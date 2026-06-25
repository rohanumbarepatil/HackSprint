/* eslint-disable */
import { AgentRegistry } from '../agents/AgentRegistry';
import { MockProvider } from '../providers/MockProvider';
import { registerResearchAgents } from '../agents/research';
import { ResearchWorkflow } from '../orchestrator/ResearchWorkflow';
import { DAGOrchestrator } from '../orchestrator/DAGOrchestrator';

describe('Research Agents', () => {
  beforeAll(() => {
    registerResearchAgents();
  });

  it('registers all 18 research agents', () => {
    const agentIds = [
      'agent-research-01-problem-understanding',
      'agent-research-02-domain-identification',
      'agent-research-03-industry-research',
      'agent-research-04-market-research',
      'agent-research-05-competitor-analysis',
      'agent-research-06-gap-analysis',
      'agent-research-07-user-persona-research',
      'agent-research-08-pain-point-analysis',
      'agent-research-09-existing-solution-analysis',
      'agent-research-10-innovation-opportunities',
      'agent-research-11-feature-brainstorming',
      'agent-research-12-business-model-suggestions',
      'agent-research-13-technology-recommendations',
      'agent-research-14-architecture-recommendations',
      'agent-research-15-risk-analysis',
      'agent-research-16-security-considerations',
      'agent-research-17-scalability-considerations',
      'agent-research-18-future-scope',
    ];

    const registered = AgentRegistry.listAll();
    for (const id of agentIds) {
      expect(registered).toContain(id);
    }
  });

  it('each stage agent is retrievable from registry', () => {
    for (let i = 1; i <= 18; i++) {
      const id = `agent-research-${String(i).padStart(2, '0')}-`;
      const matched = AgentRegistry.listAll().find(a => a.startsWith(id));
      expect(matched).toBeDefined();
    }
  });

  it('instantiates and executes ProblemUnderstandingAgent', async () => {
    const provider = new MockProvider({ simulateLatency: false });
    const AgentClass = AgentRegistry.get('agent-research-01-problem-understanding');
    const agent = new AgentClass(provider);
    const output = await agent.execute('test', 'system');

    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty('success', true);
  });

  it('instantiates and executes FutureScopeAgent', async () => {
    const provider = new MockProvider({ simulateLatency: false });
    const AgentClass = AgentRegistry.get('agent-research-18-future-scope');
    const agent = new AgentClass(provider);
    const output = await agent.execute('test', 'system');

    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty('success', true);
  });

  it('ProblemUnderstandingAgent has correct metadata', () => {
    const AgentClass = AgentRegistry.get('agent-research-01-problem-understanding');
    const provider = new MockProvider({ simulateLatency: false });
    const agent = new AgentClass(provider);
    expect(agent.metadata.id).toBe('agent-research-01-problem-understanding');
    expect(agent.metadata.name).toBe('Problem Understanding');
  });

  it('FutureScopeAgent has correct metadata', () => {
    const AgentClass = AgentRegistry.get('agent-research-18-future-scope');
    const provider = new MockProvider({ simulateLatency: false });
    const agent = new AgentClass(provider);
    expect(agent.metadata.id).toBe('agent-research-18-future-scope');
    expect(agent.metadata.name).toBe('Future Scope');
  });

  it('middle stage agent (GapAnalysis) has correct dependencies', () => {
    const AgentClass = AgentRegistry.get('agent-research-06-gap-analysis');
    const provider = new MockProvider({ simulateLatency: false });
    const agent = new AgentClass(provider);
    expect(agent.requiredContext).toContain('research-problem-understanding');
    expect(agent.requiredContext).toContain('research-competitor');
    expect(agent.producedOutput).toBe('research-gap');
  });
});

describe('ResearchWorkflow', () => {
  it('has 18 nodes', () => {
    expect(ResearchWorkflow.nodes.length).toBe(18);
  });

  it('starts with problem understanding as root node', () => {
    const root = ResearchWorkflow.nodes.find(n => n.agentId === 'agent-research-01-problem-understanding');
    expect(root).toBeDefined();
    expect(root!.dependencies).toEqual([]);
  });

  it('ends with future scope as the final node', () => {
    const last = ResearchWorkflow.nodes.find(n => n.agentId === 'agent-research-18-future-scope');
    expect(last).toBeDefined();
    expect(last!.dependencies.length).toBeGreaterThan(0);
  });

  it('executes single stage with mock provider', async () => {
    const singleStageWorkflow = {
      id: 'research-single',
      name: 'Single Stage Test',
      description: '',
      nodes: [ResearchWorkflow.nodes[0]],
    };

    const orchestrator = new DAGOrchestrator(singleStageWorkflow, 'mock');
    const results = await orchestrator.executePipeline('test-proj', 'test');

    expect(results.has('r01')).toBe(true);
    const output = JSON.parse(results.get('r01')!);
    expect(output).toHaveProperty('success', true);
  });

  it('all agent IDs in workflow are registered', () => {
    const registered = AgentRegistry.listAll();
    for (const node of ResearchWorkflow.nodes) {
      expect(registered).toContain(node.agentId);
    }
  });

  it('has sequential dependency chain', () => {
    for (let i = 1; i < ResearchWorkflow.nodes.length; i++) {
      const node = ResearchWorkflow.nodes[i];
      expect(node.dependencies.length).toBeGreaterThanOrEqual(1);
    }
  });
});
