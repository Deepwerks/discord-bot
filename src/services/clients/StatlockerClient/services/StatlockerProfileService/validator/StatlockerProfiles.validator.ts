import { z } from 'zod';
import StatlockerProfileSchema from './StatlockerProfile.validator';

const StatlockerProfilesSchema = z.array(StatlockerProfileSchema);

export type StatlockerProfilesDTO = z.infer<typeof StatlockerProfilesSchema>;
export default StatlockerProfilesSchema;
