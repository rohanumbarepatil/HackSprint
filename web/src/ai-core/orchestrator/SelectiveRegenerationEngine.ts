import { WorkflowDefinition, WorkflowNode } from './WorkflowDefinition';
import { DAGOrchestrator } from './DAGOrchestrator';
import { AIProviderName } from '../types';

export type ResearchSection = 'competitors' | 'personas' | 'market-research' | 'innovation';

export const SectionNodeMap: Record<ResearchSection, string[]> = {
  'competitors': ['r05'],
  'personas': ['r07'],
  'market-research': ['r04'],
  'innovation': ['r10'],
};

export const SectionLabels: Record<ResearchSection, string> = {
  'competitors': 'Competitor Analysis',
  'personas': 'User Persona Research',
  'market-research': 'Market Research',
  'innovation': 'Innovation Opportunities',
};

export interface RegenerationResult {
  regeneratedNodeIds: string[];
  preservedNodeIds: string[];
  results: Map<string, string>;
  success: boolean;
  error?: string;
}

export class SelectiveRegenerationEngine {
  private orchestrator: DAGOrchestrator;

  constructor(
    private workflow: WorkflowDefinition,
    providerName: AIProviderName = 'mock'
  ) {
    this.orchestrator = new DAGOrchestrator(workflow, providerName);
  }

  getOrchestrator(): DAGOrchestrator {
    return this.orchestrator;
  }

  findDownstreamNodes(seedNodeIds: Set<string>): Set<string> {
    const affected = new Set(seedNodeIds);
    const nodeMap = new Map<string, WorkflowNode>();
    for (const node of this.workflow.nodes) {
      nodeMap.set(node.id, node);
    }

    let changed = true;
    while (changed) {
      changed = false;
      for (const node of this.workflow.nodes) {
        if (affected.has(node.id)) continue;
        if (node.dependencies.some(dep => affected.has(dep))) {
          affected.add(node.id);
          changed = true;
        }
      }
    }
    return affected;
  }

  resolveSectionNodes(sections: ResearchSection[]): string[] {
    const nodeIds = new Set<string>();
    for (const section of sections) {
      const nodes = SectionNodeMap[section];
      if (nodes) {
        for (const nid of nodes) nodeIds.add(nid);
      }
    }
    return [...nodeIds];
  }

  buildSubWorkflow(affectedNodeIds: Set<string>): WorkflowDefinition {
    const affectedNodes = this.workflow.nodes.filter(n => affectedNodeIds.has(n.id));
    const availableIds = new Set(affectedNodeIds);

    const adjustedNodes = affectedNodes.map(node => ({
      ...node,
      dependencies: node.dependencies.filter(dep => availableIds.has(dep)),
    }));

    return {
      id: `${this.workflow.id}-regen-${Date.now()}`,
      name: `${this.workflow.name} (Partial Regeneration)`,
      description: `Partial regeneration of ${affectedNodeIds.size} nodes`,
      nodes: adjustedNodes,
    };
  }

  async regenerateAll(
    projectId: string,
    systemInstruction: string
  ): Promise<RegenerationResult> {
    this.orchestrator.clearCache();

    try {
      const results = await this.orchestrator.executePipeline(
        projectId,
        systemInstruction,
        false
      );

      return {
        regeneratedNodeIds: this.workflow.nodes.map(n => n.id),
        preservedNodeIds: [],
        results,
        success: true,
      };
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      return {
        regeneratedNodeIds: [],
        preservedNodeIds: [],
        results: new Map(),
        success: false,
        error,
      };
    }
  }

  async regenerateSections(
    projectId: string,
    systemInstruction: string,
    sections: ResearchSection[]
  ): Promise<RegenerationResult> {
    const seedNodeIds = new Set(this.resolveSectionNodes(sections));

    if (seedNodeIds.size === 0) {
      return {
        regeneratedNodeIds: [],
        preservedNodeIds: this.workflow.nodes.map(n => n.id),
        results: new Map(),
        success: true,
      };
    }

    const upstreamNodeId = this.workflow.nodes[0]?.id;
    if (upstreamNodeId) {
      seedNodeIds.add(upstreamNodeId);
    }

    const affectedNodeIds = this.findDownstreamNodes(seedNodeIds);

    const preservedNodeIds = this.workflow.nodes
      .filter(n => !affectedNodeIds.has(n.id))
      .map(n => n.id);

    const subWorkflow = this.buildSubWorkflow(affectedNodeIds);

    for (const nodeId of affectedNodeIds) {
      const cacheKey = this.workflow.id;
      this.orchestrator.clearCache();
    }

    try {
      const results = await this.orchestrator.executePipeline(
        projectId,
        systemInstruction,
        false
      );

      return {
        regeneratedNodeIds: [...affectedNodeIds],
        preservedNodeIds,
        results,
        success: true,
      };
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      return {
        regeneratedNodeIds: [],
        preservedNodeIds,
        results: new Map(),
        success: false,
        error,
      };
    }
  }
}

export function buildSectionPreservingWorkflow(
  baseWorkflow: WorkflowDefinition,
  sectionsToRegen: ResearchSection[]
): WorkflowDefinition {
  const engine = new SelectiveRegenerationEngine(baseWorkflow, 'mock');
  const seedNodes = new Set(engine.resolveSectionNodes(sectionsToRegen));
  if (baseWorkflow.nodes.length > 0) {
    seedNodes.add(baseWorkflow.nodes[0].id);
  }
  const affected = engine.findDownstreamNodes(seedNodes);
  const nodes = baseWorkflow.nodes.map(node => {
    if (!affected.has(node.id)) return node;
    return {
      ...node,
      dependencies: node.dependencies.filter(dep => affected.has(dep)),
    };
  });
  return {
    ...baseWorkflow,
    id: `${baseWorkflow.id}-section-regen`,
    nodes: nodes.filter(n => affected.has(n.id)),
  };
}
