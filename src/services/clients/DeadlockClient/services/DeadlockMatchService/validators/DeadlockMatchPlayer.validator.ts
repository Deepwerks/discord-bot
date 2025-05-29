import { z } from 'zod';
import DeadlockMatchPlayerStatSchema from './DeadlockMatchPlayerStat.validator';
import DeadlockMatchPlayerItemsSchema from './DeadlockMatchPlayerItems.validator';

const DeadlockMatchPlayerSchema = z.object({
  account_id: z.number(),

  player_slot: z.number(),
  team: z.number(),
  hero_id: z.number(),
  party: z.number(),

  stats: z.array(DeadlockMatchPlayerStatSchema),
  items: DeadlockMatchPlayerItemsSchema,

  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  net_worth: z.number(),
  last_hits: z.number(),
  denies: z.number(),
  ability_points: z.number(),

  assigned_lane: z.number(),
});

export type DeadlockMatchPlayerDTO = z.infer<typeof DeadlockMatchPlayerSchema>;
export default DeadlockMatchPlayerSchema;
