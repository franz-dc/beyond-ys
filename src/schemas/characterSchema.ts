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
  imageGalleryPaths: z.string().min(1).array(),
  imageDirection: z.enum(['left', 'right']),
  updatedAt: z.any(),
  // for getting the download url from firebase storage
  mainImageUrl: z.string().optional(),
  imageGalleryUrls: z.string().optional(),
  // not to be edited directly
  // for reducing the amount of reads
  gameIds: z.string().min(1).array(),
  cachedGameNames: z.record(z.string()),
});

export type CharacterSchema = z.infer<typeof characterSchema>;

export const characterCacheSchema = characterSchema.pick({
  name: true,
  accentColor: true,
  imageDirection: true,
});

export type CharacterCacheSchema = z.infer<typeof characterCacheSchema>;
