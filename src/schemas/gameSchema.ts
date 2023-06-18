import { z } from 'zod';

import { musicSchema } from './musicSchema';

export const gameSchema = z.object({
  name: z.string(),
  category: z.string(),
  subcategory: z.string(),
  platforms: z.string().min(1).array(),
  // releaseDate to be converted to a date object when fetched
  // stored as a string in firestore to account for unknown release dates
  releaseDate: z.date().nullable().or(z.string()),
  description: z.string(),
  descriptionSourceName: z.string(),
  descriptionSourceUrl: z.string(),
  characterIds: z.string().min(1).array(),
  characterSpoilerIds: z.string().min(1).array(),
  soundtrackIds: z.string().array(),
  updatedAt: z.any(),
  // for getting the download url from firebase storage
  bannerUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  // for reducing the amount of reads
  cachedSoundtracks: z.record(musicSchema),
});

export type GameSchema = z.infer<typeof gameSchema>;
