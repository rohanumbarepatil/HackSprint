/* eslint-disable */
jest.mock('@/lib/firebase/client', () => ({
  db: {},
  auth: {},
  storage: {},
  default: {},
}));

jest.mock('firebase/firestore', () => {
  let docId = 'new-id';
  const mockDocSnap = (exists: boolean, data?: any) => ({
    exists: () => exists,
    id: 'test-id',
    data: () => data || {},
  });

  const mockQuerySnapshot = (docs: any[]) => ({
    docs: docs.map(d => ({ id: d.id || 'doc-id', data: () => d })),
  });

  const mockDocRef = { id: docId };

  return {
    collection: jest.fn(() => 'test-collection'),
    doc: jest.fn(() => mockDocRef),
    getDoc: jest.fn(() => Promise.resolve(mockDocSnap(true, { name: 'test', createdAt: Date.now() }))),
    getDocs: jest.fn(() => Promise.resolve(mockQuerySnapshot([{ id: 'doc1', name: 'Test', createdAt: Date.now() }]))),
    setDoc: jest.fn(() => Promise.resolve()),
    updateDoc: jest.fn(() => Promise.resolve()),
    deleteDoc: jest.fn(() => Promise.resolve()),
    query: jest.fn(() => 'test-query'),
    where: jest.fn(() => 'test-where'),
    orderBy: jest.fn(() => 'test-order'),
    limit: jest.fn(() => 'test-limit'),
    addDoc: jest.fn(() => Promise.resolve({ id: 'new-id' })),
  };
});

import { FirestoreRepository } from '@/repositories/firestore/FirestoreRepository';

interface TestDoc { id: string; name: string; createdAt: number }

describe('FirestoreRepository', () => {
  let repo: FirestoreRepository<TestDoc>;

  beforeEach(() => {
    repo = new FirestoreRepository<TestDoc>('test-collection');
  });

  it('gets by id', async () => {
    const result = await repo.getById('test-id');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('test-id');
  });

  it('creates a document', async () => {
    const id = await repo.create({ name: 'New Doc', createdAt: Date.now() });
    expect(typeof id).toBe('string');
  });

  it('creates with explicit id', async () => {
    const id = await repo.createWithId('custom-id', { name: 'Custom', createdAt: Date.now() });
    expect(id).toBe('custom-id');
  });

  it('updates a document', async () => {
    await expect(repo.update('test-id', { name: 'Updated' })).resolves.toBeUndefined();
  });

  it('deletes a document', async () => {
    await expect(repo.delete('test-id')).resolves.toBeUndefined();
  });

  it('queries with constraints', async () => {
    const result = await repo.query([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('gets by field', async () => {
    const result = await repo.getByField('name', 'Test');
    expect(Array.isArray(result)).toBe(true);
  });

  it('gets recent documents', async () => {
    const result = await repo.getRecent(10);
    expect(Array.isArray(result)).toBe(true);
  });
});
