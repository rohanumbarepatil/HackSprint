import { create } from 'zustand';

export interface ProjectCreationData {
  // Step 1: Basic Info
  name: string;
  theme: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | '';
  targetAudience: string;
  // Step 2: Problem Statement
  problemStatement: string;
  // Step 3: Constraints
  budget: string;
  deadline: string;
  constraints: string[];
  // Step 4: Preferred Tech
  technologyPreferences: string[];
  // Step 5: AI Config
  aiGoal: string;
}

interface ProjectCreationStore {
  step: number;
  data: ProjectCreationData;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (updates: Partial<ProjectCreationData>) => void;
  reset: () => void;
}

const defaultData: ProjectCreationData = {
  name: '',
  theme: '',
  difficulty: '',
  targetAudience: '',
  problemStatement: '',
  budget: '',
  deadline: '',
  constraints: [],
  technologyPreferences: [],
  aiGoal: ''
};

export const useProjectCreationStore = create<ProjectCreationStore>((set) => ({
  step: 1,
  data: defaultData,
  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 6) })),
  prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),
  updateData: (updates) => set((state) => ({ data: { ...state.data, ...updates } })),
  reset: () => set({ step: 1, data: defaultData })
}));
