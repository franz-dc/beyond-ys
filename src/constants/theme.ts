import { createTheme } from '@mui/material/styles';
import { Urbanist } from 'next/font/google';

declare module '@mui/material/styles' {
  interface Palette {
    headerBackground: string;
    avatarBackground: string;
  }
  interface PaletteOptions {
    headerBackground: string;
    avatarBackground: string;
  }
  interface BreakpointOverrides {
    xs2: true;
    xs3: true;
    sm2: true;
    sm3: true;
  }
}

export const urbanist = Urbanist({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Helvetica', 'Arial', 'sans-serif'],
});

export const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      xs2: 450, // for character item
      xs3: 500, // for music album item
      sm: 600,
      sm2: 670, // for character item
      sm3: 750, // for music album item
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  palette: {
    mode: 'dark',
    background: {
      default: '#22252f',
      paper: '#161a22',
    },
    primary: {
      main: '#00b0ff',
      dark: '#0277bd',
    },
    headerBackground: '#3c4151',
    avatarBackground: '#acbbe9',
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
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollBehavior: 'smooth',
        },
        '& .yarl__slide_image': {
          maxHeight: 'calc(100vh - 140px) !important',
        },
        '& .yarl__slide_captions_container': {
          background: 'none !important',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'none',
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        variant: 'contained',
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          '&.MuiButton-containedPrimary': {
            backgroundColor: '#0277bd',
            color: 'inherit',
          },
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
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
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
