import { z } from 'zod';

const DeadlockMatchIdSchema = z.object({
  match_id: z.number(),
});

export type DeadlockMatchIdDTO = z.infer<typeof DeadlockMatchIdSchema>;
export default DeadlockMatchIdSchema;
