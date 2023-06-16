import { z } from 'zod';

import { musicSchema } from './musicSchema';

export const musicAlbumSchema = z.object({
  name: z.string(),
  musicIds: z.string().array(),
  updatedAt: z.any(),
  // for reducing the amount of reads
  // to be used in the music (albums) page
  cachedMusic: z.record(musicSchema),
});

export type MusicAlbumSchema = z.infer<typeof musicAlbumSchema>;
