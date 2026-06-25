/* eslint-disable */
import { PromptRegistry, PromptRecord, PromptVersion } from '../registry/PromptRegistry';

describe('PromptRegistry', () => {
  beforeEach(() => {
    const ids = ['test-prompt', 'validate-prompt', 'search-prompt', 'rollback-prompt', 'temp-prompt'];
    for (const id of ids) {
      try { PromptRegistry.unregister(id); } catch { }
    }
  });

  describe('register', () => {
    it('registers a new prompt with extracted variables', () => {
      const record = PromptRegistry.register(
        { id: 'test-prompt', name: 'Test', category: 'agent', description: 'A test prompt', tags: [], createdBy: 'tester' },
        'Hello {{name}}, your score is {{score}}'
      );
      expect(record.metadata.id).toBe('test-prompt');
      expect(record.versions.length).toBe(1);
      expect(record.versions[0].variables).toEqual(['name', 'score']);
      expect(record.metadata.currentVersionId).toBe('test-prompt_v1.0');
    });

    it('throws on duplicate registration', () => {
      PromptRegistry.register(
        { id: 'test-prompt', name: 'Test', category: 'agent', description: '', tags: [], createdBy: 'tester' },
        'content'
      );
      expect(() =>
        PromptRegistry.register(
          { id: 'test-prompt', name: 'Test', category: 'agent', description: '', tags: [], createdBy: 'tester' },
          'content'
        )
      ).toThrow('already registered');
    });

    it('accepts explicit variables and version number', () => {
      const record = PromptRegistry.register(
        { id: 'test-prompt', name: 'Test', category: 'system', description: '', tags: [], createdBy: 'me' },
        '{{a}} {{b}}',
        { versionNumber: '2.0', variables: ['a', 'b', 'c'], tags: ['important'], status: 'published', changelog: 'First' }
      );
      expect(record.versions[0].versionNumber).toBe('2.0');
      expect(record.versions[0].variables).toEqual(['a', 'b', 'c']);
      expect(record.versions[0].status).toBe('published');
      expect(record.metadata.tags).toContain('important');
    });

    it('stores validator function on version', () => {
      const validator = (c: string) => c.length > 0;
      const record = PromptRegistry.register(
        { id: 'test-prompt', name: 'Test', category: 'agent', description: '', tags: [], createdBy: 'me' },
        'content',
        { validator }
      );
      expect(record.versions[0].validator).toBe(validator);
    });
  });

  describe('createVersion', () => {
    beforeEach(() => {
      PromptRegistry.register(
        { id: 'test-prompt', name: 'Test', category: 'agent', description: '', tags: [], createdBy: 'me' },
        'v1 content'
      );
    });

    it('creates a new version with auto-incremented minor', () => {
      const version = PromptRegistry.createVersion('test-prompt', 'v2 content');
      expect(version.versionNumber).toBe('1.1');
      expect(version.content).toBe('v2 content');
    });

    it('creates version with explicit version number', () => {
      const version = PromptRegistry.createVersion('test-prompt', 'v2 content', { versionNumber: '3.0' });
      expect(version.versionNumber).toBe('3.0');
    });

    it('throws for non-existent prompt', () => {
      expect(() => PromptRegistry.createVersion('nonexistent', 'content')).toThrow('not found');
    });

    it('throws for duplicate version number', () => {
      expect(() => PromptRegistry.createVersion('test-prompt', 'dup', { versionNumber: '1.0' })).toThrow('already exists');
    });

    it('sets currentVersionId when published', () => {
      const version = PromptRegistry.createVersion('test-prompt', 'v2 pub', { status: 'published' });
      const record = PromptRegistry.get('test-prompt')!;
      expect(record.metadata.currentVersionId).toBe(version.id);
      expect(version.publishedAt).toBeDefined();
    });

    it('prunes versions beyond MAX_ROLLBACK_VERSIONS', () => {
      PromptRegistry.setMaxRollbackVersions(2);
      for (let i = 0; i < 5; i++) {
        PromptRegistry.createVersion('test-prompt', `content ${i}`);
      }
      const record = PromptRegistry.get('test-prompt')!;
      expect(record.versions.length).toBe(2);
      PromptRegistry.setMaxRollbackVersions(10);
    });
  });

  describe('publish', () => {
    it('publishes the latest version by default', () => {
      PromptRegistry.register(
        { id: 'test-prompt', name: 'Test', category: 'agent', description: '', tags: [], createdBy: 'me' },
        'initial',
        { status: 'draft' }
      );
      const published = PromptRegistry.publish('test-prompt');
      expect(published.status).toBe('published');
      expect(published.publishedAt).toBeDefined();
      const record = PromptRegistry.get('test-prompt')!;
      expect(record.metadata.currentVersionId).toBe(published.id);
    });

    it('publishes a specific version', () => {
      PromptRegistry.register(
        { id: 'test-prompt', name: 'Test', category: 'agent', description: '', tags: [], createdBy: 'me' },
        'v1',
        { status: 'published' }
      );
      const v2 = PromptRegistry.createVersion('test-prompt', 'v2', { status: 'draft' });
      const published = PromptRegistry.publish('test-prompt', v2.id);
      expect(published.status).toBe('published');
    });

    it('throws when validator fails on publish', () => {
      PromptRegistry.register(
        { id: 'validate-prompt', name: 'Val', category: 'agent', description: '', tags: [], createdBy: 'me' },
        'content',
        { validator: () => false }
      );
      expect(() => PromptRegistry.publish('validate-prompt')).toThrow('failed validation');
    });

    it('throws for non-existent prompt', () => {
      expect(() => PromptRegistry.publish('nowhere')).toThrow('not found');
    });
  });

  describe('deprecate', () => {
    it('deprecates current version and publishes latest', () => {
      PromptRegistry.register(
        { id: 'test-prompt', name: 'Test', category: 'agent', description: '', tags: [], createdBy: 'me' },
        'v1',
        { status: 'published' }
      );
      PromptRegistry.createVersion('test-prompt', 'v2');
      const deprecated = PromptRegistry.deprecate('test-prompt');
      expect(deprecated.status).toBe('deprecated');
      const record = PromptRegistry.get('test-prompt')!;
      expect(record.metadata.currentVersionId).not.toBe(deprecated.id);
    });
  });

  describe('rollback', () => {
    it('creates a rollback version from a target version', () => {
      PromptRegistry.register(
        { id: 'rollback-prompt', name: 'RB', category: 'agent', description: '', tags: [], createdBy: 'me' },
        'original content',
        { status: 'published' }
      );
      PromptRegistry.createVersion('rollback-prompt', 'v2 bad', { status: 'published' });
      const rollback = PromptRegistry.rollback('rollback-prompt', '1.0');
      expect(rollback.content).toBe('original content');
      expect(rollback.versionNumber).toContain('rollback');
      expect(rollback.status).toBe('published');
      const record = PromptRegistry.get('rollback-prompt')!;
      expect(record.metadata.currentVersionId).toBe(rollback.id);
    });

    it('throws for non-existent version', () => {
      PromptRegistry.register(
        { id: 'rollback-prompt', name: 'RB', category: 'agent', description: '', tags: [], createdBy: 'me' },
        'content'
      );
      expect(() => PromptRegistry.rollback('rollback-prompt', '99.0')).toThrow('not found');
    });
  });

  describe('hydrate', () => {
    it('substitutes variables in prompt content', () => {
      PromptRegistry.register(
        { id: 'test-prompt', name: 'Test', category: 'agent', description: '', tags: [], createdBy: 'me' },
        'Hello {{name}}, your {{item}} is ready',
        { status: 'published' }
      );
      const result = PromptRegistry.hydrate('test-prompt', { name: 'Alice', item: 'report' });
      expect(result).toBe('Hello Alice, your report is ready');
    });

    it('throws for missing variables', () => {
      PromptRegistry.register(
        { id: 'test-prompt', name: 'Test', category: 'agent', description: '', tags: [], createdBy: 'me' },
        '{{a}} and {{b}}',
        { status: 'published' }
      );
      expect(() => PromptRegistry.hydrate('test-prompt', { a: 'val' })).toThrow('Missing required variable');
    });

    it('uses specific version when versionId provided', () => {
      PromptRegistry.register(
        { id: 'test-prompt', name: 'Test', category: 'agent', description: '', tags: [], createdBy: 'me' },
        '{{var}} v1',
        { status: 'draft' }
      );
      const v2 = PromptRegistry.createVersion('test-prompt', '{{var}} v2', { status: 'published' });
      const result = PromptRegistry.hydrate('test-prompt', { var: 'data' }, { versionId: v2.id });
      expect(result).toBe('data v2');
    });

    it('warns on deprecated version hydration', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      PromptRegistry.register(
        { id: 'test-prompt', name: 'Test', category: 'agent', description: '', tags: [], createdBy: 'me' },
        '{{x}}',
        { status: 'published' }
      );
      const v2 = PromptRegistry.createVersion('test-prompt', '{{x}} v2', { status: 'deprecated' });
      PromptRegistry.hydrate('test-prompt', { x: 'val' }, { versionId: v2.id });
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('deprecated'));
      warnSpy.mockRestore();
    });

    it('warns on unsubstituted variables', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      PromptRegistry.register(
        { id: 'test-prompt', name: 'Test', category: 'agent', description: '', tags: [], createdBy: 'me' },
        '{{a}}{{b}}',
        { variables: ['a'], status: 'published' }
      );
      PromptRegistry.hydrate('test-prompt', { a: 'val' });
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('unsubstituted'));
      warnSpy.mockRestore();
    });
  });

  describe('validatePrompt', () => {
    it('returns error for empty content', () => {
      const errors = PromptRegistry.validatePrompt('any', '');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].field).toBe('content');
    });

    it('checks max length', () => {
      const errors = PromptRegistry.validatePrompt('any', 'short', { maxLength: 3 });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('max length');
    });

    it('checks required variables present in content', () => {
      const errors = PromptRegistry.validatePrompt('any', 'hello {{name}}', { requireVariables: ['name', 'missing'] });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.message.includes('missing'))).toBe(true);
    });

    it('checks allowed variables', () => {
      const errors = PromptRegistry.validatePrompt('any', '{{allowed}} {{disallowed}}', { allowedVariables: ['allowed'] });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.message.includes('disallowed'))).toBe(true);
    });
  });

  describe('get / getVersion / getCurrentVersion', () => {
    it('returns undefined for missing prompt', () => {
      expect(PromptRegistry.get('nonexistent')).toBeUndefined();
    });

    it('returns specific version', () => {
      PromptRegistry.register(
        { id: 'test-prompt', name: 'Test', category: 'agent', description: '', tags: [], createdBy: 'me' },
        'content',
        { status: 'published' }
      );
      const version = PromptRegistry.getVersion('test-prompt', 'test-prompt_v1.0');
      expect(version).toBeDefined();
      expect(version!.content).toBe('content');
    });

    it('returns current published version', () => {
      const record = PromptRegistry.register(
        { id: 'test-prompt', name: 'Test', category: 'agent', description: '', tags: [], createdBy: 'me' },
        'current',
        { status: 'published' }
      );
      const current = PromptRegistry.getCurrentVersion('test-prompt');
      expect(current).toBeDefined();
      expect(current!.content).toBe('current');
    });
  });

  describe('search / listByCategory / listAll', () => {
    beforeEach(() => {
      PromptRegistry.register(
        { id: 'search-prompt', name: 'Alpha Prompt', category: 'agent', description: 'First agent prompt', tags: ['important', 'ai'], createdBy: 'me' },
        'content',
        { status: 'draft' }
      );
    });

    it('lists all prompts', () => {
      const all = PromptRegistry.listAll();
      expect(all.length).toBeGreaterThanOrEqual(1);
      expect(all.some(p => p.id === 'search-prompt')).toBe(true);
    });

    it('filters by category', () => {
      const agentPrompts = PromptRegistry.listByCategory('agent');
      expect(agentPrompts.some(p => p.metadata.id === 'search-prompt')).toBe(true);
      const systemPrompts = PromptRegistry.listByCategory('system');
      expect(systemPrompts.some(p => p.metadata.id === 'search-prompt')).toBe(false);
    });

    it('searches by name, description, or tags', () => {
      const byName = PromptRegistry.search('Alpha');
      expect(byName.some(p => p.metadata.id === 'search-prompt')).toBe(true);

      const byDesc = PromptRegistry.search('agent');
      expect(byDesc.some(p => p.metadata.id === 'search-prompt')).toBe(true);

      const byTag = PromptRegistry.search('Alpha');
      expect(byTag.some(p => p.metadata.id === 'search-prompt')).toBe(true);
    });
  });

  describe('unregister', () => {
    it('removes a prompt from the registry', () => {
      PromptRegistry.register(
        { id: 'temp-prompt', name: 'Temp', category: 'agent', description: '', tags: [], createdBy: 'me' },
        'content'
      );
      PromptRegistry.unregister('temp-prompt');
      expect(PromptRegistry.get('temp-prompt')).toBeUndefined();
    });

    it('throws for non-existent prompt', () => {
      expect(() => PromptRegistry.unregister('nowhere')).toThrow('not found');
    });
  });

  describe('setMaxRollbackVersions', () => {
    it('enforces minimum of 1', () => {
      PromptRegistry.setMaxRollbackVersions(0);
      PromptRegistry.register(
        { id: 'test-prompt', name: 'Test', category: 'agent', description: '', tags: [], createdBy: 'me' },
        'base'
      );
      for (let i = 0; i < 5; i++) PromptRegistry.createVersion('test-prompt', `v${i}`);
      const record = PromptRegistry.get('test-prompt')!;
      expect(record.versions.length).toBe(1);
      PromptRegistry.setMaxRollbackVersions(10);
    });
  });
});
