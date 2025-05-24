import { z } from 'zod';

const DeadlockCustomMatchSchema = z.object({
  party_id: z.number(),
  party_code: z.string(),
});

export type DeadlockCustomMatchDTO = z.infer<typeof DeadlockCustomMatchSchema>;
export default DeadlockCustomMatchSchema;
