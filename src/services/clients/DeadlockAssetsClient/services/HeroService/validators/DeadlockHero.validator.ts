import { z } from 'zod';
import DeadlockHeroImagesSchema from './DeadlockHeroImages.validator';
import DeadlockHeroDescriptionSchema from './DeadlockHeroDescription.validator';

const DeadlockHeroSchema = z.object({
  id: z.number(),
  class_name: z.string(),
  name: z.string(),
  images: DeadlockHeroImagesSchema,
  description: DeadlockHeroDescriptionSchema,
  disabled: z.boolean(),
  in_development: z.boolean(),
  limited_testing: z.boolean(),
});

export type DeadlockHeroDTO = z.infer<typeof DeadlockHeroSchema>;
export default DeadlockHeroSchema;
