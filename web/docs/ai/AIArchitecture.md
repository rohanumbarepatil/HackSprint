# AI Architecture

## Overview

HackSprint AI uses a **multi-agent DAG-based architecture** to autonomously generate complete platform specifications. The system consists of 15 specialized AI agents orchestrated through a directed acyclic graph (DAG) pipeline. Each agent produces a structured output that feeds into downstream agents.

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    Provider Layer                         │
│  GeminiProvider │ MockProvider │ OpenAI │ Anthropic       │
│                    ProviderFactory                        │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│                   DAG Orchestrator                        │
│  Dependency Resolution │ Parallel Execution │ Retry       │
│  Progress Events │ Cache │ Execution History              │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│                Agent Registry                             │
│  15 Specialized Agents registered by ID                   │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│              Context Engine & Memory                      │
│  Short-term │ Long-term │ Document │ RAG                  │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│              Validation Pipeline                          │
│  6-Stage Validation │ Zod Schema │ Business Rules         │
└──────────────────────────────────────────────────────────┘
```

## Execution Flow

1. **User Input** → Project description and constraints
2. **Context Engine** → Assembles system instruction from project memory
3. **DAG Orchestrator** → Resolves dependency graph and executes agents
4. **Agents** → Each produces structured JSON output
5. **Validation** → Each output validated against Zod schema
6. **Result** → Complete platform specification with 15 modules

## Key Principles

- **Provider Abstraction**: All AI calls go through `ProviderFactory` — no direct API calls
- **Schema-Driven**: Every agent output is validated against a Zod schema
- **Deterministic DAG**: Agents execute in dependency order with parallelization where possible
- **Reproducible**: Context versioning ensures traceability
- **Pluggable**: New agents can be registered without modifying the orchestrator
