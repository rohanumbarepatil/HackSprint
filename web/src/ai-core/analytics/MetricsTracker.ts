import { GenerationMetrics } from '../types';
import { FirestoreRepository } from '@/repositories/firestore/FirestoreRepository';
import {
  AnalyticsDoc,
  AuditLogDoc,
  TokenUsageDoc,
  COLLECTIONS,
} from '@/repositories/firestore/collections';

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

const analyticsRepo = new FirestoreRepository<AnalyticsDoc>(COLLECTIONS.ANALYTICS);
const tokenUsageRepo = new FirestoreRepository<TokenUsageDoc>(COLLECTIONS.TOKEN_USAGE);
const auditLogRepo = new FirestoreRepository<AuditLogDoc>(COLLECTIONS.AUDIT_LOGS);

export class MetricsTracker {
  static async recordGeneration(metrics: GenerationMetrics): Promise<void> {
    const inputCost = (metrics.tokens.inputTokens / 1_000_000) * 3.50;
    const outputCost = (metrics.tokens.outputTokens / 1_000_000) * 10.50;
    const estimatedCost = inputCost + outputCost;
    metrics.tokens.estimatedCost = estimatedCost;

    try {
      const today = new Date().toISOString().split('T')[0];

      await analyticsRepo.create({
        projectId: metrics.projectId,
        agentId: metrics.agentId,
        provider: metrics.provider,
        model: metrics.model,
        latencyMs: metrics.latencyMs,
        tokens: {
          inputTokens: metrics.tokens.inputTokens,
          outputTokens: metrics.tokens.outputTokens,
          totalTokens: metrics.tokens.totalTokens,
          estimatedCost,
        },
        retryCount: 0,
        validationScore: 0,
        status: 'success',
        timestamp: metrics.timestamp,
      });

      await tokenUsageRepo.create({
        projectId: metrics.projectId,
        date: today,
        provider: metrics.provider,
        model: metrics.model,
        inputTokens: metrics.tokens.inputTokens,
        outputTokens: metrics.tokens.outputTokens,
        totalTokens: metrics.tokens.totalTokens,
        estimatedCost,
        generationCount: 1,
      });
    } catch {
      console.warn('[MetricsTracker] Firestore unavailable, falling back to console log.');
      console.log(
        `[MetricsTracker] Recorded Generation ${metrics.id}: ${metrics.tokens.totalTokens} tokens, ~$${estimatedCost.toFixed(4)}`
      );
    }
  }

  static async recordAuditLog(log: AuditLog): Promise<void> {
    try {
      await auditLogRepo.create({
        userId: log.userId,
        projectId: log.projectId,
        action: `generation:${log.status}`,
        resource: `agent:${log.agentId}`,
        details: {
          agentId: log.agentId,
          promptVersionId: log.promptVersionId,
          model: log.model,
          durationMs: log.durationMs,
          status: log.status,
          validationPassed: log.validationPassed,
        },
        timestamp: log.timestamp,
      });
    } catch {
      console.warn('[MetricsTracker] Firestore unavailable, falling back to console log.');
      console.log(
        `[AuditTracker] User ${log.userId} triggered agent ${log.agentId}. Status: ${log.status}`
      );
    }
  }

  static async recordRetry(
    metrics: GenerationMetrics,
    attempt: number,
    error: string
  ): Promise<void> {
    try {
      await analyticsRepo.create({
        projectId: metrics.projectId,
        agentId: metrics.agentId,
        provider: metrics.provider,
        model: metrics.model,
        latencyMs: metrics.latencyMs,
        tokens: {
          inputTokens: metrics.tokens.inputTokens,
          outputTokens: metrics.tokens.outputTokens,
          totalTokens: metrics.tokens.totalTokens,
          estimatedCost: 0,
        },
        retryCount: attempt,
        validationScore: 0,
        status: 'retried',
        timestamp: Date.now(),
      });
    } catch {
      console.warn(`[MetricsTracker] Retry ${attempt} recorded for agent ${metrics.agentId}: ${error}`);
    }
  }
}
