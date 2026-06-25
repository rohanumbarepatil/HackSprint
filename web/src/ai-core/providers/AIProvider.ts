import { ZodSchema } from 'zod';
import { AIResponse, AIStreamEvent, GenerationOptions, HealthStatus, ValidationResult } from '../types';

export interface AIProvider {
  /**
   * Generates a complete response for a given prompt.
   */
  generate(prompt: string, options?: GenerationOptions): Promise<AIResponse>;

  /**
   * Streams a response for a given prompt.
   */
  stream(prompt: string, options?: GenerationOptions): AsyncGenerator<AIStreamEvent>;

  /**
   * Validates a response against a strict Zod schema.
   */
  validate(response: string, schema: ZodSchema): Promise<ValidationResult>;

  /**
   * Approximates or exactly calculates the number of tokens in the text.
   */
  countTokens(text: string): Promise<number>;

  /**
   * Checks the health and latency of the provider's API.
   */
  healthCheck(): Promise<HealthStatus>;
}
