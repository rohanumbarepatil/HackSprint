/* eslint-disable */
import { AgentRegistry } from '../agents/AgentRegistry';
import { BaseAgent, AgentMetadata } from '../agents/BaseAgent';
import { MockProvider } from '../providers/MockProvider';
import { registerAllAgents } from '../agents';
import { z } from 'zod';
import { AIProvider } from '../providers/AIProvider';

class TestAgent extends BaseAgent {
  metadata: AgentMetadata = { id: 'test-agent', name: 'Test', description: 'Test agent', version: '1.0' };
  requiredContext: string[] = [];
  producedOutput: string = 'test-output';
  outputSchema = z.object({ result: z.string() });

  async execute(_prompt: string, _sys: string): Promise<string> {
    return JSON.stringify({ result: 'ok' });
  }
}

describe('AgentRegistry', () => {
  beforeAll(() => {
    AgentRegistry.register('test-agent', TestAgent as any);
  });

  it('registers and retrieves an agent class', () => {
    const AgentClass = AgentRegistry.get('test-agent');
    expect(AgentClass).toBe(TestAgent);
  });

  it('throws on duplicate registration', () => {
    expect(() => AgentRegistry.register('test-agent', TestAgent as any)).toThrow('already registered');
  });

  it('throws on missing agent', () => {
    expect(() => AgentRegistry.get('nonexistent')).toThrow('not found in registry');
  });

  it('lists registered agents', () => {
    const list = AgentRegistry.listAll();
    expect(list).toContain('test-agent');
  });

  it('instantiates agent with provider', () => {
    const provider = new MockProvider({ simulateLatency: false });
    const AgentClass = AgentRegistry.get('test-agent');
    const agent = new AgentClass(provider);
    expect(agent.metadata.id).toBe('test-agent');
    expect(agent.execute).toBeDefined();
  });
});

describe('BaseAgent', () => {
  it('executes and returns output', async () => {
    const provider = new MockProvider({ simulateLatency: false });
    const AgentClass = AgentRegistry.get('test-agent');
    const agent = new AgentClass(provider);
    const output = await agent.execute('prompt', 'system');
    const parsed = JSON.parse(output);
    expect(parsed.result).toBe('ok');
  });
});

describe('registerAllAgents', () => {
  it('registers all 15 agents without error', () => {
    registerAllAgents();
    const agents = AgentRegistry.listAll();
    expect(agents).toContain('agent-problem-analyzer');
    expect(agents).toContain('agent-research');
    expect(agents).toContain('agent-competitor');
    expect(agents).toContain('agent-innovation');
    expect(agents).toContain('agent-pm');
    expect(agents).toContain('agent-tech-architect');
    expect(agents).toContain('agent-db-architect');
    expect(agents).toContain('agent-ui-ux');
    expect(agents).toContain('agent-backend');
    expect(agents).toContain('agent-security');
    expect(agents).toContain('agent-qa');
    expect(agents).toContain('agent-business-analyst');
    expect(agents).toContain('agent-pitch');
    expect(agents).toContain('agent-documentation');
    expect(agents).toContain('agent-validation');
    expect(agents.length).toBeGreaterThanOrEqual(16); // 15 new + test-agent
  });
});
