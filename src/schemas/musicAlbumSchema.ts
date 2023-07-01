import { z } from 'zod';

import { musicSchema } from './musicSchema';

export const musicAlbumSchema = z.object({
  name: z.string().min(1),
  musicIds: z.string().array(),
  // releaseDate is string because some albums might not have a release date
  // or have partial dates which is not supported by firestore's timestamp
  releaseDate: z.string().refine(
    (v) => {
      const date = new Date(v);
      return date instanceof Date && !isNaN(date.valueOf());
    },
    { message: 'Invalid date' }
  ),
  updatedAt: z.any(),
  // for reducing the amount of reads
  // to be used in the music (albums) page
  cachedMusic: z.record(musicSchema),
});

export type MusicAlbumSchema = z.infer<typeof musicAlbumSchema>;

export type MusicAlbumCacheSchema = Pick<
  MusicAlbumSchema,
  'name' | 'releaseDate'
>;
