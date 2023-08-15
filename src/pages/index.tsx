import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  Grid,
  Paper,
  Stack,
  SvgIcon,
  Typography,
} from '@mui/material';
import type { BoxProps } from '@mui/material';
import Image from 'next/image';
import { FaUsers } from 'react-icons/fa';
import { GiSpinningSword } from 'react-icons/gi';
import { MdMusicNote } from 'react-icons/md';
import { TbTimelineEventText } from 'react-icons/tb';

import falcomLogo from '~/../public/assets/falcom-logo.webp';
import gagharvImg from '~/../public/assets/landing-gagharv.webp';
import heroBg from '~/../public/assets/landing-hero-bg.webp';
import heroImg from '~/../public/assets/landing-hero.webp';
import otherGamesImg from '~/../public/assets/landing-other-games.webp';
import trailsImg from '~/../public/assets/landing-trails.webp';
import ysImg from '~/../public/assets/landing-ys.webp';
import { Link, MainLayout } from '~/components';

interface GameDiagonalProps extends BoxProps {
  fill: string;
  flipY?: boolean; // flip vertical
}

const GameDiagonal = ({ fill, flipY, ...rest }: GameDiagonalProps) => (
  <Box {...rest}>
    <svg
      width='90'
      height='120'
      viewBox='0 0 90 120'
      fill={fill}
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d={
          !flipY
            ? 'M54 0H77.3509C85.5416 0 91.3252 8.02436 88.7351 15.7947L57.6468 109.06C55.469 115.593 49.3547 120 42.4679 120H0V0H54Z'
            : 'M54 120H77.3509C85.5416 120 91.3252 111.976 88.7351 104.206L57.6468 10.94C55.469 4.40699 49.3547 0 42.4679 0H0V120H54Z'
        }
      />
    </svg>
  </Box>
);

