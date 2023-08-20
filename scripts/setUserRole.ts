/* eslint-disable no-console */
import dotenv from 'dotenv';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

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
});

const auth = getAuth(app);

const setUserRole = async () => {
  const uid = process.argv[2];
  const role = process.argv[3];

  await auth.setCustomUserClaims(uid, { role });

  console.log(`User ${uid} has been set to role ${role}.`);
};

setUserRole();
