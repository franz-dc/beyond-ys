/* eslint-disable no-console */
import dotenv from 'dotenv';
import { credential } from 'firebase-admin';
import { initializeApp } from 'firebase-admin/app';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { v4 as uuidv4 } from 'uuid';

import { firestoreData } from './_firestoreData';
import { storageDataFiles } from './_storageDataFiles';

dotenv.config({
  path: '.env.local',
});

if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  const emulatorUrl =
    process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_URL || 'localhost';
  const firestorePort =
    process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT || '8080';
  const authPort = process.env.NEXT_PUBLIC_AUTH_EMULATOR_PORT || '9099';
  const storagePort = process.env.NEXT_PUBLIC_STORAGE_EMULATOR_PORT || '9199';

  process.env.FIRESTORE_EMULATOR_HOST = `${emulatorUrl}:${firestorePort}`;
  process.env.FIRESTORE_AUTH_EMULATOR_HOST = `${emulatorUrl}:${authPort}`;
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = `${emulatorUrl}:${storagePort}`;
}

const app = initializeApp({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  credential: credential.cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore(app);
const storage = getStorage(app);

const convertTimestamps = (data: Record<string, any>) => {
  if (typeof data !== 'object') return data;

  if (data.updatedAt) {
    data.updatedAt = Timestamp.fromDate(
      new Date(data.updatedAt.seconds * 1000)
    );
  }

  Object.values(data).forEach((value) => {
    if (typeof value === 'object') {
      convertTimestamps(value);
    }
  });

  return data;
};

/**
 * Seed Firestore and Storage with a portion of actual data.
 *
 * Run with `npm run seed` or `yarn seed`.
 */
const seed = async () => {
  // Firestore (_firestoreData)
  const collections = [
    'cache',
    'characters',
    'games',
    'music',
    'musicAlbums',
    'staffInfo',
  ] as const;

  // each batch has a limit of 500 ops, so we need to create multiple batches
  // whenever the current batch reaches the limit
  let currentBatchIndex = 0;
  let currentOpCount = 0;
  const batches = [db.batch()];

  collections.forEach((collectionName) => {
    const collectionData = firestoreData[collectionName];

    Object.entries(collectionData).forEach(([docId, docData]) => {
      batches[currentBatchIndex]!.set(
        db.collection(collectionName).doc(docId),
        convertTimestamps(docData)
      );

      currentOpCount++;
      if (currentOpCount === 500) {
        currentBatchIndex++;
        currentOpCount = 0;
        batches.push(db.batch());
      }
    });
  });

  console.log('Seeding firestore db...');

  await Promise.all(batches.map((batch) => batch.commit()));

  console.log(
    `Firestore seeding done (${currentBatchIndex * 500 + currentOpCount} docs).`
  );

  // Storage (_storageDataFiles + _storageData)
  console.log('Seeding storage...');
  const storageDataEntries = Object.entries(storageDataFiles);

  let currentFileIndex = 0;

  for (const [mainPath, subPaths] of storageDataEntries) {
    for (const subPath of subPaths) {
      await storage
        .bucket()
        .upload(__dirname + '/_storageData' + `/${mainPath}/${subPath}.webp`, {
          destination: `${mainPath}/${subPath}`,
          contentType: 'image/webp',
          metadata: {
            firebaseStorageDownloadTokens: uuidv4(),
          },
        });
      currentFileIndex++;
    }
  }

  console.log(`Storage seeding done (${currentFileIndex} files).`);

  console.log('Seeding complete! You may now exit this process.');
};

seed();
