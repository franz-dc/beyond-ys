import { z } from 'zod';

export const userSchema = z.object({
  username: z.string().min(1),
  role: z.enum(['admin', 'user']),
  createdAt: z.any(),
  updatedAt: z.any(),
});

export type UserSchema = z.infer<typeof userSchema>;
