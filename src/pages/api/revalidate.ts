import { credential } from 'firebase-admin';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { NextApiRequest, NextApiResponse } from 'next';
import NextCors from 'nextjs-cors';

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

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await NextCors(req, res, {
      methods: ['POST'],
      // TODO: Change this to admin URL after MVP is complete
      origin: '*',
      optionsSuccessStatus: 200,
    });

    const { authorization } = req.headers;
    if (!authorization)
      return res.status(401).json({ message: 'Unauthorized' });

    const decodedToken = await auth.verifyIdToken(authorization);
    if (decodedToken.role !== 'admin')
      return res.status(401).json({ message: 'Insufficient permissions' });

    const paths = req.query.path as string;
    if (!paths) return res.status(400).json({ message: 'No path provided' });

    const formattedPaths = paths.split(',');
    await Promise.all(formattedPaths.map((path) => res.revalidate(path)));
    return res.status(200).json({ message: 'Revalidation successful' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Revalidation failed' });
  }
};

export default handler;
