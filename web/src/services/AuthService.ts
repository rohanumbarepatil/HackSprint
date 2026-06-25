import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { userRepository } from '@/repositories/UserRepository';
import { workspaceRepository } from '@/repositories/WorkspaceRepository';
import { User } from '@/types';
import { logger } from '@/utils/logger';

class AuthService {
  private googleProvider = new GoogleAuthProvider();
  private githubProvider = new GithubAuthProvider();

  constructor() {
    this.googleProvider.addScope('email');
    this.githubProvider.addScope('user:email');
  }

  private async initializeUserProfile(firebaseUser: FirebaseUser, provider: 'google' | 'github' | 'email'): Promise<User> {
    const existingProfile = await userRepository.getById(firebaseUser.uid);
    if (existingProfile) {
      // Update last login
      await userRepository.update(firebaseUser.uid, { lastLogin: Date.now() });
      return { ...existingProfile, lastLogin: Date.now() };
    }

    // Create new profile
    const newProfile: User = {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      fullName: firebaseUser.displayName,
      username: firebaseUser.displayName?.toLowerCase().replace(/\s/g, '') || null,
      email: firebaseUser.email,
      avatar: firebaseUser.photoURL,
      provider: provider,
      role: 'user',
      status: 'active',
      subscription: 'free',
      credits: 100, // Initial onboarding credits
      projectsCreated: 0,
      lastLogin: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      onboardingCompleted: false,
      preferences: {
        theme: 'system',
        emailNotifications: true,
      }
    };

    await userRepository.create(newProfile);
    
    // Create default workspace
    await workspaceRepository.create({
      ownerId: newProfile.uid,
      name: 'My Workspace',
      isDefault: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    return newProfile;
  }

  async loginWithGoogle(): Promise<User> {
    try {
      const result = await signInWithPopup(auth, this.googleProvider);
      return await this.initializeUserProfile(result.user, 'google');
    } catch (error) {
      logger.error('Google login failed', error);
      throw error;
    }
  }

  async loginWithGithub(): Promise<User> {
    try {
      const result = await signInWithPopup(auth, this.githubProvider);
      return await this.initializeUserProfile(result.user, 'github');
    } catch (error) {
      logger.error('GitHub login failed', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }
}

export const authService = new AuthService();
