import { collection } from 'firebase/firestore';
import type { CollectionReference, DocumentData } from 'firebase/firestore';

import { GameSchema, StaffInfoSchema } from '~/schemas';

import { db } from './firebaseConfig';

const createCollection = <T = DocumentData>(
  collectionName: string
): CollectionReference<T> =>
  collection(db, collectionName) as CollectionReference<T>;

export const gamesCollection = createCollection<GameSchema>('games');
export const staffInfosCollection =
  createCollection<StaffInfoSchema>('staffInfo');
export const cacheCollection =
  createCollection<Record<string, string>>('cache');
