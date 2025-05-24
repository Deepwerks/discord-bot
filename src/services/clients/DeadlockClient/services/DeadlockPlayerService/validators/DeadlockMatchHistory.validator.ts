import { z } from 'zod';
import DeadlockMatchHistoryRecordSchema from './DeadlockMatchHistoryRecord.validator';

const DeadlockMatchHistorySchema = z.array(DeadlockMatchHistoryRecordSchema);

export type DeadlockMatchHistoryDTO = z.infer<typeof DeadlockMatchHistorySchema>;
export default DeadlockMatchHistorySchema;
