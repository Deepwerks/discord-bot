import { z } from 'zod';
import DeadlockMMRHistoryRecordSchema from './DeadlockMMRHistoryRecord.validator';

const DeadlockMMRHistorySchema = z.array(DeadlockMMRHistoryRecordSchema);

export type DeadlockMMRHistoryDTO = z.infer<typeof DeadlockMMRHistorySchema>;
export default DeadlockMMRHistorySchema;
