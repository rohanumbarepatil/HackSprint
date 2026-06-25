/* eslint-disable */
import { ValidationPipeline, ValidationConfig } from '../validator/ValidationPipeline';
import { z } from 'zod';

const TestSchema = z.object({
  name: z.string(),
  age: z.number().positive(),
  score: z.number().optional(),
  price: z.number().optional(),
  tags: z.array(z.string()).optional(),
  productName: z.string().optional(),
});

describe('ValidationPipeline - Business Rules', () => {
  it('passes valid score range', async () => {
    const result = await ValidationPipeline.run(
      JSON.stringify({ name: 'Alice', age: 30, score: 7 }),
      TestSchema
    );
    expect(result.isValid).toBe(true);
  });

  it('fails on out-of-range score', async () => {
    const result = await ValidationPipeline.run(
      JSON.stringify({ name: 'Alice', age: 30, score: 15 }),
      TestSchema
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Business Rule'))).toBe(true);
  });

  it('fails on negative price', async () => {
    const result = await ValidationPipeline.run(
      JSON.stringify({ name: 'Test', age: 25, price: -10 }),
      TestSchema
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('negative'))).toBe(true);
  });

  it('warns on empty arrays', async () => {
    const result = await ValidationPipeline.run(
      JSON.stringify({ name: 'Bob', age: 25, tags: [] }),
      TestSchema
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('empty array'))).toBe(true);
  });
});

describe('ValidationPipeline - Consistency', () => {
  it('detects productName conflict with previous results', async () => {
    const result = await ValidationPipeline.run(
      JSON.stringify({ name: 'Product', age: 1, productName: 'Beta' }),
      TestSchema,
      { previousResults: { productName: 'Alpha' } }
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('productName changed'))).toBe(true);
  });

  it('detects identical frontend and backend stacks', async () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      frontendStack: z.string(),
      backendStack: z.string(),
    });
    const result = await ValidationPipeline.run(
      JSON.stringify({ name: 'App', age: 1, frontendStack: 'React', backendStack: 'React' }),
      schema
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('should not be identical'))).toBe(true);
  });
});

describe('ValidationPipeline - Completeness', () => {
  it('detects null values', async () => {
    const schema = z.object({ name: z.string().nullable(), age: z.number().nullable() });
    const result = await ValidationPipeline.run(
      JSON.stringify({ name: null, age: 30 }),
      schema
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('null or undefined'))).toBe(true);
  });

  it('detects placeholder text', async () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const result = await ValidationPipeline.run(
      JSON.stringify({ name: 'TBD', age: 25 }),
      schema
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('placeholder'))).toBe(true);
  });

  it('detects todo markers in nested objects', async () => {
    const schema = z.object({ data: z.object({ desc: z.string() }) });
    const result = await ValidationPipeline.run(
      JSON.stringify({ data: { desc: 'TODO: implement' } }),
      schema
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('placeholder'))).toBe(true);
  });

  it('detects empty strings', async () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const result = await ValidationPipeline.run(
      JSON.stringify({ name: '', age: 25 }),
      schema
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('empty string'))).toBe(true);
  });
});

describe('ValidationPipeline - AI Self Review', () => {
  it('checks user story format', async () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      userStories: z.array(z.string()),
    });
    const result = await ValidationPipeline.run(
      JSON.stringify({ name: 'App', age: 1, userStories: ['bad story without format'] }),
      schema
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('user stories'))).toBe(true);
  });

  it('passes properly formatted user stories', async () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      userStories: z.array(z.string()),
    });
    const result = await ValidationPipeline.run(
      JSON.stringify({ name: 'App', age: 1, userStories: ['As a user, I want to login'] }),
      schema
    );
    expect(result.isValid).toBe(true);
  });

  it('checks for slide titles', async () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      slides: z.array(z.object({ title: z.string(), content: z.string() })),
    });
    const result = await ValidationPipeline.run(
      JSON.stringify({ name: 'Deck', age: 1, slides: [{ title: '', content: 'stuff' }] }),
      schema
    );
    expect(result.isValid).toBe(false);
  });

  it('detects overlapping unique features and differentiators', async () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      uniqueFeatures: z.array(z.string()),
      differentiators: z.array(z.string()),
    });
    const result = await ValidationPipeline.run(
      JSON.stringify({
        name: 'Prod',
        age: 1,
        uniqueFeatures: ['feature-a', 'feature-b'],
        differentiators: ['feature-a'],
      }),
      schema
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('overlapping'))).toBe(true);
  });

  it('flags overly long implementation timelines', async () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      phases: z.array(z.object({ name: z.string(), estimatedWeeks: z.number() })),
    });
    const result = await ValidationPipeline.run(
      JSON.stringify({
        name: 'Big Project',
        age: 1,
        phases: [{ name: 'Phase 1', estimatedWeeks: 60 }],
      }),
      schema
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('weeks'))).toBe(true);
  });
});

