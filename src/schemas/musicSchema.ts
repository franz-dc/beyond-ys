import { z } from 'zod';

export const musicSchema = z.object({
  title: z.string().min(1),
  albumId: z.string(),
  composerIds: z.string().min(1).array(),
  arrangerIds: z.string().min(1).array(),
  otherArtists: z
    .object({
      staffId: z.string().min(1),
      role: z.string(),
    })
    .array(),
  duration: z.number().int().min(0), // in seconds
  youtubeId: z.string().refine((v) => v.length === 0 || v.length === 11, {
    message: 'Youtube ID must be 11 characters long',
  }),
  updatedAt: z.any(),
  // used for editing caches
  // not to be edited in a form directly
  dependentGameIds: z.string().array(),
});

export type MusicSchema = z.infer<typeof musicSchema>;

// only used for listing music in edit music page
export type MusicCacheSchema = Pick<MusicSchema, 'title' | 'albumId'>;
