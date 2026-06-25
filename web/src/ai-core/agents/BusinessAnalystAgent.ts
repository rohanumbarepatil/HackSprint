import { BaseAgent, AgentMetadata } from './BaseAgent';
import { AIProvider } from '../providers/AIProvider';
import { BusinessModelSchema } from '../schemas';

export class BusinessAnalystAgent extends BaseAgent {
  readonly metadata: AgentMetadata = {
    id: 'agent-business-analyst',
    name: 'Business Analyst',
    description: 'Defines business model, revenue streams, and pricing tiers',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['problem', 'research', 'competitors', 'innovation'];
  readonly producedOutput: string = 'business';
  readonly outputSchema = BusinessModelSchema;

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
