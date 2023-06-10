import * as React from 'react';

import { CacheProvider } from '@emotion/react';
import type { EmotionCache } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppProps } from 'next/app';
import Head from 'next/head';
import NextTopLoader from 'nextjs-toploader';

import { MusicPlayer } from '~/components';
import { theme } from '~/constants';
import { MusicPlayerContextProps, MusicPlayerProvider } from '~/contexts';
import { createEmotionCache } from '~/utils';

const clientSideEmotionCache = createEmotionCache();

export interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

export default function MyApp(props: MyAppProps) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

  const [nowPlaying, setNowPlaying] =
    React.useState<MusicPlayerContextProps['nowPlaying']>(null);

  const [queue, setQueue] = React.useState<MusicPlayerContextProps['queue']>(
    []
  );

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name='viewport' content='initial-scale=1, width=device-width' />
      </Head>
      <ThemeProvider theme={theme}>
        <NextTopLoader showSpinner={false} color={theme.palette.primary.main} />
        <CssBaseline />
        <MusicPlayerProvider
          value={{
            nowPlaying,
            setNowPlaying,
            queue,
            setQueue,
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
        </MusicPlayerProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}
