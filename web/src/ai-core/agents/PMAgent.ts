import { BaseAgent, AgentMetadata } from './BaseAgent';
import { AIProvider } from '../providers/AIProvider';
import { PRDSchema } from '../schemas';

export class PMAgent extends BaseAgent {
  readonly metadata: AgentMetadata = {
    id: 'agent-pm',
    name: 'Product Manager',
    description: 'Creates Product Requirements Document with user personas and stories',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['problem', 'research', 'competitors', 'innovation'];
  readonly producedOutput: string = 'prd';
  readonly outputSchema = PRDSchema;

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
