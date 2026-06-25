import { ResearchCategory } from '../types';
import { ResearchRepository } from '../storage/ResearchRepository';
import { ResearchDocument, ResearchVersion, ResearchHistoryEntry } from '../types';

export interface ResearchEngineConfig {
  maxVersionsPerDocument: number;
  enableVersioning: boolean;
  enableHistory: boolean;
  enableAnalytics: boolean;
}

export const DEFAULT_RESEARCH_ENGINE_CONFIG: ResearchEngineConfig = {
  maxVersionsPerDocument: 10,
  enableVersioning: true,
  enableHistory: true,
  enableAnalytics: true,
};

export class ResearchEngine {
  protected repository: ResearchRepository;
  protected config: ResearchEngineConfig;

  constructor(
    repository: ResearchRepository,
    config: Partial<ResearchEngineConfig> = {},
  ) {
    this.repository = repository;
    this.config = { ...DEFAULT_RESEARCH_ENGINE_CONFIG, ...config };
  }

  async saveResearch(
    projectId: string,
    category: ResearchCategory,
    content: Record<string, unknown>,
    summary: string,
    source: string,
    createdBy: string,
    tags: string[] = [],
    metadata?: Record<string, unknown>,
  ): Promise<ResearchDocument> {
    const existing = await this.repository.findLatest(projectId, category);

    let document: ResearchDocument;
    const now = Date.now();

    if (existing) {
      const newVersion = existing.version + 1;

      if (this.config.enableHistory) {
        await this.repository.addHistoryEntry({
          researchId: existing.id,
          projectId,
          category,
          action: 'updated',
          previousContent: existing.content,
          newContent: content,
          version: newVersion,
          performedBy: createdBy,
          timestamp: now,
        });
      }

      document = await this.repository.update(existing.id, {
        content,
        summary,
        source,
        version: newVersion,
        updatedAt: now,
        tags,
        metadata: metadata as Record<string, unknown> | undefined,
      }) as unknown as ResearchDocument;

      if (this.config.enableVersioning) {
        await this.repository.createVersion({
          researchId: document.id,
          projectId,
          category,
          versionNumber: newVersion,
          content: existing.content,
          summary: existing.summary,
          changelog: `Updated by ${createdBy}`,
          createdBy,
          createdAt: now,
          status: 'superseded',
        });

        await this.repository.createVersion({
          researchId: document.id,
          projectId,
          category,
          versionNumber: newVersion + 1,
          content,
          summary,
          changelog: `Updated by ${createdBy}`,
          createdBy,
          createdAt: now,
          status: 'active',
        });
      }

      if (this.config.maxVersionsPerDocument > 0) {
        await this.repository.pruneVersions(document.id, this.config.maxVersionsPerDocument);
      }
    } else {
      if (this.config.enableHistory) {
        await this.repository.addHistoryEntry({
          researchId: '',
          projectId,
          category,
          action: 'created',
          newContent: content,
          version: 1,
          performedBy: createdBy,
          timestamp: now,
        });
      }

      document = await this.repository.create({
        projectId,
        category,
        content,
        summary,
        source,
        version: 1,
        createdBy,
        createdAt: now,
        updatedAt: now,
        tags,
        metadata: metadata as Record<string, unknown> | undefined,
      });

      if (this.config.enableVersioning) {
        await this.repository.createVersion({
          researchId: document.id,
          projectId,
          category,
          versionNumber: 1,
          content,
          summary,
          changelog: 'Initial version',
          createdBy,
          createdAt: now,
          status: 'active',
        });
      }
    }

    if (this.config.enableAnalytics) {
      await this.repository.recordAnalytics({
        projectId,
        category,
        action: existing ? 'used_in_generation' : 'viewed',
        timestamp: now,
        metadata: { source, version: document.version },
      });
    }

    return document;
  }

  async getResearch(
    projectId: string,
    category: ResearchCategory,
  ): Promise<ResearchDocument | null> {
    return this.repository.findLatest(projectId, category);
  }

  async getResearchById(id: string): Promise<ResearchDocument | null> {
    return this.repository.getById(id);
  }

  async getHistory(
    researchId: string,
  ): Promise<ResearchHistoryEntry[]> {
    return this.repository.getHistory(researchId);
  }

  async getVersions(
    researchId: string,
  ): Promise<ResearchVersion[]> {
    return this.repository.getVersions(researchId);
  }

  async getVersion(
    researchId: string,
    versionNumber: number,
  ): Promise<ResearchVersion | null> {
    return this.repository.getVersion(researchId, versionNumber);
  }

  async restoreVersion(
    researchId: string,
    versionNumber: number,
    restoredBy: string,
  ): Promise<ResearchDocument | null> {
    const version = await this.repository.getVersion(researchId, versionNumber);
    if (!version) return null;

    const existing = await this.repository.getById(researchId);
    if (!existing) return null;

    const now = Date.now();
    const newVersion = existing.version + 1;

    await this.repository.addHistoryEntry({
      researchId,
      projectId: existing.projectId,
      category: existing.category,
      action: 'restored',
      previousContent: existing.content,
      newContent: version.content,
      version: newVersion,
      performedBy: restoredBy,
      timestamp: now,
      reason: `Restored from version ${versionNumber}`,
    });

    await this.repository.createVersion({
      researchId,
      projectId: existing.projectId,
      category: existing.category,
      versionNumber: newVersion,
      content: existing.content,
      summary: existing.summary,
      changelog: `Superseded by restore from version ${versionNumber}`,
      createdBy: restoredBy,
      createdAt: now,
      status: 'superseded',
    });

    await this.repository.createVersion({
      researchId,
      projectId: existing.projectId,
      category: existing.category,
      versionNumber: newVersion + 1,
      content: version.content,
      summary: version.summary,
      changelog: `Restored from version ${versionNumber} by ${restoredBy}`,
      createdBy: restoredBy,
      createdAt: now,
      status: 'active',
    });

    return this.repository.update(researchId, {
      content: version.content,
      summary: version.summary,
      version: newVersion,
      updatedAt: now,
    }) as unknown as ResearchDocument;
  }

  async deleteResearch(
    researchId: string,
    deletedBy: string,
  ): Promise<void> {
    const existing = await this.repository.getById(researchId);
    if (!existing) return;

    if (this.config.enableHistory) {
      await this.repository.addHistoryEntry({
        researchId,
        projectId: existing.projectId,
        category: existing.category,
        action: 'deleted',
        previousContent: existing.content,
        version: existing.version,
        performedBy: deletedBy,
        timestamp: Date.now(),
      });
    }

    await this.repository.delete(researchId);
  }

  async listProjectResearch(
    projectId: string,
  ): Promise<ResearchDocument[]> {
    return this.repository.listByProject(projectId);
  }

  async searchByTags(
    projectId: string,
    tags: string[],
  ): Promise<ResearchDocument[]> {
    return this.repository.searchByTags(projectId, tags);
  }

  async getAnalytics(
    projectId: string,
    category?: ResearchCategory,
  ): Promise<import('../types').ResearchAnalyticsEntry[]> {
    return this.repository.getAnalytics(projectId, category);
  }
}
