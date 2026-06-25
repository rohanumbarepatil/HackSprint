import { BaseAgent } from './BaseAgent';
import { AIProvider } from '../providers/AIProvider';

export class AgentRegistry {
  private static agents: Map<string, new (provider: AIProvider) => BaseAgent> = new Map();

  /**
   * Registers a new agent dynamically.
   */
  static register(agentId: string, agentClass: new (provider: AIProvider) => BaseAgent) {
    if (this.agents.has(agentId)) {
      throw new Error(`Agent ${agentId} is already registered.`);
    }
    this.agents.set(agentId, agentClass);
  }

  /**
   * Retrieves an agent class by ID.
   */
  static get(agentId: string): new (provider: AIProvider) => BaseAgent {
    const agentClass = this.agents.get(agentId);
    if (!agentClass) {
      throw new Error(`Agent ${agentId} not found in registry.`);
    }
    return agentClass;
  }

  /**
   * Lists all available agents in the registry.
   */
  static listAll() {
    return Array.from(this.agents.keys());
  }
}
