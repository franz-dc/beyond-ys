import { z } from 'zod';

export const staffSchema = z.object({
  name: z.string(),
  avatarPath: z.string(),
  roles: z.string().array(),
});

export type StaffSchema = z.infer<typeof staffSchema>;
