import { BaseAgent, AgentMetadata } from './BaseAgent';
import { AIProvider } from '../providers/AIProvider';
import { CompetitorAnalysisSchema } from '../schemas';

export class CompetitorAgent extends BaseAgent {
  readonly metadata: AgentMetadata = {
    id: 'agent-competitor',
    name: 'Competitor Analyst',
    description: 'Analyzes direct and indirect competitors to find competitive advantage',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['problem', 'research'];
  readonly producedOutput: string = 'competitors';
  readonly outputSchema = CompetitorAnalysisSchema;

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
