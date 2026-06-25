# PromptRegistry

## Purpose

Manages versioned prompt templates with variable hydration. Enables prompt engineering without code changes — update prompts in Firestore and they take effect immediately.

## Location

`src/ai-core/registry/PromptRegistry.ts`

## API

### `hydrate(templateId, variables)`

```typescript
static hydrate(
  templateId: string,
  variables: Record<string, string>
): string
```

Replaces `{{variable}}` placeholders in the template with provided values. Throws if any required variable is missing.

### `registerLocal(version)`

```typescript
static registerLocal(version: PromptVersion): void
```

Registers a prompt version in-memory. In production, prompts would be fetched from Firestore.

## Types

```typescript
interface PromptVersion {
  id: string;
  promptId: string;
  versionNumber: string;  // e.g. "v1.0"
  content: string;        // Raw text with {{variables}}
  variables: string[];    // e.g. ["project_name", "constraints"]
  status: 'draft' | 'published' | 'deprecated';
  createdAt: number;
}

interface PromptMetadata {
  id: string;
  name: string;
  category: string;
  description: string;
  currentVersion: string;
}
```

## Usage

```typescript
// Register a prompt template
PromptRegistry.registerLocal({
  id: 'problem-analysis-v1',
  promptId: 'problem-analysis',
  versionNumber: 'v1.0',
  content: `Analyze this project: {{project_name}}
Constraints: {{constraints}}
Provide: core problem, target audience, value proposition.`,
  variables: ['project_name', 'constraints'],
  status: 'published',
  createdAt: Date.now(),
});

// Hydrate with variables
const prompt = PromptRegistry.hydrate('problem-analysis-v1', {
  project_name: 'MyApp',
  constraints: 'budget < $10k, 3-month timeline',
});
```

## Versioning Strategy

- Each prompt has a `promptId` (stable identifier) and `versionNumber` (incremented on changes)
- The registry supports `draft` → `published` → `deprecated` lifecycle
- In production, `currentVersion` on `PromptMetadata` points to the active `PromptVersion.id`
