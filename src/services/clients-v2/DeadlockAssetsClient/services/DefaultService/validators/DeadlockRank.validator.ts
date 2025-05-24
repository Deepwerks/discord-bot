import { z } from 'zod';
import DeadlockRankImagesSchema from './DeadlockRankImages.validator';

const DeadlockRankSchema = z.object({
  tier: z.number(),
  name: z.string(),
  images: DeadlockRankImagesSchema,
  color: z.string(),
});

export type DeadlockRankDTO = z.infer<typeof DeadlockRankSchema>;
export default DeadlockRankSchema;
