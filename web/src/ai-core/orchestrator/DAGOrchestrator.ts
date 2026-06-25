import { WorkflowDefinition, WorkflowNode } from './WorkflowDefinition';
import { AgentRegistry } from '../agents/AgentRegistry';
import { ProviderFactory } from '../providers/ProviderFactory';
import { ValidationPipeline } from '../validator/ValidationPipeline';
import { AIProviderName, GenerationMetrics } from '../types';
import { MetricsTracker } from '../analytics/MetricsTracker';

export type OrchestratorEventType =
  | 'node-started'
  | 'node-completed'
  | 'node-failed'
  | 'node-retrying'
  | 'node-cached'
  | 'pipeline-started'
  | 'pipeline-completed'
  | 'pipeline-failed'
  | 'progress';

export interface OrchestratorEvent {
  type: OrchestratorEventType;
  nodeId?: string;
  agentId?: string;
  message: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export type EventCallback = (event: OrchestratorEvent) => void;

export interface ExecutionRecord {
  workflowId: string;
  projectId: string;
  startedAt: number;
  completedAt?: number;
  status: 'running' | 'completed' | 'failed';
  nodeResults: Map<string, NodeExecutionResult>;
  error?: string;
}

export interface NodeExecutionResult {
  nodeId: string;
  agentId: string;
  status: 'running' | 'completed' | 'failed' | 'cached';
  attempts: number;
  startedAt: number;
  completedAt?: number;
  output?: string;
  error?: string;
  latencyMs?: number;
}

interface CacheEntry {
  output: string;
  timestamp: number;
  ttl: number;
}

export class DAGOrchestrator {
  private workflow: WorkflowDefinition;
  private providerName: AIProviderName;
  private listeners: Set<EventCallback> = new Set();
  private cache: Map<string, CacheEntry> = new Map();
  private history: ExecutionRecord[] = [];
  private maxCacheSize: number;

  constructor(workflow: WorkflowDefinition, providerName: AIProviderName = 'gemini', maxCacheSize = 50) {
    this.workflow = workflow;
    this.providerName = providerName;
    this.maxCacheSize = maxCacheSize;
  }

