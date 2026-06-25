/**
 * Memory Architecture
 * Defines strict interfaces for the multi-tiered memory system.
 */

export interface MemoryContext {
  id: string;
  projectId: string;
  timestamp: number;
}

export interface ShortTermMemory extends MemoryContext {
  recentGenerations: Record<string, string>; // Maps moduleId to recent output
  activeVariables: Record<string, unknown>;
}

export interface LongTermMemory extends MemoryContext {
  persist(key: string, value: unknown): Promise<void>;
  retrieve(key: string): Promise<unknown>;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ConversationMemory extends MemoryContext {
  messages: ConversationMessage[];
  addMessage(role: 'user' | 'assistant' | 'system', content: string): Promise<void>;
  getHistory(limit?: number): Promise<ConversationMessage[]>;
}

export interface ProjectMemory extends MemoryContext {
  problemStatement: string;
  constraints: string[];
  preferences: Record<string, unknown>;
  technologies: string[];
}

export interface DocumentMemory extends MemoryContext {
  fetchDocument(moduleId: string): Promise<string | null>;
  saveDocument(moduleId: string, content: string): Promise<void>;
}

export interface RAGMemory extends MemoryContext {
  query(vector: number[], topK?: number): Promise<Array<{ text: string, score: number }>>;
  embedAndStore(text: string, metadata?: unknown): Promise<string>;
}
