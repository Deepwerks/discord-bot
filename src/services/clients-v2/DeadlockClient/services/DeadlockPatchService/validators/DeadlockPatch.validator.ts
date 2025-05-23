import { z } from 'zod';

const DeadlockPatchSchema = z.object({
  title: z.string(),
  pub_date: z.string(),
  link: z.string(),
  guid: z.object({
    is_perma_link: z.boolean(),
    text: z.string(),
  }),
  author: z.string(),
  content_encoded: z.string(),
});

export type DeadlockPatchDTO = z.infer<typeof DeadlockPatchSchema>;
export default DeadlockPatchSchema;
