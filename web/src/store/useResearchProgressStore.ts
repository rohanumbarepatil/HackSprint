import { create } from 'zustand';

export type ResearchStage =
  | 'idle'
  | 'researching'
  | 'analyzing-competitors'
  | 'finding-opportunities'
  | 'evaluating-technologies'
  | 'completed'
  | 'failed';

export const STAGE_ORDER: ResearchStage[] = [
  'idle',
  'researching',
  'analyzing-competitors',
  'finding-opportunities',
  'evaluating-technologies',
  'completed',
];

export const STAGE_LABELS: Record<ResearchStage, string> = {
  'idle': 'Waiting to start...',
  'researching': 'Researching...',
  'analyzing-competitors': 'Analyzing Competitors...',
  'finding-opportunities': 'Finding Opportunities...',
  'evaluating-technologies': 'Evaluating Technologies...',
  'completed': 'Completed',
  'failed': 'Failed',
};

export const DISPLAY_STAGES: ResearchStage[] = [
  'researching',
  'analyzing-competitors',
  'finding-opportunities',
  'evaluating-technologies',
  'completed',
];

type StageStatus = 'pending' | 'active' | 'completed' | 'failed';

interface ResearchProgressState {
  currentStage: ResearchStage;
  progressPercent: number;
  stageStatuses: Record<ResearchStage, StageStatus>;
  errorMessage: string | null;

  setStage: (stage: ResearchStage) => void;
  setProgress: (percent: number) => void;
  setError: (message: string) => void;
  reset: () => void;
}

function computeStageStatuses(stage: ResearchStage): Record<ResearchStage, StageStatus> {
  const statuses: Record<ResearchStage, StageStatus> = {
    'idle': 'pending',
    'researching': 'pending',
    'analyzing-competitors': 'pending',
    'finding-opportunities': 'pending',
    'evaluating-technologies': 'pending',
    'completed': 'pending',
    'failed': 'pending',
  };

  if (stage === 'failed') {
    statuses['failed'] = 'failed';
    return statuses;
  }

  const idx = STAGE_ORDER.indexOf(stage);
  if (idx === -1) return statuses;

  for (let i = 0; i < STAGE_ORDER.length; i++) {
    const s = STAGE_ORDER[i];
    if (s === 'idle' || s === 'failed') continue;
    if (i < idx) statuses[s] = 'completed';
    else if (i === idx) statuses[s] = 'active';
    else statuses[s] = 'pending';
  }

  return statuses;
}

export const useResearchProgressStore = create<ResearchProgressState>((set) => ({
  currentStage: 'idle',
  progressPercent: 0,
  stageStatuses: computeStageStatuses('idle'),
  errorMessage: null,

  setStage: (stage) => set({
    currentStage: stage,
    stageStatuses: computeStageStatuses(stage),
    errorMessage: stage === 'failed' ? undefined : null,
  }),

  setProgress: (percent) => set({ progressPercent: Math.min(100, Math.max(0, percent)) }),

  setError: (message) => set({
    currentStage: 'failed',
    stageStatuses: computeStageStatuses('failed'),
    errorMessage: message,
  }),

  reset: () => set({
    currentStage: 'idle',
    progressPercent: 0,
    stageStatuses: computeStageStatuses('idle'),
    errorMessage: null,
  }),
}));
