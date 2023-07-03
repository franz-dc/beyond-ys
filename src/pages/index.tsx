import { Box, ButtonBase, Grid, Typography } from '@mui/material';
import type { BoxProps } from '@mui/material';
import Image from 'next/image';

import heroBg from '~/../public/assets/landing-hero-bg.webp';
import heroImg from '~/../public/assets/landing-hero.webp';
import ysImg from '~/../public/assets/landing-ys.webp';
import { MainLayout } from '~/components';

interface GameDiagonalProps extends BoxProps {
  fill: string;
}

const GameDiagonal = ({ fill, ...rest }: GameDiagonalProps) => (
  <Box {...rest}>
    <svg
      width='90'
      height='120'
      viewBox='0 0 90 120'
      fill={fill}
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d='M54 0H77.3509C85.5416 0 91.3252 8.02436 88.7351 15.7947L57.6468 109.06C55.469 115.593 49.3547 120 42.4679 120H0V0H54Z' />
    </svg>
  </Box>
);

const HomePage = () => {
  return (
    <MainLayout>
      <Grid
        container
        spacing={{
          xs: 0,
          sm: 2,
        }}
        sx={{
          mb: 4,
        }}
      >
        <Grid item xs={12} sm>
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              width: '100%',
              height: {
                xs: 300,
                md: '100%',
              },
              px: {
                xs: 4,
                md: 0,
              },
            }}
          >
            <Box
              component={Image}
              src={heroBg}
              alt='falcom characters'
              sx={{
                display: {
                  xs: 'block',
                  md: 'none',
                },
                position: 'absolute',
                top: 0,
                left: 0,
                width: {
                  xs: 'calc(100% + 32px)',
                  sm: 'calc(100% + 48px)',
                  md: '100%',
                },
                height: '100%',
                objectFit: 'cover',
                zIndex: -1,
                mx: {
                  xs: -2,
                  sm: -3,
                },
                opacity: 0.4,
                filter: 'blur(6px) brightness(0.5)',
                objectPosition: 'bottom 20% right',
              }}
            />
            <Typography
              variant='h1'
              sx={{
                mb: {
                  xs: 1,
                  md: 2,
                },
              }}
            >
              Bringing light to Falcom&apos;s works of art
            </Typography>
            <Typography
              color='text.secondary'
              sx={{
                mb: {
                  md: 6,
                },
              }}
            >
              Documenting games, music, the people behind, and more!
            </Typography>
          </Box>
        </Grid>
        <Grid
          item
          xs={12}
          sm='auto'
          sx={{
            display: {
              xs: 'none',
              md: 'block',
            },
          }}
        >
          <Box
            component={Image}
            src={heroImg}
            height={400}
            width='auto'
            alt='falcom characters'
            sx={{
              userSelect: 'none',
            }}
            draggable={false}
          />
        </Grid>
      </Grid>
      <Typography variant='h2' sx={{ mb: 3, textAlign: 'center' }}>
        The Games
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md='auto'>
          <Box sx={{ position: 'relative', width: 460, height: 120 }}>
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 80,
                height: 120,
                backgroundColor: '#a92525',
                borderRadius: '16px 0 0 16px',
                zIndex: -1,
              }}
            />
            <GameDiagonal
              fill='#a92525'
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                zIndex: -1,
              }}
            />
            <ButtonBase
              disableRipple
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: '16px 0 0 16px',
                zIndex: 1,
              }}
            />
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
                pl: '224px',
              }}
            >
              <Typography variant='h2' component='h3' sx={{ mb: 0.5 }}>
                Ys Series
              </Typography>
              <Typography
                sx={{ fontSize: 14, fontWeight: 500, lineHeight: 1.3 }}
              >
                Adventure saga following Adol Christin&apos;s heroic quests
                through immersive realms.
              </Typography>
            </Box>
            <Box
              component={Image}
              src={ysImg}
              alt='ys'
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 16,
                width: 190,
                height: 'auto',
                filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.35))',
                clipPath: 'polygon(0 0, 120% 0, 120% 100%, 0 100%)',
              }}
            />
          </Box>
        </Grid>
      </Grid>
    </MainLayout>
  );
};

export default HomePage;
