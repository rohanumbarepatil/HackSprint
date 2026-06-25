import { BaseAgent, AgentMetadata } from './BaseAgent';
import { AIProvider } from '../providers/AIProvider';
import { PitchDeckSchema } from '../schemas';

export class PitchAgent extends BaseAgent {
  readonly metadata: AgentMetadata = {
    id: 'agent-pitch',
    name: 'Pitch Deck Creator',
    description: 'Generates pitch deck slides and elevator pitch',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['business', 'prd', 'innovation', 'competitors'];
  readonly producedOutput: string = 'pitch';
  readonly outputSchema = PitchDeckSchema;

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
