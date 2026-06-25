import { ModuleSchemas } from '../schemas';
import { ValidationPipeline } from '../validator/ValidationPipeline';

export interface ResearchValidationResult {
  stageId: string;
  passed: boolean;
  completenessScore: number;
  consistencyScore: number;
  duplicateIssues: string[];
  hallucinationIssues: string[];
  confidenceScore: number;
  errors: string[];
}

interface ParsedOutput {
  [key: string]: unknown;
}

export class ResearchValidator {
  static async validateStage(
    stageId: string,
    rawContent: string,
    previousOutputs: Map<string, string>,
    schemaName?: string
  ): Promise<ResearchValidationResult> {
    const completenessScore = this.checkCompleteness(rawContent);
    const consistencyScore = this.checkConsistency(rawContent, previousOutputs);
    const duplicateIssues = this.detectDuplicates(rawContent, previousOutputs);
    const hallucinationIssues = this.detectHallucinations(rawContent, stageId);
    const confidenceScore = this.computeConfidence(
      completenessScore,
      consistencyScore,
      duplicateIssues,
      hallucinationIssues
    );

    const errors: string[] = [];
    if (completenessScore < 0.5) errors.push(`Completeness score ${completenessScore} below threshold`);
    if (consistencyScore < 0.5) errors.push(`Consistency score ${consistencyScore} below threshold`);
    if (duplicateIssues.length > 0) errors.push(`Duplicate issues: ${duplicateIssues.length}`);
    if (hallucinationIssues.length > 0) errors.push(`Hallucination issues: ${hallucinationIssues.length}`);

    let schemaValidationErrors: string[] = [];
    if (schemaName && ModuleSchemas[schemaName]) {
      try {
        const schemaResult = await ValidationPipeline.runWithSchemaName(rawContent, schemaName);
        if (!schemaResult.isValid) {
          schemaValidationErrors = schemaResult.errors;
          errors.push(...schemaResult.errors.map(e => `Schema: ${e}`));
        }
      } catch {
        errors.push('Schema validation threw unexpectedly');
      }
    }

    const passed =
      completenessScore >= 0.5 &&
      consistencyScore >= 0.5 &&
      duplicateIssues.length === 0 &&
      hallucinationIssues.length <= 1 &&
      schemaValidationErrors.length === 0;

    return {
      stageId,
      passed,
      completenessScore,
      consistencyScore,
      duplicateIssues,
      hallucinationIssues,
      confidenceScore,
      errors,
    };
  }

