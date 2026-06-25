import { z } from 'zod';
import { BaseAgent, AgentMetadata } from './BaseAgent';
import { AIProvider } from '../providers/AIProvider';
import { ValidationSchema } from '../schemas';

export class ValidationAgent extends BaseAgent {
  readonly metadata: AgentMetadata = {
    id: 'agent-validation',
    name: 'Validation & Quality Gate',
    description: 'Validates all generated documents for consistency, completeness, and quality',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['problem', 'research', 'competitors', 'innovation', 'prd', 'trd', 'database', 'ui-ux', 'backend', 'security', 'qa', 'business', 'pitch', 'implementation'];
  readonly producedOutput: string = 'validation';
  readonly outputSchema = ValidationSchema;

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
