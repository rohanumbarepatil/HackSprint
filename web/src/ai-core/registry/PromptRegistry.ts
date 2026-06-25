export interface PromptVersion {
  id: string;
  promptId: string; // Parent ID
  versionNumber: string; // e.g. "v1.0"
  content: string; // Raw text with {{variables}}
  variables: string[]; // e.g. ["project_name", "constraints"]
  status: 'draft' | 'published' | 'deprecated';
  createdAt: number;
}

export interface PromptMetadata {
  id: string;
  name: string;
  category: string;
  description: string;
  currentVersion: string; // Points to a PromptVersion.id
}

export class PromptRegistry {
  private static templates: Map<string, PromptVersion> = new Map();

  /**
   * Hydrates a prompt template with the provided variables.
   */
  static hydrate(templateId: string, variables: Record<string, string>): string {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Prompt template ${templateId} not found in registry.`);
    }

    let hydratedContent = template.content;
    
    // Ensure all required variables are provided
    for (const variable of template.variables) {
      if (!(variable in variables)) {
        throw new Error(`Missing required variable: ${variable} for prompt ${templateId}`);
      }
      // Replace all instances of {{variable}}
      const regex = new RegExp(`{{${variable}}}`, 'g');
      hydratedContent = hydratedContent.replace(regex, variables[variable]);
    }

    return hydratedContent;
  }

  /**
   * Registers a prompt version locally (in production this would pull from Firestore).
   */
  static registerLocal(version: PromptVersion) {
    this.templates.set(version.id, version);
  }
}
