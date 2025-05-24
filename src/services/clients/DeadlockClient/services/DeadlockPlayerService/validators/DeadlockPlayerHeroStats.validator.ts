import { z } from 'zod';

const DeadlockPlayerHeroStatsSchema = z.object({
  hero_id: z.number(),
  matches_played: z.number(),
  wins: z.number(),
  ending_level: z.number(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  denies_per_match: z.number(),
  kills_per_min: z.number(),
  deaths_per_min: z.number(),
  assists_per_min: z.number(),
  denies_per_min: z.number(),
  networth_per_min: z.number(),
  last_hits_per_min: z.number(),
  damage_mitigated_per_min: z.number(),
  damage_taken_per_min: z.number(),
  creeps_per_min: z.number(),
  obj_damage_per_min: z.number(),
  accuracy: z.number(),
  crit_shot_rate: z.number(),
  matches: z.array(z.number()),
});

export type DeadlockPlayerHeroStatsDTO = z.infer<typeof DeadlockPlayerHeroStatsSchema>;
export default DeadlockPlayerHeroStatsSchema;
