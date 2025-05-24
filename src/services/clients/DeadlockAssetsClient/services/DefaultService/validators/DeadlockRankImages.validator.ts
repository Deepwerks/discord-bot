import { z } from 'zod';

const DeadlockRankImagesSchema = z.object({
  large: z.string().url(),
  large_webp: z.string().url(),
  small: z.string().url().optional(),
  small_webp: z.string().url().optional(),
  large_subrank1: z.string().url().optional(),
  large_subrank1_webp: z.string().url().optional(),
  large_subrank2: z.string().url().optional(),
  large_subrank2_webp: z.string().url().optional(),
  large_subrank3: z.string().url().optional(),
  large_subrank3_webp: z.string().url().optional(),
  large_subrank4: z.string().url().optional(),
  large_subrank4_webp: z.string().url().optional(),
  large_subrank5: z.string().url().optional(),
  large_subrank5_webp: z.string().url().optional(),
  large_subrank6: z.string().url().optional(),
  large_subrank6_webp: z.string().url().optional(),
  small_subrank1: z.string().url().optional(),
  small_subrank1_webp: z.string().url().optional(),
  small_subrank2: z.string().url().optional(),
  small_subrank2_webp: z.string().url().optional(),
  small_subrank3: z.string().url().optional(),
  small_subrank3_webp: z.string().url().optional(),
  small_subrank4: z.string().url().optional(),
  small_subrank4_webp: z.string().url().optional(),
  small_subrank5: z.string().url().optional(),
  small_subrank5_webp: z.string().url().optional(),
  small_subrank6: z.string().url().optional(),
  small_subrank6_webp: z.string().url().optional(),
});

export type DeadlockRankImagesDTO = z.infer<typeof DeadlockRankImagesSchema>;
export default DeadlockRankImagesSchema;
