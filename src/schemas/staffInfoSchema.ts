import { z } from 'zod';

import { musicSchema } from './musicSchema';

export const staffInfoSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  descriptionSourceName: z.string(),
  descriptionSourceUrl: z.string(),
  roles: z.string().min(1).array(),
  games: z
    .object({
      gameId: z.string().min(1),
      roles: z.string().array(),
    })
    .array(),
  updatedAt: z.any(),
  // for getting the download url from firebase storage
  avatarUrl: z.string().optional(),
  // doing this to reduce reads
  cachedMusic: z.array(
    musicSchema.extend({
      id: z.string(),
    })
  ),
});

export type StaffInfoSchema = z.infer<typeof staffInfoSchema>;
