# Validation Engine

## Purpose

Ensures every AI-generated output is valid, consistent, and complete before being passed to downstream agents. Implements a strict 6-stage validation pipeline.

## Location

`src/ai-core/validator/ValidationPipeline.ts`

## 6-Stage Validation Pipeline

### Stage 1: JSON Parse Validation
Cleans the raw response (removes markdown code blocks) and parses as JSON. Rejects malformed output immediately.

### Stage 2: Strict Zod Schema Validation
Validates the parsed JSON against the agent's output schema using Zod's `safeParse`. Generates detailed error messages for each schema violation.

### Stage 3: Business Rule Validation (Stub)
Placeholder for business-specific rules (e.g., PRD must not contradict the problem statement).

### Stage 4: Consistency Validation (Stub)
Placeholder for cross-module consistency checks (e.g., database schema must match API endpoints).

### Stage 5: Completeness Validation (Stub)
Placeholder for checking empty fields, placeholder text, or generic "TODO" values.

### Stage 6: Quality Score (Stub)
Placeholder for a lightweight AI call that scores output quality on a 1-10 scale.

## API

```typescript
static async run(
  rawResponse: string,
  schema: ZodSchema
): Promise<ValidationResult>
```

**Returns:**
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  parsedData?: unknown;  // Present only when validation passes
}
```

## Schema Examples

```typescript
const ProblemAnalyzerSchema = z.object({
  coreProblem: z.string(),
  targetAudience: z.array(z.string()),
  valueProposition: z.string(),
});

const PRDSchema = z.object({
  productName: z.string(),
  userPersonas: z.array(z.string()),
  userStories: z.array(z.string()),
  mvpFeatures: z.array(z.string()),
  futureFeatures: z.array(z.string()),
});
```

## Integration

Validation is called automatically by the DAG Orchestrator after each agent execution. If validation fails, the node retries (up to `maxRetries`) with exponential backoff.

```
Agent Execute → Raw Text → JSON Clean → Zod Validate → Parsed Data
                                ↓
                          Retry on Failure
```

## Adding a Validation Rule

Extend the ValidationPipeline class with additional stages:

```typescript
// Stage 3 example
const businessRules = BusinessRuleEngine.validate(parsedData, projectConstraints);
if (!businessRules.passed) {
  errors.push(...businessRules.errors);
}
```
