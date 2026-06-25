/* eslint-disable @typescript-eslint/no-unused-vars, prefer-const */
import { ZodSchema, ZodIssue } from 'zod';
import { ValidationResult } from '../types';
import { ModuleSchemas } from '../schemas';

export interface ValidationStageResult {
  stageName: string;
  passed: boolean;
  errors: string[];
  metadata?: Record<string, unknown>;
}

export interface StageConfig {
  enabled: boolean;
  retryOnFailure: boolean;
  maxRetries: number;
}

export interface ValidationConfig {
  stages: {
    json: StageConfig;
    zod: StageConfig;
    businessRules: StageConfig;
    consistency: StageConfig;
    completeness: StageConfig;
    aiSelfReview: StageConfig;
    qualityScore: StageConfig;
  };
  minQualityScore: number;
  previousResults?: Record<string, unknown>;
  agentId?: string;
}

const DEFAULT_CONFIG: ValidationConfig = {
  stages: {
    json: { enabled: true, retryOnFailure: true, maxRetries: 2 },
    zod: { enabled: true, retryOnFailure: false, maxRetries: 1 },
    businessRules: { enabled: true, retryOnFailure: false, maxRetries: 1 },
    consistency: { enabled: true, retryOnFailure: false, maxRetries: 1 },
    completeness: { enabled: true, retryOnFailure: false, maxRetries: 1 },
    aiSelfReview: { enabled: true, retryOnFailure: false, maxRetries: 1 },
    qualityScore: { enabled: true, retryOnFailure: true, maxRetries: 2 },
  },
  minQualityScore: 6,
};