  on(callback: EventCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  off(callback: EventCallback): void {
    this.listeners.delete(callback);
  }

  private emit(event: OrchestratorEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  getHistory(): ExecutionRecord[] {
    return [...this.history];
  }

  getLastExecution(): ExecutionRecord | undefined {
    return this.history[this.history.length - 1];
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  private generateCacheKey(nodeId: string, projectId: string, systemHash: string): string {
    return `${this.workflow.id}:${projectId}:${nodeId}:${systemHash}`;
  }

  private getFromCache(cacheKey: string): string | null {
    const entry = this.cache.get(cacheKey);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }
    return entry.output;
  }

  private setCache(cacheKey: string, output: string, ttl = 300000): void {
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(cacheKey, { output, timestamp: Date.now(), ttl });
  }

  private getReadyNodes(
    completedNodeIds: Set<string>,
    runningNodeIds: Set<string>
  ): WorkflowNode[] {
    return this.workflow.nodes.filter(node => {
      if (completedNodeIds.has(node.id) || runningNodeIds.has(node.id)) return false;
      return node.dependencies.every(dep => completedNodeIds.has(dep));
    });
  }

  private removeStaleNodes(
    allNodesIds: string[],
    completedNodeIds: Set<string>,
    runningNodeIds: Set<string>
  ): void {
    for (const id of allNodesIds) {
      if (!completedNodeIds.has(id) && !runningNodeIds.has(id)) {
        const node = this.workflow.nodes.find(n => n.id === id);
        if (node && !node.dependencies.every(dep => completedNodeIds.has(dep))) {
        }
      }
    }
  }

  async executePipeline(
    projectId: string,
    systemInstruction: string,
    useCache = true
  ): Promise<Map<string, string>> {
    const systemHash = this.hashString(systemInstruction);
    const completedNodeIds = new Set<string>();
    const runningNodeIds = new Set<string>();
    const results = new Map<string, string>();
    const nodeResults = new Map<string, NodeExecutionResult>();
    let hasError = false;

    const executionRecord: ExecutionRecord = {
      workflowId: this.workflow.id,
      projectId,
      startedAt: Date.now(),
      status: 'running',
      nodeResults,
    };

    this.emit({
      type: 'pipeline-started',
      message: `Pipeline ${this.workflow.name} started for project ${projectId}`,
      timestamp: Date.now(),
      metadata: { totalNodes: this.workflow.nodes.length, providerName: this.providerName },
    });

    while (completedNodeIds.size < this.workflow.nodes.length && !hasError) {
      const readyNodes = this.getReadyNodes(completedNodeIds, runningNodeIds);

      if (readyNodes.length === 0 && runningNodeIds.size === 0) {
        executionRecord.status = 'failed';
        executionRecord.error = 'Deadlock detected in DAG Orchestrator.';
        executionRecord.completedAt = Date.now();
        this.history.push(executionRecord);

        this.emit({
          type: 'pipeline-failed',
          message: `Deadlock detected in pipeline ${this.workflow.name}`,
          timestamp: Date.now(),
        });

        throw new Error('Deadlock detected in DAG Orchestrator.');
      }

      const executionPromises = readyNodes.map(async (node) => {
        runningNodeIds.add(node.id);

        const nodeResult: NodeExecutionResult = {
          nodeId: node.id,
          agentId: node.agentId,
          status: 'running',
          attempts: 0,
          startedAt: Date.now(),
        };
        nodeResults.set(node.id, nodeResult);

        this.emit({
          type: 'node-started',
          nodeId: node.id,
          agentId: node.agentId,
          message: `Node ${node.id} (${node.agentId}) started`,
          timestamp: Date.now(),
        });

        const cacheKey = this.generateCacheKey(node.id, projectId, systemHash);

        if (useCache) {
          const cached = this.getFromCache(cacheKey);
          if (cached !== null) {
            results.set(node.id, cached);
            completedNodeIds.add(node.id);
            nodeResult.status = 'cached';
            nodeResult.completedAt = Date.now();
            nodeResult.output = cached;

            this.emit({
              type: 'node-cached',
              nodeId: node.id,
              agentId: node.agentId,
              message: `Node ${node.id} served from cache`,
              timestamp: Date.now(),
            });

            this.emitProgress(completedNodeIds.size, nodeResult);
            return;
          }
        }

        try {
          const provider = ProviderFactory.create(this.providerName);
          const AgentClass = AgentRegistry.get(node.agentId);
          const agent = new AgentClass(provider);

          let attempt = 0;
          let success = false;
          let finalOutput = '';

          while (attempt < node.retryPolicy.maxRetries && !success) {
            try {
              const nodeStartTime = Date.now();
              const rawOutput = await agent.execute('', systemInstruction);
              nodeResult.latencyMs = Date.now() - nodeStartTime;

              if (node.outputSchema) {
                const validationResult = await ValidationPipeline.run(rawOutput, node.outputSchema);
                if (!validationResult.isValid) {
                  throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
                }
                finalOutput = JSON.stringify(validationResult.parsedData);
              } else {
                finalOutput = rawOutput;
              }

              success = true;
            } catch (err) {
              attempt++;
              nodeResult.attempts = attempt;
              const errorMessage = err instanceof Error ? err.message : String(err);

              if (attempt >= node.retryPolicy.maxRetries) {
                throw err;
              }

              this.emit({
                type: 'node-retrying',
                nodeId: node.id,
                agentId: node.agentId,
                message: `Node ${node.id} attempt ${attempt}/${node.retryPolicy.maxRetries} failed: ${errorMessage}. Retrying...`,
                timestamp: Date.now(),
                metadata: { attempt, maxRetries: node.retryPolicy.maxRetries, error: errorMessage },
              });

              await new Promise(res => setTimeout(res, node.retryPolicy.backoffMs * attempt));
            }
          }

          results.set(node.id, finalOutput);
          completedNodeIds.add(node.id);
          nodeResult.status = 'completed';
          nodeResult.completedAt = Date.now();
          nodeResult.output = finalOutput;

          if (useCache) {
            this.setCache(cacheKey, finalOutput);
          }

          this.emit({
            type: 'node-completed',
            nodeId: node.id,
            agentId: node.agentId,
            message: `Node ${node.id} completed successfully`,
            timestamp: Date.now(),
            metadata: { latencyMs: nodeResult.latencyMs, attempts: attempt },
          });

          this.emitProgress(completedNodeIds.size, nodeResult);
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          nodeResult.status = 'failed';
          nodeResult.completedAt = Date.now();
          nodeResult.error = errorMessage;

          this.emit({
            type: 'node-failed',
            nodeId: node.id,
            agentId: node.agentId,
            message: `Node ${node.id} failed fatally: ${errorMessage}`,
            timestamp: Date.now(),
            metadata: { error: errorMessage },
          });

          hasError = true;
        } finally {
          runningNodeIds.delete(node.id);
        }
      });

      if (executionPromises.length > 0) {
        await Promise.race(executionPromises);
      } else {
        await new Promise(res => setTimeout(res, 50));
      }
    }

    if (hasError) {
      executionRecord.status = 'failed';
      executionRecord.error = 'Pipeline execution failed due to an unrecoverable node error.';
      executionRecord.completedAt = Date.now();
      this.history.push(executionRecord);

      this.emit({
        type: 'pipeline-failed',
        message: `Pipeline ${this.workflow.name} failed`,
        timestamp: Date.now(),
      });

      throw new Error('Pipeline execution failed due to an unrecoverable node error.');
    }

    executionRecord.status = 'completed';
    executionRecord.completedAt = Date.now();
    this.history.push(executionRecord);

    this.emit({
      type: 'pipeline-completed',
      message: `Pipeline ${this.workflow.name} completed successfully`,
      timestamp: Date.now(),
      metadata: {
        totalNodes: this.workflow.nodes.length,
        durationMs: executionRecord.completedAt - executionRecord.startedAt,
      },
    });

    return results;
  }

  private emitProgress(completedCount: number, lastNodeResult: NodeExecutionResult): void {
    this.emit({
      type: 'progress',
      message: `Progress: ${completedCount}/${this.workflow.nodes.length} nodes completed`,
      timestamp: Date.now(),
      metadata: {
        completedCount,
        totalNodes: this.workflow.nodes.length,
        lastNode: lastNodeResult.nodeId,
        lastNodeStatus: lastNodeResult.status,
        progressPercent: Math.round((completedCount / this.workflow.nodes.length) * 100),
      },
    });
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}
