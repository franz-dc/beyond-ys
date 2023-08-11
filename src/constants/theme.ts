import { createTheme, css } from '@mui/material';
import type { ThemeOptions } from '@mui/material';
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
    sm4: true;
    xl2: true;
  }
}

export const urbanist = Urbanist({
  weight: ['400', '500', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Helvetica', 'Arial', 'sans-serif'],
});

export const theme: ThemeOptions = {
  breakpoints: {
    values: {
      xs: 0,
      xs2: 450, // for character item
      xs3: 500, // for music album item
      sm: 600,
      sm2: 670, // for character item
      sm3: 750, // for music album item
      sm4: 780, // for game item
      md: 900,
      lg: 1200,
      xl: 1536,
      xl2: 1644, // youtube embed
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
    MuiAlertTitle: {
      styleOverrides: {
        root: {
          marginBottom: '0.25rem',
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
        elevation: 2,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundImage: 'none',
          transition: 'box-shadow 0.1s ease-in-out',
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
};

export const darkTheme = createTheme({
  ...theme,
  components: {
    ...theme.components,
    MuiButton: {
      ...theme.components!.MuiButton,
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
  shadows: [
    'none',
    '0px 1px 3px 0px rgba(0,0,0,0.2)',
    '0px 1px 5px 0px rgba(0,0,0,0.2)',
    '0px 1px 8px 0px rgba(0,0,0,0.2)',
    '0px 1px 10px 0px rgba(0,0,0,0.2)',
    '0px 1px 14px 0px rgba(0,0,0,0.2)',
    '0px 1px 18px 0px rgba(0,0,0,0.2)',
    '0px 2px 16px 1px rgba(0,0,0,0.2)',
    '0px 3px 14px 2px rgba(0,0,0,0.2)',
    '0px 3px 16px 2px rgba(0,0,0,0.2)',
    '0px 4px 18px 3px rgba(0,0,0,0.2)',
    '0px 4px 20px 3px rgba(0,0,0,0.2)',
    '0px 5px 22px 4px rgba(0,0,0,0.2)',
    '0px 5px 24px 4px rgba(0,0,0,0.2)',
    '0px 5px 26px 4px rgba(0,0,0,0.2)',
    '0px 6px 28px 5px rgba(0,0,0,0.2)',
    '0px 6px 30px 5px rgba(0,0,0,0.2)',
    '0px 6px 32px 5px rgba(0,0,0,0.2)',
    '0px 7px 34px 6px rgba(0,0,0,0.2)',
    '0px 7px 36px 6px rgba(0,0,0,0.2)',
    '0px 8px 38px 7px rgba(0,0,0,0.2)',
    '0px 8px 40px 7px rgba(0,0,0,0.2)',
    '0px 8px 42px 7px rgba(0,0,0,0.2)',
    '0px 9px 44px 8px rgba(0,0,0,0.2)',
    '0px 9px 46px 8px rgba(0,0,0,0.2)',
  ],
});

export const lightTheme = createTheme({
  ...theme,
  components: {
    ...theme.components,
    MuiButton: {
      ...theme.components!.MuiButton,
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
  palette: {
    mode: 'light',
    background: {
      default: '#f7f8fa',
      paper: '#ffffff',
    },
    headerBackground: '#e9ecf5',
    avatarBackground: '#757d9a',
  },
  shadows: [
    'none',
    '0px 1px 3px 0px rgba(42,103,202,0.12)',
    '0px 1px 5px 0px rgba(42,103,202,0.12)',
    '0px 1px 8px 0px rgba(42,103,202,0.12)',
    '0px 1px 10px 0px rgba(42,103,202,0.12)',
    '0px 1px 14px 0px rgba(42,103,202,0.12)',
    '0px 1px 18px 0px rgba(42,103,202,0.12)',
    '0px 2px 16px 1px rgba(42,103,202,0.12)',
    '0px 3px 14px 2px rgba(42,103,202,0.12)',
    '0px 3px 16px 2px rgba(42,103,202,0.12)',
    '0px 4px 18px 3px rgba(42,103,202,0.12)',
    '0px 4px 20px 3px rgba(42,103,202,0.12)',
    '0px 5px 22px 4px rgba(42,103,202,0.12)',
    '0px 5px 24px 4px rgba(42,103,202,0.12)',
    '0px 5px 26px 4px rgba(42,103,202,0.12)',
    '0px 6px 28px 5px rgba(42,103,202,0.12)',
    '0px 6px 30px 5px rgba(42,103,202,0.12)',
    '0px 6px 32px 5px rgba(42,103,202,0.12)',
    '0px 7px 34px 6px rgba(42,103,202,0.12)',
    '0px 7px 36px 6px rgba(42,103,202,0.12)',
    '0px 8px 38px 7px rgba(42,103,202,0.12)',
    '0px 8px 40px 7px rgba(42,103,202,0.12)',
    '0px 8px 42px 7px rgba(42,103,202,0.12)',
    '0px 9px 44px 8px rgba(42,103,202,0.12)',
    '0px 9px 46px 8px rgba(42,103,202,0.12)',
  ],
});

export const globalStyles = css`
  :root {
    body {
      background-color: ${darkTheme.palette.background.default};
      color: ${darkTheme.palette.text.primary};
    }
    .MuiPaper-root:not(.MuiAlert-root) {
      background-color: ${darkTheme.palette.background.paper};
    }
    .header-bg {
      background-color: ${darkTheme.palette.headerBackground};
    }
    .default-bg {
      background-color: ${darkTheme.palette.background.default};
    }
    .paper-bg {
      background-color: ${darkTheme.palette.background.paper};
    }
  }
  [data-theme='light'] {
    body {
      background-color: ${lightTheme.palette.background.default};
      color: ${lightTheme.palette.text.primary};
    }
    .MuiPaper-root:not(.MuiAlert-root) {
      background-color: ${lightTheme.palette.background.paper};
    }
    .header-bg {
      background-color: ${lightTheme.palette.headerBackground};
    }
    .default-bg {
      background-color: ${lightTheme.palette.background.default};
    }
    .paper-bg {
      background-color: ${lightTheme.palette.background.paper};
    }
  }
`;
