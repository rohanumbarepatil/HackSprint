import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { User } from '@/types';
import { BaseRepository } from './BaseRepository';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  async getById(uid: string): Promise<User | null> {
    const docRef = doc(db, this.collectionName, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as User;
    }
    return null;
  }

  async create(user: Omit<User, 'id'>): Promise<string> {
    // We use uid as the document ID for users
    const docRef = doc(db, this.collectionName, user.uid);
    await setDoc(docRef, user);
    return user.uid;
  }

  async update(uid: string, data: Partial<User>): Promise<void> {
    const docRef = doc(db, this.collectionName, uid);
    await updateDoc(docRef, data);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(uid: string): Promise<void> {
    throw new Error('Deletion of users must be handled securely via Cloud Functions to clean up associated data.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async query(criteria: Record<string, unknown>): Promise<User[]> {
    throw new Error('Querying multiple users is restricted to Admins via Admin SDK.');
  }

  /**
   * Completes the onboarding process and updates the user record
   */
  async completeOnboarding(uid: string): Promise<void> {
    await this.update(uid, {
      onboardingCompleted: true,
      status: 'active',
      updatedAt: Date.now(),
    });
  }
}

export const userRepository = new UserRepository();
