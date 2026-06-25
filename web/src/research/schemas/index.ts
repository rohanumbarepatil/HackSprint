import { z } from 'zod';

const unknownRecord = z.record(z.string(), z.unknown());

export const ResearchCategorySchema = z.enum([
  'problem',
  'industry',
  'market',
  'competitors',
  'painpoints',
  'personas',
  'features',
  'innovation',
  'business',
  'technology',
  'security',
  'scalability',
  'future',
]);

export const ResearchMetadataSchema = z.object({
  agentId: z.string().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  latencyMs: z.number().optional(),
  validationScore: z.number().optional(),
  contextHash: z.string().optional(),
  promptVersionId: z.string().optional(),
});

export const ResearchDocumentSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  category: ResearchCategorySchema,
  content: unknownRecord,
  summary: z.string(),
  source: z.string(),
  version: z.number(),
  createdBy: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  tags: z.array(z.string()),
  metadata: ResearchMetadataSchema.optional(),
});

export const ResearchHistoryEntrySchema = z.object({
  id: z.string(),
  researchId: z.string(),
  projectId: z.string(),
  category: ResearchCategorySchema,
  action: z.enum(['created', 'updated', 'archived', 'deleted', 'restored']),
  previousContent: unknownRecord.optional(),
  newContent: unknownRecord.optional(),
  version: z.number(),
  performedBy: z.string(),
  timestamp: z.number(),
  reason: z.string().optional(),
});

export const ResearchVersionSchema = z.object({
  id: z.string(),
  researchId: z.string(),
  projectId: z.string(),
  category: ResearchCategorySchema,
  versionNumber: z.number(),
  content: unknownRecord,
  summary: z.string(),
  changelog: z.string(),
  createdBy: z.string(),
  createdAt: z.number(),
  status: z.enum(['active', 'archived', 'superseded']),
});

export const ResearchAnalyticsEntrySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  category: ResearchCategorySchema,
  action: z.enum(['viewed', 'exported', 'compared', 'used_in_generation']),
  timestamp: z.number(),
  userId: z.string().optional(),
  metadata: unknownRecord.optional(),
});

