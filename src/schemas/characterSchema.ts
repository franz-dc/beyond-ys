import { z } from 'zod';

export const characterSchema = z.object({
  name: z.string().min(1),
  category: z.string(),
  description: z.string(),
  descriptionSourceName: z.string(),
  descriptionSourceUrl: z.string(),
  containsSpoilers: z.boolean(),
  accentColor: z.string().refine(
    (v) => {
      if (v.length === 0) return true;
      return /^#[0-9A-F]{6}$/i.test(v);
    },
    { message: 'Accent color must be a valid hex color code' }
  ),
  extraImages: z
    .object({
      path: z.string().min(1),
      caption: z.string(),
    })
    .array(),
  imageDirection: z.enum(['left', 'right']),
  voiceActors: z
    .object({
      staffId: z.string().min(1),
      language: z.string().min(1),
      description: z.string(),
    })
    .array(),
  updatedAt: z.any(),
  // to prevent unnecessary requests
  hasMainImage: z.boolean(),
  hasAvatar: z.boolean(),
  // not to be edited directly
  // for reducing the amount of reads
  gameIds: z.string().min(1).array(),
  cachedGames: z.record(
    z.object({
      name: z.string(),
      category: z.string(),
      releaseDate: z.string(),
      hasCoverImage: z.boolean(),
    })
  ),
});

export type CharacterSchema = z.infer<typeof characterSchema>;

export const characterCacheSchema = characterSchema.pick({
  name: true,
  category: true,
  accentColor: true,
  imageDirection: true,
  hasAvatar: true,
});

export type CharacterCacheSchema = z.infer<typeof characterCacheSchema>;
