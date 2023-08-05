import { credential } from 'firebase-admin';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const app = initializeApp({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  credential: credential.cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const auth = getAuth(app);

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { authorization } = req.headers;
    if (!authorization)
      return res.status(401).json({ message: 'Unauthorized' });

    const decodedToken = await auth.verifyIdToken(authorization);
    if (decodedToken.role !== 'admin')
      return res.status(401).json({ message: 'Insufficient permissions' });

    const { paths } = req.body;
    if (!paths) return res.status(400).json({ message: 'No paths provided' });

    const pathsSchema = z.string().array().nonempty();
    const parsedPaths = pathsSchema.safeParse(paths);
    if (!parsedPaths.success)
      return res.status(400).json({ message: 'Invalid paths provided' });

    await Promise.all(paths.map((path: string) => res.revalidate(path)));
    return res.status(200).json({ message: 'Revalidation successful' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Revalidation failed' });
  }
}
