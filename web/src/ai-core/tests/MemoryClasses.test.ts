/* eslint-disable */
import {
  InMemoryProjectMemory,
  InMemoryConversationMemory,
  InMemoryDocumentMemory,
  InMemoryShortTermMemory,
  InMemoryGenerationHistory,
  InMemoryContextSnapshotStore,
  InMemoryLongTermMemory,
  GenerationRecord,
} from '../memory';

describe('InMemoryProjectMemory', () => {
  it('creates with default values', () => {
    const pm = new InMemoryProjectMemory('proj-1');
    expect(pm.projectId).toBe('proj-1');
    expect(pm.problemStatement).toBe('');
    expect(pm.constraints).toEqual([]);
    expect(pm.preferences).toEqual({});
    expect(pm.technologies).toEqual([]);
    expect(pm.id).toBe('proj-proj-1');
  });

  it('creates with initial values', () => {
    const pm = new InMemoryProjectMemory('proj-2', 'problem', ['c1'], { theme: 'dark' }, ['React']);
    expect(pm.problemStatement).toBe('problem');
    expect(pm.constraints).toEqual(['c1']);
    expect(pm.preferences).toEqual({ theme: 'dark' });
    expect(pm.technologies).toEqual(['React']);
  });

  it('updateProblem updates statement and timestamp', () => {
    const pm = new InMemoryProjectMemory('p1');
    const ts = pm.timestamp;
    pm.updateProblem('new problem');
    expect(pm.problemStatement).toBe('new problem');
    expect(pm.timestamp).toBeGreaterThanOrEqual(ts);
  });

  it('addConstraint adds a constraint', () => {
    const pm = new InMemoryProjectMemory('p1');
    pm.addConstraint('must be fast');
    expect(pm.constraints).toContain('must be fast');
  });

  it('setPreference sets a preference', () => {
    const pm = new InMemoryProjectMemory('p1');
    pm.setPreference('lang', 'en');
    expect(pm.preferences).toEqual({ lang: 'en' });
  });

  it('addTechnology adds unique technologies only', () => {
    const pm = new InMemoryProjectMemory('p1');
    pm.addTechnology('React');
    pm.addTechnology('React');
    expect(pm.technologies).toEqual(['React']);
  });
});

describe('InMemoryConversationMemory', () => {
  it('adds and retrieves messages', async () => {
    const cm = new InMemoryConversationMemory('proj-1');
    await cm.addMessage('user', 'Hello');
    await cm.addMessage('assistant', 'Hi');
    const history = await cm.getHistory();
    expect(history.length).toBe(2);
    expect(history[0].role).toBe('user');
    expect(history[0].content).toBe('Hello');
    expect(history[1].role).toBe('assistant');
    expect(history[1].content).toBe('Hi');
  });

  it('respects limit in getHistory', async () => {
    const cm = new InMemoryConversationMemory('proj-1');
    for (let i = 0; i < 10; i++) {
      await cm.addMessage('user', `msg ${i}`);
    }
    const limited = await cm.getHistory(3);
    expect(limited.length).toBe(3);
  });

  it('enforces max messages limit', async () => {
    const cm = new InMemoryConversationMemory('proj-1', 3);
    for (let i = 0; i < 10; i++) {
      await cm.addMessage('user', `msg ${i}`);
    }
    expect(cm.messages.length).toBe(3);
  });

  it('clears all messages', async () => {
    const cm = new InMemoryConversationMemory('proj-1');
    await cm.addMessage('user', 'Hello');
    await cm.clear();
    const history = await cm.getHistory();
    expect(history).toHaveLength(0);
  });
});

