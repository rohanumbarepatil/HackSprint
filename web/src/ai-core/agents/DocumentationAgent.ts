import { BaseAgent, AgentMetadata } from './BaseAgent';
import { AIProvider } from '../providers/AIProvider';
import { ImplementationSchema } from '../schemas';

export class DocumentationAgent extends BaseAgent {
  readonly metadata: AgentMetadata = {
    id: 'agent-documentation',
    name: 'Documentation & Implementation Planner',
    description: 'Generates implementation plan with phased tasks and timelines',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['trd', 'backend', 'database', 'ui-ux', 'security', 'qa'];
  readonly producedOutput: string = 'implementation';
  readonly outputSchema = ImplementationSchema;

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
