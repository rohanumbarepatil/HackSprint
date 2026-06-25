/* eslint-disable */
jest.mock('@/lib/firebase/client', () => {
  const mockAuth = {};
  const mockDb = {};
  const mockStorage = {};
  return {
    auth: mockAuth,
    db: mockDb,
    storage: mockStorage,
    default: {},
  };
});

jest.mock('@/repositories/firestore/collections', () => ({
  COLLECTIONS: { ANALYTICS: 'analytics', TOKEN_USAGE: 'token-usage', AUDIT_LOGS: 'audit-logs' },
  AnalyticsDoc: class {},
  AuditLogDoc: class {},
  TokenUsageDoc: class {},
}));

import { StreamingPipeline } from '../streaming/StreamingPipeline';

describe('StreamingPipeline', () => {
  describe('stream', () => {
    it('yields events from mock provider', async () => {
      const pipeline = new StreamingPipeline('mock');
      const events: string[] = [];

      for await (const event of pipeline.stream('proj-1', 'agent-1', 'test prompt')) {
        events.push(event.type);
      }

      expect(events).toContain('STARTED');
      expect(events).toContain('GENERATING');
      expect(events).toContain('COMPLETED');
    });

    it('yields GENERATING events with payload', async () => {
      const pipeline = new StreamingPipeline('mock');
      const texts: string[] = [];

      for await (const event of pipeline.stream('proj-2', 'agent-2', 'prompt')) {
        if (event.type === 'GENERATING' && event.payload) {
          texts.push(event.payload);
        }
      }

      expect(texts.length).toBeGreaterThan(0);
      const combined = texts.join('');
      expect(combined).toBeTruthy();
    });

    it('includes THINKING and RESEARCHING events', async () => {
      const pipeline = new StreamingPipeline('mock');
      const types = new Set<string>();

      for await (const event of pipeline.stream('proj-3', 'agent-3', 'prompt')) {
        types.add(event.type);
      }

      expect(types.has('THINKING')).toBe(true);
      expect(types.has('RESEARCHING')).toBe(true);
    });

    it('includes SAVING event', async () => {
      const pipeline = new StreamingPipeline('mock');
      const types = new Set<string>();

      for await (const event of pipeline.stream('proj-4', 'agent-4', 'prompt')) {
        types.add(event.type);
      }

      expect(types.has('SAVING')).toBe(true);
    });

    it('yields events with timestamps', async () => {
      const pipeline = new StreamingPipeline('mock');
      let eventCount = 0;

      for await (const event of pipeline.stream('proj-5', 'agent-5', 'prompt')) {
        expect(event.timestamp).toBeGreaterThan(0);
        eventCount++;
      }

      expect(eventCount).toBeGreaterThan(0);
    });
  });

  describe('executeWithEvents', () => {
    it('collects all events and returns full text', async () => {
      const result = await StreamingPipeline.executeWithEvents('mock', 'test prompt');

      expect(result.text).toBeTruthy();
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('accumulates text from GENERATING events', async () => {
      const result = await StreamingPipeline.executeWithEvents('mock', 'hello');

      expect(result.text.length).toBeGreaterThan(0);

      const generatingEvents = result.events.filter(e => e.type === 'GENERATING');
      const expectedText = generatingEvents.map(e => e.payload).join('');
      expect(result.text).toBe(expectedText);
    });
  });
});
