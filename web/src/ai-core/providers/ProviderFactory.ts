import { AIProvider } from './AIProvider';
import { GeminiProvider } from './GeminiProvider';
import { MockProvider } from './MockProvider';
import { AIProviderName } from '../types';

export class ProviderFactory {
  /**
   * Instantiates and returns the requested AIProvider.
   * Ensures that the Orchestrator never instantiates providers directly.
   */
  static create(providerName: AIProviderName, options?: Record<string, unknown>): AIProvider {
    switch (providerName) {
      case 'gemini':
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error('Gemini API key is missing from environment variables.');
        }
        return new GeminiProvider(apiKey);
        
      case 'mock':
        return new MockProvider(options);
        
      case 'openai':
      case 'anthropic':
        throw new Error(`Provider ${providerName} is planned but not yet implemented.`);
        
      default:
        throw new Error(`Unknown provider requested: ${providerName}`);
    }
  }
}
