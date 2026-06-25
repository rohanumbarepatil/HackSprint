import { DAGOrchestrator } from '../orchestrator/DAGOrchestrator';
import {
  FullResearchWorkflow,
  PhaseOrder,
  PhaseWorkflows,
  PhaseName,
  WorkflowNode,
} from '../orchestrator/WorkflowDefinition';
import { ResearchValidator, ResearchValidationResult } from './ResearchValidator';
import { ContextEngine, AssembledContext } from '../context/ContextEngine';
import { ProjectMemory, DocumentMemory } from '../memory';
import { AIProviderName } from '../types';

export interface PipelinePhaseResult {
  phase: PhaseName;
  nodeResults: Map<string, string>;
  validationResults: Map<string, ResearchValidationResult>;
  startedAt: number;
  completedAt: number;
  passed: boolean;
}

export interface PipelineResult {
  workflowId: string;
  phases: PipelinePhaseResult[];
  allResults: Map<string, string>;
  startedAt: number;
  completedAt: number;
  passed: boolean;
  error?: string;
}

export type PipelineEventType =
  | 'phase-started'
  | 'phase-completed'
  | 'phase-failed'
  | 'node-validated'
  | 'pipeline-completed'
  | 'pipeline-failed';

export interface PipelineEvent {
  type: PipelineEventType;
  phase?: PhaseName;
  message: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export type PipelineCallback = (event: PipelineEvent) => void;

export class ResearchPipeline {
  private providerName: AIProviderName;
  private listeners: Set<PipelineCallback> = new Set();
  private abortRequested = false;

  constructor(
    providerName: AIProviderName = 'gemini',
  ) {
    this.providerName = providerName;
  }

