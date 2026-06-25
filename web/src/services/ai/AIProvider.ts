export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  jsonSchema?: Record<string, unknown>; // strict typing for JSON schemas
}

export interface AIProvider {
  /**
   * Initializes the AI provider with necessary configuration/API keys.
   */
  initialize(config: Record<string, unknown>): void;

  /**
   * Generates a single string response.
   */
  generateText(prompt: string, options?: GenerateOptions): Promise<string>;

  /**
   * Streams a string response, calling the onUpdate callback with the diff.
   */
  streamText(prompt: string, onUpdate: (chunk: string) => void, options?: GenerateOptions): Promise<void>;
  
  /**
   * Generates a strictly typed JSON object based on a provided schema.
   */
  generateStructuredData<T>(prompt: string, schema: Record<string, unknown>, options?: GenerateOptions): Promise<T>;
}
