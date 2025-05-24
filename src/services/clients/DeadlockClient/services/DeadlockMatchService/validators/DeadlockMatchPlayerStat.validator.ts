import { z } from 'zod';

const DeadlockMatchPlayerStatSchema = z.object({
  net_worth: z.number(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  creep_kills: z.number(),
  neutral_kills: z.number(),
  player_damage: z.number(),
  neutral_damage: z.number(),
  boss_damage: z.number(),
  denies: z.number(),
  player_healing: z.number(),
  ability_points: z.number(),
  self_healing: z.number(),
  player_damage_taken: z.number(),
});

export type DeadlockMatchPlayerStatDTO = z.infer<typeof DeadlockMatchPlayerStatSchema>;
export default DeadlockMatchPlayerStatSchema;
