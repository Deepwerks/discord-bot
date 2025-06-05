import { z } from 'zod';
import DeadlockMatchPlayerSchema from './DeadlockMatchPlayer.validator';

const DeadlockMatchSchema = z.object({
  match_info: z.object({
    match_id: z.number(),
    start_time: z.number(),
    duration_s: z.number(),
    match_outcome: z.number(),
    winning_team: z.number(),
    players: z.array(DeadlockMatchPlayerSchema),
    average_badge_team0: z.number().nullable(),
    average_badge_team1: z.number().nullable(),
  }),
});

export type DeadlockMatchDTO = z.infer<typeof DeadlockMatchSchema>;
export default DeadlockMatchSchema;
