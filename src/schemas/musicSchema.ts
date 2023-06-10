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
});

export type MusicSchema = z.infer<typeof musicSchema>;
