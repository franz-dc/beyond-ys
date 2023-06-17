import { z } from 'zod';

import { musicSchema } from './musicSchema';

export const gameSchema = z.object({
  name: z.string(),
  category: z.string(),
  subcategory: z.string(),
  platforms: z.string().array(),
  releaseDate: z.string(),
  description: z.string(),
  descriptionSourceName: z.string(),
  descriptionSourceUrl: z.string(),
  characters: z.string().array(),
  characterSpoilers: z.string().array(),
  soundtrackIds: z.string().array(),
  updatedAt: z.any(),
  // for getting the download url from firebase storage
  bannerUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  // for reducing the amount of reads
  cachedSoundtracks: z.record(musicSchema),
  // for editing cache
  // not to be edited in a form directly
  dependentCharacterIds: z.string().array(),
});

export type GameSchema = z.infer<typeof gameSchema>;
