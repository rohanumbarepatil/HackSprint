# Firestore Schema

Firestore collections used by the HackSprint AI Core for persistence, analytics, and audit.

## Collections

### projects
Document containing project metadata and configuration.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Auto-generated document ID |
| name | string | Project name |
| description | string | Project description |
| workspaceId | string | Parent workspace reference |
| ownerId | string | User who owns the project |
| status | string | `draft`, `active`, or `archived` |
| templateId | string? | Template used to create project |
| tags | string[] | Categorization tags |
| createdAt | number | Unix timestamp |
| updatedAt | number | Unix timestamp |

### documents
Stores generated content per module per project.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Auto-generated document ID |
| projectId | string | Parent project reference |
| moduleId | string | Module identifier (e.g. `prd`, `trd`, `research`) |
| content | string | Generated document content |
| version | number | Document version number |
| schemaVersion | string | Schema version used for generation |
| createdBy | string | Agent that created the document |
| createdAt | number | Unix timestamp |
| updatedAt | number | Unix timestamp |

### contexts
Stores assembled context snapshots for traceability.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Auto-generated document ID |
| projectId | string | Parent project reference |
| workflowId | string | Workflow that produced this context |
| contextHash | string | SHA-256 hash of assembled context |
| assembledContext | string | Full assembled system instruction |
| versionId | string | Context version identifier |
| nodeResults | map | Node ID to output mapping |
| createdAt | number | Unix timestamp |

### generations
Complete record of every AI generation.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Auto-generated document ID |
| projectId | string | Parent project reference |
| agentId | string | Agent that generated the output |
| moduleId | string | Target module |
| provider | string | AI provider used (`gemini`, `mock`) |
| model | string | Model name |
| prompt | string | Prompt sent to provider |
| output | string | Generated output |
| contextHash | string | Context snapshot hash |
| promptVersionId | string? | Prompt version used |
| latencyMs | number | Generation latency |
| tokens | object | `{ inputTokens, outputTokens, totalTokens, estimatedCost? }` |
| retryCount | number | Number of retry attempts |
| validationScore | number? | Quality validation score |
| validationPassed | boolean | Whether validation passed |
| success | boolean | Whether generation succeeded |
| errorMessage | string? | Error message if failed |
| createdAt | number | Unix timestamp |

### prompts
Prompt template metadata.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Auto-generated document ID |
| name | string | Prompt name |
| category | string | `system`, `agent`, `validation`, `research`, `analysis`, `generation`, `review` |
| description | string | Prompt description |
| tags | string[] | Categorization tags |
| currentVersionId | string | Active published version ID |
| createdBy | string | Creator reference |
| createdAt | number | Unix timestamp |
| updatedAt | number | Unix timestamp |

### promptVersions
Versioned prompt content with changelog tracking.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Auto-generated document ID |
| promptId | string | Parent prompt reference |
| versionNumber | string | Semantic version string |
| content | string | Prompt template content |
| variables | string[] | Template variables |
| status | string | `draft`, `published`, or `deprecated` |
| changelog | string | Version change description |
| createdAt | number | Unix timestamp |
| publishedAt | number? | Publication timestamp |

### analytics
Per-generation analytics records for cost tracking and performance monitoring.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Auto-generated document ID |
| projectId | string | Parent project reference |
| agentId | string | Agent identifier |
| provider | string | AI provider |
| model | string | Model name |
| latencyMs | number | Generation latency in milliseconds |
| tokens | object | `{ inputTokens, outputTokens, totalTokens, estimatedCost }` |
| retryCount | number | Number of retries |
| validationScore | number | Quality validation score (0-10) |
| status | string | `success`, `failed`, or `retried` |
| timestamp | number | Unix timestamp |

### events
Streaming and orchestration events for real-time UI updates.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Auto-generated document ID |
| projectId | string | Parent project reference |
| workflowId | string? | Workflow identifier |
| nodeId | string? | Node identifier |
| agentId | string? | Agent identifier |
| type | string | Event type (e.g. `pipeline-started`, `node-completed`) |
| message | string | Human-readable message |
| metadata | map? | Additional event metadata |
| timestamp | number | Unix timestamp |

### validationReports
Detailed validation results for each generation.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Auto-generated document ID |
| generationId | string | Reference to the generation record |
| projectId | string | Parent project reference |
| agentId | string | Agent identifier |
| schemaName | string | Schema name used for validation |
| isValid | boolean | Overall validation result |
| errors | string[] | Validation error messages |
| stageResults | array | Per-stage validation results |
| qualityScore | number | Quality score (0-10) |
| timestamp | number | Unix timestamp |

### tokenUsage
Daily aggregated token usage for billing and monitoring.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Auto-generated document ID |
| projectId | string | Parent project reference |
| date | string | ISO date string (YYYY-MM-DD) |
| provider | string | AI provider |
| model | string | Model name |
| inputTokens | number | Daily input token count |
| outputTokens | number | Daily output token count |
| totalTokens | number | Daily total token count |
| estimatedCost | number | Estimated cost in USD |
| generationCount | number | Number of generations |

### auditLogs
Audit trail for user and system actions.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Auto-generated document ID |
| userId | string | User who performed the action |
| projectId | string | Project reference |
| action | string | Action performed |
| resource | string | Resource acted upon |
| details | map | Additional context |
| ipAddress | string? | Request IP address |
| userAgent | string? | Client user agent |
| timestamp | number | Unix timestamp |
