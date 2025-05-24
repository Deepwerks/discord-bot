import { z } from 'zod';

const DeadlockMMRHistoryRecordSchema = z.object({
  match_id: z.number(),
  player_score: z.number(),
  rank: z.number(),
  division: z.number(),
  division_tier: z.number(),
});

export type DeadlockMMRHistoryRecordDTO = z.infer<typeof DeadlockMMRHistoryRecordSchema>;
export default DeadlockMMRHistoryRecordSchema;
