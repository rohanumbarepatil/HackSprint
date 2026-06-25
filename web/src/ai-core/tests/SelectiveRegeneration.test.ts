/* eslint-disable */
import { SelectiveRegenerationEngine, SectionNodeMap, SectionLabels, buildSectionPreservingWorkflow } from '../orchestrator/SelectiveRegenerationEngine';
import { ResearchWorkflow } from '../orchestrator/ResearchWorkflow';
import { AgentRegistry } from '../agents/AgentRegistry';
import { BaseAgent, AgentMetadata } from '../agents/BaseAgent';
import { z } from 'zod';

class RegenTestAgent extends BaseAgent {
  metadata: AgentMetadata = { id: 'regen-test', name: 'Regen Test', description: '', version: '1' };
  requiredContext: string[] = [];
  producedOutput: string = 'regen-out';
  outputSchema = z.object({ ok: z.boolean() });

  async execute(_p: string, _s: string) {
    return JSON.stringify({ ok: true });
  }
}

AgentRegistry.register('regen-test', RegenTestAgent as any);

const chain3: WorkflowDefinition = {
  id: 'chain3',
  name: '3-Node Chain',
  description: 'A→B→C',
  nodes: [
    { id: 'n1', agentId: 'regen-test', dependencies: [], retryPolicy: { maxRetries: 1, backoffMs: 10 }, timeoutMs: 1000, priority: 'low' },
    { id: 'n2', agentId: 'regen-test', dependencies: ['n1'], retryPolicy: { maxRetries: 1, backoffMs: 10 }, timeoutMs: 1000, priority: 'low' },
    { id: 'n3', agentId: 'regen-test', dependencies: ['n2'], retryPolicy: { maxRetries: 1, backoffMs: 10 }, timeoutMs: 1000, priority: 'low' },
  ],
};

const diamond4: WorkflowDefinition = {
  id: 'diamond4',
  name: 'Diamond 4',
  description: 'A splits to B,C, merge to D',
  nodes: [
    { id: 'a', agentId: 'regen-test', dependencies: [], retryPolicy: { maxRetries: 1, backoffMs: 10 }, timeoutMs: 1000, priority: 'low' },
    { id: 'b', agentId: 'regen-test', dependencies: ['a'], retryPolicy: { maxRetries: 1, backoffMs: 10 }, timeoutMs: 1000, priority: 'low' },
    { id: 'c', agentId: 'regen-test', dependencies: ['a'], retryPolicy: { maxRetries: 1, backoffMs: 10 }, timeoutMs: 1000, priority: 'low' },
    { id: 'd', agentId: 'regen-test', dependencies: ['b', 'c'], retryPolicy: { maxRetries: 1, backoffMs: 10 }, timeoutMs: 1000, priority: 'low' },
  ],
};

describe('SectionNodeMap', () => {
  it('maps all 4 sections to their node IDs', () => {
    expect(SectionNodeMap['competitors']).toEqual(['r05']);
    expect(SectionNodeMap['personas']).toEqual(['r07']);
    expect(SectionNodeMap['market-research']).toEqual(['r04']);
    expect(SectionNodeMap['innovation']).toEqual(['r10']);
  });

  it('has labels for all sections', () => {
    expect(SectionLabels['competitors']).toBe('Competitor Analysis');
    expect(SectionLabels['personas']).toBe('User Persona Research');
    expect(SectionLabels['market-research']).toBe('Market Research');
    expect(SectionLabels['innovation']).toBe('Innovation Opportunities');
  });
});

describe('SelectiveRegenerationEngine', () => {
  it('regenerates entire 3-node workflow', async () => {
    const engine = new SelectiveRegenerationEngine(chain3, 'mock');
    const result = await engine.regenerateAll('test-proj', 'test');

    expect(result.success).toBe(true);
    expect(result.regeneratedNodeIds).toEqual(['n1', 'n2', 'n3']);
    expect(result.preservedNodeIds).toEqual([]);
  });

  it('regenerates single node and its downstream', async () => {
    const engine = new SelectiveRegenerationEngine(chain3, 'mock');
    const result = await engine.regenerateSections('test-proj', 'test', []);

    expect(result.success).toBe(true);
    expect(result.regeneratedNodeIds).toEqual([]);
    expect(result.preservedNodeIds).toEqual(['n1', 'n2', 'n3']);
  });

  it('handles diamond workflow', async () => {
    const engine = new SelectiveRegenerationEngine(diamond4, 'mock');
    const result = await engine.regenerateAll('diamond', 'test');

    expect(result.success).toBe(true);
    expect(result.regeneratedNodeIds.length).toBe(4);
  });

  it('has accessible orchestrator with history', async () => {
    const engine = new SelectiveRegenerationEngine(diamond4, 'mock');
    await engine.regenerateAll('hist', 'test');

    const orchestrator = engine.getOrchestrator();
    expect(orchestrator.getHistory().length).toBe(1);
  });

  it('regeneration result contains results map', async () => {
    const engine = new SelectiveRegenerationEngine(chain3, 'mock');
    const result = await engine.regenerateAll('map-test', 'test');

    expect(result.results.size).toBe(3);
    expect(result.results.has('n1')).toBe(true);
  });
});

describe('findDownstreamNodes', () => {
  it('finds all nodes downstream of n1 in chain3', () => {
    const engine = new SelectiveRegenerationEngine(chain3, 'mock');
    const affected = engine.findDownstreamNodes(new Set(['n1']));
    expect(affected.has('n1')).toBe(true);
    expect(affected.has('n2')).toBe(true);
    expect(affected.has('n3')).toBe(true);
  });

  it('only finds n3 downstream of n2 in chain3', () => {
    const engine = new SelectiveRegenerationEngine(chain3, 'mock');
    const affected = engine.findDownstreamNodes(new Set(['n2']));
    expect(affected.has('n1')).toBe(false);
    expect(affected.has('n2')).toBe(true);
    expect(affected.has('n3')).toBe(true);
  });

  it('finds no downstream for leaf node n3', () => {
    const engine = new SelectiveRegenerationEngine(chain3, 'mock');
    const affected = engine.findDownstreamNodes(new Set(['n3']));
    expect(affected.has('n1')).toBe(false);
    expect(affected.has('n2')).toBe(false);
    expect(affected.has('n3')).toBe(true);
  });

  it('does not include unrelated branches in diamond', () => {
    const engine = new SelectiveRegenerationEngine(diamond4, 'mock');
    const affected = engine.findDownstreamNodes(new Set(['b']));
    expect(affected.has('a')).toBe(false);
    expect(affected.has('b')).toBe(true);
    expect(affected.has('c')).toBe(false);
    expect(affected.has('d')).toBe(true); // d depends on b
  });
});

describe('buildSectionPreservingWorkflow', () => {
  it('produces smaller sub-workflow for market-research section', () => {
    const sub = buildSectionPreservingWorkflow(ResearchWorkflow, ['market-research']);
    expect(sub.nodes.length).toBeGreaterThan(0);
    expect(sub.nodes.length).toBeLessThanOrEqual(ResearchWorkflow.nodes.length);
    expect(sub.id).toContain('section-regen');
  });

  it('resolves section nodes correctly', () => {
    const engine = new SelectiveRegenerationEngine(ResearchWorkflow, 'mock');
    const nodes = engine.resolveSectionNodes(['competitors']);
    expect(nodes).toEqual(['r05']);
  });
});
