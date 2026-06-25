import { BaseAgent, AgentMetadata } from './BaseAgent';
import { AIProvider } from '../providers/AIProvider';
import { QASchema } from '../schemas';

export class QAAgent extends BaseAgent {
  readonly metadata: AgentMetadata = {
    id: 'agent-qa',
    name: 'Quality Assurance Engineer',
    description: 'Defines test plans, unit tests, and E2E testing strategy',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['backend', 'ui-ux', 'security', 'prd'];
  readonly producedOutput: string = 'qa';
  readonly outputSchema = QASchema;

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
