import { z } from 'zod';

const DeadlockHeroImagesSchema = z.object({
  icon_hero_card: z.string().url().nullable().optional(),
  icon_hero_card_webp: z.string().url().nullable().optional(),
  icon_image_small: z.string().url().nullable().optional(),
  icon_image_small_webp: z.string().url().nullable().optional(),
  minimap_image: z.string().url().nullable().optional(),
  minimap_image_webp: z.string().url().nullable().optional(),
  selection_image: z.string().url().nullable().optional(),
  selection_image_webp: z.string().url().nullable().optional(),
  top_bar_image: z.string().url().nullable().optional(),
  top_bar_image_webp: z.string().url().nullable().optional(),
});

export type DeadlockHeroImagesDTO = z.infer<typeof DeadlockHeroImagesSchema>;
export default DeadlockHeroImagesSchema;
