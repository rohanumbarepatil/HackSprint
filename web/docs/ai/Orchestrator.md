# DAG Orchestrator

## Purpose

Executes the multi-agent pipeline as a directed acyclic graph (DAG). Handles dependency resolution, parallel execution, retry logic, caching, progress events, and execution history.

## Location

`src/ai-core/orchestrator/DAGOrchestrator.ts`

## API

### Constructor

```typescript
new DAGOrchestrator(
  workflow: WorkflowDefinition,
  providerName?: AIProviderName,
  maxCacheSize?: number
)
```

### executePipeline

```typescript
async executePipeline(
  projectId: string,
  systemInstruction: string,
  useCache?: boolean
): Promise<Map<string, string>>
```

Executes all nodes in dependency order. Returns a Map of nodeId → output JSON string.

## Features

### Dependency Resolution

The orchestrator identifies **ready nodes** — nodes whose dependencies are all completed. Independent nodes execute in parallel.

```typescript
private getReadyNodes(completedNodeIds, runningNodeIds): WorkflowNode[]
```

### Parallel Execution

Nodes with no interdependencies run concurrently via `Promise.race`. The orchestrator loops until all nodes complete or an error occurs.

### Retry with Backoff

Each node has a configurable retry policy:
```typescript
retryPolicy: {
  maxRetries: number;  // Maximum retry attempts
  backoffMs: number;   // Base backoff (multiplied by attempt count)
}
```

### Cache Layer

In-memory cache with TTL and LRU eviction:
- **Cache Key**: `workflowId:projectId:nodeId:systemHash`
- **TTL**: 5 minutes by default
- **Eviction**: LRU when cache exceeds `maxCacheSize`
- **Bypass**: Set `useCache = false` to skip caching

```typescript
clearCache(): void
getCacheSize(): number
```

### Progress Events

EventEmitter-style callback system:

```typescript
orchestrator.on((event: OrchestratorEvent) => {
  // event.type: 'node-started' | 'node-completed' | 'node-failed'
  //             'node-retrying' | 'node-cached' | 'pipeline-started'
  //             'pipeline-completed' | 'pipeline-failed' | 'progress'
  // event.nodeId, event.agentId, event.message, event.timestamp
});

// Unsubscribe
const cleanup = orchestrator.on(callback);
cleanup();

// or
orchestrator.off(callback);
```

### Execution History

Full audit trail of every pipeline run:

```typescript
getHistory(): ExecutionRecord[]
getLastExecution(): ExecutionRecord | undefined
// Each record contains: workflowId, projectId, startedAt, completedAt,
// status, error?, and per-node results with timing/latency
```

## WorkflowDefinition

```typescript
interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
}

interface WorkflowNode {
  id: string;
  agentId: string;
  dependencies: string[];
  retryPolicy: { maxRetries: number; backoffMs: number };
  timeoutMs: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  outputSchema?: ZodSchema;
}
```

## Default Workflow

`HackSprintDefaultWorkflow` contains 15 nodes forming a complete generation pipeline:

```
discovery:   problem → research → competitor → innovation
planning:    pm, business (parallel after innovation)
architecture: tech-architect → db-architect → backend, ui-ux
quality:     security, qa, documentation, pitch
validation:  validation (depends on all 14)
```
