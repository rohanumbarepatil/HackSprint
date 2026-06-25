import { BaseAgent, AgentMetadata } from './BaseAgent';
import { AIProvider } from '../providers/AIProvider';
import { ResearchSchema } from '../schemas';

export class ResearchAgent extends BaseAgent {
  readonly metadata: AgentMetadata = {
    id: 'agent-research',
    name: 'Research Analyst',
    description: 'Conducts market research, identifies trends and opportunities',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['problem'];
  readonly producedOutput: string = 'research';
  readonly outputSchema = ResearchSchema;

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
