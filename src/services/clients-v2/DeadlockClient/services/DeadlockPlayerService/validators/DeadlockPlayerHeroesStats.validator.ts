import { z } from 'zod';
import DeadlockPlayerHeroStatsSchema from './DeadlockPlayerHeroStats.validator';

const DeadlockPlayerHeroesStatsSchema = z.array(DeadlockPlayerHeroStatsSchema);

export type DeadlockPlayerHeroesStatsDTO = z.infer<typeof DeadlockPlayerHeroesStatsSchema>;
export default DeadlockPlayerHeroesStatsSchema;
