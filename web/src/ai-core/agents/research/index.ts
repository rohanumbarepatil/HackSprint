import { BaseAgent } from '../BaseAgent';
import { AIProvider } from '../../providers/AIProvider';
import { AgentRegistry } from '../AgentRegistry';
import { ProblemUnderstandingAgent } from './ResearchAgents';
import { DomainIdentificationAgent } from './ResearchAgents';
import { IndustryResearchAgent } from './ResearchAgents';
import { MarketResearchAgent } from './ResearchAgents';
import { CompetitorAnalysisAgent } from './ResearchAgents';
import { GapAnalysisAgent } from './ResearchAgents';
import { UserPersonaResearchAgent } from './ResearchAgents';
import { PainPointAnalysisAgent } from './ResearchAgents';
import { ExistingSolutionAnalysisAgent } from './ResearchAgents';
import { InnovationOpportunitiesAgent } from './ResearchAgents';
import { FeatureBrainstormingAgent } from './ResearchAgents';
import { BusinessModelSuggestionsAgent } from './ResearchAgents';
import { TechnologyRecommendationsAgent } from './ResearchAgents';
import { ArchitectureRecommendationsAgent } from './ResearchAgents';
import { RiskAnalysisAgent } from './ResearchAgents';
import { SecurityConsiderationsAgent } from './ResearchAgents';
import { ScalabilityConsiderationsAgent } from './ResearchAgents';
import { FutureScopeAgent } from './ResearchAgents';

const researchAgents: [string, new (provider: AIProvider) => BaseAgent][] = [
  ['agent-research-01-problem-understanding', ProblemUnderstandingAgent],
  ['agent-research-02-domain-identification', DomainIdentificationAgent],
  ['agent-research-03-industry-research', IndustryResearchAgent],
  ['agent-research-04-market-research', MarketResearchAgent],
  ['agent-research-05-competitor-analysis', CompetitorAnalysisAgent],
  ['agent-research-06-gap-analysis', GapAnalysisAgent],
  ['agent-research-07-user-persona-research', UserPersonaResearchAgent],
  ['agent-research-08-pain-point-analysis', PainPointAnalysisAgent],
  ['agent-research-09-existing-solution-analysis', ExistingSolutionAnalysisAgent],
  ['agent-research-10-innovation-opportunities', InnovationOpportunitiesAgent],
  ['agent-research-11-feature-brainstorming', FeatureBrainstormingAgent],
  ['agent-research-12-business-model-suggestions', BusinessModelSuggestionsAgent],
  ['agent-research-13-technology-recommendations', TechnologyRecommendationsAgent],
  ['agent-research-14-architecture-recommendations', ArchitectureRecommendationsAgent],
  ['agent-research-15-risk-analysis', RiskAnalysisAgent],
  ['agent-research-16-security-considerations', SecurityConsiderationsAgent],
  ['agent-research-17-scalability-considerations', ScalabilityConsiderationsAgent],
  ['agent-research-18-future-scope', FutureScopeAgent],
];

export function registerResearchAgents() {
  for (const [id, cls] of researchAgents) {
    try {
      AgentRegistry.register(id, cls);
    } catch {
      // skip if already registered
    }
  }
}

export {
  ProblemUnderstandingAgent,
  DomainIdentificationAgent,
  IndustryResearchAgent,
  MarketResearchAgent,
  CompetitorAnalysisAgent,
  GapAnalysisAgent,
  UserPersonaResearchAgent,
  PainPointAnalysisAgent,
  ExistingSolutionAnalysisAgent,
  InnovationOpportunitiesAgent,
  FeatureBrainstormingAgent,
  BusinessModelSuggestionsAgent,
  TechnologyRecommendationsAgent,
  ArchitectureRecommendationsAgent,
  RiskAnalysisAgent,
  SecurityConsiderationsAgent,
  ScalabilityConsiderationsAgent,
  FutureScopeAgent,
};