export const ResearchQuerySchema = z.object({
  projectId: z.string(),
  category: ResearchCategorySchema.optional(),
  tags: z.array(z.string()).optional(),
  fromDate: z.number().optional(),
  toDate: z.number().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

// Category-specific research content schemas
export const ProblemResearchSchema = z.object({
  coreProblem: z.string(),
  rootCauses: z.array(z.string()),
  impact: z.string(),
  stakeholders: z.array(z.object({ name: z.string(), influence: z.number().min(1).max(10) })),
  existingSolutions: z.array(z.object({ name: z.string(), limitation: z.string() })),
});

export const IndustryResearchSchema = z.object({
  industryName: z.string(),
  sector: z.string(),
  marketSize: z.string(),
  growthRate: z.string(),
  keyPlayers: z.array(z.string()),
  regulations: z.array(z.string()),
  trends: z.array(z.string()),
});

export const MarketResearchSchema = z.object({
  totalAddressableMarket: z.string(),
  serviceableAddressableMarket: z.string(),
  serviceableObtainableMarket: z.string(),
  targetSegments: z.array(z.object({ name: z.string(), size: z.string(), needs: z.array(z.string()) })),
  marketGaps: z.array(z.string()),
});

export const CompetitorResearchSchema = z.object({
  directCompetitors: z.array(z.object({ name: z.string(), strengths: z.array(z.string()), weaknesses: z.array(z.string()), pricing: z.string().optional() })),
  indirectCompetitors: z.array(z.object({ name: z.string(), strengths: z.array(z.string()), weaknesses: z.array(z.string()) })),
  marketPositioning: z.string(),
  competitiveAdvantage: z.string(),
});

export const PainPointsSchema = z.object({
  primaryPainPoints: z.array(z.object({ pain: z.string(), severity: z.number().min(1).max(10), frequency: z.string(), persona: z.string() })),
  secondaryPainPoints: z.array(z.object({ pain: z.string(), severity: z.number().min(1).max(10), frequency: z.string() })),
  summary: z.string(),
});

export const PersonasSchema = z.object({
  primaryPersonas: z.array(z.object({ name: z.string(), role: z.string(), goals: z.array(z.string()), frustrations: z.array(z.string()), techLevel: z.number().min(1).max(10) })),
  secondaryPersonas: z.array(z.object({ name: z.string(), role: z.string(), goals: z.array(z.string()), frustrations: z.array(z.string()) })),
  antiPersonas: z.array(z.string()).optional(),
});

export const FeaturesSchema = z.object({
  mvpFeatures: z.array(z.object({ name: z.string(), description: z.string(), priority: z.enum(['critical', 'high', 'medium', 'low']), effort: z.enum(['small', 'medium', 'large', 'xlarge']) })),
  futureFeatures: z.array(z.object({ name: z.string(), description: z.string(), priority: z.enum(['medium', 'low']) })),
  dependencies: z.array(z.object({ feature: z.string(), dependsOn: z.array(z.string()) })).optional(),
});

export const InnovationSchema = z.object({
  noveltyScore: z.number().min(1).max(10),
  uniqueDifferentiators: z.array(z.string()),
  patentPotential: z.string().optional(),
  disruptionLevel: z.enum(['low', 'medium', 'high', 'transformative']),
  innovationAreas: z.array(z.object({ area: z.string(), description: z.string(), impact: z.number().min(1).max(10) })),
});

export const BusinessSchema = z.object({
  revenueModel: z.object({ primary: z.string(), secondary: z.array(z.string()), pricingStrategy: z.string() }),
  costStructure: z.object({ fixedCosts: z.array(z.string()), variableCosts: z.array(z.string()), breakEvenUnits: z.number().optional() }),
  goToMarket: z.object({ channels: z.array(z.string()), timeline: z.string(), acquisitionStrategy: z.string() }),
  financialProjections: z.object({ year1: z.string(), year2: z.string(), year3: z.string() }).optional(),
});

export const TechnologySchema = z.object({
  recommendedStack: z.object({ frontend: z.array(z.string()), backend: z.array(z.string()), database: z.array(z.string()), infrastructure: z.array(z.string()) }),
  architecturePattern: z.string(),
  thirdPartyServices: z.array(z.object({ service: z.string(), purpose: z.string(), cost: z.string().optional() })),
  scalabilityConsiderations: z.array(z.string()),
});

export const SecuritySchema = z.object({
  threatModel: z.array(z.object({ threat: z.string(), severity: z.enum(['low', 'medium', 'high', 'critical']), mitigation: z.string() })),
  compliance: z.array(z.string()),
  securityControls: z.array(z.object({ control: z.string(), description: z.string(), priority: z.enum(['must-have', 'should-have', 'nice-to-have']) })),
  dataHandling: z.object({ encryption: z.string(), storage: z.string(), retention: z.string() }),
});

export const ScalabilitySchema = z.object({
  projectedLoad: z.object({ concurrentUsers: z.string(), dataVolume: z.string(), requestRate: z.string() }),
  scalingStrategy: z.object({ horizontal: z.array(z.string()), vertical: z.array(z.string()), caching: z.array(z.string()) }),
  bottlenecks: z.array(z.object({ component: z.string(), risk: z.string(), solution: z.string() })),
  costProjections: z.object({ current: z.string(), atScale: z.string() }).optional(),
});

export const FutureSchema = z.object({
  roadmap: z.array(z.object({ phase: z.string(), features: z.array(z.string()), timeline: z.string() })),
  emergingTrends: z.array(z.object({ trend: z.string(), relevance: z.string(), adoptionHorizon: z.string() })),
  expansionOpportunities: z.array(z.string()),
  risks: z.array(z.object({ risk: z.string(), probability: z.enum(['low', 'medium', 'high']), impact: z.enum(['low', 'medium', 'high']), mitigation: z.string() })),
});

export const ResearchSchemas: Record<string, z.ZodSchema> = {
  problem: ProblemResearchSchema,
  industry: IndustryResearchSchema,
  market: MarketResearchSchema,
  competitors: CompetitorResearchSchema,
  painpoints: PainPointsSchema,
  personas: PersonasSchema,
  features: FeaturesSchema,
  innovation: InnovationSchema,
  business: BusinessSchema,
  technology: TechnologySchema,
  security: SecuritySchema,
  scalability: ScalabilitySchema,
  future: FutureSchema,
};
