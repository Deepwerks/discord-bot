import { z } from 'zod';

const DeadlockHeroDescriptionSchema = z.object({
  lore: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  playstyle: z.string().nullable().optional(),
});

export type DeadlockHeroDescriptionDTO = z.infer<typeof DeadlockHeroDescriptionSchema>;
export default DeadlockHeroDescriptionSchema;
