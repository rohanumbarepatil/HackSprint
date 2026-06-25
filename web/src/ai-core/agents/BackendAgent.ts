import { z } from 'zod';
import { BaseAgent, AgentMetadata } from './BaseAgent';
import { AIProvider } from '../providers/AIProvider';
import { BackendSchema } from '../schemas';

export class BackendAgent extends BaseAgent {
  readonly metadata: AgentMetadata = {
    id: 'agent-backend',
    name: 'Backend Architect',
    description: 'Designs the backend API layer, endpoints, and deployment strategy',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['trd', 'database', 'prd'];
  readonly producedOutput: string = 'backend';
  readonly outputSchema = BackendSchema;

  constructor(provider: AIProvider) {
    super(provider);
  }

  async execute(prompt: string, systemInstruction: string): Promise<string> {
    const response = await this.provider.generate(prompt, {
      systemInstruction,
      schema: this.outputSchema,
    });
    return response.text;
  }
}
