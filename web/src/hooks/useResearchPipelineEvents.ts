'use client';

import { useEffect, useRef } from 'react';
import { useResearchProgressStore, type ResearchStage } from '@/store/useResearchProgressStore';
import type { PipelineEvent } from '@/ai-core/pipeline';
import type { OrchestratorEvent } from '@/ai-core/orchestrator/DAGOrchestrator';
import { PhaseWorkflows } from '@/ai-core/orchestrator/WorkflowDefinition';

const NODE_TO_STAGE: Record<string, ResearchStage> = {
  'node-research': 'researching',
  'node-competitor': 'analyzing-competitors',
  'node-innovation': 'finding-opportunities',
};

const PHASE_BROAD_STAGES: Record<string, ResearchStage> = {
  discovery: 'researching',
  planning: 'evaluating-technologies',
  architecture: 'evaluating-technologies',
  quality: 'evaluating-technologies',
  validation: 'evaluating-technologies',
};

export function usePipelineToProgress(pipeline: {
  on: (cb: (event: PipelineEvent) => void) => () => void;
} | null) {
  const setStage = useResearchProgressStore((s) => s.setStage);
  const setProgress = useResearchProgressStore((s) => s.setProgress);
  const setError = useResearchProgressStore((s) => s.setError);
  const reset = useResearchProgressStore((s) => s.reset);
  const prevStageRef = useRef<ResearchStage>('idle');

  useEffect(() => {
    if (!pipeline) return;

    reset();
    prevStageRef.current = 'idle';

    const unsub = pipeline.on((event: PipelineEvent) => {
      switch (event.type) {
        case 'phase-started': {
          if (event.phase) {
            const stage = PHASE_BROAD_STAGES[event.phase];
            if (stage) {
              setStage(stage);
              prevStageRef.current = stage;
            }
          }
          break;
        }
        case 'node-validated': {
          const nodeId = event.metadata?.nodeId as string | undefined;
          if (nodeId && NODE_TO_STAGE[nodeId]) {
            setStage(NODE_TO_STAGE[nodeId]);
            prevStageRef.current = NODE_TO_STAGE[nodeId];
          }

          const phase = event.phase;
          if (phase && PhaseWorkflows[phase]) {
            const nodes = PhaseWorkflows[phase];
            const idx = nodes.indexOf(nodeId ?? '');
            if (idx >= 0) {
              const pct = Math.round(((idx + 1) / nodes.length) * 100);
              setProgress(pct);
            }
          }
          break;
        }
        case 'phase-completed': {
          const nextPhaseOrder = ['discovery', 'planning', 'architecture', 'quality', 'validation'];
          if (event.phase) {
            const currentIdx = nextPhaseOrder.indexOf(event.phase);
            if (currentIdx >= 0 && currentIdx < nextPhaseOrder.length - 1) {
              const nextPhase = nextPhaseOrder[currentIdx + 1];
              const stage = PHASE_BROAD_STAGES[nextPhase];
              if (stage && stage !== prevStageRef.current) {
                setStage(stage);
                prevStageRef.current = stage;
              }
            }
          }
          setProgress(100);
          break;
        }
        case 'phase-failed': {
          setError(event.message);
          break;
        }
        case 'pipeline-completed': {
          setStage('completed');
          setProgress(100);
          break;
        }
        case 'pipeline-failed': {
          setError(event.message);
          break;
        }
      }
    });

    return () => {
      unsub();
    };
  }, [pipeline, setStage, setProgress, setError, reset]);
}

const ORCHESTRATOR_NODE_TO_STAGE: Record<string, ResearchStage> = {
  'node-research': 'researching',
  'node-competitor': 'analyzing-competitors',
  'node-innovation': 'finding-opportunities',
};

const ORCHESTRATOR_NODE_PHASE: Record<string, string> = {};
for (const [phase, nodeIds] of Object.entries(PhaseWorkflows)) {
  for (const nodeId of nodeIds) {
    ORCHESTRATOR_NODE_PHASE[nodeId] = phase;
  }
}

export function useOrchestratorToProgress(orchestrator: {
  on: (cb: (event: OrchestratorEvent) => void) => () => void;
} | null) {
  const setStage = useResearchProgressStore((s) => s.setStage);
  const setProgress = useResearchProgressStore((s) => s.setProgress);
  const setError = useResearchProgressStore((s) => s.setError);
  const reset = useResearchProgressStore((s) => s.reset);
  const totalNodesRef = useRef(0);

  useEffect(() => {
    if (!orchestrator) return;

    reset();
    totalNodesRef.current = 0;

    const unsub = orchestrator.on((event: OrchestratorEvent) => {
      switch (event.type) {
        case 'pipeline-started': {
          totalNodesRef.current = (event.metadata?.totalNodes as number) || 1;
          setStage('researching');
          break;
        }
        case 'node-started': {
          if (event.nodeId && ORCHESTRATOR_NODE_TO_STAGE[event.nodeId]) {
            setStage(ORCHESTRATOR_NODE_TO_STAGE[event.nodeId]);
          }
          if (!event.nodeId?.startsWith('node-checkpoint')) {
            const phase = ORCHESTRATOR_NODE_PHASE[event.nodeId ?? ''];
            if (phase && PHASE_BROAD_STAGES[phase]) {
              setStage(PHASE_BROAD_STAGES[phase]);
            }
          }
          break;
        }
        case 'node-completed': {
          const completedCount = (event.metadata?.progressPercent as number)
            ?? (event.metadata?.completedCount as number)
            ?? 0;
          if (completedCount > 0) {
            setProgress(completedCount);
          }
          break;
        }
        case 'progress': {
          const pct = event.metadata?.progressPercent as number;
          if (pct) setProgress(pct);
          break;
        }
        case 'pipeline-completed': {
          setStage('completed');
          setProgress(100);
          break;
        }
        case 'pipeline-failed': {
          setError(event.message);
          break;
        }
      }
    });

    return () => {
      unsub();
    };
  }, [orchestrator, setStage, setProgress, setError, reset]);
}
