import { z } from 'zod';

const StatlockerProfileSchema = z.object({
  accountId: z.number(),
  name: z.string(),
  avatarUrl: z.string(),
  performanceRankMessage: z.string().nullable(),
});

export type StatlockerProfileDTO = z.infer<typeof StatlockerProfileSchema>;
export default StatlockerProfileSchema;
