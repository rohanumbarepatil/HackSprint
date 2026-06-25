# Sequence Diagrams

## Full Pipeline Execution

```
User         ContextEngine        DAG Orchestrator        AgentRegistry       ProviderFactory        AI Provider
 │                  │                     │                     │                    │                    │
 │  project input   │                     │                     │                    │                    │
 ├─────────────────►│                     │                     │                    │                    │
 │                  │                     │                     │                    │                    │
 │                  │ buildContext()       │                     │                    │                    │
 │                  ├──────►─────────────►│                     │                    │                    │
 │                  │                     │                     │                    │                    │
 │                  │                     │─────────────────────────────────────────────────────────────►│
 │                  │                     │   getReadyNodes()   │                    │                    │
 │                  │                     ├──────►─────────────►│                    │                    │
 │                  │                     │                     │                    │                    │
 │                  │                     │   create('gemini')  │                    │                    │
 │                  │                     ├─────────────────────┼────────────────────►                    │
 │                  │                     │                     │                    │                    │
 │                  │                     │                     │   GeminiProvider   │                    │
 │                  │                     │                     │◄───────────────────┤                    │
 │                  │                     │                     │                    │                    │
 │                  │                     │   get('agent-xyz')  │                    │                    │
 │                  │                     ├─────────────────────►                    │                    │
 │                  │                     │                     │                    │                    │
 │                  │                     │   new Agent(prov)   │                    │                    │
 │                  │                     │◄────────────────────┤                    │                    │
 │                  │                     │                     │                    │                    │
 │   ┌─── FOR EACH READY NODE ───┐        │                     │                    │                    │
 │   │                           │        │                     │                    │                    │
 │   │                     execute(prompt, sysInstruction)       │                    │                    │
 │   │                     ├─────────────────────────────────────┼────────────────────►                   │
 │   │                     │                                     │                    │                   │
 │   │                     │                                     │                    │  generate()        │
 │   │                     │                                     │                    ├───────────────────►│
 │   │                     │                                     │                    │                    │
 │   │                     │                                     │                    │◄───────────────────┤
 │   │                     │                                     │                    │   AIResponse       │
 │   │                     │◄────────────────────────────────────┼────────────────────┤                    │
 │   │                     │                                     │                    │                    │
 │   │                     │  ValidationPipeline.run()           │                    │                    │
 │   │                     ├─────────────────────────────────────►                    │                    │
 │   │                     │                                     │                    │                    │
 │   │                     │◄─────────────────────────────────────┤                    │                    │
 │   │                     │   { isValid, parsedData }           │                    │                    │
 │   │                     │                                     │                    │                    │
 │   │                     │  emit('node-completed')             │                    │                    │
 │   │                     ├──────►─────────────►                │                    │                    │
 │   │                     │                                     │                    │                    │
 │   └─── END ────────────┘                                      │                    │                    │
 │                                                               │                    │                    │
 │                  │                results Map                  │                    │                    │
 │◄──────────────────────────────────────────────────────────────┤                    │                    │
```

## Orchestrator Event Flow (Real-Time Progress)

```
DAG Orchestrator                          Listeners (UI / Logging)
       │                                          │
       │  emit('pipeline-started')                │
       ├──────────────────────────────────────────►
       │                                          │
       │  emit('node-started', nodeId, agentId)   │
       ├──────────────────────────────────────────►
       │                                          │
       │  ┌─── ON FAILURE ──────────────────┐     │
       │  │  emit('node-retrying', attempt)  │     │
       │  ├──────────────────────────────────►     │
       │  │  emit('node-failed')             │     │
       │  ├──────────────────────────────────►     │
       │  └──────────────────────────────────┘     │
       │                                          │
       │  emit('node-completed', nodeId, output)  │
       ├──────────────────────────────────────────►
       │                                          │
       │  emit('progress', completed/total)       │
       ├──────────────────────────────────────────►
       │                                          │
       │  emit('pipeline-completed')               │
       ├──────────────────────────────────────────►
       │                                          │
```

## Retry Flow

```
Agent Execute ──► Validation ──► Failed ──► Retry (attempt+1)
                     │                           │
                     │                    exponential backoff
                     │                     (backoffMs * attempt)
                     │                           │
                     ├── maxRetries reached? ────┤
                     │                           │
                     │ Yes                       │ No
                     ▼                           ▼
               Pipeline Fatal               Retry Execute
```

## Cache Flow

```
executePipeline(projectId, instruction)
       │
       │  generateCacheKey(workflowId, projectId, nodeId, hash)
       │
       ├── cache hit? ──► emit('node-cached') ──► return cached output
       │
       └── cache miss ──► execute agent ──► store in cache ──► return output
                              │
                         LRU eviction if cache full
```

## Parallel Execution (Independent Nodes)

```
Timeline:
T0:  node-A starts     node-B starts
     (deps: [])        (deps: [])
T1:  node-A running    node-B running
T2:  node-A completes  node-B running
T3:                     node-B completes
T4:  emit progress 2/2
```

## Sequential Execution (Chained Nodes)

```
Timeline:
T0:  node-A starts
     (deps: [])
T1:  node-A completes
T2:  node-B starts
     (deps: [node-A])
T3:  node-B completes
T4:  emit progress 2/2
```
