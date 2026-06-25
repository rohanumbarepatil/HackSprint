import { BaseAgent, AgentMetadata } from '../BaseAgent';
import { AIProvider } from '../../providers/AIProvider';
import { ResearchStageOutputSchema } from './ResearchStageSchema';

export abstract class ResearchStageBase extends BaseAgent {
  abstract readonly stage: number;
  abstract readonly stageName: string;

  readonly outputSchema = ResearchStageOutputSchema;

  constructor(provider: AIProvider) {
    super(provider);
  }

  abstract buildPrompt(previousOutputs: string[]): string;

  async execute(prompt: string, systemInstruction: string): Promise<string> {
    const fullPrompt = prompt || this.buildPrompt([]);
    const response = await this.provider.generate(fullPrompt, {
      systemInstruction,
      schema: this.outputSchema,
    });
    return response.text;
  }
}
