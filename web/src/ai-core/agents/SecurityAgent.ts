import { BaseAgent, AgentMetadata } from './BaseAgent';
import { AIProvider } from '../providers/AIProvider';
import { SecuritySchema } from '../schemas';

export class SecurityAgent extends BaseAgent {
  readonly metadata: AgentMetadata = {
    id: 'agent-security',
    name: 'Security Architect',
    description: 'Defines authentication, authorization, and data encryption strategies',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['trd', 'backend', 'database'];
  readonly producedOutput: string = 'security';
  readonly outputSchema = SecuritySchema;

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
