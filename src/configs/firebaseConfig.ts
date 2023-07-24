// import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  connectAuthEmulator,
  getAuth,
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

const useFirebaseEmulator =
  process.env.NODE_ENV === 'development' &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleAuthProvider = new GoogleAuthProvider();

// https://stackoverflow.com/questions/65066963
// @ts-ignore
if (useFirebaseEmulator && !global.EMULATORS_STARTED) {
  // @ts-ignore
  global.EMULATORS_STARTED = true;

  const emulatorUrl =
    process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_URL || 'localhost';
  const firestorePort =
    process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT || '8080';
  const authPort = process.env.NEXT_PUBLIC_AUTH_EMULATOR_PORT || '9099';
  const storagePort = process.env.NEXT_PUBLIC_STORAGE_EMULATOR_PORT || '9199';

  connectFirestoreEmulator(db, emulatorUrl, Number(firestorePort));
  connectAuthEmulator(auth, `http://${emulatorUrl}:${authPort}/`);
  connectStorageEmulator(storage, emulatorUrl, Number(storagePort));
}
