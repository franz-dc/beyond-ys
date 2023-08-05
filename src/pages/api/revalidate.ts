import { apps, credential } from 'firebase-admin';
import { type App, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { NextApiRequest, NextApiResponse } from 'next';
import NextCors from 'nextjs-cors';

const app = apps.some((app) => app?.name === 'beyond-ys-admin')
  ? (apps?.find((app) => app?.name === 'beyond-ys-admin') as App)
  : initializeApp(
      {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        credential: credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
            /\\n/g,
            '\n'
          ),
        }),
      },
      'beyond-ys-admin'
    );
const auth = getAuth(app);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await NextCors(req, res, {
    methods: ['GET'],
    origin: '*',
    optionsSuccessStatus: 200,
  });

  if (req.method !== 'GET')
    return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { authorization } = req.headers;
    if (!authorization)
      return res.status(401).json({ message: 'Unauthorized' });

    const decodedToken = await auth.verifyIdToken(authorization);
    if (decodedToken.role !== 'admin')
      return res.status(401).json({ message: 'Insufficient permissions' });

    const paths = req.query.paths as string;
    if (!paths) return res.status(400).json({ message: 'No paths provided' });

    const formattedPaths = paths.split(',');
    await Promise.all(formattedPaths.map((path) => res.revalidate(path)));
    return res.status(200).json({ message: 'Revalidation successful' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Revalidation failed' });
  }
}
