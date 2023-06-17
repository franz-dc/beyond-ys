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
  gameIds: z.string().min(1).array(),
  imagePaths: z.string().min(1).array(),
  updatedAt: z.any(),
  // for getting the download url from firebase storage
  imageUrls: z.string().optional(),
  // for reducing the amount of reads
  cachedGameNames: z.record(z.string()),
});

export type CharacterSchema = z.infer<typeof characterSchema>;
