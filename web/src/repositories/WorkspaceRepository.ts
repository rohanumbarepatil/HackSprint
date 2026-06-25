import { db } from '@/lib/firebase/client';
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { Workspace } from '@/types';
import { BaseRepository } from './BaseRepository';

export class WorkspaceRepository extends BaseRepository<Workspace> {
  constructor() {
    super('workspaces');
  }

  async getById(id: string): Promise<Workspace | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Workspace;
    }
    return null;
  }

  async create(workspace: Omit<Workspace, 'id'>): Promise<string> {
    const collectionRef = collection(db, this.collectionName);
    const docRef = doc(collectionRef); // Generate auto-ID
    const newWorkspace: Workspace = { ...workspace, id: docRef.id };
    await setDoc(docRef, newWorkspace);
    return newWorkspace.id;
  }

  async update(id: string, data: Partial<Workspace>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, data);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(id: string): Promise<void> {
    throw new Error('Workspace deletion must be handled via Cloud Functions to cascade delete projects.');
  }

  async query(criteria: Record<string, unknown>): Promise<Workspace[]> {
    let q = query(collection(db, this.collectionName));
    
    // Add where clauses based on criteria
    Object.entries(criteria).forEach(([key, value]) => {
      q = query(q, where(key, '==', value));
    });

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Workspace);
  }

  async getDefaultWorkspaceForUser(userId: string): Promise<Workspace | null> {
    const workspaces = await this.query({ ownerId: userId, isDefault: true });
    return workspaces.length > 0 ? workspaces[0] : null;
  }
}

export const workspaceRepository = new WorkspaceRepository();
