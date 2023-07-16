import { z } from 'zod';

export const imageSchema = z
  // cannot do z.instanceof(File) directly due to SSR
  .instanceof<{
    new (
      fileBits: BlobPart[],
      fileName: string,
      options?: FilePropertyBag | undefined
    ): File;
    prototype: File;
  }>(typeof File !== 'undefined' ? File : ({} as any))
  .nullable()
  // check if less than 5mb
  .refine(
    (value) => {
      if (!value) return true;
      return value.size < 5 * 1024 * 1024;
    },
    { message: 'Image must be less than 5MB.' }
  );

export type ImageSchema = z.infer<typeof imageSchema>;
