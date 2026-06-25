/**
 * Future Readiness Interfaces
 * Defines abstraction layers for enterprise tools slated for Phase 6+.
 */

export interface VectorSearchEngine {
  search(query: string, topK: number): Promise<any[]>;
  index(document: string, metadata: any): Promise<void>;
}

export interface ExternalAPIClient {
  get(url: string, headers?: Record<string, string>): Promise<any>;
  post(url: string, body: any, headers?: Record<string, string>): Promise<any>;
}

export interface MCPIntegration {
  listTools(): Promise<any[]>;
  callTool(toolName: string, args: any): Promise<any>;
}

export interface GitHubIntegration {
  createRepository(name: string, description: string): Promise<string>;
  commitFiles(repoId: string, files: Record<string, string>, message: string): Promise<void>;
  createPullRequest(repoId: string, title: string, branch: string): Promise<string>;
}

export interface FigmaIntegration {
  generateComponent(prompt: string, designSystem: any): Promise<string>;
  syncTokens(figmaFileId: string): Promise<any>;
}

export interface JiraIntegration {
  createEpic(title: string, description: string): Promise<string>;
  createTicket(epicId: string, title: string, storyPoints: number): Promise<string>;
}
