import { z } from 'zod';

const DeadlockItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  image: z.string().url().optional(),
});

export type DeadlockItemDTO = z.infer<typeof DeadlockItemSchema>;
export default DeadlockItemSchema;
