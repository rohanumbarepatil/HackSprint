/* eslint-disable */
jest.mock('@/lib/firebase/client', () => ({ db: {}, auth: {}, storage: {}, default: {} }));

import { ResearchPipeline, PipelineEvent } from '../pipeline/ResearchPipeline';
import { registerAllAgents } from '../agents';
import {
  InMemoryProjectMemory,
  InMemoryDocumentMemory,
  InMemoryConversationMemory,
  InMemoryShortTermMemory,
} from '../memory';
import { AgentRegistry } from '../agents/AgentRegistry';
import { BaseAgent, AgentMetadata } from '../agents/BaseAgent';
import { z } from 'zod';

class TestAgent extends BaseAgent {
  metadata: AgentMetadata = { id: 'test-agent', name: 'Test', description: '', version: '1' };
  requiredContext: string[] = [];
  producedOutput: string = 'test-out';
  outputSchema = z.object({ result: z.string() });

  async execute(_prompt: string, _sys: string) {
    return JSON.stringify({ result: 'ok' });
  }
}

describe('ResearchPipeline', () => {
  beforeAll(() => {
    registerAllAgents();
    try { AgentRegistry.register('test-agent', TestAgent as any); } catch {}
  });

  let projectMemory: InMemoryProjectMemory;
  let documentMemory: InMemoryDocumentMemory;

  beforeEach(() => {
    projectMemory = new InMemoryProjectMemory(
      'test-proj',
      'Build a task management app',
      ['Must be real-time'],
      { theme: 'dark' },
      ['React', 'Node.js']
    );
    documentMemory = new InMemoryDocumentMemory('test-proj');
  });

  it('constructs with default provider', () => {
    const pipeline = new ResearchPipeline();
    expect(pipeline).toBeDefined();
  });

  it('constructs with specified provider', () => {
    const pipeline = new ResearchPipeline('mock');
    expect(pipeline).toBeDefined();
  });

  it('supports event subscription with cleanup', () => {
    const pipeline = new ResearchPipeline('mock');
    const cleanup = pipeline.on(() => {});
    expect(typeof cleanup).toBe('function');
  });

  it('emits phase-started and phase-completed events via callback', async () => {
    const pipeline = new ResearchPipeline('mock');
    const events: PipelineEvent[] = [];

    pipeline.on((event) => events.push(event));

    const result = await pipeline.execute('test-proj', projectMemory, documentMemory);

    const phaseStarted = events.filter(e => e.type === 'phase-started');
    const phaseCompleted = events.filter(e => e.type === 'phase-completed');

    expect(phaseStarted.length).toBeGreaterThan(0);
    expect(phaseCompleted.length).toBeGreaterThan(0);
    expect(result.passed).toBe(true);
  }, 60000);

  it('executes all phases and accumulates results', async () => {
    const pipeline = new ResearchPipeline('mock');
    const result = await pipeline.execute('test-proj', projectMemory, documentMemory);

    expect(result.passed).toBe(true);
    expect(result.workflowId).toBeTruthy();
    expect(result.phases.length).toBe(5);
    expect(result.allResults.size).toBeGreaterThan(0);
    expect(result.startedAt).toBeLessThan(result.completedAt);
  }, 60000);

  it('produces per-phase results with validation', async () => {
    const pipeline = new ResearchPipeline('mock');
    const result = await pipeline.execute('test-proj', projectMemory, documentMemory);

    for (const phase of result.phases) {
      expect(phase.phase).toBeTruthy();
      expect(phase.nodeResults.size).toBeGreaterThan(0);
      expect(phase.validationResults.size).toBeGreaterThan(0);
      expect(phase.startedAt).toBeLessThan(phase.completedAt);
    }
  }, 60000);

  it('emits node-validated events for each node', async () => {
    const pipeline = new ResearchPipeline('mock');
    const events: PipelineEvent[] = [];

    pipeline.on((event) => events.push(event));

    await pipeline.execute('test-proj', projectMemory, documentMemory);

    const validated = events.filter(e => e.type === 'node-validated');
    expect(validated.length).toBeGreaterThan(0);
  }, 60000);

  it('emits pipeline-completed event on success', async () => {
    const pipeline = new ResearchPipeline('mock');
    const events: PipelineEvent[] = [];

    pipeline.on((event) => events.push(event));

    await pipeline.execute('test-proj', projectMemory, documentMemory);

    expect(events.some(e => e.type === 'pipeline-completed')).toBe(true);
    expect(events.some(e => e.type === 'pipeline-failed')).toBe(false);
  }, 60000);

  it('accepts pre-assembled context from options', async () => {
    const pipeline = new ResearchPipeline('mock');
    const { ContextEngine } = require('../context/ContextEngine');
    const context = await ContextEngine.buildContext(projectMemory, documentMemory, []);

    const result = await pipeline.execute('test-proj', projectMemory, documentMemory, {
      assembledContext: context,
    });

    expect(result.passed).toBe(true);
  }, 60000);

  it('accepts conversation and short-term memory in options', async () => {
    const pipeline = new ResearchPipeline('mock');
    const convMem = new InMemoryConversationMemory('test-proj');
    await convMem.addMessage('user', 'Hello');
    const stm = new InMemoryShortTermMemory('test-proj');
    stm.setVariable('focus', 'speed');

    const result = await pipeline.execute('test-proj', projectMemory, documentMemory, {
      conversationMemory: convMem,
      shortTermMemory: stm,
    });

    expect(result.passed).toBe(true);
  }, 60000);
});
