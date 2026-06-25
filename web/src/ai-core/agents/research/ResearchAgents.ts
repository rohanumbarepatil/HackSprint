import { AgentMetadata } from '../BaseAgent';
import { AIProvider } from '../../providers/AIProvider';
import { ResearchStageBase } from './ResearchStageBase';

export class ProblemUnderstandingAgent extends ResearchStageBase {
  readonly stage = 1;
  readonly stageName = 'ProblemUnderstanding';
  readonly metadata: AgentMetadata = {
    id: 'agent-research-01-problem-understanding',
    name: 'Problem Understanding',
    description: 'Analyzes and clarifies the core problem statement',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = [];
  readonly producedOutput: string = 'research-problem-understanding';

  constructor(provider: AIProvider) { super(provider); }
  buildPrompt(_prev: string[]): string { return 'Analyze the core problem. Provide title, summary, detailed analysis, confidence score, sources, and timestamp.'; }
}

export class DomainIdentificationAgent extends ResearchStageBase {
  readonly stage = 2;
  readonly stageName = 'DomainIdentification';
  readonly metadata: AgentMetadata = {
    id: 'agent-research-02-domain-identification',
    name: 'Domain Identification',
    description: 'Identifies the domain and subdomains relevant to the problem',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['research-problem-understanding'];
  readonly producedOutput: string = 'research-domain-identification';

  constructor(provider: AIProvider) { super(provider); }
  buildPrompt(_prev: string[]): string { return 'Identify the domain and subdomains relevant to this problem. Provide title, summary, detailed analysis, confidence score, sources, and timestamp.'; }
}

export class IndustryResearchAgent extends ResearchStageBase {
  readonly stage = 3;
  readonly stageName = 'IndustryResearch';
  readonly metadata: AgentMetadata = {
    id: 'agent-research-03-industry-research',
    name: 'Industry Research',
    description: 'Researches the industry landscape and key players',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['research-problem-understanding', 'research-domain-identification'];
  readonly producedOutput: string = 'research-industry';

  constructor(provider: AIProvider) { super(provider); }
  buildPrompt(_prev: string[]): string { return 'Research the industry landscape. Provide title, summary, detailed analysis, confidence score, sources, and timestamp.'; }
}

export class MarketResearchAgent extends ResearchStageBase {
  readonly stage = 4;
  readonly stageName = 'MarketResearch';
  readonly metadata: AgentMetadata = {
    id: 'agent-research-04-market-research',
    name: 'Market Research',
    description: 'Analyzes market size, trends, and growth opportunities',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['research-problem-understanding', 'research-domain-identification', 'research-industry'];
  readonly producedOutput: string = 'research-market';

  constructor(provider: AIProvider) { super(provider); }
  buildPrompt(_prev: string[]): string { return 'Analyze market size, trends, and growth opportunities. Provide title, summary, detailed analysis, confidence score, sources, and timestamp.'; }
}

export class CompetitorAnalysisAgent extends ResearchStageBase {
  readonly stage = 5;
  readonly stageName = 'CompetitorAnalysis';
  readonly metadata: AgentMetadata = {
    id: 'agent-research-05-competitor-analysis',
    name: 'Competitor Analysis',
    description: 'Analyzes direct and indirect competitors',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['research-problem-understanding', 'research-industry', 'research-market'];
  readonly producedOutput: string = 'research-competitor';

  constructor(provider: AIProvider) { super(provider); }
  buildPrompt(_prev: string[]): string { return 'Analyze direct and indirect competitors. Provide title, summary, detailed analysis, confidence score, sources, and timestamp.'; }
}

export class GapAnalysisAgent extends ResearchStageBase {
  readonly stage = 6;
  readonly stageName = 'GapAnalysis';
  readonly metadata: AgentMetadata = {
    id: 'agent-research-06-gap-analysis',
    name: 'Gap Analysis',
    description: 'Identifies gaps in existing solutions and market opportunities',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['research-problem-understanding', 'research-competitor', 'research-market'];
  readonly producedOutput: string = 'research-gap';

  constructor(provider: AIProvider) { super(provider); }
  buildPrompt(_prev: string[]): string { return 'Identify gaps in existing solutions and market opportunities. Provide title, summary, detailed analysis, confidence score, sources, and timestamp.'; }
}

export class UserPersonaResearchAgent extends ResearchStageBase {
  readonly stage = 7;
  readonly stageName = 'UserPersonaResearch';
  readonly metadata: AgentMetadata = {
    id: 'agent-research-07-user-persona-research',
    name: 'User Persona Research',
    description: 'Develops detailed user personas based on problem context',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['research-problem-understanding', 'research-market', 'research-gap'];
  readonly producedOutput: string = 'research-personas';

  constructor(provider: AIProvider) { super(provider); }
  buildPrompt(_prev: string[]): string { return 'Develop detailed user personas. Provide title, summary, detailed analysis, confidence score, sources, and timestamp.'; }
}

export class PainPointAnalysisAgent extends ResearchStageBase {
  readonly stage = 8;
  readonly stageName = 'PainPointAnalysis';
  readonly metadata: AgentMetadata = {
    id: 'agent-research-08-pain-point-analysis',
    name: 'Pain Point Analysis',
    description: 'Identifies and prioritizes user pain points',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['research-personas', 'research-gap', 'research-problem-understanding'];
  readonly producedOutput: string = 'research-painpoints';

  constructor(provider: AIProvider) { super(provider); }
  buildPrompt(_prev: string[]): string { return 'Identify and prioritize user pain points. Provide title, summary, detailed analysis, confidence score, sources, and timestamp.'; }
}

export class ExistingSolutionAnalysisAgent extends ResearchStageBase {
  readonly stage = 9;
  readonly stageName = 'ExistingSolutionAnalysis';
  readonly metadata: AgentMetadata = {
    id: 'agent-research-09-existing-solution-analysis',
    name: 'Existing Solution Analysis',
    description: 'Evaluates existing solutions and their limitations',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['research-competitor', 'research-painpoints', 'research-gap'];
  readonly producedOutput: string = 'research-existing-solutions';

  constructor(provider: AIProvider) { super(provider); }
  buildPrompt(_prev: string[]): string { return 'Evaluate existing solutions and their limitations. Provide title, summary, detailed analysis, confidence score, sources, and timestamp.'; }
}

export class InnovationOpportunitiesAgent extends ResearchStageBase {
  readonly stage = 10;
  readonly stageName = 'InnovationOpportunities';
  readonly metadata: AgentMetadata = {
    id: 'agent-research-10-innovation-opportunities',
    name: 'Innovation Opportunities',
    description: 'Identifies innovation opportunities and novel approaches',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['research-gap', 'research-existing-solutions', 'research-painpoints'];
  readonly producedOutput: string = 'research-innovation';

  constructor(provider: AIProvider) { super(provider); }
  buildPrompt(_prev: string[]): string { return 'Identify innovation opportunities and novel approaches. Provide title, summary, detailed analysis, confidence score, sources, and timestamp.'; }
}

export class FeatureBrainstormingAgent extends ResearchStageBase {
  readonly stage = 11;
  readonly stageName = 'FeatureBrainstorming';
  readonly metadata: AgentMetadata = {
    id: 'agent-research-11-feature-brainstorming',
    name: 'Feature Brainstorming',
    description: 'Brainstorms potential features based on pain points and opportunities',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['research-innovation', 'research-painpoints', 'research-personas'];
  readonly producedOutput: string = 'research-features';

  constructor(provider: AIProvider) { super(provider); }
  buildPrompt(_prev: string[]): string { return 'Brainstorm potential features. Provide title, summary, detailed analysis, confidence score, sources, and timestamp.'; }
}

export class BusinessModelSuggestionsAgent extends ResearchStageBase {
  readonly stage = 12;
  readonly stageName = 'BusinessModelSuggestions';
  readonly metadata: AgentMetadata = {
    id: 'agent-research-12-business-model-suggestions',
    name: 'Business Model Suggestions',
    description: 'Suggests viable business models and monetization strategies',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['research-market', 'research-competitor', 'research-features', 'research-innovation'];
  readonly producedOutput: string = 'research-business-model';

  constructor(provider: AIProvider) { super(provider); }
  buildPrompt(_prev: string[]): string { return 'Suggest viable business models and monetization strategies. Provide title, summary, detailed analysis, confidence score, sources, and timestamp.'; }
}

export class TechnologyRecommendationsAgent extends ResearchStageBase {
  readonly stage = 13;
  readonly stageName = 'TechnologyRecommendations';
  readonly metadata: AgentMetadata = {
    id: 'agent-research-13-technology-recommendations',
    name: 'Technology Recommendations',
    description: 'Recommends appropriate technology stack and tools',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['research-features', 'research-innovation', 'research-existing-solutions'];
  readonly producedOutput: string = 'research-technology';

  constructor(provider: AIProvider) { super(provider); }
  buildPrompt(_prev: string[]): string { return 'Recommend appropriate technology stack and tools. Provide title, summary, detailed analysis, confidence score, sources, and timestamp.'; }
}

export class ArchitectureRecommendationsAgent extends ResearchStageBase {
  readonly stage = 14;
  readonly stageName = 'ArchitectureRecommendations';
  readonly metadata: AgentMetadata = {
    id: 'agent-research-14-architecture-recommendations',
    name: 'Architecture Recommendations',
    description: 'Recommends system architecture and design patterns',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['research-technology', 'research-features', 'research-existing-solutions'];
  readonly producedOutput: string = 'research-architecture';

  constructor(provider: AIProvider) { super(provider); }
  buildPrompt(_prev: string[]): string { return 'Recommend system architecture and design patterns. Provide title, summary, detailed analysis, confidence score, sources, and timestamp.'; }
}

export class RiskAnalysisAgent extends ResearchStageBase {
  readonly stage = 15;
  readonly stageName = 'RiskAnalysis';
  readonly metadata: AgentMetadata = {
    id: 'agent-research-15-risk-analysis',
    name: 'Risk Analysis',
    description: 'Identifies technical, market, and operational risks',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['research-technology', 'research-architecture', 'research-market', 'research-business-model'];
  readonly producedOutput: string = 'research-risk';

  constructor(provider: AIProvider) { super(provider); }
  buildPrompt(_prev: string[]): string { return 'Identify technical, market, and operational risks. Provide title, summary, detailed analysis, confidence score, sources, and timestamp.'; }
}

export class SecurityConsiderationsAgent extends ResearchStageBase {
  readonly stage = 16;
  readonly stageName = 'SecurityConsiderations';
  readonly metadata: AgentMetadata = {
    id: 'agent-research-16-security-considerations',
    name: 'Security Considerations',
    description: 'Analyzes security requirements and potential vulnerabilities',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['research-architecture', 'research-technology', 'research-risk'];
  readonly producedOutput: string = 'research-security';

  constructor(provider: AIProvider) { super(provider); }
  buildPrompt(_prev: string[]): string { return 'Analyze security requirements and potential vulnerabilities. Provide title, summary, detailed analysis, confidence score, sources, and timestamp.'; }
}

export class ScalabilityConsiderationsAgent extends ResearchStageBase {
  readonly stage = 17;
  readonly stageName = 'ScalabilityConsiderations';
  readonly metadata: AgentMetadata = {
    id: 'agent-research-17-scalability-considerations',
    name: 'Scalability Considerations',
    description: 'Analyzes scalability requirements and growth strategies',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['research-architecture', 'research-technology', 'research-risk'];
  readonly producedOutput: string = 'research-scalability';

  constructor(provider: AIProvider) { super(provider); }
  buildPrompt(_prev: string[]): string { return 'Analyze scalability requirements and growth strategies. Provide title, summary, detailed analysis, confidence score, sources, and timestamp.'; }
}

export class FutureScopeAgent extends ResearchStageBase {
  readonly stage = 18;
  readonly stageName = 'FutureScope';
  readonly metadata: AgentMetadata = {
    id: 'agent-research-18-future-scope',
    name: 'Future Scope',
    description: 'Outlines future expansion possibilities and roadmap',
    version: '1.0.0',
  };
  readonly requiredContext: string[] = ['research-innovation', 'research-features', 'research-business-model', 'research-scalability', 'research-security'];
  readonly producedOutput: string = 'research-future-scope';

  constructor(provider: AIProvider) { super(provider); }
  buildPrompt(_prev: string[]): string { return 'Outline future expansion possibilities and roadmap. Provide title, summary, detailed analysis, confidence score, sources, and timestamp.'; }
}
