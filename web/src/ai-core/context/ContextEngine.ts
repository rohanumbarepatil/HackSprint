import { createHash } from 'crypto';
import { ProjectMemory, DocumentMemory, ConversationMemory, ShortTermMemory } from '../memory';

export interface ContextVersion {
  versionId: string;
  timestamp: number;
  hash: string;
}

export interface AgentContextRequest {
  agentId: string;
  requiredModules: string[];
  includePreferences?: boolean;
  includeConversation?: boolean;
  includeShortTerm?: boolean;
}

export interface AssembledContext {
  systemInstruction: string;
  projectContext: string;
  upstreamDocuments: string;
  userPreferences: string;
  shortTermMemory: string;
  conversationSummary: string;
  version: ContextVersion;
}

interface ContextSegment {
  label: string;
  content: string;
}

export class ContextEngine {
  private static readonly MAX_CONVERSATION_HISTORY = 20;

  private static formatSegment(label: string, content: string): string {
    if (!content.trim()) return '';
    return `\n=== ${label} ===\n${content.trim()}\n`;
  }

  private static hashContent(content: string): string {
    return createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  private static assembleProjectContext(projectMemory: ProjectMemory): string {
    const segments: ContextSegment[] = [
      {
        label: 'PROBLEM STATEMENT',
        content: projectMemory.problemStatement,
      },
      {
        label: 'CONSTRAINTS',
        content: projectMemory.constraints.join('\n'),
      },
      {
        label: 'TECHNOLOGIES',
        content: projectMemory.technologies.join(', '),
      },
    ];

    const preferences = projectMemory.preferences;
    if (preferences && Object.keys(preferences).length > 0) {
      segments.push({
        label: 'USER PREFERENCES',
        content: Object.entries(preferences)
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join('\n'),
      });
    }

    return segments.map(s => this.formatSegment(s.label, s.content)).join('');
  }

  private static async assembleUpstreamDocuments(
    documentMemory: DocumentMemory,
    moduleIds: string[]
  ): Promise<string> {
    const parts: string[] = [];
    for (const modId of moduleIds) {
      const doc = await documentMemory.fetchDocument(modId);
      if (doc) {
        parts.push(this.formatSegment(`MODULE: ${modId.toUpperCase()}`, doc));
      }
    }
    return parts.join('');
  }

  private static assembleUserPreferences(projectMemory: ProjectMemory): string {
    const prefs = projectMemory.preferences;
    if (!prefs || Object.keys(prefs).length === 0) {
      return 'No specific user preferences configured.';
    }
    return Object.entries(prefs)
      .map(([key, value]) => `${key}: ${JSON.stringify(value, null, 2)}`)
      .join('\n');
  }

  private static assembleShortTermMemory(shortTermMemory?: ShortTermMemory): string {
    if (!shortTermMemory) return 'No active session context.';
    const parts: string[] = [];

    const recentGens = shortTermMemory.recentGenerations;
    if (recentGens && Object.keys(recentGens).length > 0) {
      parts.push(
        this.formatSegment(
          'RECENT GENERATIONS',
          Object.entries(recentGens)
            .map(([k, v]) => `${k}: ${v.substring(0, 500)}`)
            .join('\n')
        )
      );
    }

    const activeVars = shortTermMemory.activeVariables;
    if (activeVars && Object.keys(activeVars).length > 0) {
      parts.push(
        this.formatSegment(
          'ACTIVE VARIABLES',
          Object.entries(activeVars)
            .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
            .join('\n')
        )
      );
    }

    return parts.join('');
  }

  private static async assembleConversationSummary(
    conversationMemory?: ConversationMemory
  ): Promise<string> {
    if (!conversationMemory) return 'No conversation history available.';
    const history = await conversationMemory.getHistory(this.MAX_CONVERSATION_HISTORY);
    if (!history || history.length === 0) return 'No recent conversation history.';

    return history
      .map(msg => `[${msg.role.toUpperCase()}] ${msg.content}`)
      .join('\n');
  }

  private static assembleSystemInstruction(
    projectContext: string,
    upstreamDocuments: string,
    userPreferences: string,
    shortTermMemory: string,
    conversationSummary: string
  ): string {
    const header = `You are HackSprint AI, an expert AI Architect and Software Engineer.
You must adhere strictly to the project constraints and problem statement provided below.
Always format your response exactly as requested by the provided JSON schema.`;

    const parts = [
      header,
      projectContext,
      upstreamDocuments,
      userPreferences,
      shortTermMemory,
      conversationSummary,
    ];

    return parts.filter(Boolean).join('\n');
  }

  static async buildContext(
    projectMemory: ProjectMemory,
    documentMemory: DocumentMemory,
    requiredUpstreamModules: string[],
    options?: {
      conversationMemory?: ConversationMemory;
      shortTermMemory?: ShortTermMemory;
    }
  ): Promise<AssembledContext> {
    const projectContext = this.assembleProjectContext(projectMemory);
    const upstreamDocuments = await this.assembleUpstreamDocuments(
      documentMemory,
      requiredUpstreamModules
    );
    const userPreferences = this.assembleUserPreferences(projectMemory);
    const shortTermMemory = this.assembleShortTermMemory(options?.shortTermMemory);
    const conversationSummary = await this.assembleConversationSummary(
      options?.conversationMemory
    );

    const systemInstruction = this.assembleSystemInstruction(
      projectContext,
      upstreamDocuments,
      userPreferences,
      shortTermMemory,
      conversationSummary
    );

    const hash = this.hashContent(systemInstruction);

    return {
      systemInstruction,
      projectContext,
      upstreamDocuments,
      userPreferences,
      shortTermMemory,
      conversationSummary,
      version: {
        versionId: `ctx_${Date.now()}_${hash}`,
        timestamp: Date.now(),
        hash,
      },
    };
  }

  static async buildSelectiveContext(
    projectMemory: ProjectMemory,
    documentMemory: DocumentMemory,
    request: AgentContextRequest
  ): Promise<AssembledContext> {
    const projectContext = this.assembleProjectContext(projectMemory);
    const upstreamDocuments = await this.assembleUpstreamDocuments(
      documentMemory,
      request.requiredModules
    );
    const userPreferences = request.includePreferences
      ? this.assembleUserPreferences(projectMemory)
      : '';
    const shortTermMemory = '';
    const conversationSummary = request.includeConversation ? '' : '';

    const systemInstruction = this.assembleSystemInstruction(
      projectContext,
      upstreamDocuments,
      userPreferences,
      shortTermMemory,
      conversationSummary
    );

    const hash = this.hashContent(systemInstruction);

    return {
      systemInstruction,
      projectContext,
      upstreamDocuments,
      userPreferences,
      shortTermMemory: '',
      conversationSummary: '',
      version: {
        versionId: `ctx_${Date.now()}_${hash}`,
        timestamp: Date.now(),
        hash,
      },
    };
  }
}
