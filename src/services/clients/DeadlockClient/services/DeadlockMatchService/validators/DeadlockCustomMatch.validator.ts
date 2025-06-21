import { z } from 'zod';

const DeadlockCustomMatchSchema = z.object({
  party_id: z.string(),
  party_code: z.string(),
});

export type DeadlockCustomMatchDTO = z.infer<typeof DeadlockCustomMatchSchema>;
export default DeadlockCustomMatchSchema;
