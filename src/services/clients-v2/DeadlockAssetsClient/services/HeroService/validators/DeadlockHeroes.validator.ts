import { z } from 'zod';
import DeadlockHeroSchema from './DeadlockHero.validator';

const DeadlockHeroesSchema = z.array(DeadlockHeroSchema);

export type DeadlockRanksDTO = z.infer<typeof DeadlockHeroesSchema>;
export default DeadlockHeroesSchema;