  private static checkCompleteness(rawContent: string): number {
    if (!rawContent || rawContent.trim().length === 0) return 0;

    let score = 1;

    const trimmed = rawContent.trim();
    if (trimmed.length < 50) score -= 0.3;
    if (trimmed.length < 20) score -= 0.4;

    const placeholderCount = (trimmed.match(
      /todo|tbd|placeholder|lorem ipsum|insert.*here|example\.(com|org|net)|replace.*with/gi
    ) || []).length;
    score -= placeholderCount * 0.15;

    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) score -= 0.2;

    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'object' && parsed !== null) {
        const keys = Object.keys(parsed);
        if (keys.length === 0) score -= 0.5;
        const emptyValues = keys.filter(k => {
          const v = parsed[k];
          return v === null || v === undefined || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);
        });
        score -= (emptyValues.length / keys.length) * 0.5;
      }
    } catch {
      score -= 0.3;
    }

    return Math.max(0, Math.min(1, score));
  }

  private static checkConsistency(
    rawContent: string,
    previousOutputs: Map<string, string>
  ): number {
    if (previousOutputs.size === 0) return 1;

    let score = 1;
    let checksRun = 0;

    try {
      const currentParsed: ParsedOutput = JSON.parse(rawContent.trim());
      const currentEntries = Object.entries(currentParsed);

      for (const prevContent of previousOutputs.values()) {
        try {
          const prevParsed: ParsedOutput = JSON.parse(prevContent);
          const sharedKeys = currentEntries.filter(([k]) => k in prevParsed);

          for (const [key, currentVal] of sharedKeys) {
            checksRun++;
            const prevVal = prevParsed[key];
            if (typeof currentVal === 'string' && typeof prevVal === 'string') {
              const currentLower = currentVal.toLowerCase().trim();
              const prevLower = prevVal.toLowerCase().trim();
              if (
                currentLower !== prevLower &&
                currentLower.includes(prevLower) === false &&
                prevLower.includes(currentLower) === false
              ) {
                score -= 0.1;
              }
            }
            if (
              Array.isArray(currentVal) &&
              Array.isArray(prevVal) &&
              currentVal.length > 0 &&
              prevVal.length > 0
            ) {
              const overlap = currentVal.filter((v: string) =>
                prevVal.includes(v)
              );
              if (overlap.length === 0) score -= 0.1;
            }
          }
        } catch {
          continue;
        }
      }
    } catch {
      score -= 0.3;
    }

    if (checksRun === 0) score -= 0.1;

    return Math.max(0, Math.min(1, score));
  }

  private static detectDuplicates(
    rawContent: string,
    previousOutputs: Map<string, string>
  ): string[] {
    const issues: string[] = [];

    try {
      const currentParsed: ParsedOutput = JSON.parse(rawContent.trim());
      const currentStr = JSON.stringify(currentParsed);

      const seenValues = new Map<string, string[]>();
      for (const [key, value] of Object.entries(currentParsed)) {
        const strVal = JSON.stringify(value);
        if (!seenValues.has(strVal)) seenValues.set(strVal, []);
        seenValues.get(strVal)!.push(key);
      }

      for (const [val, keys] of seenValues.entries()) {
        if (keys.length > 1 && val !== '[]' && val !== '""' && val !== 'null' && val !== '{}') {
          issues.push(`Duplicate value "${val.substring(0, 50)}" across keys: ${keys.join(', ')}`);
        }
      }

      for (const prevContent of previousOutputs.values()) {
        try {
          const prev = JSON.parse(prevContent);
          const prevStr = JSON.stringify(prev);
          if (currentStr === prevStr) {
            issues.push('Stage output is identical to a previous stage output');
            break;
          }
        } catch {
          continue;
        }
      }
    } catch {
      issues.push('Could not parse stage output for duplicate detection');
    }

    return issues;
  }

  private static detectHallucinations(
    rawContent: string,
    stageId: string
  ): string[] {
    const issues: string[] = [];

    try {
      const parsed: ParsedOutput = JSON.parse(rawContent.trim());

      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === 'number') {
          if (key.toLowerCase().includes('score') || key.toLowerCase().includes('rating')) {
            if (value < 0 || value > 100) {
              issues.push(`Suspicious ${key}=${value} (unnatural range for score)`);
            }
          }
        }

        if (typeof value === 'string') {
          const lower = value.toLowerCase();
          if (
            /^[\d,]+%$/.test(value) &&
            (parseInt(value.replace(/[,%]/g, '')) > 100 ||
              parseInt(value.replace(/[,%]/g, '')) < 0)
          ) {
            issues.push(`Suspicious percentage value "${value}" in field "${key}"`);
          }

          const numberClaims = lower.match(/\$\d+[kmb]/g);
          if (numberClaims && numberClaims.length > 3) {
            issues.push(`Multiple monetary claims (${numberClaims.length}) in "${key}" may indicate hallucination`);
          }

          if (/trillions?/.test(lower) && stageId !== 'node-research') {
            issues.push(`Claim of "trillion" in "${key}" outside research stage`);
          }
        }

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const nested: Record<string, unknown> = value as Record<string, unknown>;
          for (const [nk, nv] of Object.entries(nested)) {
            if (typeof nv === 'number' && nk.toLowerCase().includes('score')) {
              if (nv < 0 || nv > 100) {
                issues.push(`Suspicious nested ${nk}=${nv} in "${key}" (unnatural range)`);
              }
            }
          }
        }

        if (Array.isArray(value) && value.length > 0) {
          const allSame = value.every((v: unknown) =>
            typeof v === 'string' && v === value[0]
          );
          if (allSame && value.length > 2) {
            issues.push(`All ${value.length} items in "${key}" are identical`);
          }

          const itemScores = value
            .filter((v: unknown): v is Record<string, unknown> =>
              typeof v === 'object' && v !== null && 'score' in v
            )
            .map((v: Record<string, unknown>) => v.score);
          if (itemScores.length > 0 && itemScores.every((s: unknown) => s === itemScores[0])) {
            issues.push(`All scores in "${key}" array are identical`);
          }
        }
      }
    } catch {
      return ['Could not parse stage output for hallucination detection'];
    }

    return issues;
  }

  private static computeConfidence(
    completenessScore: number,
    consistencyScore: number,
    duplicateIssues: string[],
    hallucinationIssues: string[]
  ): number {
    let confidence = (completenessScore + consistencyScore) / 2;
    confidence -= duplicateIssues.length * 0.1;
    confidence -= hallucinationIssues.length * 0.15;
    return Math.max(0, Math.min(1, confidence));
  }
}
