# ContextEngine

## Purpose

Assembles the complete context (system instruction) passed to every AI agent. Guarantees that each request receives the exact same fundamental project state, ensuring reproducibility and consistency across agent outputs.

## Location

`src/ai-core/context/ContextEngine.ts`

## API

### `buildContext(projectMemory, documentMemory, requiredUpstreamModules)`

```typescript
static async buildContext(
  projectMemory: ProjectMemory,
  documentMemory: DocumentMemory,
  requiredUpstreamModules: string[]
): Promise<AssembledContext>
```

**Parameters:**
- `projectMemory`: Project-level context (problem statement, constraints, technologies)
- `documentMemory`: Document storage for fetching upstream module outputs
- `requiredUpstreamModules`: List of module IDs this agent depends on

**Returns:**
```typescript
interface AssembledContext {
  systemInstruction: string;  // Complete prompt for the AI
  projectContext: string;     // Project details section
  upstreamDocuments: string;  // Previous module outputs
  version: ContextVersion;    // Reproducibility metadata
}
```

## Context Structure

```
┌─────────────────────────────────────────┐
│           SYSTEM INSTRUCTION             │
│                                         │
│  "You are HackSprint AI, an expert...   │
│                                         │
│  --- PROJECT CONTEXT ---                │
│  PROBLEM STATEMENT:                     │
│  [project.problemStatement]             │
│                                         │
│  CONSTRAINTS:                           │
│  [project.constraints]                  │
│                                         │
│  TECHNOLOGIES:                          │
│  [project.technologies]                 │
│                                         │
│  --- UPSTREAM MODULES ---               │
│  [previous module outputs]              │
└─────────────────────────────────────────┘
```

## Memory Interfaces

```typescript
interface ProjectMemory {
  problemStatement: string;
  constraints: string[];
  preferences: Record<string, unknown>;
  technologies: string[];
}

interface DocumentMemory {
  fetchDocument(moduleId: string): Promise<string | null>;
  saveDocument(moduleId: string, content: string): Promise<void>;
}
```

## Usage

```typescript
const context = await ContextEngine.buildContext(
  projectMemory,
  documentMemory,
  ['problem', 'research', 'competitors']
);

// Pass to orchestrator
const results = await orchestrator.executePipeline(
  projectId,
  context.systemInstruction
);
```

## Versioning

Each assembled context includes a version hash for reproducibility:
- Hash is derived from the full system instruction text
- Format: `ctx_{timestamp}_{hash}`
- Enables auditing of which context version produced each output
