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
  // to prevent unnecessary requests
  hasAvatar: z.boolean(),
  // musicIds and cachedMusic are not to be edited directly
  // doing this to reduce reads
  musicIds: z.string().min(1).array(),
  cachedMusic: z.record(musicSchema),
  // schema additions (optional)
  aliases: z.string().min(1).array().optional(),
  relevantLinks: z
    .object({
      name: z.string().min(1),
      url: z.string().min(1),
    })
    .array()
    .optional(),
});

export type StaffInfoSchema = z.infer<typeof staffInfoSchema>;

export type StaffInfoCacheSchema = Pick<
  StaffInfoSchema,
  'name' | 'roles' | 'hasAvatar'
>;
