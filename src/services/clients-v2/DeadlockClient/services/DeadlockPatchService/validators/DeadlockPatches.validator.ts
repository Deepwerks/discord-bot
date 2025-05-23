import { z } from 'zod';
import DeadlockPatchSchema from './DeadlockPatch.validator';

const DeadlockPatchesSchema = z.array(DeadlockPatchSchema);

export type DeadlockPatchesDTO = z.infer<typeof DeadlockPatchesSchema>;
export default DeadlockPatchesSchema;
