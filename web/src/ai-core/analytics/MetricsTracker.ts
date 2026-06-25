import { GenerationMetrics } from '../types';

export interface AuditLog {
  userId: string;
  projectId: string;
  agentId: string;
  promptVersionId: string;
  model: string;
  timestamp: number;
  durationMs: number;
  status: 'success' | 'failed' | 'retried';
  validationPassed: boolean;
}

export class MetricsTracker {
  /**
   * Logs a completed generation metric for analytics and billing.
   */
  static async recordGeneration(metrics: GenerationMetrics): Promise<void> {
    // Calculate estimated cost
    // e.g. Gemini 1.5 Pro: $3.50 / 1M input tokens, $10.50 / 1M output tokens
    const inputCost = (metrics.tokens.inputTokens / 1_000_000) * 3.50;
    const outputCost = (metrics.tokens.outputTokens / 1_000_000) * 10.50;
    metrics.tokens.estimatedCost = inputCost + outputCost;

    // In production, persist to Firestore 'analytics' and 'tokenUsage' collections
    console.log(`[MetricsTracker] Recorded Generation ${metrics.id}: ${metrics.tokens.totalTokens} tokens, ~\$${metrics.tokens.estimatedCost.toFixed(4)}`);
  }

  /**
   * Logs an audit event ensuring complete traceabilty.
   */
  static async recordAuditLog(log: AuditLog): Promise<void> {
    // In production, persist to Firestore 'auditLogs'
    console.log(`[AuditTracker] User ${log.userId} triggered agent ${log.agentId}. Status: ${log.status}`);
  }
}
