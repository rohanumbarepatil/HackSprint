import { BaseAgent, AgentMetadata } from './BaseAgent';
import { AIProvider } from '../providers/AIProvider';
import { TRDSchema } from '../schemas';

export class TechnicalArchitectAgent extends BaseAgent {
  readonly metadata: AgentMetadata = {
    id: 'agent-tech-architect',
    name: 'Technical Architect',
    description: 'Designs the technical architecture, stack, and infrastructure',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['problem', 'prd', 'innovation'];
  readonly producedOutput: string = 'trd';
  readonly outputSchema = TRDSchema;

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
