# ProviderFactory

## Purpose

Central factory for creating AI provider instances. Ensures that no component in the system directly instantiates AI providers, maintaining a clean abstraction layer.

## Location

`src/ai-core/providers/ProviderFactory.ts`

## API

### `create(providerName, options?)`

```typescript
static create(
  providerName: AIProviderName,
  options?: Record<string, unknown>
): AIProvider
```

**Parameters:**
- `providerName`: One of `'gemini'`, `'mock'`, `'openai'`, `'anthropic'`
- `options`: Optional configuration passed to the provider constructor

**Returns:** An `AIProvider` instance

**Throws:**
- If API key is missing for Gemini provider
- If provider is not yet implemented (openai, anthropic)

## Supported Providers

| Name | Status | Notes |
|------|--------|-------|
| `gemini` | ✅ Active | Uses `@google/genai`, requires `NEXT_PUBLIC_FIREBASE_API_KEY` or `GEMINI_API_KEY` |
| `mock` | ✅ Active | Simulates AI responses for testing, supports `simulateLatency` and `shouldFail` options |
| `openai` | 🔄 Planned | Not yet implemented |
| `anthropic` | 🔄 Planned | Not yet implemented |

## AIProvider Interface

```typescript
interface AIProvider {
  generate(prompt: string, options?: GenerationOptions): Promise<AIResponse>
  stream(prompt: string, options?: GenerationOptions): AsyncGenerator<AIStreamEvent>
  validate(response: string, schema: ZodSchema): Promise<ValidationResult>
  countTokens(text: string): Promise<number>
  healthCheck(): Promise<HealthStatus>
}
```

## Usage

```typescript
// Always use ProviderFactory — never instantiate providers directly
const provider = ProviderFactory.create('gemini', {
  model: 'gemini-2.0-flash',
  temperature: 0.3,
});

const response = await provider.generate('Your prompt here', {
  systemInstruction: 'You are an AI architect...',
});
```

## Adding a New Provider

1. Implement the `AIProvider` interface
2. Import the class in `ProviderFactory.ts`
3. Add a new case in the `switch` statement
