import { z } from 'zod';

export const staffInfoSchema = z.object({
  description: z.string(),
  descriptionSourceName: z.string(),
  descriptionSourceUrl: z.string(),
  games: z
    .object({
      gameId: z.string(),
      role: z.string(),
      // cached name (to reduce reads)
      name: z.string(),
    })
    .array(),
});

export type StaffInfoSchema = z.infer<typeof staffInfoSchema>;
