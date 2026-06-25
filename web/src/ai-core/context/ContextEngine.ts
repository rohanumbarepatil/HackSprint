import { ProjectMemory, DocumentMemory } from '../memory';

export interface ContextVersion {
  versionId: string;
  timestamp: number;
  hash: string; // Hash of the context content for reproducibility
}

export interface AssembledContext {
  systemInstruction: string;
  projectContext: string;
  upstreamDocuments: string;
  version: ContextVersion;
}

export class ContextEngine {
  /**
   * Assembles the full context required by an AI Agent.
   * This guarantees that every request receives the exact same fundamental project state.
   */
  static async buildContext(
    projectMemory: ProjectMemory,
    documentMemory: DocumentMemory,
    requiredUpstreamModules: string[]
  ): Promise<AssembledContext> {
    
    // 1. Build Project Context
    const projectContext = `
      PROBLEM STATEMENT:
      ${projectMemory.problemStatement}
      
      CONSTRAINTS:
      ${projectMemory.constraints.join(', ')}
      
      TECHNOLOGIES:
      ${projectMemory.technologies.join(', ')}
    `;

    // 2. Build Upstream Documents Context
    let upstreamDocuments = '';
    for (const modId of requiredUpstreamModules) {
      const doc = await documentMemory.fetchDocument(modId);
      if (doc) {
        upstreamDocuments += `\n\n--- PREVIOUS MODULE: ${modId.toUpperCase()} ---\n${doc}`;
      }
    }

    // 3. Assemble Final System Instruction
    const systemInstruction = `
      You are HackSprint AI, an expert AI Architect and Software Engineer.
      You must adhere strictly to the project constraints and problem statement provided below.
      Always format your response exactly as requested by the provided JSON schema.
      
      ${projectContext}
      
      ${upstreamDocuments}
    `;

    // 4. Generate Reproducible Version
    const hash = Buffer.from(systemInstruction).toString('base64').substring(0, 16);
    
    return {
      systemInstruction,
      projectContext,
      upstreamDocuments,
      version: {
        versionId: `ctx_${Date.now()}_${hash}`,
        timestamp: Date.now(),
        hash,
      }
    };
  }
}
