import { z } from 'zod';

const DeadlockHeroDescriptionSchema = z.object({
  lore: z.string(),
  role: z.string(),
  playstyle: z.string(),
});

export type DeadlockHeroDescriptionDTO = z.infer<typeof DeadlockHeroDescriptionSchema>;
export default DeadlockHeroDescriptionSchema;
