import { ZodSchema } from 'zod';

export type AIProviderName = 'gemini' | 'openai' | 'anthropic' | 'mock';

export interface GenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  schema?: ZodSchema;
  systemInstruction?: string;
}

export interface AIResponse {
  text: string;
  tokens: TokenStats;
  provider: AIProviderName;
  model: string;
}

export type StreamEventType = 
  | 'STARTED' 
  | 'THINKING' 
  | 'RESEARCHING' 
  | 'GENERATING' 
  | 'VALIDATING' 
  | 'SAVING' 
  | 'COMPLETED' 
  | 'FAILED';

export interface AIStreamEvent {
  type: StreamEventType;
  payload?: string; // Partial text or status message
  timestamp: number;
}

export interface TokenStats {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  parsedData?: any;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  message?: string;
}

// Queue Types
export interface QueueJob {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  payload: any;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxRetries: number;
}

// Analytics Types
export interface GenerationMetrics {
  id: string;
  projectId: string;
  agentId: string;
  provider: AIProviderName;
  model: string;
  latencyMs: number;
  tokens: TokenStats;
  timestamp: number;
}
