import { z } from 'zod';

const DeadlockMatchHistoryRecordSchema = z.object({
  account_id: z.number(),
  match_id: z.number(),
  hero_id: z.number(),
  hero_level: z.number(),
  start_time: z.number(),
  game_mode: z.number(),
  match_mode: z.number(),
  player_team: z.number(),
  player_kills: z.number(),
  player_deaths: z.number(),
  player_assists: z.number(),
  denies: z.number(),
  net_worth: z.number(),
  last_hits: z.number(),
  team_abandoned: z.number().nullable(),
  abandoned_time_s: z.number().nullable(),
  match_duration_s: z.number(),
  match_result: z.number(),
  objectives_mask_team0: z.number(),
  objectives_mask_team1: z.number(),
});

export type DeadlockMatchHistoryRecordDTO = z.infer<typeof DeadlockMatchHistoryRecordSchema>;
export default DeadlockMatchHistoryRecordSchema;
