/* eslint-disable */
import { ValidationPipeline } from '../validator/ValidationPipeline';
import { z } from 'zod';

const TestSchema = z.object({
  name: z.string(),
  age: z.number().positive(),
});

describe('ValidationPipeline', () => {
  it('passes valid JSON against schema', async () => {
    const result = await ValidationPipeline.run(
      JSON.stringify({ name: 'Alice', age: 30 }),
      TestSchema
    );
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.parsedData).toEqual({ name: 'Alice', age: 30 });
  });

  it('fails on invalid JSON', async () => {
    const result = await ValidationPipeline.run(
      'not json',
      TestSchema
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('fails on schema violation', async () => {
    const result = await ValidationPipeline.run(
      JSON.stringify({ name: 'Alice', age: -5 }),
      TestSchema
    );
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Schema Error');
  });

  it('fails on missing required fields', async () => {
    const result = await ValidationPipeline.run(
      JSON.stringify({ name: 'Alice' }),
      TestSchema
    );
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Schema Error');
  });

  it('cleans markdown code blocks with json tag', async () => {
    const result = await ValidationPipeline.run(
      '```json\n{"name": "Bob", "age": 25}\n```',
      TestSchema
    );
    expect(result.isValid).toBe(true);
    expect((result.parsedData as any).name).toBe('Bob');
  });

  it('cleans markdown code blocks without language tag', async () => {
    const result = await ValidationPipeline.run(
      '```\n{"name": "Charlie", "age": 35}\n```',
      TestSchema
    );
    expect(result.isValid).toBe(true);
  });

  it('handles complex nested schemas', async () => {
    const complexSchema = z.object({
      items: z.array(z.object({
        id: z.string().uuid(),
        tags: z.array(z.string()).min(1),
      })).min(1),
    });

    const validData = {
      items: [
        { id: '550e8400-e29b-41d4-a716-446655440000', tags: ['urgent'] },
      ],
    };

    const result = await ValidationPipeline.run(JSON.stringify(validData), complexSchema);
    expect(result.isValid).toBe(true);
  });

  it('rejects empty required arrays', async () => {
    const schema = z.object({ tags: z.array(z.string()).min(1) });
    const result = await ValidationPipeline.run(
      JSON.stringify({ tags: [] }),
      schema
    );
    expect(result.isValid).toBe(false);
  });

  it('handles completely empty input', async () => {
    const result = await ValidationPipeline.run('', TestSchema);
    expect(result.isValid).toBe(false);
  });

  it('handles null input', async () => {
    const result = await ValidationPipeline.run('null', TestSchema);
    expect(result.isValid).toBe(false);
  });
});
