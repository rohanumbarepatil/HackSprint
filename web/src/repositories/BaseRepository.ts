export abstract class BaseRepository<T extends { id: string }> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  /**
   * Retrieves a document by its ID.
   */
  abstract getById(id: string): Promise<T | null>;

  /**
   * Creates a new document.
   */
  abstract create(item: Omit<T, 'id'>): Promise<string>;

  /**
   * Updates an existing document.
   */
  abstract update(id: string, data: Partial<T>): Promise<void>;

  /**
   * Deletes a document by ID.
   */
  abstract delete(id: string): Promise<void>;

  /**
   * Retrieves all documents matching specific criteria.
   */
  abstract query(criteria: Record<string, unknown>): Promise<T[]>;
}
