import { BaseAgent, AgentMetadata } from './BaseAgent';
import { AIProvider } from '../providers/AIProvider';
import { DatabaseSchema } from '../schemas';

export class DBAgent extends BaseAgent {
  readonly metadata: AgentMetadata = {
    id: 'agent-db-architect',
    name: 'Database Architect',
    description: 'Designs the database schema, collections, and fields',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['trd', 'prd'];
  readonly producedOutput: string = 'database';
  readonly outputSchema = DatabaseSchema;

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
