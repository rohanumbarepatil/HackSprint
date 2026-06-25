/**
 * Future Readiness Interfaces
 * Defines abstraction layers for enterprise tools slated for Phase 6+.
 */

export interface VectorSearchEngine {
  search(query: string, topK: number): Promise<unknown[]>;
  index(document: string, metadata: unknown): Promise<void>;
}

export interface ExternalAPIClient {
  get(url: string, headers?: Record<string, string>): Promise<unknown>;
  post(url: string, body: unknown, headers?: Record<string, string>): Promise<unknown>;
}

export interface MCPIntegration {
  listTools(): Promise<unknown[]>;
  callTool(toolName: string, args: unknown): Promise<unknown>;
}

export interface GitHubIntegration {
  createRepository(name: string, description: string): Promise<string>;
  commitFiles(repoId: string, files: Record<string, string>, message: string): Promise<void>;
  createPullRequest(repoId: string, title: string, branch: string): Promise<string>;
}

export interface FigmaIntegration {
  generateComponent(prompt: string, designSystem: unknown): Promise<string>;
  syncTokens(figmaFileId: string): Promise<unknown>;
}

export interface JiraIntegration {
  createEpic(title: string, description: string): Promise<string>;
  createTicket(epicId: string, title: string, storyPoints: number): Promise<string>;
}
