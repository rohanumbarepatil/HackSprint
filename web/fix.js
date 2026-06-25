/* eslint-disable */
const fs = require('fs');

function replaceFile(path, replacements) {
  let content = fs.readFileSync(path, 'utf8');
  for (const [search, replace] of replacements) {
    content = content.split(search).join(replace);
  }
  fs.writeFileSync(path, content);
}

replaceFile('src/ai-core/memory/index.ts', [
  ['activeVariables: Record<string, any>;', 'activeVariables: Record<string, unknown>;'],
  ['persist(key: string, value: any): Promise<void>;', 'persist(key: string, value: unknown): Promise<void>;'],
  ['retrieve(key: string): Promise<any>;', 'retrieve(key: string): Promise<unknown>;'],
  ['preferences: Record<string, any>;', 'preferences: Record<string, unknown>;'],
  ['embedAndStore(text: string, metadata?: any): Promise<string>;', 'embedAndStore(text: string, metadata?: unknown): Promise<string>;']
]);

replaceFile('src/ai-core/orchestrator/DAGOrchestrator.ts', [
  ['catch (e: any)', 'catch (e: unknown)']
]);

replaceFile('src/ai-core/providers/GeminiProvider.ts', [
  ["import { ZodSchema } from 'zod';", "import { ZodSchema, ZodIssue } from 'zod';"],
  ['catch (error: any)', 'catch (error: unknown)'],
  ['errors: validated.error.errors.map(e => `${e.path.join(\'.\')}: ${e.message}`)', 'errors: validated.error.issues.map((issue: ZodIssue) => `${issue.path.join(\'.\')}: ${issue.message}`)']
]);

replaceFile('src/ai-core/providers/MockProvider.ts', [
  ["import { ZodSchema } from 'zod';", "import { ZodSchema, ZodIssue } from 'zod';"],
  ['async generate(prompt: string, options?: GenerationOptions): Promise<AIResponse> {', 'async generate(_prompt: string, options?: GenerationOptions): Promise<AIResponse> {'],
  ['catch (e) {', 'catch (_e) {'],
  ['errors: validated.error.errors.map(e => `${e.path.join(\'.\')}: ${e.message}`)', 'errors: validated.error.issues.map((issue: ZodIssue) => `${issue.path.join(\'.\')}: ${issue.message}`)']
]);

replaceFile('src/ai-core/validator/ValidationPipeline.ts', [
  ["import { ZodSchema } from 'zod';", "import { ZodSchema, ZodIssue } from 'zod';"],
  ['errors: validated.error.errors.map(e => `Schema Error at ${e.path.join(\'.\')}: ${e.message}`)', 'errors: validated.error.issues.map((issue: ZodIssue) => `Schema Error at ${issue.path.join(\'.\')}: ${issue.message}`)']
]);
