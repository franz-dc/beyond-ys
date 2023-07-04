import * as React from 'react';

import { CacheProvider } from '@emotion/react';
import type { EmotionCache } from '@emotion/react';
import { IconButton } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Analytics } from '@vercel/analytics/react';
import { AppProps } from 'next/app';
import Head from 'next/head';
import NextTopLoader from 'nextjs-toploader';
import { SnackbarProvider } from 'notistack';
import { MdClose } from 'react-icons/md';
import { z } from 'zod';

import { MusicPlayer } from '~/components';
import { theme } from '~/constants';
import { MusicPlayerContextProps, MusicPlayerProvider } from '~/contexts';
import { createEmotionCache } from '~/utils';
const clientSideEmotionCache = createEmotionCache();

export interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

z.setErrorMap((issue, ctx) => {
  if (issue.code === 'too_small' && issue.minimum === 1) {
    return { message: 'This field is required.' };
  }
  return { message: ctx.defaultError };
});

export default function MyApp(props: MyAppProps) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

  const [nowPlaying, setNowPlaying] =
    React.useState<MusicPlayerContextProps['nowPlaying']>(null);

  const [queue, setQueue] = React.useState<MusicPlayerContextProps['queue']>(
    []
  );

  const [isPlaying, setIsPlaying] =
    React.useState<MusicPlayerContextProps['isPlaying']>(false);

  const notistackRef = React.createRef<any>();

  const onClickDismiss = (key: any) => () => {
    notistackRef?.current?.closeSnackbar(key);
  };

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name='viewport' content='initial-scale=1, width=device-width' />
      </Head>
      <ThemeProvider theme={theme}>
        <NextTopLoader showSpinner={false} color={theme.palette.primary.main} />
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
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
        </LocalizationProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}