  on(callback: PipelineCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private emit(event: PipelineEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  abort(): void {
    this.abortRequested = true;
  }

  async execute(
    projectId: string,
    projectMemory: ProjectMemory,
    documentMemory: DocumentMemory,
    options?: {
      conversationMemory?: import('../memory').ConversationMemory;
      shortTermMemory?: import('../memory').ShortTermMemory;
      assembledContext?: AssembledContext;
    }
  ): Promise<PipelineResult> {
    this.abortRequested = false;
    const allResults = new Map<string, string>();
    const phaseResults: PipelinePhaseResult[] = [];
    const pipelineStart = Date.now();

    let systemInstruction: string;

    if (options?.assembledContext) {
      systemInstruction = options.assembledContext.systemInstruction;
    } else {
      const context = await ContextEngine.buildContext(
        projectMemory,
        documentMemory,
        [],
        {
          conversationMemory: options?.conversationMemory,
          shortTermMemory: options?.shortTermMemory,
        }
      );
      systemInstruction = context.systemInstruction;
    }

    for (const phaseName of PhaseOrder) {
      if (this.abortRequested) {
        this.emit({
          type: 'pipeline-failed',
          message: 'Pipeline aborted by user',
          timestamp: Date.now(),
        });

        return {
          workflowId: FullResearchWorkflow.id,
          phases: phaseResults,
          allResults,
          startedAt: pipelineStart,
          completedAt: Date.now(),
          passed: false,
          error: 'Pipeline aborted',
        };
      }

      const phaseNodeIds = PhaseWorkflows[phaseName];
      if (!phaseNodeIds || phaseNodeIds.length === 0) continue;

      const phaseNodes = phaseNodeIds
        .map(id => FullResearchWorkflow.nodes.find(n => n.id === id))
        .filter((n): n is WorkflowNode => n !== undefined);

      this.emit({
        type: 'phase-started',
        phase: phaseName,
        message: `Phase "${phaseName}" started with ${phaseNodes.length} nodes`,
        timestamp: Date.now(),
        metadata: { nodeCount: phaseNodes.length, nodes: phaseNodes.map(n => n.id) },
      });

      const phaseStart = Date.now();
      const phaseWorkflow = {
        ...FullResearchWorkflow,
        nodes: phaseNodes,
      };

      const phaseOrchestrator = new DAGOrchestrator(
        phaseWorkflow,
        this.providerName,
        50
      );

      let phasePassed = true;
      const validationResults = new Map<string, ResearchValidationResult>();
      let phaseNodeResults: Map<string, string>;

      try {
        phaseNodeResults = await phaseOrchestrator.executePipeline(
          projectId,
          this.buildPhaseContext(systemInstruction, phaseName, allResults),
          true
        );

        for (const [nodeId, output] of phaseNodeResults) {
          allResults.set(nodeId, output);
        }

        for (const node of phaseNodes) {
          const output = phaseNodeResults.get(node.id);
          if (!output) continue;

          const schemaName = this.nodeIdToSchemaName(node.id);
          const validation = await ResearchValidator.validateStage(
            node.id,
            output,
            allResults,
            schemaName
          );
          validationResults.set(node.id, validation);

          this.emit({
            type: 'node-validated',
            phase: phaseName,
            message: `Node ${node.id} validated: ${validation.passed ? 'PASS' : 'FAIL'} (confidence: ${(validation.confidenceScore * 100).toFixed(0)}%)`,
            timestamp: Date.now(),
            metadata: {
              nodeId: node.id,
              passed: validation.passed,
              completenessScore: validation.completenessScore,
              consistencyScore: validation.consistencyScore,
              duplicateCount: validation.duplicateIssues.length,
              hallucinationCount: validation.hallucinationIssues.length,
              confidenceScore: validation.confidenceScore,
            },
          });

          if (!validation.passed) {
            phasePassed = false;
          }
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        phasePassed = false;

        this.emit({
          type: 'phase-failed',
          phase: phaseName,
          message: `Phase "${phaseName}" failed: ${errorMessage}`,
          timestamp: Date.now(),
          metadata: { error: errorMessage },
        });

        return {
          workflowId: FullResearchWorkflow.id,
          phases: phaseResults,
          allResults,
          startedAt: pipelineStart,
          completedAt: Date.now(),
          passed: false,
          error: `Phase "${phaseName}" failed: ${errorMessage}`,
        };
      }

      const phaseResult: PipelinePhaseResult = {
        phase: phaseName,
        nodeResults: phaseNodeResults,
        validationResults,
        startedAt: phaseStart,
        completedAt: Date.now(),
        passed: phasePassed,
      };

      phaseResults.push(phaseResult);

      this.emit({
        type: 'phase-completed',
        phase: phaseName,
        message: `Phase "${phaseName}" ${phasePassed ? 'completed' : 'completed with validation warnings'}`,
        timestamp: Date.now(),
        metadata: {
          nodeCount: phaseNodes.length,
          durationMs: phaseResult.completedAt - phaseResult.startedAt,
          passed: phasePassed,
          validatedCount: validationResults.size,
          passedCount: Array.from(validationResults.values()).filter(v => v.passed).length,
        },
      });
    }

    const pipelineEnd = Date.now();

    this.emit({
      type: 'pipeline-completed',
      message: 'Pipeline completed successfully',
      timestamp: pipelineEnd,
      metadata: {
        totalPhases: phaseResults.length,
        durationMs: pipelineEnd - pipelineStart,
        totalNodes: allResults.size,
      },
    });

    return {
      workflowId: FullResearchWorkflow.id,
      phases: phaseResults,
      allResults,
      startedAt: pipelineStart,
      completedAt: pipelineEnd,
      passed: true,
    };
  }

  private buildPhaseContext(
    baseInstruction: string,
    phaseName: PhaseName,
    accumulatedResults: Map<string, string>
  ): string {
    const previousPhases = PhaseOrder.slice(0, PhaseOrder.indexOf(phaseName));
    if (previousPhases.length === 0) return baseInstruction;

    let context = baseInstruction;

    for (const prevPhase of previousPhases) {
      const prevNodeIds = PhaseWorkflows[prevPhase] ?? [];
      const phaseOutputs = prevNodeIds
        .filter(id => accumulatedResults.has(id) && !id.startsWith('node-checkpoint'))
        .map(id => {
          const node = FullResearchWorkflow.nodes.find(n => n.id === id);
          const agentName = node?.agentId ?? id;
          return `\n--- ${prevPhase.toUpperCase()} / ${agentName} ---\n${accumulatedResults.get(id)}`;
        })
        .join('\n');

      if (phaseOutputs) {
        context += `\n\n${phaseOutputs}`;
      }
    }

    return context;
  }

  private nodeIdToSchemaName(nodeId: string): string | undefined {
    const map: Record<string, string> = {
      'node-problem': 'problem',
      'node-research': 'research',
      'node-competitor': 'competitors',
      'node-innovation': 'innovation',
      'node-pm': 'prd',
      'node-business': 'business',
      'node-tech-architect': 'trd',
      'node-db-architect': 'database',
      'node-ui-ux': 'ui-ux',
      'node-backend': 'backend',
      'node-security': 'security',
      'node-qa': 'qa',
      'node-pitch': 'pitch',
      'node-documentation': 'implementation',
      'node-validation': 'validation',
    };
    return map[nodeId];
  }
}
