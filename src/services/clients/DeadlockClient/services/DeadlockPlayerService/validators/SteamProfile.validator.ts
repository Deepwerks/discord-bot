import { z } from 'zod';

const SteamProfileSchema = z.object({
  account_id: z.number(),
  avatar: z.string(),
  countrycode: z.string().nullable(),
  last_updated: z.string().datetime(),
  personaname: z.string(),
  profileurl: z.string(),
  realname: z.string().nullable(),
});

export type SteamProfileDTO = z.infer<typeof SteamProfileSchema>;
export default SteamProfileSchema;
