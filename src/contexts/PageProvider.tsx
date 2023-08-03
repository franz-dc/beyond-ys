import type { PropsWithChildren } from 'react';

import { CacheProvider } from '@emotion/react';
import type { EmotionCache } from '@emotion/react';
import Head from 'next/head';
import { ThemeProvider as PreferredThemeProvider } from 'next-themes';

import { createEmotionCache } from '~/utils';

import { MuiThemeProvider } from './MuiThemeProvider';

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

export const PageProvider = ({
  children,
  emotionCache = clientSideEmotionCache,
}: PropsWithChildren<{
  emotionCache?: EmotionCache;
}>) => (
  <PreferredThemeProvider>
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name='viewport' content='initial-scale=1, width=device-width' />
      </Head>
      <MuiThemeProvider>{children}</MuiThemeProvider>
    </CacheProvider>
  </PreferredThemeProvider>
);
