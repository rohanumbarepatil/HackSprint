import { AgentRegistry } from './AgentRegistry';
import { BaseAgent } from './BaseAgent';
import { AIProvider } from '../providers/AIProvider';
import { ProblemAnalyzerAgent } from './ProblemAnalyzerAgent';
import { ResearchAgent } from './ResearchAgent';
import { CompetitorAgent } from './CompetitorAgent';
import { InnovationAgent } from './InnovationAgent';
import { PMAgent } from './PMAgent';
import { TechnicalArchitectAgent } from './TechnicalArchitectAgent';
import { DBAgent } from './DBAgent';
import { UIUXAgent } from './UIUXAgent';
import { BackendAgent } from './BackendAgent';
import { SecurityAgent } from './SecurityAgent';
import { QAAgent } from './QAAgent';
import { BusinessAnalystAgent } from './BusinessAnalystAgent';
import { PitchAgent } from './PitchAgent';
import { DocumentationAgent } from './DocumentationAgent';
import { ValidationAgent } from './ValidationAgent';

export function registerAllAgents() {
  const agents: [string, new (provider: AIProvider) => BaseAgent][] = [
    ['agent-problem-analyzer', ProblemAnalyzerAgent],
    ['agent-research', ResearchAgent],
    ['agent-competitor', CompetitorAgent],
    ['agent-innovation', InnovationAgent],
    ['agent-pm', PMAgent],
    ['agent-tech-architect', TechnicalArchitectAgent],
    ['agent-db-architect', DBAgent],
    ['agent-ui-ux', UIUXAgent],
    ['agent-backend', BackendAgent],
    ['agent-security', SecurityAgent],
    ['agent-qa', QAAgent],
    ['agent-business-analyst', BusinessAnalystAgent],
    ['agent-pitch', PitchAgent],
    ['agent-documentation', DocumentationAgent],
    ['agent-validation', ValidationAgent],
  ];
  for (const [id, cls] of agents) {
    try {
      AgentRegistry.register(id, cls);
    } catch {
      // Agent already registered, skip
    }
  }
}

export function isAgentRegistered(id: string): boolean {
  try {
    AgentRegistry.get(id);
    return true;
  } catch {
    return false;
  }
}

export {
  ProblemAnalyzerAgent,
  ResearchAgent,
  CompetitorAgent,
  InnovationAgent,
  PMAgent,
  TechnicalArchitectAgent,
  DBAgent,
  UIUXAgent,
  BackendAgent,
  SecurityAgent,
  QAAgent,
  BusinessAnalystAgent,
  PitchAgent,
  DocumentationAgent,
  ValidationAgent,
};
