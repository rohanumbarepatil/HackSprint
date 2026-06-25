export type UserRole = 'user' | 'premium' | 'admin' | 'superadmin';
export type UserStatus = 'active' | 'suspended' | 'banned';

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  emailNotifications?: boolean;
}

export interface User {
  id: string; // Used by BaseRepository
  uid: string;
  fullName: string | null;
  username: string | null;
  email: string | null;
  avatar: string | null;
  provider: 'google' | 'github' | 'email' | 'anonymous' | 'unknown';
  role: UserRole;
  status: UserStatus;
  subscription: 'free' | 'pro' | 'enterprise';
  credits: number;
  projectsCreated: number;
  lastLogin: number;
  createdAt: number;
  updatedAt: number;
  onboardingCompleted: boolean;
  preferences: UserPreferences;
}

export interface ProjectSettings {
  name: string;
  description?: string;
  theme?: string;
  teamSize?: number;
  deadline?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  targetAudience?: string;
  technologyPreferences?: string[];
  budget?: string;
  constraints?: string[];
}

export interface Project {
  id: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
  settings: ProjectSettings;
  completionPercentage: number;
  aiQualityScore?: number;
}

export interface Workspace {
  id: string;
  ownerId: string;
  name: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export type DocumentStatus = 
  | 'Not Started'
  | 'Generating'
  | 'Generated'
  | 'Validating'
  | 'Needs Review'
  | 'Approved'
  | 'Outdated';

export interface DocumentModule {
  id: string;
  projectId: string;
  type: string; // e.g. 'PRD', 'Architecture'
  content: string; // Markdown or JSON
  status: DocumentStatus;
  createdAt: number;
  updatedAt: number;
  dependencies: string[]; // IDs of upstream modules this depends on
}
