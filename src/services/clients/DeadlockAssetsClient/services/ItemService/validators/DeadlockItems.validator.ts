import { z } from 'zod';
import DeadlockItemSchema from './DeadlockItem.validator';

const DeadlockItemsSchema = z.array(DeadlockItemSchema);

export type DeadlockItemsDTO = z.infer<typeof DeadlockItemsSchema>;
export default DeadlockItemsSchema;
