import { z } from 'zod';
import { BaseAgent, AgentMetadata } from './BaseAgent';
import { AIProvider } from '../providers/AIProvider';
import { ProblemAnalyzerSchema } from '../schemas';

export class ProblemAnalyzerAgent extends BaseAgent {
  readonly metadata: AgentMetadata = {
    id: 'agent-problem-analyzer',
    name: 'Problem Analyzer',
    description: 'Analyzes the core problem, target audience, and value proposition',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = [];
  readonly producedOutput: string = 'problem';
  readonly outputSchema = ProblemAnalyzerSchema;

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
