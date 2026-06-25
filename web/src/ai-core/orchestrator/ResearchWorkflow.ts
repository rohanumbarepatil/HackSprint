import { WorkflowDefinition } from './WorkflowDefinition';

export const ResearchWorkflow: WorkflowDefinition = {
  id: 'research-v1',
  name: 'Full Research Pipeline',
  description: '18-stage sequential research pipeline. Each stage builds on the previous.',
  nodes: [
    { id: 'r01', agentId: 'agent-research-01-problem-understanding', dependencies: [], retryPolicy: { maxRetries: 3, backoffMs: 1000 }, timeoutMs: 30000, priority: 'high' },
    { id: 'r02', agentId: 'agent-research-02-domain-identification', dependencies: ['r01'], retryPolicy: { maxRetries: 3, backoffMs: 1000 }, timeoutMs: 30000, priority: 'high' },
    { id: 'r03', agentId: 'agent-research-03-industry-research', dependencies: ['r01', 'r02'], retryPolicy: { maxRetries: 3, backoffMs: 1000 }, timeoutMs: 45000, priority: 'high' },
    { id: 'r04', agentId: 'agent-research-04-market-research', dependencies: ['r01', 'r02', 'r03'], retryPolicy: { maxRetries: 3, backoffMs: 1000 }, timeoutMs: 45000, priority: 'high' },
    { id: 'r05', agentId: 'agent-research-05-competitor-analysis', dependencies: ['r01', 'r03', 'r04'], retryPolicy: { maxRetries: 3, backoffMs: 1000 }, timeoutMs: 45000, priority: 'high' },
    { id: 'r06', agentId: 'agent-research-06-gap-analysis', dependencies: ['r01', 'r05', 'r04'], retryPolicy: { maxRetries: 3, backoffMs: 1000 }, timeoutMs: 30000, priority: 'high' },
    { id: 'r07', agentId: 'agent-research-07-user-persona-research', dependencies: ['r01', 'r04', 'r06'], retryPolicy: { maxRetries: 3, backoffMs: 1000 }, timeoutMs: 45000, priority: 'high' },
    { id: 'r08', agentId: 'agent-research-08-pain-point-analysis', dependencies: ['r07', 'r06', 'r01'], retryPolicy: { maxRetries: 3, backoffMs: 1000 }, timeoutMs: 30000, priority: 'high' },
    { id: 'r09', agentId: 'agent-research-09-existing-solution-analysis', dependencies: ['r05', 'r08', 'r06'], retryPolicy: { maxRetries: 3, backoffMs: 1000 }, timeoutMs: 45000, priority: 'high' },
    { id: 'r10', agentId: 'agent-research-10-innovation-opportunities', dependencies: ['r06', 'r09', 'r08'], retryPolicy: { maxRetries: 3, backoffMs: 1000 }, timeoutMs: 30000, priority: 'high' },
    { id: 'r11', agentId: 'agent-research-11-feature-brainstorming', dependencies: ['r10', 'r08', 'r07'], retryPolicy: { maxRetries: 3, backoffMs: 1000 }, timeoutMs: 60000, priority: 'high' },
    { id: 'r12', agentId: 'agent-research-12-business-model-suggestions', dependencies: ['r04', 'r05', 'r11', 'r10'], retryPolicy: { maxRetries: 3, backoffMs: 1000 }, timeoutMs: 45000, priority: 'medium' },
    { id: 'r13', agentId: 'agent-research-13-technology-recommendations', dependencies: ['r11', 'r10', 'r09'], retryPolicy: { maxRetries: 3, backoffMs: 1000 }, timeoutMs: 45000, priority: 'high' },
    { id: 'r14', agentId: 'agent-research-14-architecture-recommendations', dependencies: ['r13', 'r11', 'r09'], retryPolicy: { maxRetries: 3, backoffMs: 1000 }, timeoutMs: 60000, priority: 'high' },
    { id: 'r15', agentId: 'agent-research-15-risk-analysis', dependencies: ['r13', 'r14', 'r04', 'r12'], retryPolicy: { maxRetries: 3, backoffMs: 1000 }, timeoutMs: 45000, priority: 'high' },
    { id: 'r16', agentId: 'agent-research-16-security-considerations', dependencies: ['r14', 'r13', 'r15'], retryPolicy: { maxRetries: 3, backoffMs: 1000 }, timeoutMs: 45000, priority: 'high' },
    { id: 'r17', agentId: 'agent-research-17-scalability-considerations', dependencies: ['r14', 'r13', 'r15'], retryPolicy: { maxRetries: 3, backoffMs: 1000 }, timeoutMs: 45000, priority: 'medium' },
    { id: 'r18', agentId: 'agent-research-18-future-scope', dependencies: ['r10', 'r11', 'r12', 'r17', 'r16'], retryPolicy: { maxRetries: 3, backoffMs: 1000 }, timeoutMs: 60000, priority: 'medium' },
  ],
};
