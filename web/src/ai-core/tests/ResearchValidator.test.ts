/* eslint-disable */
import { ResearchValidator } from '../pipeline/ResearchValidator';

describe('ResearchValidator', () => {
  describe('validateStage', () => {
    it('returns a valid result for complete, consistent content', async () => {
      const result = await ResearchValidator.validateStage(
        'node-research',
        JSON.stringify({ marketSize: 'Large', trends: ['AI'], opportunities: ['Growth'] }),
        new Map()
      );
      expect(result.passed).toBe(true);
      expect(result.stageId).toBe('node-research');
      expect(result.completenessScore).toBeGreaterThanOrEqual(0.5);
      expect(result.consistencyScore).toBe(1);
      expect(result.confidenceScore).toBeGreaterThan(0);
      expect(result.duplicateIssues).toHaveLength(0);
      expect(result.hallucinationIssues).toHaveLength(0);
    });

    it('fails on completely empty content', async () => {
      const result = await ResearchValidator.validateStage('node-empty', '', new Map());
      expect(result.passed).toBe(false);
      expect(result.completenessScore).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('passes schema validation when schema exists', async () => {
      const result = await ResearchValidator.validateStage(
        'node-research',
        JSON.stringify({ marketSize: 'Big', trends: ['t1'], opportunities: ['o1'] }),
        new Map(),
        'research'
      );
      expect(result.passed).toBe(true);
    });
  });

  describe('checkCompleteness', () => {
    it('scores 0 for empty string', async () => {
      const result = await ResearchValidator.validateStage('t', '', new Map());
      expect(result.completenessScore).toBe(0);
    });

    it('penalizes short content', async () => {
      const result = await ResearchValidator.validateStage('t', '{"a":1}', new Map());
      expect(result.completenessScore).toBeLessThan(1);
    });

    it('penalizes placeholders', async () => {
      const result = await ResearchValidator.validateStage(
        't',
        JSON.stringify({ todo: 'something', tbd: 'other' }),
        new Map()
      );
      expect(result.completenessScore).toBeLessThan(0.7);
    });

    it('penalizes empty object values', async () => {
      const result = await ResearchValidator.validateStage(
        't',
        JSON.stringify({ name: '', items: [] }),
        new Map()
      );
      expect(result.completenessScore).toBeLessThan(1);
    });
  });

  describe('checkConsistency', () => {
    it('returns 1 when no previous outputs', async () => {
      const result = await ResearchValidator.validateStage(
        't',
        JSON.stringify({ key: 'val' }),
        new Map()
      );
      expect(result.consistencyScore).toBe(1);
    });

    it('detects inconsistent string values across stages', async () => {
      const prev = new Map<string, string>();
      prev.set('node-prev', JSON.stringify({ productName: 'Alpha' }));
      const result = await ResearchValidator.validateStage(
        't',
        JSON.stringify({ productName: 'Beta' }),
        prev
      );
      expect(result.consistencyScore).toBeLessThan(1);
    });

    it('detects inconsistent arrays across stages', async () => {
      const prev = new Map<string, string>();
      prev.set('node-prev', JSON.stringify({ features: ['f1', 'f2'] }));
      const result = await ResearchValidator.validateStage(
        't',
        JSON.stringify({ features: ['f3', 'f4'] }),
        prev
      );
      expect(result.consistencyScore).toBeLessThan(1);
    });

    it('returns consistent when values overlap', async () => {
      const prev = new Map<string, string>();
      prev.set('node-prev', JSON.stringify({ productName: 'Alpha' }));
      const result = await ResearchValidator.validateStage(
        't',
        JSON.stringify({ productName: 'Alpha' }),
        prev
      );
      expect(result.consistencyScore).toBe(1);
    });

    it('handles non-JSON previous outputs gracefully', async () => {
      const prev = new Map<string, string>();
      prev.set('node-prev', 'not json');
      const result = await ResearchValidator.validateStage(
        't',
        JSON.stringify({ key: 'val' }),
        prev
      );
      expect(result.consistencyScore).toBe(0.9);
    });
  });

  describe('detectDuplicates', () => {
    it('detects duplicate values within same output', async () => {
      const result = await ResearchValidator.validateStage(
        't',
        JSON.stringify({ a: 'same', b: 'same', c: 'same' }),
        new Map()
      );
      expect(result.duplicateIssues.length).toBeGreaterThan(0);
    });

    it('detects identical output to previous stage', async () => {
      const prev = new Map<string, string>();
      prev.set('node-prev', JSON.stringify({ key: 'val', extra: 'data' }));
      const result = await ResearchValidator.validateStage(
        't',
        JSON.stringify({ key: 'val', extra: 'data' }),
        prev
      );
      expect(result.duplicateIssues.length).toBeGreaterThan(0);
    });

    it('ignores empty arrays and nulls in duplicate check', async () => {
      const result = await ResearchValidator.validateStage(
        't',
        JSON.stringify({ a: [], b: null, c: '' }),
        new Map()
      );
      expect(result.duplicateIssues).toHaveLength(0);
    });

    it('handles non-JSON content in duplicate detection', async () => {
      const result = await ResearchValidator.validateStage('t', 'not-json', new Map());
      expect(result.duplicateIssues.length).toBeGreaterThan(0);
    });
  });

  describe('detectHallucinations', () => {
    it('detects suspicious score values', async () => {
      const result = await ResearchValidator.validateStage(
        'node-research',
        JSON.stringify({ score: 999, rating: -5 }),
        new Map()
      );
      expect(result.hallucinationIssues.length).toBeGreaterThan(0);
    });

    it('detects suspicious percentages', async () => {
      const result = await ResearchValidator.validateStage(
        'node-research',
        JSON.stringify({ share: '150%' }),
        new Map()
      );
      expect(result.hallucinationIssues.length).toBeGreaterThan(0);
    });

    it('detects multiple monetary claims', async () => {
      const result = await ResearchValidator.validateStage(
        'node-research',
        JSON.stringify({ projections: '$10m $20m $30m $40m' }),
        new Map()
      );
      expect(result.hallucinationIssues.length).toBeGreaterThan(0);
    });

    it('detects trillion claims outside research stage', async () => {
      const result = await ResearchValidator.validateStage(
        'node-pm',
        JSON.stringify({ market: 'trillion dollar market' }),
        new Map()
      );
      expect(result.hallucinationIssues.length).toBeGreaterThan(0);
    });

    it('allows trillion claims in research stage', async () => {
      const result = await ResearchValidator.validateStage(
        'node-research',
        JSON.stringify({ market: 'trillion dollar market' }),
        new Map()
      );
      const trillionIssues = result.hallucinationIssues.filter(i => i.includes('trillion'));
      expect(trillionIssues).toHaveLength(0);
    });

    it('detects identical items in arrays', async () => {
      const result = await ResearchValidator.validateStage(
        'node-research',
        JSON.stringify({ items: ['same', 'same', 'same', 'same'] }),
        new Map()
      );
      expect(result.hallucinationIssues.length).toBeGreaterThan(0);
    });

    it('detects identical scores in array items', async () => {
      const result = await ResearchValidator.validateStage(
        'node-research',
        JSON.stringify({ features: [{ score: 5 }, { score: 5 }, { score: 5 }] }),
        new Map()
      );
      expect(result.hallucinationIssues.length).toBeGreaterThan(0);
    });

    it('handles non-JSON for hallucination detection', async () => {
      const result = await ResearchValidator.validateStage('t', 'bad json{{{', new Map());
      expect(result.hallucinationIssues.length).toBeGreaterThan(0);
    });

    it('detects nested suspicious scores', async () => {
      const result = await ResearchValidator.validateStage(
        'node-research',
        JSON.stringify({ section: { score: 999 } }),
        new Map()
      );
      expect(result.hallucinationIssues.length).toBeGreaterThan(0);
    });
  });

  describe('computeConfidence', () => {
    it('computes high confidence with good scores', async () => {
      const result = await ResearchValidator.validateStage(
        't',
        JSON.stringify({ marketSize: 'Large', trends: ['AI'], opportunities: ['Growth'], extra: 'data' }),
        new Map()
      );
      expect(result.confidenceScore).toBeGreaterThan(0.7);
    });

    it('computes low confidence with many issues', async () => {
      const result = await ResearchValidator.validateStage(
        't',
        JSON.stringify({ score: 999, rating: -1, a: 'same', b: 'same' }),
        new Map()
      );
      expect(result.confidenceScore).toBeLessThan(0.5);
    });
  });

  describe('schema validation integration', () => {
    it('fails when schema validation fails', async () => {
      const result = await ResearchValidator.validateStage(
        'node-research',
        JSON.stringify({ marketSize: 123, trends: 'not-an-array', opportunities: null }),
        new Map(),
        'research'
      );
      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.includes('Schema'))).toBe(true);
    });

    it('tolerates unknown schema name', async () => {
      const result = await ResearchValidator.validateStage(
        'node-x',
        JSON.stringify({ marketSize: 'Large', trends: ['AI boom', 'ML growth'], opportunities: ['Cloud', 'Edge'] }),
        new Map(),
        'unknown-schema'
      );
      expect(result.passed).toBe(true);
    });
  });
});
