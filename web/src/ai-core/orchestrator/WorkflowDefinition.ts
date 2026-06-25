import { ZodSchema } from 'zod';

export interface WorkflowNode {
  id: string;
  agentId: string;
  dependencies: string[]; // Node IDs that must complete before this node
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
    // Further nodes would define the full 15 modules...
  ]
};