export class ValidationPipeline {
  static async run(
    rawResponse: string,
    schema: ZodSchema,
    config?: Partial<ValidationConfig>
  ): Promise<ValidationResult> {
    const resolvedConfig = this.mergeConfig(config);
    const allErrors: string[] = [];
    const stageResults: ValidationStageResult[] = [];
    let parsedData: unknown;
    let currentContent = rawResponse;

    const recordStage = (
      name: string,
      passed: boolean,
      errors: string[] = [],
      meta?: Record<string, unknown>
    ) => {
      stageResults.push({ stageName: name, passed, errors, metadata: meta });
      allErrors.push(...errors);
    };

    const executeStage = async <T>(
      name: string,
      stageCfg: StageConfig,
      fn: (content: string) => Promise<{ passed: boolean; data?: T; errors: string[]; meta?: Record<string, unknown> }>
    ): Promise<{ passed: boolean; data?: T } | null> => {
      if (!stageCfg.enabled) {
        recordStage(name, true, [], { skipped: true });
        return null;
      }

      for (let attempt = 0; attempt <= stageCfg.maxRetries; attempt++) {
        try {
          const result = await fn(currentContent);
          recordStage(name, result.passed, result.errors, result.meta);
          if (result.passed) {
            return { passed: true, data: result.data };
          }
          if (!stageCfg.retryOnFailure) break;
          if (attempt < stageCfg.maxRetries) {
            currentContent = this.applyRetryCleanup(currentContent, name);
          }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          recordStage(name, false, [`Stage ${name} threw exception: ${msg}`]);
          if (!stageCfg.retryOnFailure) break;
        }
      }
      return { passed: false };
    };

    const jsonResult = await executeStage<string>(
      'JSON Parse & Clean',
      resolvedConfig.stages.json,
      async (content) => {
        let cleaned = content.trim();
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.replace(/^```json\s*\n?/, '').replace(/\n?```$/, '');
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```\w*\s*\n?/, '').replace(/\n?```$/, '');
        }
        const parsed = JSON.parse(cleaned);
        return { passed: true, data: cleaned, errors: [], meta: { originalLength: content.length, cleanedLength: cleaned.length } };
      }
    );

    if (!jsonResult?.passed) {
      return {
        isValid: false,
        errors: allErrors,
        parsedData: undefined,
        stageResults,
      };
    }

    const zodResult = await executeStage<unknown>(
      'Zod Schema Validation',
      resolvedConfig.stages.zod,
      async (content) => {
        const cleaned = jsonResult.data!;
        const schemaData = JSON.parse(cleaned);
        const zodResult = schema.safeParse(schemaData);
        if (!zodResult.success) {
          return {
            passed: false,
            errors: zodResult.error.issues.map(
              (e: ZodIssue) =>
                `Schema Error at ${e.path.map(p => String(p)).join('.')}: ${e.message}`
            ),
          };
        }
        return { passed: true, data: zodResult.data, errors: [] };
      }
    );

    if (!zodResult?.passed) {
      return {
        isValid: false,
        errors: allErrors,
        parsedData: undefined,
        stageResults,
      };
    }

    parsedData = zodResult.data;

    const businessResult = await executeStage(
      'Business Rule Validation',
      resolvedConfig.stages.businessRules,
      async () => {
        const data = parsedData as Record<string, unknown>;
        const businessErrors: string[] = [];

        if (typeof data === 'object' && data !== null) {
          for (const [key, value] of Object.entries(data)) {
            if (key.toLowerCase().includes('score') && typeof value === 'number') {
              if (value < 0 || value > 10) {
                businessErrors.push(`Business Rule: ${key} must be between 0-10, got ${value}`);
              }
            }
            if (key.toLowerCase().includes('price') && typeof value === 'number') {
              if (value < 0) {
                businessErrors.push(`Business Rule: ${key} cannot be negative`);
              }
            }
            if (Array.isArray(value) && value.length === 0) {
              businessErrors.push(`Business Rule: ${key} is an empty array, may indicate missing data`);
            }
          }
        }

        return {
          passed: businessErrors.length === 0,
          errors: businessErrors,
          meta: { rulesChecked: ['scoreRange', 'nonNegative', 'nonEmpty'] },
        };
      }
    );

    const consistencyResult = await executeStage(
      'Consistency Validation',
      resolvedConfig.stages.consistency,
      async () => {
        const data = parsedData as Record<string, unknown>;
        const consistencyErrors: string[] = [];
        const prev = resolvedConfig.previousResults;

        if (prev) {
          if (prev.productName && data.productName && prev.productName !== data.productName) {
            consistencyErrors.push(
              `Consistency: productName changed from "${prev.productName}" to "${data.productName}"`
            );
          }
        }

        if (data.frontendStack && data.backendStack && data.frontendStack === data.backendStack) {
          consistencyErrors.push('Consistency: frontend and backend stacks should not be identical');
        }

        if (data.databaseType && data.restEndpoints && Array.isArray(data.restEndpoints)) {
          if (data.databaseType === 'relational' && data.restEndpoints.length > 100) {
            consistencyErrors.push('Consistency: 100+ endpoints unlikely for a relational DB schema');
          }
        }

        return {
          passed: consistencyErrors.length === 0,
          errors: consistencyErrors,
          meta: { crossModuleChecks: !!prev },
        };
      }
    );

    const completenessResult = await executeStage(
      'Completeness Validation',
      resolvedConfig.stages.completeness,
      async () => {
        const data = parsedData as Record<string, unknown>;
        const completenessErrors: string[] = [];

        const placeholderPatterns = [
          /todo/i, /tbd/i, /placeholder/i, /lorem ipsum/i,
          /insert.*here/i, /example\.(com|org|net)/i, /replace.*with/i,
        ];

        const checkValue = (value: unknown, path: string) => {
          if (value === null || value === undefined) {
            completenessErrors.push(`Completeness: ${path} is null or undefined`);
            return;
          }
          if (typeof value === 'string') {
            if (value.trim().length === 0) {
              completenessErrors.push(`Completeness: ${path} is empty string`);
              return;
            }
            for (const pattern of placeholderPatterns) {
              if (pattern.test(value)) {
                completenessErrors.push(`Completeness: ${path} contains placeholder text: "${value.substring(0, 50)}"`);
                break;
              }
            }
          }
          if (Array.isArray(value)) {
            if (value.length === 0) {
              completenessErrors.push(`Completeness: ${path} is an empty array`);
            }
            value.forEach((item, idx) => {
              if (typeof item === 'object' && item !== null) {
                checkValue(item, `${path}[${idx}]`);
              }
            });
          }
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            for (const [k, v] of Object.entries(value)) {
              checkValue(v, `${path}.${k}`);
            }
          }
        };

        for (const [key, value] of Object.entries(data)) {
          checkValue(value, key);
        }

        return {
          passed: completenessErrors.length === 0,
          errors: completenessErrors,
          meta: { fieldsChecked: Object.keys(data).length },
        };
      }
    );

    const reviewResult = await executeStage<Record<string, unknown>>(
      'AI Self Review',
      resolvedConfig.stages.aiSelfReview,
      async () => {
        const data = parsedData as Record<string, unknown>;
        const reviewIssues: string[] = [];

        if (Array.isArray(data.userStories) && data.userStories.length > 0) {
          const allHaveActor = data.userStories.every(
            (s: string) => /as (a|an)/i.test(s) || /i want/i.test(s)
          );
          if (!allHaveActor) {
            reviewIssues.push('Review: user stories should follow "As a... I want..." format');
          }
        }

        if (Array.isArray(data.slides)) {
          const hasTitle = data.slides.every((s: Record<string, unknown>) => s.title);
          if (!hasTitle) {
            reviewIssues.push('Review: all slides should have a title');
          }
        }

        if (data.uniqueFeatures && data.differentiators && Array.isArray(data.uniqueFeatures) && Array.isArray(data.differentiators)) {
          const diffArr = data.differentiators as string[];
          const overlap = (data.uniqueFeatures as string[]).filter((f: string) => diffArr.includes(f));
          if (overlap.length > 0) {
            reviewIssues.push(`Review: overlapping uniqueFeatures and differentiators: ${overlap.join(', ')}`);
          }
        }

        if (data.phases && Array.isArray(data.phases)) {
          const totalWeeks = data.phases.reduce((sum: number, p: Record<string, unknown>) => sum + (typeof p.estimatedWeeks === 'number' ? p.estimatedWeeks : 0), 0);
          if (totalWeeks > 52) {
            reviewIssues.push(`Review: implementation plan spans ${totalWeeks} weeks (> 1 year)`);
          }
        }

        return {
          passed: reviewIssues.length === 0,
          errors: reviewIssues,
          meta: { checksRun: ['userStoryFormat', 'slideTitles', 'featureOverlap', 'timelineScope'] },
        };
      }
    );

    const qualityResult = await executeStage<number>(
      'Quality Score',
      resolvedConfig.stages.qualityScore,
      async () => {
        const data = parsedData as Record<string, unknown>;
        let score = 10;

        for (const stage of stageResults) {
          if (!stage.passed) {
            score -= 1;
          }
        }

        if (Array.isArray(data)) {
          score = Math.max(1, score - 1);
        }

        const hasStrings = Object.values(data).some(v => typeof v === 'string' && v.length > 0);
        if (!hasStrings) score = Math.max(1, score - 2);

        const qualityErrors: string[] = [];
        if (score < resolvedConfig.minQualityScore) {
          qualityErrors.push(`Quality Score ${score} is below minimum ${resolvedConfig.minQualityScore}`);
        }

        return {
          passed: score >= resolvedConfig.minQualityScore,
          errors: qualityErrors,
          data: score,
          meta: { qualityScore: score, minScore: resolvedConfig.minQualityScore },
        };
      }
    );

    const isValid = !allErrors.some(e => !e.startsWith('Warning:'));

    return {
      isValid: stageResults.every(s => s.passed || s.metadata?.skipped),
      errors: allErrors,
      parsedData,
      stageResults,
    };
  }

  static async runWithSchemaName(
    rawResponse: string,
    schemaName: string,
    config?: Partial<ValidationConfig>
  ): Promise<ValidationResult> {
    const schema = ModuleSchemas[schemaName];
    if (!schema) {
      return {
        isValid: false,
        errors: [`No schema found for module "${schemaName}"`],
        parsedData: undefined,
      };
    }
    return this.run(rawResponse, schema, config);
  }

  private static mergeConfig(override?: Partial<ValidationConfig>): ValidationConfig {
    if (!override) return DEFAULT_CONFIG;
    return {
      stages: {
        json: { ...DEFAULT_CONFIG.stages.json, ...override.stages?.json },
        zod: { ...DEFAULT_CONFIG.stages.zod, ...override.stages?.zod },
        businessRules: { ...DEFAULT_CONFIG.stages.businessRules, ...override.stages?.businessRules },
        consistency: { ...DEFAULT_CONFIG.stages.consistency, ...override.stages?.consistency },
        completeness: { ...DEFAULT_CONFIG.stages.completeness, ...override.stages?.completeness },
        aiSelfReview: { ...DEFAULT_CONFIG.stages.aiSelfReview, ...override.stages?.aiSelfReview },
        qualityScore: { ...DEFAULT_CONFIG.stages.qualityScore, ...override.stages?.qualityScore },
      },
      minQualityScore: override.minQualityScore ?? DEFAULT_CONFIG.minQualityScore,
      previousResults: override.previousResults,
    };
  }

  private static applyRetryCleanup(content: string, stageName: string): string {
    if (stageName === 'JSON Parse & Clean') {
      const trimmed = content.trim();
      const jsonStart = trimmed.indexOf('{');
      const jsonEnd = trimmed.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        return trimmed.substring(jsonStart, jsonEnd + 1);
      }
    }
    return content;
  }
}

declare module '../types' {
  interface ValidationResult {
    stageResults?: ValidationStageResult[];
  }
}
