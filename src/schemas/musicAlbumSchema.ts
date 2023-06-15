import { z } from 'zod';

import { musicSchema } from './musicSchema';

export const musicAlbumSchema = z.object({
  name: z.string(),
  musicIds: z.string().array(),
  updatedAt: z.any(),
  // for reducing the amount of reads
  cachedMusic: z.array(
    musicSchema.extend({
      id: z.string(),
    })
  ),
});

export type MusicAlbumSchema = z.infer<typeof musicAlbumSchema>;
