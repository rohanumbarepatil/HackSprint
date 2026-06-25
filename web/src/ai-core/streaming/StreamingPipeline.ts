import { ProviderFactory } from '../providers/ProviderFactory';
import { MetricsTracker } from '../analytics/MetricsTracker';
import { AIProviderName, AIStreamEvent, GenerationOptions } from '../types';

export type StreamCallback = (event: AIStreamEvent) => void;

export interface StreamResult {
  text: string;
  events: AIStreamEvent[];
  latencyMs: number;
}

export class StreamingPipeline {
  private providerName: AIProviderName;

  constructor(providerName: AIProviderName = 'gemini') {
    this.providerName = providerName;
  }

  async *stream(
    projectId: string,
    agentId: string,
    prompt: string,
    options?: GenerationOptions & { retryCount?: number; validationScore?: number }
  ): AsyncGenerator<AIStreamEvent> {
    const provider = ProviderFactory.create(this.providerName);
    const startTime = Date.now();
    let fullText = '';

    for await (const event of provider.stream(prompt, options)) {
      if (event.type === 'GENERATING' && event.payload) {
        fullText += event.payload;
      }
      yield event;
    }

    const latencyMs = Date.now() - startTime;
    const tokenEstimate = Math.ceil(fullText.length / 4);

    await MetricsTracker.recordGeneration({
      id: `${projectId}_${agentId}_${Date.now()}`,
      projectId,
      agentId,
      provider: this.providerName,
      model: options?.model ?? 'default',
      latencyMs,
      tokens: {
        inputTokens: options?.maxTokens ? Math.ceil(prompt.length / 4) : 0,
        outputTokens: tokenEstimate,
        totalTokens: tokenEstimate,
      },
      timestamp: Date.now(),
    });
  }

  static async executeWithEvents(
    providerName: AIProviderName,
    prompt: string,
    options?: GenerationOptions
  ): Promise<StreamResult> {
    const provider = ProviderFactory.create(providerName);
    const events: AIStreamEvent[] = [];
    let text = '';
    const startTime = Date.now();

    for await (const event of provider.stream(prompt, options)) {
      events.push(event);
      if (event.type === 'GENERATING' && event.payload) {
        text += event.payload;
      }
    }

    return {
      text,
      events,
      latencyMs: Date.now() - startTime,
    };
  }
}
