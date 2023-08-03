/* eslint-disable @typescript-eslint/no-empty-function */
import { createContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export interface NowPlaying {
  id: string;
  title: string;
  artists: {
    name: string;
    link: string;
  }[];
  youtubeId: string;
  albumName?: string;
  albumUrl?: string;
}

export interface MusicPlayerContextProps {
  nowPlaying: NowPlaying | null;
  setNowPlaying: Dispatch<SetStateAction<NowPlaying | null>>;
  queue: NowPlaying[];
  setQueue: Dispatch<SetStateAction<NowPlaying[]>>;
  isPlaying: boolean;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
}

export const MusicPlayerContext = createContext<MusicPlayerContextProps>({
  nowPlaying: null,
  setNowPlaying: () => {},
  queue: [],
  setQueue: () => {},
  isPlaying: false,
  setIsPlaying: () => {},
});

export const MusicPlayerProvider = MusicPlayerContext.Provider;
