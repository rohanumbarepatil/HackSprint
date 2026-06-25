/* eslint-disable */
import { DAGOrchestrator } from '../orchestrator/DAGOrchestrator';
import { WorkflowDefinition } from '../orchestrator/WorkflowDefinition';
import { AgentRegistry } from '../agents/AgentRegistry';
import { BaseAgent, AgentMetadata } from '../agents/BaseAgent';
import { z } from 'zod';

class MockAgent extends BaseAgent {
  metadata: AgentMetadata = { id: 'mock', name: 'Mock Agent', description: '', version: '1' };
  requiredContext = [];
  producedOutput = 'mock-output';
  outputSchema = z.object({ success: z.boolean() });

  async execute(_prompt: string, _sys: string) {
    return JSON.stringify({ success: true, mock: 'data' });
  }
}

AgentRegistry.register('mock', MockAgent);

const testWorkflow: WorkflowDefinition = {
  id: 'test',
  name: 'Test Workflow',
  description: 'A simple DAG',
  nodes: [
    {
      id: 'node1',
      agentId: 'mock',
      dependencies: [],
      retryPolicy: { maxRetries: 1, backoffMs: 100 },
      timeoutMs: 1000,
      priority: 'high',
      outputSchema: z.object({ success: z.boolean() })
    }
  ]
};

describe('DAGOrchestrator', () => {
  it('executes a workflow successfully using the MockProvider', async () => {
    const orchestrator = new DAGOrchestrator(testWorkflow, 'mock');
    const results = await orchestrator.executePipeline('proj-1', 'sys-inst');
    
    expect(results.has('node1')).toBe(true);
    const output = JSON.parse(results.get('node1')!);
    expect(output.success).toBe(true);
  });
});
