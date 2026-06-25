/* eslint-disable */
import { MockProvider } from '../providers/MockProvider';
import { ProviderFactory } from '../providers/ProviderFactory';
import { z } from 'zod';

describe('MockProvider', () => {
  it('generates a response', async () => {
    const provider = new MockProvider({ simulateLatency: false });
    const response = await provider.generate('test prompt');
    expect(response.text).toBeTruthy();
    expect(response.provider).toBe('mock');
    expect(response.tokens.totalTokens).toBe(200);
  });

  it('supports schema option in generate', async () => {
    const provider = new MockProvider({ simulateLatency: false });
    const schema = z.object({ mock: z.string(), success: z.boolean() });
    const response = await provider.generate('test', { schema });
    const parsed = JSON.parse(response.text);
    expect(parsed.success).toBe(true);
  });

  it('throws on forced failure', async () => {
    const provider = new MockProvider({ simulateLatency: false, shouldFail: true });
    await expect(provider.generate('fail')).rejects.toThrow('MockProvider forced generation failure');
  });

  it('streams events', async () => {
    const provider = new MockProvider({ simulateLatency: false });
    const events: string[] = [];
    for await (const event of provider.stream('test')) {
      events.push(event.type);
    }
    expect(events).toContain('STARTED');
    expect(events).toContain('GENERATING');
    expect(events).toContain('COMPLETED');
  });

  it('streams failure on shouldFail', async () => {
    const provider = new MockProvider({ simulateLatency: false, shouldFail: true });
    const events: string[] = [];
    for await (const event of provider.stream('fail')) {
      events.push(event.type);
    }
    expect(events).toContain('FAILED');
    expect(events).not.toContain('COMPLETED');
  });

  it('validates response against schema', async () => {
    const provider = new MockProvider({ simulateLatency: false });
    const schema = z.object({ mock: z.string(), success: z.boolean() });
    const result = await provider.validate(JSON.stringify({ mock: 'data', success: true }), schema);
    expect(result.isValid).toBe(true);
  });

  it('returns invalid for bad schema', async () => {
    const provider = new MockProvider({ simulateLatency: false });
    const schema = z.object({ required: z.string() });
    const result = await provider.validate(JSON.stringify({ wrong: 'data' }), schema);
    expect(result.isValid).toBe(false);
  });

  it('counts tokens', async () => {
    const provider = new MockProvider({ simulateLatency: false });
    const count = await provider.countTokens('hello world');
    expect(count).toBeGreaterThan(0);
    expect(count).toBe(Math.ceil('hello world'.length / 4));
  });

  it('health check returns healthy', async () => {
    const provider = new MockProvider({ simulateLatency: false });
    const health = await provider.healthCheck();
    expect(health.status).toBe('healthy');
  });

  it('health check returns down on shouldFail', async () => {
    const provider = new MockProvider({ simulateLatency: false, shouldFail: true });
    const health = await provider.healthCheck();
    expect(health.status).toBe('down');
  });
});

describe('ProviderFactory', () => {
  it('creates MockProvider', () => {
    const provider = ProviderFactory.create('mock');
    expect(provider).toBeInstanceOf(MockProvider);
  });

  it('throws for unimplemented providers', () => {
    expect(() => ProviderFactory.create('openai')).toThrow('not yet implemented');
    expect(() => ProviderFactory.create('anthropic')).toThrow('not yet implemented');
  });

  it('throws for unknown provider', () => {
    expect(() => (ProviderFactory as any).create('unknown')).toThrow('Unknown provider');
  });
});
