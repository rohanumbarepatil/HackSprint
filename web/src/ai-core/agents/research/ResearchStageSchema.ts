import { z } from 'zod';

export const ResearchStageOutputSchema = z.object({
  title: z.string(),
  summary: z.string(),
  detailedAnalysis: z.string(),
  confidenceScore: z.number().min(0).max(100),
  sources: z.array(z.string()),
  timestamp: z.number(),
});

export type ResearchStageOutput = z.infer<typeof ResearchStageOutputSchema>;
