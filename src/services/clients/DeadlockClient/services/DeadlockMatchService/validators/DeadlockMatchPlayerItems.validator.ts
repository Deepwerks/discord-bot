import { z } from 'zod';

const DeadlockMatchPlayerItemsSchema = z.array(
  z.object({
    game_time_s: z.number(),
    item_id: z.number(),
    upgrade_id: z.number(),
    sold_time_s: z.number(),
    flags: z.number(),
    imbued_ability_id: z.number(),
  })
);

export type DeadlockMatchPlayerItemsDTO = z.infer<typeof DeadlockMatchPlayerItemsSchema>;
export default DeadlockMatchPlayerItemsSchema;
