import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { CssBaseline, GlobalStyles, ThemeProvider } from '@mui/material';
import { useTheme } from 'next-themes';
import NextTopLoader from 'nextjs-toploader';

import { darkTheme, globalStyles, lightTheme } from '~/constants';

export const MuiThemeProvider = ({ children }: { children: ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState(darkTheme);

  useEffect(() => {
    resolvedTheme === 'light'
      ? setCurrentTheme(lightTheme)
      : setCurrentTheme(darkTheme);
  }, [resolvedTheme]);

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <GlobalStyles styles={globalStyles} />
      <NextTopLoader
        showSpinner={false}
        color={currentTheme.palette.primary.main}
      />
      {children}
    </ThemeProvider>
  );
};
