import { z } from 'zod';

import { characterCacheSchema } from './characterSchema';
import { musicSchema } from './musicSchema';

export const gameSchema = z.object({
  name: z.string().min(1),
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
  // for reducing the amount of reads
  cachedSoundtracks: z.record(musicSchema),
  cachedCharacters: z.record(characterCacheSchema),
});

export type GameSchema = z.infer<typeof gameSchema>;
