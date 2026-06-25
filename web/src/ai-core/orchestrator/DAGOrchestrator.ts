import { WorkflowDefinition, WorkflowNode } from './WorkflowDefinition';
import { AgentRegistry } from '../agents/AgentRegistry';
import { ProviderFactory } from '../providers/ProviderFactory';
import { ValidationPipeline } from '../validator/ValidationPipeline';
import { AIProviderName } from '../types';

export class DAGOrchestrator {
  private workflow: WorkflowDefinition;
  private providerName: AIProviderName;

  constructor(workflow: WorkflowDefinition, providerName: AIProviderName = 'gemini') {
    this.workflow = workflow;
    this.providerName = providerName;
  }

  /**
   * Evaluates the DAG to find nodes that have 0 pending dependencies.
   */
  private getReadyNodes(completedNodeIds: Set<string>, runningNodeIds: Set<string>): WorkflowNode[] {
    return this.workflow.nodes.filter(node => {
      if (completedNodeIds.has(node.id) || runningNodeIds.has(node.id)) return false;
      return node.dependencies.every(dep => completedNodeIds.has(dep));
    });
  }

  /**
   * Executes the full DAG pipeline.
   * Will execute independent nodes in parallel automatically.
   */
  async executePipeline(projectId: string, systemInstruction: string) {
    const completedNodeIds = new Set<string>();
    const runningNodeIds = new Set<string>();
    const results = new Map<string, string>();

    let hasError = false;

    // Loop until all nodes are completed or an unrecoverable error occurs
    while (completedNodeIds.size < this.workflow.nodes.length && !hasError) {
      const readyNodes = this.getReadyNodes(completedNodeIds, runningNodeIds);
      
      if (readyNodes.length === 0 && runningNodeIds.size === 0) {
        throw new Error('Deadlock detected in DAG Orchestrator.');
      }

      // Execute all ready nodes in parallel
      const executionPromises = readyNodes.map(async (node) => {
        runningNodeIds.add(node.id);
        
        try {
          // 1. Resolve Provider and Agent
          const provider = ProviderFactory.create(this.providerName);
          const AgentClass = AgentRegistry.get(node.agentId);
          const agent = new AgentClass(provider);

          // 2. Execute Agent with Retry Policy
          let attempt = 0;
          let success = false;
          let finalOutput = '';

          while (attempt < node.retryPolicy.maxRetries && !success) {
            try {
              // Note: Pass empty prompt here, as the systemInstruction contains the context
              const rawOutput = await agent.execute('', systemInstruction);
              
              // 3. Validation Pipeline
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
              if (attempt >= node.retryPolicy.maxRetries) {
                throw err;
              }
              await new Promise(res => setTimeout(res, node.retryPolicy.backoffMs * attempt));
            }
          }

          results.set(node.id, finalOutput);
          completedNodeIds.add(node.id);
        } catch (e: unknown) {
          console.error(`Node ${node.id} failed fatally:`, e);
          hasError = true; // Stop the pipeline
        } finally {
          runningNodeIds.delete(node.id);
        }
      });

      // Wait for any running node to finish before scanning for new ready nodes
      await Promise.race(executionPromises);
    }

    if (hasError) {
      throw new Error('Pipeline execution failed due to an unrecoverable node error.');
    }

    return results;
  }
}
