/* eslint-disable */
import { DAGOrchestrator, OrchestratorEvent } from '../orchestrator/DAGOrchestrator';
import { WorkflowDefinition } from '../orchestrator/WorkflowDefinition';
import { AgentRegistry } from '../agents/AgentRegistry';
import { BaseAgent, AgentMetadata } from '../agents/BaseAgent';
import { z } from 'zod';

class EventTestAgent extends BaseAgent {
  metadata: AgentMetadata = { id: 'event-test', name: 'Event Test', description: '', version: '1' };
  requiredContext: string[] = [];
  producedOutput: string = 'event-output';
  outputSchema = z.object({ ok: z.boolean() });

  async execute(_prompt: string, _sys: string) {
    return JSON.stringify({ ok: true });
  }
}

AgentRegistry.register('event-test', EventTestAgent as any);

const eventWorkflow: WorkflowDefinition = {
  id: 'event-test',
  name: 'Event Test',
  description: 'Test event emission',
  nodes: [
    {
      id: 'node-a',
      agentId: 'event-test',
      dependencies: [],
      retryPolicy: { maxRetries: 1, backoffMs: 50 },
      timeoutMs: 2000,
      priority: 'high',
      outputSchema: z.object({ ok: z.boolean() }),
    },
    {
      id: 'node-b',
      agentId: 'event-test',
      dependencies: ['node-a'],
      retryPolicy: { maxRetries: 1, backoffMs: 50 },
      timeoutMs: 2000,
      priority: 'medium',
    },
  ],
};

describe('DAGOrchestrator Events', () => {
  it('emits pipeline-started and pipeline-completed events', async () => {
    const orchestrator = new DAGOrchestrator(eventWorkflow, 'mock');
    const events: OrchestratorEvent[] = [];

    orchestrator.on((event) => events.push(event));

    await orchestrator.executePipeline('proj-events', 'test');

    expect(events.some(e => e.type === 'pipeline-started')).toBe(true);
    expect(events.some(e => e.type === 'pipeline-completed')).toBe(true);
  });

  it('emits node-started and node-completed for each node', async () => {
    const orchestrator = new DAGOrchestrator(eventWorkflow, 'mock');
    const events: OrchestratorEvent[] = [];

    orchestrator.on((event) => events.push(event));

    await orchestrator.executePipeline('proj-nodes', 'test');

    const started = events.filter(e => e.type === 'node-started').map(e => e.nodeId);
    const completed = events.filter(e => e.type === 'node-completed').map(e => e.nodeId);

    expect(started).toContain('node-a');
    expect(started).toContain('node-b');
    expect(completed).toContain('node-a');
    expect(completed).toContain('node-b');
  });

  it('emits progress events', async () => {
    const orchestrator = new DAGOrchestrator(eventWorkflow, 'mock');
    const events: OrchestratorEvent[] = [];

    orchestrator.on((event) => events.push(event));

    await orchestrator.executePipeline('proj-progress', 'test');

    const progressEvents = events.filter(e => e.type === 'progress');
    expect(progressEvents.length).toBeGreaterThan(0);
  });

  it('supports unsubscribing with off()', async () => {
    const orchestrator = new DAGOrchestrator(eventWorkflow, 'mock');
    const events: OrchestratorEvent[] = [];

    const cb = (event: OrchestratorEvent) => events.push(event);
    orchestrator.on(cb);
    orchestrator.off(cb);

    await orchestrator.executePipeline('proj-off', 'test');
    expect(events.length).toBe(0);
  });

  it('supports unsubscribing via returned cleanup function', async () => {
    const orchestrator = new DAGOrchestrator(eventWorkflow, 'mock');
    const events: OrchestratorEvent[] = [];

    const cleanup = orchestrator.on((event) => events.push(event));
    cleanup();

    await orchestrator.executePipeline('proj-cleanup', 'test');
    expect(events.length).toBe(0);
  });
});
