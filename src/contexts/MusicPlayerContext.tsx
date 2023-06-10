import { Dispatch, SetStateAction, createContext } from 'react';

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
}

export const MusicPlayerContext = createContext<MusicPlayerContextProps>({
  nowPlaying: null,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setNowPlaying: () => {},
  queue: [],
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setQueue: () => {},
});

export const MusicPlayerProvider = MusicPlayerContext.Provider;
