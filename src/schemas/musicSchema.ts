import { z } from 'zod';

export const musicSchema = z.object({
  title: z.string(),
  albumId: z.string(),
  composerIds: z.string().array(),
  arrangerIds: z.string().array(),
  otherArtists: z
    .object({
      staffId: z.string(),
      role: z.string(),
    })
    .array(),
  duration: z.string(),
  youtubeId: z.string(),
  updatedAt: z.any(),
  // used for editing caches
  // not to be edited in a form directly
  dependentGameIds: z.string().array(),
});

export type MusicSchema = z.infer<typeof musicSchema>;

export type MusicCacheSchema = Pick<MusicSchema, 'title' | 'albumId'>;
