import { BaseAgent, AgentMetadata } from './BaseAgent';
import { AIProvider } from '../providers/AIProvider';
import { UISchema } from '../schemas';

export class UIUXAgent extends BaseAgent {
  readonly metadata: AgentMetadata = {
    id: 'agent-ui-ux',
    name: 'UI/UX Designer',
    description: 'Designs the user interface and experience, screens and components',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['prd', 'trd'];
  readonly producedOutput: string = 'ui-ux';
  readonly outputSchema = UISchema;

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
