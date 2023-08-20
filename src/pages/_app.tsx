import { createRef, useState } from 'react';

import { CacheProvider } from '@emotion/react';
import type { EmotionCache } from '@emotion/react';
import { IconButton } from '@mui/material';
import { Analytics } from '@vercel/analytics/react';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { SnackbarProvider } from 'notistack';
import { MdClose } from 'react-icons/md';

import { MusicPlayer } from '~/components';
import {
  MusicPlayerContextProps,
  MusicPlayerProvider,
  PageProvider,
} from '~/contexts';
import { createEmotionCache } from '~/utils';
const clientSideEmotionCache = createEmotionCache();

export interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

export default function MyApp(props: MyAppProps) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

  const [nowPlaying, setNowPlaying] =
    useState<MusicPlayerContextProps['nowPlaying']>(null);

  const [queue, setQueue] = useState<MusicPlayerContextProps['queue']>([]);

  const [isPlaying, setIsPlaying] =
    useState<MusicPlayerContextProps['isPlaying']>(false);

  const notistackRef = createRef<any>();

  const onClickDismiss = (key: any) => () => {
    notistackRef?.current?.closeSnackbar(key);
  };

  return (
    <PageProvider emotionCache={emotionCache}>
      <NextThemeProvider>
        <CacheProvider value={emotionCache}>
          <Head>
            <meta
              name='viewport'
              content='initial-scale=1, width=device-width'
            />
          </Head>
          <SnackbarProvider
            ref={notistackRef}
            action={(key) => (
              <IconButton onClick={onClickDismiss(key)} sx={{ color: 'white' }}>
                <MdClose />
              </IconButton>
            )}
          >
            <MusicPlayerProvider
              value={{
                nowPlaying,
                setNowPlaying,
                queue,
                setQueue,
                isPlaying,
                setIsPlaying,
              }}
            >
              {nowPlaying && (
                <MusicPlayer
                  title={nowPlaying.title}
                  artists={nowPlaying.artists}
                  youtubeId={nowPlaying.youtubeId}
                  albumName={nowPlaying.albumName}
                  albumUrl={nowPlaying.albumUrl}
                />
              )}
              <Component {...pageProps} />
              <Analytics debug={false} />
            </MusicPlayerProvider>
          </SnackbarProvider>
        </CacheProvider>
      </NextThemeProvider>
    </PageProvider>
  );
}