describe('InMemoryDocumentMemory', () => {
  it('saves and fetches documents', async () => {
    const dm = new InMemoryDocumentMemory('proj-1');
    await dm.saveDocument('analysis', 'analysis content');
    const doc = await dm.fetchDocument('analysis');
    expect(doc).toBe('analysis content');
  });

  it('returns null for missing document', async () => {
    const dm = new InMemoryDocumentMemory('proj-1');
    const doc = await dm.fetchDocument('nonexistent');
    expect(doc).toBeNull();
  });

  it('lists document keys', async () => {
    const dm = new InMemoryDocumentMemory('proj-1');
    await dm.saveDocument('a', 'a');
    await dm.saveDocument('b', 'b');
    const list = await dm.listDocuments();
    expect(list).toContain('a');
    expect(list).toContain('b');
    expect(list.length).toBe(2);
  });

  it('overwrites existing document', async () => {
    const dm = new InMemoryDocumentMemory('proj-1');
    await dm.saveDocument('key', 'v1');
    await dm.saveDocument('key', 'v2');
    const doc = await dm.fetchDocument('key');
    expect(doc).toBe('v2');
  });
});

describe('InMemoryShortTermMemory', () => {
  it('stores and retrieves generations', () => {
    const stm = new InMemoryShortTermMemory('proj-1');
    stm.setGeneration('node-1', 'output-1');
    expect(stm.recentGenerations['node-1']).toBe('output-1');
  });

  it('stores active variables', () => {
    const stm = new InMemoryShortTermMemory('proj-1');
    stm.setVariable('focus', 'performance');
    expect(stm.activeVariables).toEqual({ focus: 'performance' });
  });

  it('clears generations only', () => {
    const stm = new InMemoryShortTermMemory('proj-1');
    stm.setGeneration('n1', 'out');
    stm.setVariable('v1', 'val');
    stm.clearGenerations();
    expect(stm.recentGenerations).toEqual({});
    expect(stm.activeVariables).toEqual({ v1: 'val' });
  });

  it('clears everything', () => {
    const stm = new InMemoryShortTermMemory('proj-1');
    stm.setGeneration('n1', 'out');
    stm.setVariable('v1', 'val');
    stm.clearAll();
    expect(stm.recentGenerations).toEqual({});
    expect(stm.activeVariables).toEqual({});
  });
});

describe('InMemoryGenerationHistory', () => {
  const makeRecord = (moduleId: string, agentId: string, ts: number): GenerationRecord => ({
    id: `${moduleId}-${ts}`,
    agentId,
    moduleId,
    output: '{}',
    contextHash: 'abc',
    timestamp: ts,
    latencyMs: 100,
    success: true,
  });

  it('adds and retrieves records by module', async () => {
    const gh = new InMemoryGenerationHistory('proj-1');
    await gh.addRecord(makeRecord('mod-a', 'agent-1', 100));
    await gh.addRecord(makeRecord('mod-b', 'agent-2', 200));
    const modA = await gh.getByModule('mod-a');
    expect(modA.length).toBe(1);
    expect(modA[0].agentId).toBe('agent-1');
  });

  it('retrieves records by agent', async () => {
    const gh = new InMemoryGenerationHistory('proj-1');
    await gh.addRecord(makeRecord('m1', 'agent-x', 100));
    await gh.addRecord(makeRecord('m2', 'agent-x', 200));
    const records = await gh.getByAgent('agent-x');
    expect(records.length).toBe(2);
  });

  it('gets latest record for a module', async () => {
    const gh = new InMemoryGenerationHistory('proj-1');
    await gh.addRecord(makeRecord('mod', 'agent', 100));
    await gh.addRecord(makeRecord('mod', 'agent', 300));
    await gh.addRecord(makeRecord('mod', 'agent', 200));
    const latest = await gh.getLatest('mod');
    expect(latest!.timestamp).toBe(300);
  });

  it('returns null for missing module', async () => {
    const gh = new InMemoryGenerationHistory('proj-1');
    const latest = await gh.getLatest('nowhere');
    expect(latest).toBeNull();
  });
});

