import { db } from '@/lib/firebase/client';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';

export class FirestoreRepository<T extends { id: string }> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  async getById(id: string): Promise<T | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  }

  async create(data: Omit<T, 'id'>): Promise<string> {
    const collectionRef = collection(db, this.collectionName);
    const docRef = doc(collectionRef);
    await setDoc(docRef, data as DocumentData);
    return docRef.id;
  }

  async createWithId(id: string, data: Omit<T, 'id'>): Promise<string> {
    const docRef = doc(db, this.collectionName, id);
    await setDoc(docRef, data as DocumentData);
    return id;
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, data as DocumentData);
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  async query(constraints: QueryConstraint[]): Promise<T[]> {
    const q = query(collection(db, this.collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
  }

  async getByField(field: string, value: unknown): Promise<T[]> {
    return this.query([where(field, '==', value)]);
  }

  async getRecent(limitCount: number): Promise<T[]> {
    const constraints: QueryConstraint[] = [
      orderBy('createdAt', 'desc'),
      limit(limitCount),
    ];
    return this.query(constraints);
  }
}
