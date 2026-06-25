# AgentRegistry

## Purpose

Central registry for all AI agent classes. Agents are registered by string ID and instantiated on demand by the DAG Orchestrator. This decouples agent definitions from the execution pipeline.

## Location

`src/ai-core/agents/AgentRegistry.ts`

## API

### `register(agentId, agentClass)`

```typescript
static register(
  agentId: string,
  agentClass: new (provider: AIProvider) => BaseAgent
): void
```

Registers an agent class under a unique ID. Throws if the ID is already registered.

### `get(agentId)`

```typescript
static get(agentId: string): new (provider: AIProvider) => BaseAgent
```

Retrieves a registered agent class by ID. Throws if not found.

### `listAll()`

```typescript
static listAll(): string[]
```

Returns all registered agent IDs.

## Automatic Registration

Call `registerAllAgents()` from `src/ai-core/agents/index.ts` to register all 15 agents at once:

```typescript
import { registerAllAgents } from '../agents';

registerAllAgents();
```

## Registered Agents

| ID | Agent | Output Module |
|----|-------|---------------|
| `agent-problem-analyzer` | Problem Analyzer | `problem` |
| `agent-research` | Research Analyst | `research` |
| `agent-competitor` | Competitor Analyst | `competitors` |
| `agent-innovation` | Innovation Strategist | `innovation` |
| `agent-pm` | Product Manager | `prd` |
| `agent-tech-architect` | Technical Architect | `trd` |
| `agent-db-architect` | Database Architect | `database` |
| `agent-ui-ux` | UI/UX Designer | `ui-ux` |
| `agent-backend` | Backend Architect | `backend` |
| `agent-security` | Security Architect | `security` |
| `agent-qa` | QA Engineer | `qa` |
| `agent-business-analyst` | Business Analyst | `business` |
| `agent-pitch` | Pitch Deck Creator | `pitch` |
| `agent-documentation` | Documentation & Implementation Planner | `implementation` |
| `agent-validation` | Validation & Quality Gate | `validation` |

## BaseAgent Interface

```typescript
abstract class BaseAgent {
  abstract readonly metadata: AgentMetadata;
  abstract readonly requiredContext: string[];
  abstract readonly producedOutput: string;
  abstract readonly outputSchema: ZodSchema;

  constructor(provider: AIProvider);
  abstract execute(prompt: string, systemInstruction: string): Promise<string>;
}
```

## Adding a Custom Agent

```typescript
class MyCustomAgent extends BaseAgent {
  metadata = { id: 'agent-custom', name: 'Custom', ... };
  requiredContext = ['problem', 'research'];
  producedOutput = 'custom';
  outputSchema = z.object({ ... });

  async execute(prompt: string, sys: string) {
    const response = await this.provider.generate(prompt, { systemInstruction: sys });
    return response.text;
  }
}

AgentRegistry.register('agent-custom', MyCustomAgent);
```
