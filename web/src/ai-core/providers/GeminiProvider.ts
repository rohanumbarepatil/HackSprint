/* eslint-disable */
import { ZodSchema, ZodIssue } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { AIProvider } from './AIProvider';
import { AIResponse, AIStreamEvent, GenerationOptions, HealthStatus, ValidationResult } from '../types';

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;
  private defaultModel = 'gemini-2.5-pro';

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generate(prompt: string, options?: GenerationOptions): Promise<AIResponse> {
    const model = options?.model || this.defaultModel;
    
    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens,
          systemInstruction: options?.systemInstruction,
          // Note: In strict production we could map Zod schemas directly to Gemini's responseSchema feature here
          // if we translate the Zod schema into the format Gemini expects. For now, we enforce it post-generation.
          responseMimeType: options?.schema ? 'application/json' : 'text/plain',
        }
      });

      return {
        text: response.text || '',
        tokens: {
          inputTokens: response.usageMetadata?.promptTokenCount || 0,
          outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0,
        },
        provider: 'gemini',
        model,
      };
    } catch (error: unknown) {
      throw new Error(`GeminiProvider generation failed: ${(error as Error).message}`);
    }
  }

  async *stream(prompt: string, options?: GenerationOptions): AsyncGenerator<AIStreamEvent> {
    const model = options?.model || this.defaultModel;
    yield { type: 'STARTED', timestamp: Date.now() };
    
    try {
      yield { type: 'THINKING', timestamp: Date.now() };
      
      const stream = await this.ai.models.generateContentStream({
        model,
        contents: prompt,
        config: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens,
          systemInstruction: options?.systemInstruction,
        }
      });

      for await (const chunk of stream) {
        yield { 
          type: 'GENERATING', 
          payload: chunk.text, 
          timestamp: Date.now() 
        };
      }

      yield { type: 'COMPLETED', timestamp: Date.now() };
    } catch (error: unknown) {
      yield { type: 'FAILED', payload: (error as Error).message, timestamp: Date.now() };
    }
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
    // Uses the countTokens API strictly for precision
    try {
      const response = await this.ai.models.countTokens({
        model: this.defaultModel,
        contents: text,
      });
      return response.totalTokens || 0;
    } catch (_e) {
      // Fallback rough estimation if API fails
      return Math.ceil(text.length / 4);
    }
  }

  async healthCheck(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      // Smallest possible request to check if the API is responding
      await this.countTokens('ping');
      return {
        status: 'healthy',
        latencyMs: Date.now() - start,
        message: 'OK',
      };
    } catch (error: unknown) {
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        message: (error as Error).message,
      };
    }
  }
}
