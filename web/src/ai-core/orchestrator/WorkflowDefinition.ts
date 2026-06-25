import { ZodSchema } from 'zod';

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
  outputSchema?: ZodSchema;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
}

export const HackSprintDefaultWorkflow: WorkflowDefinition = {
  id: 'hacksprint-v1',
  name: 'Full Platform Generation',
  description: 'Generates the 15 complete modules for HackSprint.',
  nodes: [
    {
      id: 'node-problem',
      agentId: 'agent-problem-analyzer',
      dependencies: [],
      retryPolicy: { maxRetries: 3, backoffMs: 1000 },
      timeoutMs: 30000,
      priority: 'high',
    },
    {
      id: 'node-research',
      agentId: 'agent-research',
      dependencies: ['node-problem'],
      retryPolicy: { maxRetries: 3, backoffMs: 1000 },
      timeoutMs: 60000,
      priority: 'high',
    },
    {
      id: 'node-competitor',
      agentId: 'agent-competitor',
      dependencies: ['node-problem', 'node-research'],
      retryPolicy: { maxRetries: 3, backoffMs: 1000 },
      timeoutMs: 60000,
      priority: 'high',
    },
    {
      id: 'node-innovation',
      agentId: 'agent-innovation',
      dependencies: ['node-problem', 'node-research', 'node-competitor'],
      retryPolicy: { maxRetries: 3, backoffMs: 1000 },
      timeoutMs: 30000,
      priority: 'high',
    },
    {
      id: 'node-pm',
      agentId: 'agent-pm',
      dependencies: ['node-problem', 'node-research', 'node-competitor', 'node-innovation'],
      retryPolicy: { maxRetries: 3, backoffMs: 1000 },
      timeoutMs: 60000,
      priority: 'critical',
    },
    {
      id: 'node-business',
      agentId: 'agent-business-analyst',
      dependencies: ['node-problem', 'node-research', 'node-competitor', 'node-innovation'],
      retryPolicy: { maxRetries: 3, backoffMs: 1000 },
      timeoutMs: 45000,
      priority: 'high',
    },
    {
      id: 'node-tech-architect',
      agentId: 'agent-tech-architect',
      dependencies: ['node-problem', 'node-pm', 'node-innovation'],
      retryPolicy: { maxRetries: 3, backoffMs: 1000 },
      timeoutMs: 60000,
      priority: 'critical',
    },
    {
      id: 'node-db-architect',
      agentId: 'agent-db-architect',
      dependencies: ['node-tech-architect', 'node-pm'],
      retryPolicy: { maxRetries: 3, backoffMs: 1000 },
      timeoutMs: 45000,
      priority: 'high',
    },
    {
      id: 'node-ui-ux',
      agentId: 'agent-ui-ux',
      dependencies: ['node-pm', 'node-tech-architect'],
      retryPolicy: { maxRetries: 3, backoffMs: 1000 },
      timeoutMs: 60000,
      priority: 'high',
    },
    {
      id: 'node-backend',
      agentId: 'agent-backend',
      dependencies: ['node-tech-architect', 'node-db-architect', 'node-pm'],
      retryPolicy: { maxRetries: 3, backoffMs: 1000 },
      timeoutMs: 60000,
      priority: 'critical',
    },
    {
      id: 'node-security',
      agentId: 'agent-security',
      dependencies: ['node-tech-architect', 'node-backend', 'node-db-architect'],
      retryPolicy: { maxRetries: 3, backoffMs: 1000 },
      timeoutMs: 45000,
      priority: 'high',
    },
    {
      id: 'node-qa',
      agentId: 'agent-qa',
      dependencies: ['node-backend', 'node-ui-ux', 'node-security', 'node-pm'],
      retryPolicy: { maxRetries: 3, backoffMs: 1000 },
      timeoutMs: 60000,
      priority: 'medium',
    },
    {
      id: 'node-pitch',
      agentId: 'agent-pitch',
      dependencies: ['node-business', 'node-pm', 'node-innovation', 'node-competitor'],
      retryPolicy: { maxRetries: 3, backoffMs: 1000 },
      timeoutMs: 45000,
      priority: 'medium',
    },
    {
      id: 'node-documentation',
      agentId: 'agent-documentation',
      dependencies: ['node-tech-architect', 'node-backend', 'node-db-architect', 'node-ui-ux', 'node-security', 'node-qa'],
      retryPolicy: { maxRetries: 3, backoffMs: 1000 },
      timeoutMs: 60000,
      priority: 'medium',
    },
    {
      id: 'node-validation',
      agentId: 'agent-validation',
      dependencies: ['node-problem', 'node-research', 'node-competitor', 'node-innovation', 'node-pm', 'node-tech-architect', 'node-db-architect', 'node-ui-ux', 'node-backend', 'node-security', 'node-qa', 'node-business', 'node-pitch', 'node-documentation'],
      retryPolicy: { maxRetries: 3, backoffMs: 1000 },
      timeoutMs: 90000,
      priority: 'critical',
    },
  ],
};

export const PhaseWorkflows: Record<string, string[]> = {
  'discovery': ['node-problem', 'node-research', 'node-competitor', 'node-innovation'],
  'planning': ['node-pm', 'node-business'],
  'architecture': ['node-tech-architect', 'node-db-architect', 'node-ui-ux', 'node-backend', 'node-security'],
  'quality': ['node-qa', 'node-documentation', 'node-pitch'],
  'validation': ['node-validation'],
};