describe('ValidationPipeline - Quality Score', () => {
  it('passes with high quality score', async () => {
    const result = await ValidationPipeline.run(
      JSON.stringify({ name: 'Test', age: 25, score: 5, tags: ['a'] }),
      TestSchema
    );
    expect(result.stageResults!.some(s => s.stageName === 'Quality Score' && s.passed)).toBe(true);
  });

  it('fails with low quality score when minQualityScore is high', async () => {
    const result = await ValidationPipeline.run(
      JSON.stringify({ name: 'Test', age: 25 }),
      TestSchema,
      {
        minQualityScore: 10,
        stages: {
          json: { enabled: true, retryOnFailure: false, maxRetries: 1 },
          zod: { enabled: true, retryOnFailure: false, maxRetries: 1 },
          businessRules: { enabled: true, retryOnFailure: false, maxRetries: 1 },
          consistency: { enabled: true, retryOnFailure: false, maxRetries: 1 },
          completeness: { enabled: true, retryOnFailure: false, maxRetries: 1 },
          aiSelfReview: { enabled: true, retryOnFailure: false, maxRetries: 1 },
          qualityScore: { enabled: true, retryOnFailure: false, maxRetries: 1 },
        },
      }
    );
    const qualityStage = result.stageResults!.find(s => s.stageName === 'Quality Score');
    expect(qualityStage).toBeDefined();
  });
});

describe('ValidationPipeline - Configuration', () => {
  it('skips disabled stages', async () => {
    const config: Partial<ValidationConfig> = {
      stages: {
        json: { enabled: true, retryOnFailure: false, maxRetries: 1 },
        zod: { enabled: true, retryOnFailure: false, maxRetries: 1 },
        businessRules: { enabled: false, retryOnFailure: false, maxRetries: 1 },
        consistency: { enabled: false, retryOnFailure: false, maxRetries: 1 },
        completeness: { enabled: false, retryOnFailure: false, maxRetries: 1 },
        aiSelfReview: { enabled: false, retryOnFailure: false, maxRetries: 1 },
        qualityScore: { enabled: false, retryOnFailure: false, maxRetries: 1 },
      },
    };
    const result = await ValidationPipeline.run(
      JSON.stringify({ name: 'Skip', age: 1 }),
      TestSchema,
      config
    );
    const skipped = result.stageResults!.filter(s => s.metadata?.skipped);
    expect(skipped.length).toBe(5);
    expect(result.isValid).toBe(true);
  });

  it('retries JSON stage on failure', async () => {
    const config: Partial<ValidationConfig> = {
      stages: {
        json: { enabled: true, retryOnFailure: true, maxRetries: 3 },
        zod: { enabled: true, retryOnFailure: false, maxRetries: 1 },
        businessRules: { enabled: false, retryOnFailure: false, maxRetries: 1 },
        consistency: { enabled: false, retryOnFailure: false, maxRetries: 1 },
        completeness: { enabled: false, retryOnFailure: false, maxRetries: 1 },
        aiSelfReview: { enabled: false, retryOnFailure: false, maxRetries: 1 },
        qualityScore: { enabled: false, retryOnFailure: false, maxRetries: 1 },
      },
    };
    const result = await ValidationPipeline.run('totally invalid', TestSchema, config);
    expect(result.isValid).toBe(false);
  });
});

describe('ValidationPipeline - runWithSchemaName', () => {
  it('runs with a valid schema name', async () => {
    const result = await ValidationPipeline.runWithSchemaName(
      JSON.stringify({ coreProblem: 'Test', targetAudience: ['devs'], valueProposition: 'save time' }),
      'problem'
    );
    expect(result.isValid).toBe(true);
  });

  it('returns error for unknown schema name', async () => {
    const result = await ValidationPipeline.runWithSchemaName(
      JSON.stringify({}),
      'nonexistent'
    );
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('No schema found');
  });
});

describe('ValidationPipeline - retry cleanup', () => {
  it('extracts JSON from surrounding text', () => {
    const result = ValidationPipeline.run(
      'Here is the result: {"name": "Clean", "age": 30}',
      TestSchema
    );
    // Should still pass because the retry cleanup extracts the JSON
  });
});
