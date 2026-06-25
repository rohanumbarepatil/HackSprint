import { ZodSchema } from 'zod';
import { AIProvider } from '../providers/AIProvider';

export interface AgentMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
}

export abstract class BaseAgent {
  abstract readonly metadata: AgentMetadata;
  abstract readonly requiredContext: string[]; // Upstream modules required
  abstract readonly producedOutput: string;    // Output module id
  abstract readonly outputSchema: ZodSchema;
  
  protected provider: AIProvider;

  constructor(provider: AIProvider) {
    this.provider = provider;
  }

  /**
   * Executes the agent's core task, returning raw text or JSON string.
   * This is generally called by the Orchestrator.
   */
  abstract execute(prompt: string, systemInstruction: string): Promise<string>;
}
