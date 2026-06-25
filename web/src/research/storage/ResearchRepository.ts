import {
  where,
  orderBy,
  limit,
  QueryConstraint,
} from 'firebase/firestore';
import { FirestoreRepository } from '@/repositories/firestore/FirestoreRepository';
import { COLLECTIONS } from '@/repositories/firestore/collections';
import {
  ResearchCategory,
  ResearchDocument,
  ResearchHistoryEntry,
  ResearchVersion,
  ResearchAnalyticsEntry,
} from '../types';

export class ResearchRepository {
  private docRepo: FirestoreRepository<ResearchDocument>;
  private historyRepo: FirestoreRepository<ResearchHistoryEntry>;
  private versionRepo: FirestoreRepository<ResearchVersion>;
  private analyticsRepo: FirestoreRepository<ResearchAnalyticsEntry>;

  constructor() {
    this.docRepo = new FirestoreRepository<ResearchDocument>(COLLECTIONS.RESEARCH);
    this.historyRepo = new FirestoreRepository<ResearchHistoryEntry>(COLLECTIONS.RESEARCH_HISTORY);
    this.versionRepo = new FirestoreRepository<ResearchVersion>(COLLECTIONS.RESEARCH_VERSIONS);
    this.analyticsRepo = new FirestoreRepository<ResearchAnalyticsEntry>(COLLECTIONS.RESEARCH_ANALYTICS);
  }

  async create(data: Omit<ResearchDocument, 'id'>): Promise<ResearchDocument> {
    const id = await this.docRepo.create(data);
    return { id, ...data } as ResearchDocument;
  }

  async getById(id: string): Promise<ResearchDocument | null> {
    return this.docRepo.getById(id);
  }

  async update(id: string, data: Partial<ResearchDocument>): Promise<ResearchDocument | null> {
    await this.docRepo.update(id, data);
    return this.getById(id);
  }

  async delete(id: string): Promise<void> {
    await this.docRepo.delete(id);
  }

  async findLatest(projectId: string, category: ResearchCategory): Promise<ResearchDocument | null> {
    const constraints: QueryConstraint[] = [
      where('projectId', '==', projectId),
      where('category', '==', category),
      orderBy('version', 'desc'),
      limit(1),
    ];
    const results = await this.docRepo.query(constraints);
    return results.length > 0 ? results[0] : null;
  }

  async listByProject(projectId: string): Promise<ResearchDocument[]> {
    const constraints: QueryConstraint[] = [
      where('projectId', '==', projectId),
      orderBy('updatedAt', 'desc'),
    ];
    return this.docRepo.query(constraints);
  }

  async searchByTags(projectId: string, tags: string[]): Promise<ResearchDocument[]> {
    const constraints: QueryConstraint[] = [
      where('projectId', '==', projectId),
      where('tags', 'array-contains-any', tags),
      orderBy('updatedAt', 'desc'),
    ];
    return this.docRepo.query(constraints);
  }

  async addHistoryEntry(data: Omit<ResearchHistoryEntry, 'id'>): Promise<void> {
    await this.historyRepo.create(data);
  }

  async getHistory(researchId: string): Promise<ResearchHistoryEntry[]> {
    const constraints: QueryConstraint[] = [
      where('researchId', '==', researchId),
      orderBy('timestamp', 'desc'),
    ];
    return this.historyRepo.query(constraints);
  }

  async createVersion(data: Omit<ResearchVersion, 'id'>): Promise<void> {
    await this.versionRepo.create(data);
  }

  async getVersions(researchId: string): Promise<ResearchVersion[]> {
    const constraints: QueryConstraint[] = [
      where('researchId', '==', researchId),
      orderBy('versionNumber', 'desc'),
    ];
    return this.versionRepo.query(constraints);
  }

  async getVersion(researchId: string, versionNumber: number): Promise<ResearchVersion | null> {
    const constraints: QueryConstraint[] = [
      where('researchId', '==', researchId),
      where('versionNumber', '==', versionNumber),
      limit(1),
    ];
    const results = await this.versionRepo.query(constraints);
    return results.length > 0 ? results[0] : null;
  }

  async pruneVersions(researchId: string, maxCount: number): Promise<void> {
    const versions = await this.getVersions(researchId);
    if (versions.length <= maxCount) return;

    const toRemove = versions.slice(maxCount);
    for (const v of toRemove) {
      await this.versionRepo.delete(v.id);
    }
  }

  async recordAnalytics(data: Omit<ResearchAnalyticsEntry, 'id'>): Promise<void> {
    await this.analyticsRepo.create(data);
  }

  async getAnalytics(
    projectId: string,
    category?: ResearchCategory,
  ): Promise<ResearchAnalyticsEntry[]> {
    const constraints: QueryConstraint[] = [where('projectId', '==', projectId)];
    if (category) {
      constraints.push(where('category', '==', category));
    }
    constraints.push(orderBy('timestamp', 'desc'));
    return this.analyticsRepo.query(constraints);
  }
}
