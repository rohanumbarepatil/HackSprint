import { z } from 'zod';

// 1. Problem Analyzer
export const ProblemAnalyzerSchema = z.object({
  coreProblem: z.string(),
  targetAudience: z.array(z.string()),
  valueProposition: z.string(),
});

// 2. Research
export const ResearchSchema = z.object({
  marketSize: z.string(),
  trends: z.array(z.string()),
  opportunities: z.array(z.string()),
});

// 3. Competitor Analysis
export const CompetitorAnalysisSchema = z.object({
  directCompetitors: z.array(z.object({ name: z.string(), weakness: z.string() })),
  indirectCompetitors: z.array(z.object({ name: z.string(), weakness: z.string() })),
  competitiveAdvantage: z.string(),
});

// 4. Innovation
export const InnovationSchema = z.object({
  noveltyScore: z.number().min(1).max(10),
  uniqueFeatures: z.array(z.string()),
  differentiators: z.array(z.string()),
});

// 5. Product Manager (PRD)
export const PRDSchema = z.object({
  productName: z.string(),
  userPersonas: z.array(z.string()),
  userStories: z.array(z.string()),
  mvpFeatures: z.array(z.string()),
  futureFeatures: z.array(z.string()),
});

// 6. Technical Architect (TRD)
export const TRDSchema = z.object({
  frontendStack: z.string(),
  backendStack: z.string(),
  infrastructure: z.string(),
  systemArchitecture: z.string(),
});

// 7. Database Architect
export const DatabaseSchema = z.object({
  databaseType: z.enum(['relational', 'nosql', 'graph']),
  collections: z.array(z.object({
    name: z.string(),
    fields: z.array(z.object({ name: z.string(), type: z.string(), required: z.boolean() }))
  })),
});

// 8. API Architect
export const APISchema = z.object({
  restEndpoints: z.array(z.object({ method: z.string(), path: z.string(), description: z.string() })),
  graphqlMutations: z.array(z.string()).optional(),
});

// 9. UI/UX Designer
export const UISchema = z.object({
  designSystem: z.object({ primaryColor: z.string(), font: z.string() }),
  screens: z.array(z.object({ name: z.string(), layout: z.string(), components: z.array(z.string()) })),
});

// 10. DevOps
export const DevOpsSchema = z.object({
  ciCdPipeline: z.array(z.string()),
  hostingProvider: z.string(),
  scalingStrategy: z.string(),
});

// 11. Security
export const SecuritySchema = z.object({
  authentication: z.string(),
  authorizationRoles: z.array(z.string()),
  dataEncryption: z.string(),
});

// 12. QA
export const QASchema = z.object({
  unitTests: z.array(z.string()),
  e2eTests: z.array(z.string()),
  manualTestingSteps: z.array(z.string()),
});

// 13. Business Analyst
export const BusinessModelSchema = z.object({
  revenueStreams: z.array(z.string()),
  pricingTiers: z.array(z.object({ name: z.string(), price: z.string() })),
  customerAcquisitionCost: z.string(),
});

// 14. Pitch Deck
export const PitchDeckSchema = z.object({
  slides: z.array(z.object({ title: z.string(), content: z.string() })),
  elevatorPitch: z.string(),
});

// 15. Implementation Plan
export const ImplementationSchema = z.object({
  phases: z.array(z.object({
    name: z.string(),
    tasks: z.array(z.string()),
    estimatedWeeks: z.number(),
  })),
});

// 16. Backend (combined API + DevOps)
export const BackendSchema = z.object({
  restEndpoints: z.array(z.object({ method: z.string(), path: z.string(), description: z.string() })),
  graphqlMutations: z.array(z.string()).optional(),
  ciCdPipeline: z.array(z.string()),
  hostingProvider: z.string(),
  scalingStrategy: z.string(),
});

// 17. Validation & Quality
export const ValidationSchema = z.object({
  overallScore: z.number().min(1).max(10),
  consistencyIssues: z.array(z.string()),
  completenessIssues: z.array(z.string()),
  recommendations: z.array(z.string()),
  approved: z.boolean(),
});

export const ModuleSchemas: Record<string, z.ZodSchema> = {
  'problem': ProblemAnalyzerSchema,
  'research': ResearchSchema,
  'competitors': CompetitorAnalysisSchema,
  'innovation': InnovationSchema,
  'prd': PRDSchema,
  'trd': TRDSchema,
  'database': DatabaseSchema,
  'api': APISchema,
  'ui-ux': UISchema,
  'devops': DevOpsSchema,
  'backend': BackendSchema,
  'security': SecuritySchema,
  'qa': QASchema,
  'business': BusinessModelSchema,
  'pitch': PitchDeckSchema,
  'implementation': ImplementationSchema,
  'validation': ValidationSchema,
};
