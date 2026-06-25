export type PromptStatus = 'draft' | 'published' | 'deprecated';
export type PromptCategory =
  | 'system'
  | 'agent'
  | 'validation'
  | 'research'
  | 'analysis'
  | 'generation'
  | 'review';

export interface PromptVersion {
  id: string;
  promptId: string;
  versionNumber: string;
  content: string;
  variables: string[];
  status: PromptStatus;
  createdAt: number;
  publishedAt?: number;
  changelog: string;
  validator?: (content: string) => boolean;
}

export interface PromptMetadata {
  id: string;
  name: string;
  category: PromptCategory;
  description: string;
  tags: string[];
  currentVersionId: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface PromptRecord {
  metadata: PromptMetadata;
  versions: PromptVersion[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export class PromptRegistry {
  private static prompts: Map<string, PromptRecord> = new Map();
  private static MAX_ROLLBACK_VERSIONS = 10;

  static register(
    metadata: Omit<PromptMetadata, 'currentVersionId' | 'createdAt' | 'updatedAt'>,
    initialContent: string,
    options?: {
      versionNumber?: string;
      variables?: string[];
      changelog?: string;
      status?: PromptStatus;
      tags?: string[];
      validator?: (content: string) => boolean;
    }
  ): PromptRecord {
    if (this.prompts.has(metadata.id)) {
      throw new Error(`Prompt ${metadata.id} is already registered.`);
    }

    const extractedVariables = options?.variables ?? this.extractVariables(initialContent);
    const now = Date.now();
    const versionId = `${metadata.id}_v${options?.versionNumber ?? '1.0'}`;

    const version: PromptVersion = {
      id: versionId,
      promptId: metadata.id,
      versionNumber: options?.versionNumber ?? '1.0',
      content: initialContent,
      variables: extractedVariables,
      status: options?.status ?? 'draft',
      createdAt: now,
      changelog: options?.changelog ?? 'Initial version',
      validator: options?.validator,
    };

    const record: PromptRecord = {
      metadata: {
        ...metadata,
        tags: options?.tags ?? [],
        currentVersionId: versionId,
        createdAt: now,
        updatedAt: now,
      },
      versions: [version],
    };

    this.prompts.set(metadata.id, record);
    return record;
  }

  static createVersion(
    promptId: string,
    content: string,
    options?: {
      versionNumber?: string;
      variables?: string[];
      changelog?: string;
      status?: PromptStatus;
      validator?: (content: string) => boolean;
    }
  ): PromptVersion {
    const record = this.prompts.get(promptId);
    if (!record) {
      throw new Error(`Prompt ${promptId} not found in registry.`);
    }

    const latestVersion = record.versions[record.versions.length - 1];
    const nextMinor = parseInt(latestVersion.versionNumber.split('.')[1] ?? '0') + 1;
    const majorVersion = latestVersion.versionNumber.split('.')[0];
    const versionNumber = options?.versionNumber ?? `${majorVersion}.${nextMinor}`;
    const now = Date.now();
    const versionId = `${promptId}_v${versionNumber}`;

    if (record.versions.some(v => v.id === versionId)) {
      throw new Error(`Version ${versionNumber} already exists for prompt ${promptId}.`);
    }

    const extractedVariables = options?.variables ?? this.extractVariables(content);

    const version: PromptVersion = {
      id: versionId,
      promptId,
      versionNumber,
      content,
      variables: extractedVariables,
      status: options?.status ?? 'draft',
      createdAt: now,
      changelog: options?.changelog ?? '',
      validator: options?.validator,
    };

    record.versions.push(version);

    if (record.versions.length > this.MAX_ROLLBACK_VERSIONS) {
      record.versions = record.versions.slice(-this.MAX_ROLLBACK_VERSIONS);
    }

    if (version.status === 'published') {
      record.metadata.currentVersionId = versionId;
      version.publishedAt = now;
    }

    record.metadata.updatedAt = now;
    return version;
  }

  static publish(promptId: string, versionId?: string): PromptVersion {
    const record = this.prompts.get(promptId);
    if (!record) {
      throw new Error(`Prompt ${promptId} not found in registry.`);
    }

    const targetVersion = versionId
      ? record.versions.find(v => v.id === versionId)
      : record.versions[record.versions.length - 1];

    if (!targetVersion) {
      throw new Error(`Version ${versionId} not found for prompt ${promptId}.`);
    }

    if (targetVersion.validator && !targetVersion.validator(targetVersion.content)) {
      throw new Error(`Version ${targetVersion.versionNumber} failed validation check.`);
    }

    targetVersion.status = 'published';
    targetVersion.publishedAt = Date.now();
    record.metadata.currentVersionId = targetVersion.id;
    record.metadata.updatedAt = Date.now();
    return targetVersion;
  }

  static deprecate(promptId: string): PromptVersion {
    const record = this.prompts.get(promptId);
    if (!record) {
      throw new Error(`Prompt ${promptId} not found in registry.`);
    }

    const current = record.versions.find(v => v.id === record.metadata.currentVersionId);
    if (current) {
      current.status = 'deprecated';
    }

    const latest = record.versions[record.versions.length - 1];
    if (latest && latest.id !== record.metadata.currentVersionId) {
      latest.status = 'published';
      latest.publishedAt = Date.now();
      record.metadata.currentVersionId = latest.id;
    }

    record.metadata.updatedAt = Date.now();
    return current ?? latest;
  }

  static rollback(promptId: string, versionNumber: string): PromptVersion {
    const record = this.prompts.get(promptId);
    if (!record) {
      throw new Error(`Prompt ${promptId} not found in registry.`);
    }

    const target = record.versions.find(v => v.versionNumber === versionNumber);
    if (!target) {
      throw new Error(`Version ${versionNumber} not found for prompt ${promptId}.`);
    }

    const now = Date.now();
    const rollbackVersionNumber = `${versionNumber}-rollback-${now}`;
    const versionId = `${promptId}_v${rollbackVersionNumber}`;

    const rollback: PromptVersion = {
      id: versionId,
      promptId,
      versionNumber: rollbackVersionNumber,
      content: target.content,
      variables: [...target.variables],
      status: 'published',
      createdAt: now,
      publishedAt: now,
      changelog: `Rollback to version ${versionNumber}`,
      validator: target.validator,
    };

    record.versions.push(rollback);
    record.metadata.currentVersionId = versionId;
    record.metadata.updatedAt = now;

    if (record.versions.length > this.MAX_ROLLBACK_VERSIONS) {
      record.versions = record.versions.slice(-this.MAX_ROLLBACK_VERSIONS);
    }

    return rollback;
  }

  static hydrate(
    promptId: string,
    variables: Record<string, string>,
    options?: { versionId?: string }
  ): string {
    const record = this.prompts.get(promptId);
    if (!record) {
      throw new Error(`Prompt ${promptId} not found in registry.`);
    }

    const version = options?.versionId
      ? record.versions.find(v => v.id === options.versionId)
      : record.versions.find(v => v.id === record.metadata.currentVersionId);

    if (!version) {
      throw new Error(`No active version found for prompt ${promptId}.`);
    }

    if (version.status === 'deprecated') {
      console.warn(`Hydrating deprecated prompt version ${version.versionNumber} for ${promptId}.`);
    }

    let hydratedContent = version.content;

    for (const variable of version.variables) {
      if (!(variable in variables)) {
        throw new Error(
          `Missing required variable: "${variable}" for prompt ${promptId} version ${version.versionNumber}`
        );
      }
      const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g');
      hydratedContent = hydratedContent.replace(regex, variables[variable]);
    }

    const unsubstituted = hydratedContent.match(/\{\{(\w+)\}\}/g);
    if (unsubstituted) {
      console.warn(
        `Prompt ${promptId} has unsubstituted variables: ${unsubstituted.join(', ')}`
      );
    }

    return hydratedContent;
  }

  static validatePrompt(
    promptId: string,
    content: string,
    options?: {
      requireVariables?: string[];
      maxLength?: number;
      allowedVariables?: string[];
    }
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!content || content.trim().length === 0) {
      errors.push({ field: 'content', message: 'Prompt content cannot be empty.' });
      return errors;
    }

    if (options?.maxLength && content.length > options.maxLength) {
      errors.push({
        field: 'content',
        message: `Prompt exceeds max length of ${options.maxLength} characters.`,
      });
    }

    const extractedVars = this.extractVariables(content);

    if (options?.requireVariables) {
      for (const varName of options.requireVariables) {
        if (!extractedVars.includes(varName)) {
          errors.push({
            field: 'variables',
            message: `Required variable "${varName}" is missing from prompt content.`,
          });
        }
      }
    }

    if (options?.allowedVariables) {
      for (const varName of extractedVars) {
        if (!options.allowedVariables.includes(varName)) {
          errors.push({
            field: 'variables',
            message: `Variable "${varName}" is not in the allowed list.`,
          });
        }
      }
    }

    return errors;
  }

  static get(promptId: string): PromptRecord | undefined {
    return this.prompts.get(promptId);
  }

  static getVersion(promptId: string, versionId: string): PromptVersion | undefined {
    const record = this.prompts.get(promptId);
    return record?.versions.find(v => v.id === versionId);
  }

  static getCurrentVersion(promptId: string): PromptVersion | undefined {
    const record = this.prompts.get(promptId);
    if (!record) return undefined;
    return record.versions.find(v => v.id === record.metadata.currentVersionId);
  }

  static listByCategory(category: PromptCategory): PromptRecord[] {
    return Array.from(this.prompts.values()).filter(p => p.metadata.category === category);
  }

  static search(query: string): PromptRecord[] {
    const lower = query.toLowerCase();
    return Array.from(this.prompts.values()).filter(
      p =>
        p.metadata.name.toLowerCase().includes(lower) ||
        p.metadata.description.toLowerCase().includes(lower) ||
        p.metadata.tags.some(t => t.toLowerCase().includes(lower))
    );
  }

  static listAll(): PromptMetadata[] {
    return Array.from(this.prompts.values()).map(r => r.metadata);
  }

  static unregister(promptId: string): void {
    if (!this.prompts.has(promptId)) {
      throw new Error(`Prompt ${promptId} not found in registry.`);
    }
    this.prompts.delete(promptId);
  }

  private static extractVariables(content: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      variables.add(match[1]);
    }
    return Array.from(variables);
  }

  static setMaxRollbackVersions(max: number): void {
    this.MAX_ROLLBACK_VERSIONS = Math.max(1, max);
  }
}
