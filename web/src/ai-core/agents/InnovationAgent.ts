import { BaseAgent, AgentMetadata } from './BaseAgent';
import { AIProvider } from '../providers/AIProvider';
import { InnovationSchema } from '../schemas';

export class InnovationAgent extends BaseAgent {
  readonly metadata: AgentMetadata = {
    id: 'agent-innovation',
    name: 'Innovation Strategist',
    description: 'Evaluates novelty and identifies unique differentiators',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['problem', 'research', 'competitors'];
  readonly producedOutput: string = 'innovation';
  readonly outputSchema = InnovationSchema;

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
