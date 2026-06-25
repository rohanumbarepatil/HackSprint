export interface MemoryContext {
  id: string;
  projectId: string;
  timestamp: number;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ShortTermMemory extends MemoryContext {
  recentGenerations: Record<string, string>;
  activeVariables: Record<string, unknown>;
}

export interface LongTermMemory extends MemoryContext {
  persist(key: string, value: unknown): Promise<void>;
  retrieve(key: string): Promise<unknown>;
}

export interface ConversationMemory extends MemoryContext {
  messages: ConversationMessage[];
  addMessage(role: 'user' | 'assistant' | 'system', content: string): Promise<void>;
  getHistory(limit?: number): Promise<ConversationMessage[]>;
  clear(): Promise<void>;
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
  listDocuments(): Promise<string[]>;
}

export interface RAGMemory extends MemoryContext {
  query(vector: number[], topK?: number): Promise<Array<{ text: string; score: number }>>;
  embedAndStore(text: string, metadata?: unknown): Promise<string>;
}

export interface GenerationRecord {
  id: string;
  agentId: string;
  moduleId: string;
  output: string;
  contextHash: string;
  promptVersionId?: string;
  timestamp: number;
  latencyMs: number;
  success: boolean;
  validationErrors?: string[];
}

export interface GenerationHistory extends MemoryContext {
  records: GenerationRecord[];
  addRecord(record: GenerationRecord): Promise<void>;
  getByModule(moduleId: string): Promise<GenerationRecord[]>;
  getByAgent(agentId: string): Promise<GenerationRecord[]>;
  getLatest(moduleId: string): Promise<GenerationRecord | null>;
}

export interface ContextSnapshot extends MemoryContext {
  contextHash: string;
  assembledContext: string;
  versionId: string;
  workflowId: string;
  nodeResults: Record<string, string>;
}

export interface ContextSnapshotStore extends MemoryContext {
  snapshots: ContextSnapshot[];
  saveSnapshot(snapshot: ContextSnapshot): Promise<string>;
  getSnapshot(id: string): Promise<ContextSnapshot | null>;
  getByWorkflow(workflowId: string): Promise<ContextSnapshot[]>;
  getByContextHash(hash: string): Promise<ContextSnapshot | null>;
}

export class InMemoryProjectMemory implements ProjectMemory {
  id: string;
  projectId: string;
  timestamp: number;
  problemStatement: string;
  constraints: string[];
  preferences: Record<string, unknown>;
  technologies: string[];

  constructor(
    projectId: string,
    problemStatement = '',
    constraints: string[] = [],
    preferences: Record<string, unknown> = {},
    technologies: string[] = []
  ) {
    this.id = `proj-${projectId}`;
    this.projectId = projectId;
    this.timestamp = Date.now();
    this.problemStatement = problemStatement;
    this.constraints = constraints;
    this.preferences = preferences;
    this.technologies = technologies;
  }

  updateProblem(statement: string): void {
    this.problemStatement = statement;
    this.timestamp = Date.now();
  }

  addConstraint(constraint: string): void {
    this.constraints.push(constraint);
    this.timestamp = Date.now();
  }

  setPreference(key: string, value: unknown): void {
    this.preferences[key] = value;
    this.timestamp = Date.now();
  }

  addTechnology(tech: string): void {
    if (!this.technologies.includes(tech)) {
      this.technologies.push(tech);
      this.timestamp = Date.now();
    }
  }
}

export class InMemoryConversationMemory implements ConversationMemory {
  id: string;
  projectId: string;
  timestamp: number;
  messages: ConversationMessage[];
  private maxMessages: number;

  constructor(projectId: string, maxMessages = 100) {
    this.id = `conv-${projectId}`;
    this.projectId = projectId;
    this.timestamp = Date.now();
    this.messages = [];
    this.maxMessages = maxMessages;
  }

  async addMessage(role: 'user' | 'assistant' | 'system', content: string): Promise<void> {
    const message: ConversationMessage = {
      role,
      content,
      timestamp: Date.now(),
    };
    this.messages.push(message);
    this.timestamp = Date.now();

    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
  }

  async getHistory(limit?: number): Promise<ConversationMessage[]> {
    const count = limit ?? this.messages.length;
    return this.messages.slice(-count);
  }

  async clear(): Promise<void> {
    this.messages = [];
    this.timestamp = Date.now();
  }
}

export class InMemoryDocumentMemory implements DocumentMemory {
  id: string;
  projectId: string;
  timestamp: number;
  private documents: Map<string, string>;

  constructor(projectId: string) {
    this.id = `doc-${projectId}`;
    this.projectId = projectId;
    this.timestamp = Date.now();
    this.documents = new Map();
  }

  async fetchDocument(moduleId: string): Promise<string | null> {
    return this.documents.get(moduleId) ?? null;
  }

  async saveDocument(moduleId: string, content: string): Promise<void> {
    this.documents.set(moduleId, content);
    this.timestamp = Date.now();
  }

  async listDocuments(): Promise<string[]> {
    return Array.from(this.documents.keys());
  }
}

export class InMemoryShortTermMemory implements ShortTermMemory {
  id: string;
  projectId: string;
  timestamp: number;
  recentGenerations: Record<string, string>;
  activeVariables: Record<string, unknown>;

  constructor(projectId: string) {
    this.id = `stm-${projectId}`;
    this.projectId = projectId;
    this.timestamp = Date.now();
    this.recentGenerations = {};
    this.activeVariables = {};
  }

  setGeneration(moduleId: string, output: string): void {
    this.recentGenerations[moduleId] = output;
    this.timestamp = Date.now();
  }

  setVariable(key: string, value: unknown): void {
    this.activeVariables[key] = value;
    this.timestamp = Date.now();
  }

  clearGenerations(): void {
    this.recentGenerations = {};
    this.timestamp = Date.now();
  }

  clearAll(): void {
    this.recentGenerations = {};
    this.activeVariables = {};
    this.timestamp = Date.now();
  }
}

export class InMemoryGenerationHistory implements GenerationHistory {
  id: string;
  projectId: string;
  timestamp: number;
  records: GenerationRecord[];

  constructor(projectId: string) {
    this.id = `gen-${projectId}`;
    this.projectId = projectId;
    this.timestamp = Date.now();
    this.records = [];
  }

  async addRecord(record: GenerationRecord): Promise<void> {
    this.records.push(record);
    this.timestamp = Date.now();
  }

  async getByModule(moduleId: string): Promise<GenerationRecord[]> {
    return this.records.filter(r => r.moduleId === moduleId);
  }

  async getByAgent(agentId: string): Promise<GenerationRecord[]> {
    return this.records.filter(r => r.agentId === agentId);
  }

  async getLatest(moduleId: string): Promise<GenerationRecord | null> {
    const matches = this.records.filter(r => r.moduleId === moduleId);
    if (matches.length === 0) return null;
    return matches.reduce((latest, curr) =>
      curr.timestamp > latest.timestamp ? curr : latest
    );
  }
}

export class InMemoryContextSnapshotStore implements ContextSnapshotStore {
  id: string;
  projectId: string;
  timestamp: number;
  snapshots: ContextSnapshot[];
  private maxSnapshots: number;

  constructor(projectId: string, maxSnapshots = 50) {
    this.id = `snap-${projectId}`;
    this.projectId = projectId;
    this.timestamp = Date.now();
    this.snapshots = [];
    this.maxSnapshots = maxSnapshots;
  }

  async saveSnapshot(snapshot: ContextSnapshot): Promise<string> {
    this.snapshots.push(snapshot);
    this.timestamp = Date.now();

    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }

    return snapshot.id;
  }

  async getSnapshot(id: string): Promise<ContextSnapshot | null> {
    return this.snapshots.find(s => s.id === id) ?? null;
  }

  async getByWorkflow(workflowId: string): Promise<ContextSnapshot[]> {
    return this.snapshots.filter(s => s.workflowId === workflowId);
  }

  async getByContextHash(hash: string): Promise<ContextSnapshot | null> {
    return this.snapshots.find(s => s.contextHash === hash) ?? null;
  }
}

export class InMemoryLongTermMemory implements LongTermMemory {
  id: string;
  projectId: string;
  timestamp: number;
  private store: Map<string, unknown>;

  constructor(projectId: string) {
    this.id = `ltm-${projectId}`;
    this.projectId = projectId;
    this.timestamp = Date.now();
    this.store = new Map();
  }

  async persist(key: string, value: unknown): Promise<void> {
    this.store.set(key, value);
    this.timestamp = Date.now();
  }

  async retrieve(key: string): Promise<unknown> {
    return this.store.get(key);
  }

  async delete(key: string): Promise<boolean> {
    const existed = this.store.has(key);
    this.store.delete(key);
    return existed;
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.timestamp = Date.now();
  }
}
