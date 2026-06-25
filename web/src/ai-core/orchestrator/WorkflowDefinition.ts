import { z } from 'zod';
import {
  ProblemAnalyzerSchema,
  ResearchSchema,
  CompetitorAnalysisSchema,
  InnovationSchema,
  PRDSchema,
  TRDSchema,
  DatabaseSchema,
  UISchema,
  BackendSchema,
  SecuritySchema,
  QASchema,
  BusinessModelSchema,
  PitchDeckSchema,
  ImplementationSchema,
  ValidationSchema,
} from '../schemas';

export interface WorkflowNode {
  id: string;
  agentId: string;
  dependencies: string[];
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
  timeoutMs: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  outputSchema?: z.ZodSchema;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
}

export type PhaseName =
  | 'discovery'
  | 'planning'
  | 'architecture'
  | 'quality'
  | 'validation'
  | 'checkpoint';

export interface PhaseDefinition {
  name: PhaseName;
  nodeIds: string[];
  dependsOn: PhaseName[];
  validationCheckpoint: boolean;
}

export const NodeOutputSchema: Record<string, z.ZodSchema> = {
  'node-problem': ProblemAnalyzerSchema,
  'node-research': ResearchSchema,
  'node-competitor': CompetitorAnalysisSchema,
  'node-innovation': InnovationSchema,
  'node-pm': PRDSchema,
  'node-business': BusinessModelSchema,
  'node-tech-architect': TRDSchema,
  'node-db-architect': DatabaseSchema,
  'node-ui-ux': UISchema,
  'node-backend': BackendSchema,
  'node-security': SecuritySchema,
  'node-qa': QASchema,
  'node-pitch': PitchDeckSchema,
  'node-documentation': ImplementationSchema,
  'node-validation': ValidationSchema,
  'node-checkpoint-discovery': z.object({
    validated: z.boolean(),
    stageResults: z.array(z.object({ stageName: z.string(), passed: z.boolean() })),
  }),
  'node-checkpoint-planning': z.object({
    validated: z.boolean(),
    stageResults: z.array(z.object({ stageName: z.string(), passed: z.boolean() })),
  }),
  'node-checkpoint-architecture': z.object({
    validated: z.boolean(),
    stageResults: z.array(z.object({ stageName: z.string(), passed: z.boolean() })),
  }),
};

const CHECKPOINT_CONFIG = {
  retryPolicy: { maxRetries: 2, backoffMs: 500 },
  timeoutMs: 15000,
  priority: 'critical' as const,
};

const BASE_RETRY = { maxRetries: 3, backoffMs: 1000 };

