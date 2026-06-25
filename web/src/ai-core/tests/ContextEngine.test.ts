/* eslint-disable */
import { ContextEngine, AssembledContext } from '../context/ContextEngine';
import {
  InMemoryProjectMemory,
  InMemoryDocumentMemory,
  InMemoryConversationMemory,
  InMemoryShortTermMemory,
} from '../memory';

describe('ContextEngine', () => {
  let projectMemory: InMemoryProjectMemory;
  let documentMemory: InMemoryDocumentMemory;

  beforeEach(() => {
    projectMemory = new InMemoryProjectMemory(
      'test-proj',
      'Build a task management app',
      ['Must be real-time', 'Mobile first'],
      { theme: 'dark', language: 'en' },
      ['React', 'Node.js', 'Firebase']
    );

    documentMemory = new InMemoryDocumentMemory('test-proj');
  });

  describe('buildContext', () => {
    it('assembles a complete context with all fields', async () => {
      const context = await ContextEngine.buildContext(
        projectMemory,
        documentMemory,
        ['problem', 'research']
      );
      expect(context.systemInstruction).toBeTruthy();
      expect(context.projectContext).toContain('PROBLEM STATEMENT');
      expect(context.projectContext).toContain('CONSTRAINTS');
      expect(context.projectContext).toContain('TECHNOLOGIES');
      expect(context.projectContext).toContain('USER PREFERENCES');
      expect(context.upstreamDocuments).toBe('');
      expect(context.userPreferences).toContain('dark');
      expect(context.shortTermMemory).toContain('No active session context');
      expect(context.conversationSummary).toContain('No conversation history');
      expect(context.version).toBeDefined();
      expect(context.version.hash).toHaveLength(16);
      expect(context.version.versionId).toMatch(/^ctx_/);
    });

    it('includes upstream document content when available', async () => {
      await documentMemory.saveDocument('problem', 'Problem: build a great app');
      await documentMemory.saveDocument('research', 'Research: market is big');

      const context = await ContextEngine.buildContext(
        projectMemory,
        documentMemory,
        ['problem', 'research']
      );
      expect(context.upstreamDocuments).toContain('MODULE: PROBLEM');
      expect(context.upstreamDocuments).toContain('MODULE: RESEARCH');
      expect(context.upstreamDocuments).toContain('Problem: build a great app');
      expect(context.upstreamDocuments).toContain('Research: market is big');
    });

    it('includes conversation history when provided', async () => {
      const convMemory = new InMemoryConversationMemory('test-proj');
      await convMemory.addMessage('user', 'Hello');
      await convMemory.addMessage('assistant', 'Hi there');

      const context = await ContextEngine.buildContext(
        projectMemory,
        documentMemory,
        [],
        { conversationMemory: convMemory }
      );
      expect(context.conversationSummary).toContain('[USER] Hello');
      expect(context.conversationSummary).toContain('[ASSISTANT] Hi there');
    });

    it('includes short-term memory when provided', async () => {
      const stm = new InMemoryShortTermMemory('test-proj');
      stm.setGeneration('node-analysis', '{"result": "analyzed"}');
      stm.setVariable('focus', 'performance');

      const context = await ContextEngine.buildContext(
        projectMemory,
        documentMemory,
        [],
        { shortTermMemory: stm }
      );
      expect(context.shortTermMemory).toContain('RECENT GENERATIONS');
      expect(context.shortTermMemory).toContain('node-analysis');
      expect(context.shortTermMemory).toContain('ACTIVE VARIABLES');
      expect(context.shortTermMemory).toContain('focus');
    });

    it('generates unique version hashes for different content', async () => {
      const context1 = await ContextEngine.buildContext(
        projectMemory,
        documentMemory,
        []
      );

      const altProject = new InMemoryProjectMemory('other', 'Different problem');
      const context2 = await ContextEngine.buildContext(
        altProject,
        documentMemory,
        []
      );
      expect(context1.version.hash).not.toBe(context2.version.hash);
      expect(context1.version.versionId).not.toBe(context2.version.versionId);
    });

    it('handles project with empty constraints and technologies', async () => {
      const minimalProject = new InMemoryProjectMemory('minimal', 'Just a problem');
      const context = await ContextEngine.buildContext(
        minimalProject,
        documentMemory,
        []
      );
      expect(context.projectContext).toContain('PROBLEM STATEMENT');
      expect(context.version.hash).toBeTruthy();
    });

    it('generates system instruction containing header', async () => {
      const context = await ContextEngine.buildContext(
        projectMemory,
        documentMemory,
        []
      );
      expect(context.systemInstruction).toContain('HackSprint AI');
      expect(context.systemInstruction).toContain('JSON schema');
    });

    it('limits conversation history to 20 messages', async () => {
      const convMemory = new InMemoryConversationMemory('test-proj');
      for (let i = 0; i < 25; i++) {
        await convMemory.addMessage('user', `Message ${i}`);
      }
      const context = await ContextEngine.buildContext(
        projectMemory,
        documentMemory,
        [],
        { conversationMemory: convMemory }
      );
      const lines = context.conversationSummary.split('\n').filter(l => l.startsWith('[USER]'));
      expect(lines.length).toBe(20);
    });
  });

  describe('buildSelectiveContext', () => {
    it('builds context for a specific agent request', async () => {
      const context = await ContextEngine.buildSelectiveContext(
        projectMemory,
        documentMemory,
        {
          agentId: 'test-agent',
          requiredModules: ['problem'],
          includePreferences: true,
          includeConversation: false,
        }
      );
      expect(context.systemInstruction).toBeTruthy();
      expect(context.projectContext).toContain('PROBLEM STATEMENT');
      expect(context.shortTermMemory).toBe('');
      expect(context.conversationSummary).toBe('');
    });

    it('excludes preferences when includePreferences is false', async () => {
      const context = await ContextEngine.buildSelectiveContext(
        projectMemory,
        documentMemory,
        {
          agentId: 'test-agent',
          requiredModules: [],
          includePreferences: false,
        }
      );
      expect(context.userPreferences).toBe('');
    });

    it('includes upstream docs for specified modules', async () => {
      await documentMemory.saveDocument('architecture', 'Architecture doc content');
      const context = await ContextEngine.buildSelectiveContext(
        projectMemory,
        documentMemory,
        {
          agentId: 'architect',
          requiredModules: ['architecture'],
          includePreferences: false,
        }
      );
      expect(context.upstreamDocuments).toContain('Architecture doc content');
    });
  });
});