const HomePage = () => {
  const exploreItems = [
    {
      label: 'Characters',
      href: '/characters',
      icon: <GiSpinningSword />,
    },
    {
      label: 'Music',
      href: '/music',
      icon: <MdMusicNote />,
    },
    {
      label: 'Staff',
      href: '/staff',
      icon: <FaUsers />,
    },
    {
      label: 'Composers',
      href: '/composer-timeline',
      icon: <TbTimelineEventText />,
    },
  ];

  return (
    <MainLayout>
      <Grid
        container
        spacing={{
          xs: 0,
          sm: 2,
        }}
        sx={{
          mb: {
            xs: 6,
            md: 2,
          },
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
              pl: {
                md: 4,
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
                filter: 'blur(6px) brightness(0.4)',
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
            height={380}
            width='auto'
            alt='falcom characters'
            sx={{
              userSelect: 'none',
            }}
            draggable={false}
          />
        </Grid>
      </Grid>
      <Typography
        variant='h2'
        sx={{
          mb: {
            xs: 2,
            sm: 3,
          },
          textAlign: 'center',
        }}
      >
        The Games
      </Typography>
      <Box
        sx={{
          position: 'relative',
        }}
      >
        {/* YS -------------------------------------------------------------- */}
        <Box
          sx={{
            position: 'relative',
            width: {
              xs: '100%',
              xs2: 'calc(100% - 32px)',
              sm: 'calc(100% - 64px)',
              sm3: 'calc(100% - 160px)',
              md: 450,
            },
            height: 120,
          }}
        >
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
            component={Link}
            href='/ys-series'
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
            aria-label='Ys Series'
          />
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              height: '100%',
              pl: {
                xs: '172px',
                sm: '222px',
              },
              pr: 5,
              color: 'white',
            }}
          >
            <Typography variant='h2' component='h3' sx={{ mb: 0.5 }}>
              Ys Series
            </Typography>
            <Typography
              sx={{
                display: {
                  xs: 'none',
                  xs2: 'block',
                },
                fontSize: 14,
                fontWeight: 500,
                lineHeight: 1.3,
              }}
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
              width: {
                xs: 140,
                sm: 190,
              },
              height: 'auto',
              filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.35))',
              clipPath: 'polygon(0 0, 120% 0, 120% 100%, 0 100%)',
            }}
          />
        </Box>
        {/* TRAILS ---------------------------------------------------------- */}
        <Box
          sx={{
            position: {
              md: 'absolute',
            },
            top: 28,
            right: 0,
            mt: {
              xs: 2,
              sm: 4,
              md: 0,
            },
            ml: {
              xs: 'auto',
            },
            width: '100%',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: {
                xs: '100%',
                xs2: 'calc(100% - 32px)',
                sm: 'calc(100% - 64px)',
                sm3: 'calc(100% - 160px)',
                md: 420,
              },
              height: 120,
              ml: 'auto',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 80,
                right: 0,
                height: 120,
                backgroundColor: '#254aa9',
                borderRadius: '0 16px 16px 0',
                zIndex: -1,
              }}
            />
            <GameDiagonal
              flipY
              fill='#254aa9'
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: -1,
                transform: 'scaleX(-1)',
              }}
            />
            <ButtonBase
              component={Link}
              href='/trails-series'
              disableRipple
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: '0 16px 16px 0',
                zIndex: 1,
              }}
              aria-label='Trails Series'
            />
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
                pl: {
                  xs: 5,
                  xs2: 4,
                },
                pr: {
                  xs: '170px',
                  sm: '210px',
                },
                textAlign: 'right',
                color: 'white',
              }}
            >
              <Typography variant='h2' component='h3' sx={{ mb: 0.5 }}>
                Trails Series
              </Typography>
              <Typography
                sx={{
                  display: {
                    xs: 'none',
                    xs2: 'block',
                  },
                  fontSize: 14,
                  fontWeight: 500,
                  lineHeight: 1.3,
                }}
              >
                Saga with intricate world-building, political intrigue, and
                memorable characters.
              </Typography>
            </Box>
            <Box
              component={Image}
              src={trailsImg}
              alt='trails'
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 16,
                width: {
                  xs: 140,
                  sm: 180,
                },
                height: 'auto',
                filter: 'drop-shadow(-2px 2px 4px rgba(0, 0, 0, 0.35))',
                clipPath: 'polygon(-20% 0, 100% 0, 100% 101%, -20% 101%)',
              }}
            />
          </Box>
        </Box>
        <Box
          sx={{
            position: 'relative',
            mt: {
              xs: 2,
              sm: 4,
              md: 3,
            },
            mb: {
              md: '28px',
            },
          }}
        >
          {/* GAGHARV --------------------------------------------------------- */}
          <Box
            sx={{
              position: 'relative',
              width: {
                xs: '100%',
                xs2: 'calc(100% - 32px)',
                sm: 'calc(100% - 64px)',
                sm3: 'calc(100% - 160px)',
                md: 400,
              },
              height: 120,
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 80,
                height: 120,
                backgroundColor: '#aa6B21',
                borderRadius: '16px 0 0 16px',
                zIndex: -1,
              }}
            />
            <GameDiagonal
              fill='#aa6B21'
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                zIndex: -1,
              }}
            />
            <ButtonBase
              component={Link}
              href='/gagharv-trilogy'
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
              aria-label='Gagharv Trilogy'
            />
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
                pl: {
                  xs: '144px',
                  sm: '184px',
                },
                pr: 4,
                color: 'white',
              }}
            >
              <Typography variant='h2' component='h3' sx={{ mb: 0.5 }}>
                Gagharv Trilogy
              </Typography>
              <Typography
                sx={{
                  display: {
                    xs: 'none',
                    xs2: 'block',
                  },
                  pr: 1,
                  fontSize: 14,
                  fontWeight: 500,
                  lineHeight: 1.3,
                }}
              >
                Epic fantasy journey across the lands surrounding the rift of
                Gagharv.
              </Typography>
            </Box>
            <Box
              component={Image}
              src={gagharvImg}
              alt='gagharv'
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 16,
                width: {
                  xs: 120,
                  sm: 160,
                },
                height: 'auto',
                filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.35))',
                clipPath: 'polygon(0 0, 120% 0, 120% 100%, 0 100%)',
              }}
            />
          </Box>
          {/* OTHER GAMES --------------------------------------------------- */}
          <Box
            sx={{
              position: {
                md: 'absolute',
              },
              top: 28,
              right: 0,
              mt: {
                xs: 2,
                sm: 4,
                md: 0,
              },
              ml: {
                xs: 'auto',
              },
              width: '100%',
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: {
                  xs: '100%',
                  xs2: 'calc(100% - 32px)',
                  sm: 'calc(100% - 64px)',
                  sm3: 'calc(100% - 160px)',
                  md: 470,
                },
                height: 120,
                ml: 'auto',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 80,
                  right: 0,
                  height: 120,
                  backgroundColor: '#161a22',
                  borderRadius: '0 16px 16px 0',
                  zIndex: -1,
                }}
              />
              <GameDiagonal
                flipY
                fill='#161a22'
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: -1,
                  transform: 'scaleX(-1)',
                }}
              />
              <ButtonBase
                component={Link}
                href='/games'
                disableRipple
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  borderRadius: '0 16px 16px 0',
                  zIndex: 1,
                }}
                aria-label='Other Games'
              />
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  height: '100%',
                  pl: {
                    xs: 5,
                    xs2: 4,
                  },
                  pr: {
                    xs: '150px',
                    sm: '180px',
                  },
                  textAlign: 'right',
                  color: 'white',
                }}
              >
                <Typography variant='h2' component='h3' sx={{ mb: 0.5 }}>
                  Other Games
                </Typography>
                <Typography
                  sx={{
                    display: {
                      xs: 'none',
                      xs2: 'block',
                    },
                    fontSize: 14,
                    fontWeight: 500,
                    lineHeight: 1.3,
                  }}
                >
                  Series from Xanadu, Zwei!!, Dragon Quest, and more great games
                  made by Falcom!
                </Typography>
              </Box>
              <Box
                component={Image}
                src={otherGamesImg}
                alt='other games'
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 16,
                  width: {
                    xs: 120,
                    sm: 150,
                  },
                  height: 'auto',
                  filter: 'drop-shadow(-2px 2px 4px rgba(0, 0, 0, 0.35))',
                  clipPath: 'polygon(-20% 0, 100% 0, 100% 101%, -20% 101%)',
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
      <Box
        component='section'
        sx={{
          mt: {
            xs: 6,
            md: 10,
          },
          mb: 6,
        }}
      >
        <Typography
          variant='h2'
          sx={{
            mb: 2,
            textAlign: 'center',
          }}
        >
          New to Falcom?
        </Typography>
        <Paper
          sx={{
            display: 'flex',
            mx: {
              md: 4,
            },
            mb: 2,
            px: {
              xs: 3,
              md: 4,
            },
            py: {
              xs: 2,
              md: 3,
            },
          }}
        >
          <Grid
            container
            spacing={{
              xs: 2,
              md: 4,
            }}
          >
            <Grid item xs={12} md={3}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                <Box
                  component={Image}
                  src={falcomLogo}
                  alt='falcom logo'
                  sx={{
                    width: {
                      xs: '60%',
                      xs2: '50%',
                      sm: '40%',
                      sm2: '30%',
                      md: '100%',
                    },
                    height: 'auto',
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={9}>
              <Typography>
                <strong>Nihon Falcom Corporation</strong>, commonly known as
                Falcom, is a Japanese video game developer and publisher
                renowned for its contributions to the role-playing game (RPG)
                genre. Founded in 1981, Falcom has created several influential
                and beloved game series that have left a significant mark on
                gaming history.
              </Typography>
            </Grid>
          </Grid>
        </Paper>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Button size='large' component={Link} href='/nihon-falcom'>
            Learn More
          </Button>
        </Box>
      </Box>
      <Typography
        variant='h2'
        sx={{
          mb: 3,
          textAlign: 'center',
        }}
      >
        More to Explore
      </Typography>
      <Stack
        direction='row'
        spacing={2}
        useFlexGap
        flexWrap='wrap'
        alignItems='center'
        justifyContent='center'
      >
        {exploreItems.map(({ label, href, icon }) => (
          <Paper
            key={label}
            sx={{
              width: 180,
              borderRadius: 4,
              transition:
                'transform 0.1s ease-in-out, box-shadow 0.1s ease-in-out',
              '&:hover, &:focus-within': {
                transform: 'translateY(-4px)',
                boxShadow: ({ shadows }) => shadows[6],
              },
            }}
          >
            <ButtonBase
              component={Link}
              href={href}
              focusRipple
              sx={{
                position: 'relative',
                display: 'block',
                width: '100%',
                height: '100%',
                borderRadius: 4,
              }}
            >
              <Box
                sx={{
                  height: 90,
                  backgroundColor: ({ palette }) =>
                    palette.mode === 'dark'
                      ? '#2a303d'
                      : palette.headerBackground,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  mb: '50px',
                  clipPath:
                    'polygon(0 0, 100% 0, 100% calc(100% - 20px), 0 100%)',
                }}
              />
              <Avatar
                className='default-bg'
                sx={{
                  position: 'absolute',
                  top: 30,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 100,
                  height: 100,
                  border: ({ palette }) =>
                    `12px solid ${palette.background.paper}`,
                }}
              >
                <SvgIcon
                  sx={{
                    width: 35,
                    height: 35,
                    color: 'text.secondary',
                  }}
                >
                  {icon}
                </SvgIcon>
              </Avatar>
              <Typography
                variant='h2'
                component='h3'
                sx={{
                  // pb: 4,
                  height: 60,
                  textAlign: 'center',
                }}
              >
                {label}
              </Typography>
            </ButtonBase>
          </Paper>
        ))}
      </Stack>
    </MainLayout>
  );
};

export default HomePage;