export const FullResearchWorkflow: WorkflowDefinition = {
  id: 'research-pipeline-v1',
  name: '18-Stage Research Pipeline',
  description:
    'Full research pipeline: 15 agent stages + 3 validation checkpoints. Each stage consumes previous outputs, no stage merging.',

  nodes: [
    {
      id: 'node-problem',
      agentId: 'agent-problem-analyzer',
      dependencies: [],
      retryPolicy: BASE_RETRY,
      timeoutMs: 30000,
      priority: 'high',
      outputSchema: ProblemAnalyzerSchema,
    },
    {
      id: 'node-research',
      agentId: 'agent-research',
      dependencies: ['node-problem'],
      retryPolicy: BASE_RETRY,
      timeoutMs: 60000,
      priority: 'high',
      outputSchema: ResearchSchema,
    },
    {
      id: 'node-competitor',
      agentId: 'agent-competitor',
      dependencies: ['node-problem', 'node-research'],
      retryPolicy: BASE_RETRY,
      timeoutMs: 60000,
      priority: 'high',
      outputSchema: CompetitorAnalysisSchema,
    },
    {
      id: 'node-innovation',
      agentId: 'agent-innovation',
      dependencies: ['node-problem', 'node-research', 'node-competitor'],
      retryPolicy: BASE_RETRY,
      timeoutMs: 30000,
      priority: 'high',
      outputSchema: InnovationSchema,
    },
    {
      id: 'node-checkpoint-discovery',
      agentId: 'agent-validation',
      dependencies: ['node-problem', 'node-research', 'node-competitor', 'node-innovation'],
      retryPolicy: CHECKPOINT_CONFIG.retryPolicy,
      timeoutMs: CHECKPOINT_CONFIG.timeoutMs,
      priority: CHECKPOINT_CONFIG.priority,
      outputSchema: NodeOutputSchema['node-checkpoint-discovery'],
    },
    {
      id: 'node-pm',
      agentId: 'agent-pm',
      dependencies: ['node-problem', 'node-research', 'node-competitor', 'node-innovation'],
      retryPolicy: BASE_RETRY,
      timeoutMs: 60000,
      priority: 'critical',
      outputSchema: PRDSchema,
    },
    {
      id: 'node-business',
      agentId: 'agent-business-analyst',
      dependencies: ['node-problem', 'node-research', 'node-competitor', 'node-innovation'],
      retryPolicy: BASE_RETRY,
      timeoutMs: 45000,
      priority: 'high',
      outputSchema: BusinessModelSchema,
    },
    {
      id: 'node-checkpoint-planning',
      agentId: 'agent-validation',
      dependencies: ['node-pm', 'node-business'],
      retryPolicy: CHECKPOINT_CONFIG.retryPolicy,
      timeoutMs: CHECKPOINT_CONFIG.timeoutMs,
      priority: CHECKPOINT_CONFIG.priority,
      outputSchema: NodeOutputSchema['node-checkpoint-planning'],
    },
    {
      id: 'node-tech-architect',
      agentId: 'agent-tech-architect',
      dependencies: ['node-problem', 'node-pm', 'node-innovation'],
      retryPolicy: BASE_RETRY,
      timeoutMs: 60000,
      priority: 'critical',
      outputSchema: TRDSchema,
    },
    {
      id: 'node-db-architect',
      agentId: 'agent-db-architect',
      dependencies: ['node-tech-architect', 'node-pm'],
      retryPolicy: BASE_RETRY,
      timeoutMs: 45000,
      priority: 'high',
      outputSchema: DatabaseSchema,
    },
    {
      id: 'node-ui-ux',
      agentId: 'agent-ui-ux',
      dependencies: ['node-pm', 'node-tech-architect'],
      retryPolicy: BASE_RETRY,
      timeoutMs: 60000,
      priority: 'high',
      outputSchema: UISchema,
    },
    {
      id: 'node-backend',
      agentId: 'agent-backend',
      dependencies: ['node-tech-architect', 'node-db-architect', 'node-pm'],
      retryPolicy: BASE_RETRY,
      timeoutMs: 60000,
      priority: 'critical',
      outputSchema: BackendSchema,
    },
    {
      id: 'node-security',
      agentId: 'agent-security',
      dependencies: ['node-tech-architect', 'node-backend', 'node-db-architect'],
      retryPolicy: BASE_RETRY,
      timeoutMs: 45000,
      priority: 'high',
      outputSchema: SecuritySchema,
    },
    {
      id: 'node-checkpoint-architecture',
      agentId: 'agent-validation',
      dependencies: [
        'node-tech-architect', 'node-db-architect', 'node-ui-ux',
        'node-backend', 'node-security',
      ],
      retryPolicy: CHECKPOINT_CONFIG.retryPolicy,
      timeoutMs: CHECKPOINT_CONFIG.timeoutMs,
      priority: CHECKPOINT_CONFIG.priority,
      outputSchema: NodeOutputSchema['node-checkpoint-architecture'],
    },
    {
      id: 'node-qa',
      agentId: 'agent-qa',
      dependencies: ['node-backend', 'node-ui-ux', 'node-security', 'node-pm'],
      retryPolicy: BASE_RETRY,
      timeoutMs: 60000,
      priority: 'medium',
      outputSchema: QASchema,
    },
    {
      id: 'node-pitch',
      agentId: 'agent-pitch',
      dependencies: ['node-business', 'node-pm', 'node-innovation', 'node-competitor'],
      retryPolicy: BASE_RETRY,
      timeoutMs: 45000,
      priority: 'medium',
      outputSchema: PitchDeckSchema,
    },
    {
      id: 'node-documentation',
      agentId: 'agent-documentation',
      dependencies: [
        'node-tech-architect', 'node-backend', 'node-db-architect',
        'node-ui-ux', 'node-security', 'node-qa',
      ],
      retryPolicy: BASE_RETRY,
      timeoutMs: 60000,
      priority: 'medium',
      outputSchema: ImplementationSchema,
    },
    {
      id: 'node-validation',
      agentId: 'agent-validation',
      dependencies: [
        'node-problem', 'node-research', 'node-competitor', 'node-innovation',
        'node-pm', 'node-tech-architect', 'node-db-architect', 'node-ui-ux',
        'node-backend', 'node-security', 'node-qa', 'node-business',
        'node-pitch', 'node-documentation',
      ],
      retryPolicy: BASE_RETRY,
      timeoutMs: 90000,
      priority: 'critical',
      outputSchema: ValidationSchema,
    },
  ],
};

export const PhaseWorkflows: Record<PhaseName, string[]> = {
  discovery: [
    'node-problem', 'node-research', 'node-competitor', 'node-innovation',
    'node-checkpoint-discovery',
  ],
  planning: ['node-pm', 'node-business', 'node-checkpoint-planning'],
  architecture: [
    'node-tech-architect', 'node-db-architect', 'node-ui-ux',
    'node-backend', 'node-security', 'node-checkpoint-architecture',
  ],
  quality: ['node-qa', 'node-pitch', 'node-documentation'],
  validation: ['node-validation'],
  checkpoint: [],
};

export const PhaseOrder: PhaseName[] = [
  'discovery',
  'planning',
  'architecture',
  'quality',
  'validation',
];

export const HackSprintDefaultWorkflow: WorkflowDefinition = {
  id: 'hacksprint-v1',
  name: 'Full Platform Generation',
  description: 'Generates the 15 complete modules for HackSprint.',
  nodes: FullResearchWorkflow.nodes.filter(
    n => !n.id.startsWith('node-checkpoint')
  ),
};
