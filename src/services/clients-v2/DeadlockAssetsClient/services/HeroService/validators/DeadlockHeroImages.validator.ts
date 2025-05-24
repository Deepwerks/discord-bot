import { z } from 'zod';

const DeadlockHeroImagesSchema = z.object({
  icon_hero_card: z.string().url(),
  icon_hero_card_webp: z.string().url(),
  icon_image_small: z.string().url(),
  icon_image_small_webp: z.string().url(),
  minimap_image: z.string().url(),
  minimap_image_webp: z.string().url(),
  selection_image: z.string().url(),
  selection_image_webp: z.string().url(),
  top_bar_image: z.string().url(),
  top_bar_image_webp: z.string().url(),
});

export type DeadlockHeroImagesDTO = z.infer<typeof DeadlockHeroImagesSchema>;
export default DeadlockHeroImagesSchema;
