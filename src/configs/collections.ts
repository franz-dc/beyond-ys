import { collection } from 'firebase/firestore';
import type { CollectionReference, DocumentData } from 'firebase/firestore';

import {
  CharacterSchema,
  GameSchema,
  MusicAlbumSchema,
  MusicSchema,
  StaffInfoSchema,
  UserSchema,
} from '../schemas';

import { db } from './firebaseConfig';

const createCollection = <T = DocumentData>(
  collectionName: string
): CollectionReference<T> =>
  collection(db, collectionName) as CollectionReference<T>;

export const charactersCollection =
  createCollection<CharacterSchema>('characters');
export const gamesCollection = createCollection<GameSchema>('games');
export const staffInfosCollection =
  createCollection<StaffInfoSchema>('staffInfo');
export const musicAlbumsCollection =
  createCollection<MusicAlbumSchema>('musicAlbums');
export const musicCollection = createCollection<MusicSchema>('music');
export const cacheCollection = createCollection<Record<string, any>>('cache');
export const usersCollection = createCollection<UserSchema>('users');
