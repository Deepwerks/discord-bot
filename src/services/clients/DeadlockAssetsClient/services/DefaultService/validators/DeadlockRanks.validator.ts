import { z } from 'zod';
import DeadlockRankSchema from './DeadlockRank.validator';

const DeadlockRanksSchema = z.array(DeadlockRankSchema);

export type DeadlockRanksDTO = z.infer<typeof DeadlockRanksSchema>;
export default DeadlockRanksSchema;