describe('InMemoryContextSnapshotStore', () => {
  it('saves and retrieves snapshots', async () => {
    const cs = new InMemoryContextSnapshotStore('proj-1');
    const snapshot = {
      id: 'snap-1',
      projectId: 'proj-1',
      timestamp: 100,
      contextHash: 'hash1',
      assembledContext: 'context',
      versionId: 'v1',
      workflowId: 'wf-1',
      nodeResults: { n1: 'out1' },
    };
    const id = await cs.saveSnapshot(snapshot);
    expect(id).toBe('snap-1');
    const retrieved = await cs.getSnapshot('snap-1');
    expect(retrieved).toEqual(snapshot);
  });

  it('returns null for missing snapshot', async () => {
    const cs = new InMemoryContextSnapshotStore('proj-1');
    const snap = await cs.getSnapshot('nonexistent');
    expect(snap).toBeNull();
  });

  it('finds by workflow', async () => {
    const cs = new InMemoryContextSnapshotStore('proj-1');
    await cs.saveSnapshot({ id: 's1', projectId: 'p1', timestamp: 0, contextHash: 'h1', assembledContext: '', versionId: 'v1', workflowId: 'wf-a', nodeResults: {} });
    await cs.saveSnapshot({ id: 's2', projectId: 'p1', timestamp: 0, contextHash: 'h2', assembledContext: '', versionId: 'v1', workflowId: 'wf-b', nodeResults: {} });
    const snaps = await cs.getByWorkflow('wf-a');
    expect(snaps.length).toBe(1);
    expect(snaps[0].id).toBe('s1');
  });

  it('finds by context hash', async () => {
    const cs = new InMemoryContextSnapshotStore('proj-1');
    await cs.saveSnapshot({ id: 's1', projectId: 'p1', timestamp: 0, contextHash: 'target-hash', assembledContext: '', versionId: 'v1', workflowId: 'wf-1', nodeResults: {} });
    const snap = await cs.getByContextHash('target-hash');
    expect(snap).not.toBeNull();
    expect(snap!.id).toBe('s1');
  });

  it('enforces max snapshots limit', async () => {
    const cs = new InMemoryContextSnapshotStore('proj-1', 2);
    for (let i = 0; i < 5; i++) {
      await cs.saveSnapshot({ id: `s${i}`, projectId: 'p1', timestamp: i, contextHash: `h${i}`, assembledContext: '', versionId: 'v1', workflowId: 'wf-1', nodeResults: {} });
    }
    expect(cs.snapshots.length).toBe(2);
  });
});

describe('InMemoryLongTermMemory', () => {
  it('persists and retrieves values', async () => {
    const ltm = new InMemoryLongTermMemory('proj-1');
    await ltm.persist('key1', { data: 'value' });
    const val = await ltm.retrieve('key1');
    expect(val).toEqual({ data: 'value' });
  });

  it('returns undefined for missing key', async () => {
    const ltm = new InMemoryLongTermMemory('proj-1');
    const val = await ltm.retrieve('nonexistent');
    expect(val).toBeUndefined();
  });

  it('deletes a key', async () => {
    const ltm = new InMemoryLongTermMemory('proj-1');
    await ltm.persist('key', 'val');
    const deleted = await ltm.delete('key');
    expect(deleted).toBe(true);
    const val = await ltm.retrieve('key');
    expect(val).toBeUndefined();
  });

  it('returns false when deleting missing key', async () => {
    const ltm = new InMemoryLongTermMemory('proj-1');
    const deleted = await ltm.delete('nowhere');
    expect(deleted).toBe(false);
  });

  it('clears all stored data', async () => {
    const ltm = new InMemoryLongTermMemory('proj-1');
    await ltm.persist('a', 1);
    await ltm.persist('b', 2);
    await ltm.clear();
    expect(await ltm.retrieve('a')).toBeUndefined();
    expect(await ltm.retrieve('b')).toBeUndefined();
  });
});
