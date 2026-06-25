export type ResearchCategory =
  | 'problem'
  | 'industry'
  | 'market'
  | 'competitors'
  | 'painpoints'
  | 'personas'
  | 'features'
  | 'innovation'
  | 'business'
  | 'technology'
  | 'security'
  | 'scalability'
  | 'future';

export interface ResearchDocument {
  id: string;
  projectId: string;
  category: ResearchCategory;
  content: Record<string, unknown>;
  summary: string;
  source: string;
  version: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  metadata?: ResearchMetadata;
}

export interface ResearchMetadata {
  agentId?: string;
  provider?: string;
  model?: string;
  latencyMs?: number;
  validationScore?: number;
  contextHash?: string;
  promptVersionId?: string;
}

export interface ResearchHistoryEntry {
  id: string;
  researchId: string;
  projectId: string;
  category: ResearchCategory;
  action: 'created' | 'updated' | 'archived' | 'deleted' | 'restored';
  previousContent?: Record<string, unknown>;
  newContent?: Record<string, unknown>;
  version: number;
  performedBy: string;
  timestamp: number;
  reason?: string;
}

export interface ResearchVersion {
  id: string;
  researchId: string;
  projectId: string;
  category: ResearchCategory;
  versionNumber: number;
  content: Record<string, unknown>;
  summary: string;
  changelog: string;
  createdBy: string;
  createdAt: number;
  status: 'active' | 'archived' | 'superseded';
}

export interface ResearchAnalyticsEntry {
  id: string;
  projectId: string;
  category: ResearchCategory;
  action: 'viewed' | 'exported' | 'compared' | 'used_in_generation';
  timestamp: number;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface ResearchSummary {
  id: string;
  projectId: string;
  category: ResearchCategory;
  summary: string;
  keyFindings: string[];
  confidence: number;
  generatedAt: number;
  expiresAt?: number;
}

export interface ResearchQuery {
  projectId: string;
  category?: ResearchCategory;
  tags?: string[];
  fromDate?: number;
  toDate?: number;
  limit?: number;
  offset?: number;
}
