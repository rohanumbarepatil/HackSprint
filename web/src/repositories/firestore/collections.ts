export const COLLECTIONS = {
  PROJECTS: 'projects' as const,
  DOCUMENTS: 'documents' as const,
  CONTEXTS: 'contexts' as const,
  GENERATIONS: 'generations' as const,
  PROMPTS: 'prompts' as const,
  PROMPT_VERSIONS: 'promptVersions' as const,
  ANALYTICS: 'analytics' as const,
  EVENTS: 'events' as const,
  VALIDATION_REPORTS: 'validationReports' as const,
  TOKEN_USAGE: 'tokenUsage' as const,
  AUDIT_LOGS: 'auditLogs' as const,
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

export interface ProjectDoc {
  id: string;
  name: string;
  description: string;
  workspaceId: string;
  ownerId: string;
  status: 'draft' | 'active' | 'archived';
  templateId?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface DocumentDoc {
  id: string;
  projectId: string;
  moduleId: string;
  content: string;
  version: number;
  schemaVersion: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface ContextDoc {
  id: string;
  projectId: string;
  workflowId: string;
  contextHash: string;
  assembledContext: string;
  versionId: string;
  nodeResults: Record<string, string>;
  createdAt: number;
}

export interface GenerationDoc {
  id: string;
  projectId: string;
  agentId: string;
  moduleId: string;
  provider: string;
  model: string;
  prompt: string;
  output: string;
  contextHash: string;
  promptVersionId?: string;
  latencyMs: number;
  tokens: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost?: number;
  };
  retryCount: number;
  validationScore?: number;
  validationPassed: boolean;
  success: boolean;
  errorMessage?: string;
  createdAt: number;
}

export interface PromptDoc {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  currentVersionId: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface PromptVersionDoc {
  id: string;
  promptId: string;
  versionNumber: string;
  content: string;
  variables: string[];
  status: 'draft' | 'published' | 'deprecated';
  changelog: string;
  createdAt: number;
  publishedAt?: number;
}

export interface AnalyticsDoc {
  id: string;
  projectId: string;
  agentId: string;
  provider: string;
  model: string;
  latencyMs: number;
  tokens: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
  retryCount: number;
  validationScore: number;
  status: 'success' | 'failed' | 'retried';
  timestamp: number;
}

export interface EventDoc {
  id: string;
  projectId: string;
  workflowId?: string;
  nodeId?: string;
  agentId?: string;
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

export interface ValidationReportDoc {
  id: string;
  generationId: string;
  projectId: string;
  agentId: string;
  schemaName: string;
  isValid: boolean;
  errors: string[];
  stageResults: Array<{
    stageName: string;
    passed: boolean;
    errors: string[];
    metadata?: Record<string, unknown>;
  }>;
  qualityScore: number;
  timestamp: number;
}

export interface TokenUsageDoc {
  id: string;
  projectId: string;
  date: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  generationCount: number;
}

export interface AuditLogDoc {
  id: string;
  userId: string;
  projectId: string;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: number;
}
