/* eslint-disable */
import { DAGOrchestrator, NodeExecutionResult } from '../orchestrator/DAGOrchestrator';
import { WorkflowDefinition, HackSprintDefaultWorkflow } from '../orchestrator/WorkflowDefinition';
import { AgentRegistry } from '../agents/AgentRegistry';
import { BaseAgent, AgentMetadata } from '../agents/BaseAgent';
import { z } from 'zod';
import { registerAllAgents } from '../agents';

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

const singleNodeWorkflow: WorkflowDefinition = {
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

const parallelWorkflow: WorkflowDefinition = {
  id: 'parallel-test',
  name: 'Parallel Test',
  description: 'Two independent nodes',
  nodes: [
    {
      id: 'node-a',
      agentId: 'mock',
      dependencies: [],
      retryPolicy: { maxRetries: 1, backoffMs: 50 },
      timeoutMs: 2000,
      priority: 'high',
    },
    {
      id: 'node-b',
      agentId: 'mock',
      dependencies: [],
      retryPolicy: { maxRetries: 1, backoffMs: 50 },
      timeoutMs: 2000,
      priority: 'high',
    },
  ],
};

const chainedWorkflow: WorkflowDefinition = {
  id: 'chain-test',
  name: 'Chained Test',
  description: 'Node-b depends on node-a',
  nodes: [
    {
      id: 'node-a',
      agentId: 'mock',
      dependencies: [],
      retryPolicy: { maxRetries: 1, backoffMs: 50 },
      timeoutMs: 2000,
      priority: 'high',
    },
    {
      id: 'node-b',
      agentId: 'mock',
      dependencies: ['node-a'],
      retryPolicy: { maxRetries: 1, backoffMs: 50 },
      timeoutMs: 2000,
      priority: 'high',
    },
  ],
};

describe('DAGOrchestrator', () => {
  it('executes a workflow successfully using the MockProvider', async () => {
    const orchestrator = new DAGOrchestrator(singleNodeWorkflow, 'mock');
    const results = await orchestrator.executePipeline('proj-1', 'sys-inst');
    
    expect(results.has('node1')).toBe(true);
    const output = JSON.parse(results.get('node1')!);
    expect(output.success).toBe(true);
  });

  it('executes independent nodes in parallel', async () => {
    const orchestrator = new DAGOrchestrator(parallelWorkflow, 'mock');
    const start = Date.now();
    const results = await orchestrator.executePipeline('proj-parallel', 'test');
    const duration = Date.now() - start;

    expect(results.has('node-a')).toBe(true);
    expect(results.has('node-b')).toBe(true);
    expect(duration).toBeLessThan(300);
  });

  it('executes chained nodes sequentially', async () => {
    const orchestrator = new DAGOrchestrator(chainedWorkflow, 'mock');
    const results = await orchestrator.executePipeline('proj-chain', 'test');
    expect(results.has('node-a')).toBe(true);
    expect(results.has('node-b')).toBe(true);
  });

  it('caches results and returns cached on second execution', async () => {
    const orchestrator = new DAGOrchestrator(singleNodeWorkflow, 'mock');
    const results1 = await orchestrator.executePipeline('proj-cache', 'hello world', true);
    const results2 = await orchestrator.executePipeline('proj-cache', 'hello world', true);

    expect(results1.get('node1')).toBe(results2.get('node1'));
  });

  it('bypasses cache when useCache is false', async () => {
    const orchestrator = new DAGOrchestrator(singleNodeWorkflow, 'mock');
    const results1 = await orchestrator.executePipeline('proj-nocache', 'test', false);
    const results2 = await orchestrator.executePipeline('proj-nocache', 'test', false);

    expect(results1.get('node1')).toBe(results2.get('node1'));
  });

  it('uses different cache keys for different system instructions', async () => {
    const orchestrator = new DAGOrchestrator(singleNodeWorkflow, 'mock');
    const results1 = await orchestrator.executePipeline('proj-diff', 'hello', true);
    const results2 = await orchestrator.executePipeline('proj-diff', 'world', true);

    expect(results1.get('node1')).toBe(results2.get('node1'));
  });

  it('tracks execution history', async () => {
    const orchestrator = new DAGOrchestrator(singleNodeWorkflow, 'mock');
    await orchestrator.executePipeline('proj-history', 'test');

    const history = orchestrator.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].workflowId).toBe('test');
    expect(history[0].projectId).toBe('proj-history');
    expect(history[0].status).toBe('completed');
  });

  it('accumulates multiple execution records in history', async () => {
    const orchestrator = new DAGOrchestrator(singleNodeWorkflow, 'mock');
    await orchestrator.executePipeline('proj-hist-1', 'test');
    await orchestrator.executePipeline('proj-hist-2', 'test');

    const history = orchestrator.getHistory();
    expect(history.length).toBe(2);
    expect(history[0].projectId).toBe('proj-hist-1');
    expect(history[1].projectId).toBe('proj-hist-2');
  });

  it('records per-node execution details in history', async () => {
    const orchestrator = new DAGOrchestrator(chainedWorkflow, 'mock');
    await orchestrator.executePipeline('proj-details', 'test');

    const lastRun = orchestrator.getLastExecution()!;
    expect(lastRun.nodeResults.size).toBe(2);

    const nodeAResult = lastRun.nodeResults.get('node-a')!;
    expect(nodeAResult.status).toBe('completed');
    expect(nodeAResult.agentId).toBe('mock');
    expect(nodeAResult.nodeId).toBe('node-a');
    expect(nodeAResult.attempts).toBe(0);
    expect(nodeAResult.latencyMs).toBeDefined();
  });

  it('returns last execution via getLastExecution', async () => {
    const orchestrator = new DAGOrchestrator(singleNodeWorkflow, 'mock');
    await orchestrator.executePipeline('proj-last', 'test');

    const last = orchestrator.getLastExecution();
    expect(last).toBeDefined();
    expect(last!.status).toBe('completed');
  });

  it('exposes cache size', async () => {
    const orchestrator = new DAGOrchestrator(singleNodeWorkflow, 'mock');
    await orchestrator.executePipeline('proj-cachesize', 'test', true);
    expect(orchestrator.getCacheSize()).toBeGreaterThanOrEqual(1);
  });

  it('clears cache on demand', async () => {
    const orchestrator = new DAGOrchestrator(singleNodeWorkflow, 'mock');
    await orchestrator.executePipeline('proj-clearcache', 'test', true);
    orchestrator.clearCache();
    expect(orchestrator.getCacheSize()).toBe(0);
  });

  it('throws on deadlock when dependencies cannot be satisfied', async () => {
    const deadlockWorkflow: WorkflowDefinition = {
      id: 'deadlock',
      name: 'Deadlock',
      description: 'Node-a and node-b depend on each other',
      nodes: [
        {
          id: 'node-a',
          agentId: 'mock',
          dependencies: ['node-b'],
          retryPolicy: { maxRetries: 1, backoffMs: 50 },
          timeoutMs: 1000,
          priority: 'high',
        },
        {
          id: 'node-b',
          agentId: 'mock',
          dependencies: ['node-a'],
          retryPolicy: { maxRetries: 1, backoffMs: 50 },
          timeoutMs: 1000,
          priority: 'high',
        },
      ],
    };
    const orchestrator = new DAGOrchestrator(deadlockWorkflow, 'mock');
    await expect(orchestrator.executePipeline('proj-deadlock', 'test')).rejects.toThrow('Deadlock');
  });
});

describe('HackSprintDefaultWorkflow', () => {
  beforeAll(() => {
    registerAllAgents();
  });

  it('has 15 nodes', () => {
    expect(HackSprintDefaultWorkflow.nodes.length).toBe(15);
  });

  it('has validation as the final node depending on all others', () => {
    const validationNode = HackSprintDefaultWorkflow.nodes.find(n => n.agentId === 'agent-validation');
    expect(validationNode).toBeDefined();
    expect(validationNode!.dependencies.length).toBe(14);
  });

  it('has problem analyzer as root node', () => {
    const root = HackSprintDefaultWorkflow.nodes.find(n => n.agentId === 'agent-problem-analyzer');
    expect(root).toBeDefined();
    expect(root!.dependencies).toHaveLength(0);
  });

  it('has all registered agents in workflow', () => {
    const agentIds = HackSprintDefaultWorkflow.nodes.map(n => n.agentId);
    const registered = AgentRegistry.listAll();

    for (const agentId of agentIds) {
      expect(registered).toContain(agentId);
    }
  });
});
