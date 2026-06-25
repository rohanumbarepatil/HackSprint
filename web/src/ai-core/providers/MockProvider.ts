/* eslint-disable */
import { z, ZodSchema, ZodIssue } from 'zod';
import { AIProvider } from './AIProvider';
import { AIResponse, AIStreamEvent, GenerationOptions, HealthStatus, ValidationResult } from '../types';

function generateMockFromSchema(schema: ZodSchema): unknown {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(shape)) {
      result[key] = generateMockFromSchema(value as ZodSchema);
    }
    return result;
  }

  if (schema instanceof z.ZodArray) {
    return [generateMockFromSchema(schema.element as ZodSchema)];
  }

  if (schema instanceof z.ZodString) {
    return 'mock-string';
  }

  if (schema instanceof z.ZodNumber) {
    return 42;
  }

  if (schema instanceof z.ZodBoolean) {
    return true;
  }

  if (schema instanceof z.ZodEnum) {
    return schema._def.values[0];
  }

  if (schema instanceof z.ZodOptional) {
    return generateMockFromSchema(schema.unwrap() as ZodSchema);
  }

  if (schema instanceof z.ZodNullable) {
    return generateMockFromSchema(schema.unwrap() as ZodSchema);
  }

  if (schema instanceof z.ZodDefault) {
    return schema._def.defaultValue();
  }

  if (schema instanceof z.ZodUnion) {
    return generateMockFromSchema(schema._def.options[0] as ZodSchema);
  }

  if (schema instanceof z.ZodEffects) {
    return generateMockFromSchema(schema._def.schema as ZodSchema);
  }

  return null;
}

export class MockProvider implements AIProvider {
  private simulateLatency: boolean;
  private shouldFail: boolean;

  constructor(options: { simulateLatency?: boolean; shouldFail?: boolean } = {}) {
    this.simulateLatency = options.simulateLatency ?? true;
    this.shouldFail = options.shouldFail ?? false;
  }

  private async delay(ms: number) {
    if (this.simulateLatency) {
      await new Promise(resolve => setTimeout(resolve, ms));
    }
  }

  async generate(_prompt: string, options?: GenerationOptions): Promise<AIResponse> {
    await this.delay(1000);

    if (this.shouldFail) {
      throw new Error('MockProvider forced generation failure.');
    }

    let mockText = 'This is a mock generation response from MockProvider.';

    if (options?.schema) {
      const mockData = generateMockFromSchema(options.schema);
      mockText = JSON.stringify(mockData);
    }

    return {
      text: mockText,
      tokens: { inputTokens: 50, outputTokens: 150, totalTokens: 200 },
      provider: 'mock',
      model: options?.model || 'mock-model-v1',
    };
  }

  async *stream(prompt: string, options?: GenerationOptions): AsyncGenerator<AIStreamEvent> {
    yield { type: 'STARTED', timestamp: Date.now() };
    await this.delay(200);

    yield { type: 'RESEARCHING', timestamp: Date.now() };
    await this.delay(200);

    yield { type: 'THINKING', timestamp: Date.now() };
    await this.delay(200);

    if (this.shouldFail) {
      yield { type: 'FAILED', payload: 'Mock failure during stream', timestamp: Date.now() };
      return;
    }

    yield { type: 'GENERATING', payload: 'Mock', timestamp: Date.now() };
    await this.delay(200);

    yield { type: 'GENERATING', payload: ' stream', timestamp: Date.now() };
    await this.delay(200);

    yield { type: 'GENERATING', payload: ' response.', timestamp: Date.now() };

    if (options?.schema) {
      yield { type: 'VALIDATING', timestamp: Date.now() };
      await this.delay(100);
    }

    yield { type: 'SAVING', timestamp: Date.now() };
    await this.delay(100);

    yield { type: 'COMPLETED', timestamp: Date.now() };
  }

  async validate(response: string, schema: ZodSchema): Promise<ValidationResult> {
    try {
      const parsed = JSON.parse(response);
      const validated = schema.safeParse(parsed);

      if (validated.success) {
        return { isValid: true, errors: [], parsedData: validated.data };
      }

      return {
        isValid: false,
        errors: validated.error.issues.map((issue: ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
      };
    } catch (_e) {
      return { isValid: false, errors: ['Failed to parse response as JSON.'] };
    }
  }

  async countTokens(text: string): Promise<number> {
    return Math.ceil(text.length / 4);
  }

  async healthCheck(): Promise<HealthStatus> {
    await this.delay(200);
    return {
      status: this.shouldFail ? 'down' : 'healthy',
      latencyMs: 200,
      message: this.shouldFail ? 'MockProvider forced health failure' : 'OK',
    };
  }
}
