import { createTheme } from '@mui/material/styles';
import { Urbanist } from 'next/font/google';

export const urbanist = Urbanist({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Helvetica', 'Arial', 'sans-serif'],
});

export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#22252f',
      paper: '#161a22',
      // @ts-ignore
      header: '#3c4151',
    },
    primary: {
      main: '#00b0ff',
      dark: '#0277bd',
    },
  },
  typography: {
    fontFamily: urbanist.style.fontFamily,
    fontWeightRegular: 400,
    fontWeightMedium: 700,
    fontWeightBold: 900,
    h1: {
      fontSize: 32,
      fontWeight: 700,
    },
    h2: {
      fontSize: 24,
      fontWeight: 700,
    },
    h3: {
      fontSize: 18,
      fontWeight: 700,
    },
    h4: {
      fontSize: 16,
      fontWeight: 700,
    },
    h5: {
      fontSize: 14,
      fontWeight: 700,
    },
    h6: {
      fontSize: 12,
      fontWeight: 700,
    },
    body1: {
      lineHeight: 1.4,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'none',
          boxShadow: 'none',
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'none',
          transition: 'all 0.2s ease-in-out',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        gutterBottom: {
          marginBottom: '0.75em',
        },
      },
    },
  },
});
