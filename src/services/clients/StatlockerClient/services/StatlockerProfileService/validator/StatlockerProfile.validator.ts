import { z } from 'zod';

const StatlockerProfileSchema = z.object({
  accountId: z.number(),
  name: z.string(),
  avatarUrl: z.string(),
  performanceRankMessage: z.string().nullable(),
  lastUpdated: z.string().nullable(),
  ppScore: z.number().nullable(),
  estimatedRankNumber: z.number().nullable(),
});

export type StatlockerProfileDTO = z.infer<typeof StatlockerProfileSchema>;
export default StatlockerProfileSchema;
