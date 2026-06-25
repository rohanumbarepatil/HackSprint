/* eslint-disable */
import { DAGOrchestrator, NodeExecutionResult } from '../orchestrator/DAGOrchestrator';
import { WorkflowDefinition } from '../orchestrator/WorkflowDefinition';
import { AgentRegistry } from '../agents/AgentRegistry';
import { BaseAgent, AgentMetadata } from '../agents/BaseAgent';
import { z } from 'zod';

let callCount = 0;

class FailingAgent extends BaseAgent {
  metadata: AgentMetadata = { id: 'fail-agent', name: 'Fail', description: '', version: '1' };
  requiredContext: string[] = [];
  producedOutput: string = 'fail-out';
  outputSchema = z.object({ ok: z.boolean() });

  async execute(_prompt: string, _sys: string) {
    callCount++;
    if (callCount < 3) {
      throw new Error(`Simulated failure attempt ${callCount}`);
    }
    return JSON.stringify({ ok: true });
  }
}

class StableAgent extends BaseAgent {
  metadata: AgentMetadata = { id: 'stable-agent', name: 'Stable', description: '', version: '1' };
  requiredContext: string[] = [];
  producedOutput: string = 'stable-out';
  outputSchema = z.object({ ok: z.boolean() });

  async execute(_prompt: string, _sys: string) {
    return JSON.stringify({ ok: true });
  }
}

const retryWorkflow: WorkflowDefinition = {
  id: 'retry-test',
  name: 'Retry Test',
  description: 'Node with retry policy',
  nodes: [
    {
      id: 'node-retry',
      agentId: 'fail-agent',
      dependencies: [],
      retryPolicy: { maxRetries: 3, backoffMs: 10 },
      timeoutMs: 5000,
      priority: 'high',
      outputSchema: z.object({ ok: z.boolean() }),
    },
  ],
};

const stableWorkflow: WorkflowDefinition = {
  id: 'stable-test',
  name: 'Stable Test',
  description: 'Node with stable agent',
  nodes: [
    {
      id: 'node-stable',
      agentId: 'stable-agent',
      dependencies: [],
      retryPolicy: { maxRetries: 2, backoffMs: 10 },
      timeoutMs: 2000,
      priority: 'high',
      outputSchema: z.object({ ok: z.boolean() }),
    },
  ],
};

describe('DAGOrchestrator - Retry Logic', () => {
  beforeAll(() => {
    try { AgentRegistry.register('fail-agent', FailingAgent as any); } catch {}
    try { AgentRegistry.register('stable-agent', StableAgent as any); } catch {}
  });

  beforeEach(() => {
    callCount = 0;
  });

  it('retries on failure and succeeds within max retries', async () => {
    const orchestrator = new DAGOrchestrator(retryWorkflow, 'mock');
    const results = await orchestrator.executePipeline('proj-retry', 'test', false);

    expect(results.has('node-retry')).toBe(true);
    const output = JSON.parse(results.get('node-retry')!);
    expect(output.ok).toBe(true);
    expect(callCount).toBe(3);
  });

  it('records correct attempt count in history', async () => {
    const orchestrator = new DAGOrchestrator(retryWorkflow, 'mock');
    await orchestrator.executePipeline('proj-attempts', 'test', false);

    const lastRun = orchestrator.getLastExecution()!;
    const nodeResult = lastRun.nodeResults.get('node-retry')!;
    expect(nodeResult.attempts).toBe(2);
    expect(nodeResult.status).toBe('completed');
  });

  it('emits node-retrying events', async () => {
    const orchestrator = new DAGOrchestrator(retryWorkflow, 'mock');
    const events: any[] = [];

    orchestrator.on((event) => events.push(event));

    await orchestrator.executePipeline('proj-retry-events', 'test', false);

    const retryEvents = events.filter(e => e.type === 'node-retrying');
    expect(retryEvents.length).toBeGreaterThan(0);
    expect(retryEvents[0].metadata).toBeDefined();
    expect(retryEvents[0].metadata.attempt).toBeDefined();
  });

  it('succeeds on first attempt with stable agent', async () => {
    const orchestrator = new DAGOrchestrator(stableWorkflow, 'mock');

    orchestrator.on((event) => {});

    const results = await orchestrator.executePipeline('proj-stable', 'test', false);
    const lastRun = orchestrator.getLastExecution()!;
    const result = lastRun.nodeResults.get('node-stable')!;
    expect(result.attempts).toBe(0);
    expect(result.status).toBe('completed');
  });

  it('fails fatally when all retries exhausted', async () => {
    callCount = 0;
    class AlwaysFailsAgent extends BaseAgent {
      metadata: AgentMetadata = { id: 'always-fail', name: 'Always Fail', description: '', version: '1' };
      requiredContext: string[] = [];
      producedOutput: string = 'fail-out';
      outputSchema = z.object({ ok: z.boolean() });

      async execute(_prompt: string, _sys: string) {
        throw new Error('Permanent failure');
      }
    }

    try { AgentRegistry.register('always-fail', AlwaysFailsAgent as any); } catch {}

    const failWorkflow: WorkflowDefinition = {
      id: 'always-fail',
      name: 'Always Fail',
      description: '',
      nodes: [{
        id: 'node-fail',
        agentId: 'always-fail',
        dependencies: [],
        retryPolicy: { maxRetries: 2, backoffMs: 10 },
        timeoutMs: 1000,
        priority: 'high',
      }],
    };

    const orchestrator = new DAGOrchestrator(failWorkflow, 'mock');
    await expect(orchestrator.executePipeline('proj-fail', 'test', false)).rejects.toThrow();
  });

  it('logs retry events with metadata', async () => {
    const orchestrator = new DAGOrchestrator(retryWorkflow, 'mock');
    const events: any[] = [];

    orchestrator.on((event) => events.push(event));

    try {
      await orchestrator.executePipeline('proj-meta', 'test', false);
    } catch {}

    const retryEvents = events.filter(e => e.type === 'node-retrying');
    for (const event of retryEvents) {
      expect(event.metadata.attempt).toBeGreaterThan(0);
      expect(event.metadata.maxRetries).toBeGreaterThan(0);
    }
  });
});
