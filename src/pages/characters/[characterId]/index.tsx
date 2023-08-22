import { useEffect, useState } from 'react';

import {
  Alert,
  AlertTitle,
  Avatar,
  Box,
  ButtonBase,
  Collapse,
  Grid,
  Paper,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import type { GetStaticPaths, GetStaticProps } from 'next';
import { ReactCountryFlag } from 'react-country-flag';
import { MdNoAccounts } from 'react-icons/md';
import { Lightbox } from 'yet-another-react-lightbox';
import { Captions, Counter } from 'yet-another-react-lightbox/plugins';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/counter.css';

import { GameItem, Link, MainLayout } from '~/components';
import { cacheCollection, charactersCollection } from '~/configs';
import { CLOUD_STORAGE_URL, COUNTRIES } from '~/constants';
import {
  CharacterCacheSchema,
  CharacterSchema,
  StaffInfoCacheSchema,
} from '~/schemas';

type Params = {
  characterId: string;
};

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  if (process.env.USE_EMPTY_STATIC_PATHS === 'true')
    return { paths: [], fallback: 'blocking' };

  const charactersDoc = await getDoc<Record<string, CharacterCacheSchema>>(
    doc(cacheCollection, 'characters')
  );

  const charactersCache = charactersDoc.data() || {};

  return {
    paths: Object.keys(charactersCache).map((characterId) => ({
      params: { characterId },
    })),
    fallback: 'blocking',
  };
};

interface Props extends CharacterSchema {
  id: string;
  staffInfoCache: Record<string, StaffInfoCacheSchema>;
}

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const characterId = params?.characterId as string;

  if (!characterId) return { notFound: true };

  const docSnap = await getDoc(doc(charactersCollection, characterId));

  if (!docSnap.exists()) {
    console.error(`Character with id "${characterId}" does not exist.`);
    return { notFound: true };
  }

  const staffInfoCacheDoc = await getDoc(doc(cacheCollection, 'staffInfo'));

  const data: Props = {
    ...docSnap.data(),
    id: characterId,
    updatedAt: docSnap.data()?.updatedAt?.toMillis() || null,
    staffInfoCache: staffInfoCacheDoc.data() || {},
  };

  return { props: data };
};

const CharacterInfo = ({
  id,
  name,
  category,
  accentColor,
  description = 'No description available.',
  descriptionSourceName,
  descriptionSourceUrl,
  imageDirection,
  cachedGames,
  voiceActors,
  staffInfoCache,
  extraImages,
  hasMainImage,
  containsSpoilers,
  aliases,
}: Props) => {
  const formattedGames = Object.entries(cachedGames)
    .map(([id, game]) => ({
      id,
      ...game,
    }))
    // sorting: most recent first, empty release date last
    .sort(({ releaseDate: a }, { releaseDate: b }) => {
      if (!a) return 1;
      if (!b) return -1;
      return (b as string).localeCompare(a as string);
    });

  const [photoIndex, setPhotoIndex] = useState(-1);

  const [isGamesExpanded, setIsGamesExpanded] = useState(false);

  // NextJS keeps the states on page change, so we need to reset it
  useEffect(() => {
    setPhotoIndex(-1);
    setIsGamesExpanded(false);
  }, [id]);

  const hasOtherInformation = !!aliases && aliases.length > 0;

  return (
    <MainLayout
      title={name}
      description={description}
      image={hasMainImage ? `${CLOUD_STORAGE_URL}/characters/${id}` : undefined}
    >
      {containsSpoilers && (
        <Alert severity='info' sx={{ mb: 2 }}>
          <AlertTitle>This page contains spoilers.</AlertTitle>
          Play the games associated with this character first if you
          haven&apos;t already.
        </Alert>
      )}
      <Box
        sx={{
          position: 'absolute',
          left: {
            xs: 0,
            sm: 24,
          },
          right: {
            xs: 0,
            sm: 24,
          },
          height: 150,
          backgroundImage: ({ palette }) =>
            `linear-gradient(${alpha(
              accentColor,
              palette.mode === 'dark' ? 0.6 : 0.3
            )}, rgba(0, 0, 0, 0))`,
          borderTopLeftRadius: {
            sm: 16,
          },
          borderTopRightRadius: {
            sm: 16,
          },
          zIndex: -1,
        }}
      />
      <Box
        sx={{
          px: {
            xs: 0,
            md: 3,
          },
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md='auto'>
            <Grid
              container
              spacing={2}
              sx={{
                maxWidth: {
                  md: 196,
                },
                px: {
                  xs: 2,
                  md: 0,
                },
              }}
            >
              <Grid item xs={12} xs2='auto'>
                <Box
                  sx={{
                    width: {
                      xs: 120,
                      md: 180,
                    },
                    pt: 4,
                    mx: {
                      xs: 'auto',
                      xs2: 0,
                    },
                    mb: 1,
                  }}
                >
                  {hasMainImage ? (
                    <ButtonBase
                      focusRipple
                      onClick={() => setPhotoIndex(0)}
                      sx={{
                        borderRadius: 2,
                      }}
                      aria-label='view main image'
                    >
                      <Box
                        component='img'
                        src={`${CLOUD_STORAGE_URL}/characters/${id}`}
                        alt={`${name} main image`}
                        width='100%'
                        height='auto'
                        sx={{
                          transform: `scaleX(${
                            imageDirection === 'right' ? 1 : -1
                          })`,
                        }}
                      />
                    </ButtonBase>
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: {
                          xs: 120,
                          md: 180,
                        },
                        backgroundColor: 'background.paper',
                        borderRadius: 2,
                      }}
                    >
                      <Box
                        component={MdNoAccounts}
                        sx={{
                          width: {
                            xs: 72,
                            md: 100,
                          },
                          height: {
                            xs: 72,
                            md: 100,
                          },
                          color: 'divider',
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </Grid>
              <Grid
                item
                xs={12}
                xs2
                md={12}
                sx={{
                  flex: {
                    xs2: '1 0 auto',
                  },
                  width: 0,
                }}
              >
                <Stack
                  direction={{
                    xs: 'column-reverse',
                    xs2: 'column',
                  }}
                >
                  <Box
                    sx={{
                      display: {
                        xs: 'block',
                        md: 'none',
                      },
                      pt: {
                        xs: extraImages.length > 0 ? 2 : 0,
                        xs2: 8,
                      },
                      mt: {
                        xs: extraImages.length > 0 ? 1 : 0,
                        xs2: 0,
                      },
                      mb: {
                        xs: 0,
                        xs2: 3,
                      },
                      textAlign: {
                        xs: 'center',
                        xs2: 'left',
                      },
                    }}
                  >
                    <Typography variant='h1'>{name}</Typography>
                    <Typography sx={{ color: 'text.secondary' }}>
                      {category}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: {
                        xs: 'flex',
                        xs2: 'block',
                      },
                      justifyContent: 'center',
                      mx: {
                        xs: 'auto',
                        xs2: 0,
                      },
                    }}
                  >
                    <Stack direction='row' spacing={1}>
                      {/* first 3 images */}
                      {extraImages.slice(0, 3).map((image, idx) => (
                        <ButtonBase
                          key={image.path}
                          focusRipple
                          sx={{
                            width: 39, // (180 - 8 * 3) / 4
                            height: 56,
                            borderRadius: 1,
                          }}
                          aria-label='view character gallery image'
                        >
                          <Box
                            component='img'
                            src={`${CLOUD_STORAGE_URL}/character-gallery/${id}/${image.path}`}
                            sx={{
                              width: 39,
                              height: 56,
                              objectFit: 'cover',
                              borderRadius: 1,
                              backgroundColor: 'background.paper',
                            }}
                            onClick={() =>
                              setPhotoIndex(hasMainImage ? idx + 1 : idx)
                            }
                            alt={`gallery image ${idx + 1}`}
                          />
                        </ButtonBase>
                      ))}
                      {extraImages[3] && (
                        <ButtonBase
                          focusRipple
                          sx={{
                            position: 'relative',
                            width: 39, // (180 - 8 * 3) / 4
                            height: 56,
                            borderRadius: 1,
                          }}
                          aria-label='view character gallery image'
                        >
                          <Box
                            component='img'
                            src={`${CLOUD_STORAGE_URL}/character-gallery/${id}/${extraImages[3].path}`}
                            sx={{
                              width: 39,
                              height: 56,
                              objectFit: 'cover',
                              borderRadius: 1,
                              backgroundColor: 'background.paper',
                            }}
                            onClick={() => setPhotoIndex(hasMainImage ? 4 : 3)}
                            alt='gallery image 4'
                          />
                          {extraImages.length > 4 ||
                            (true && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  borderRadius: 1,
                                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                  backdropFilter: 'blur(2px)',
                                }}
                              >
                                <Typography fontSize={14} fontWeight='medium'>
                                  +{extraImages.length - 4}
                                </Typography>
                              </Box>
                            ))}
                        </ButtonBase>
                      )}
                    </Stack>
                  </Box>
                </Stack>
                <Lightbox
                  open={photoIndex >= 0}
                  close={() => setPhotoIndex(-1)}
                  index={photoIndex}
                  animation={{
                    fade: 220,
                    swipe: 220,
                    // default from PhotoSwipe
                    easing: {
                      fade: 'cubic-bezier(0.4, 0, 0.22, 1)',
                      swipe: 'cubic-bezier(0.4, 0, 0.22, 1)',
                    },
                  }}
                  styles={{
                    container: {
                      backgroundColor: 'rgba(0, 0, 0, 0.85)',
                      backdropFilter: 'blur(4px)',
                    },
                  }}
                  plugins={[Captions, Counter]}
                  counter={{
                    container: { style: { top: 'unset', bottom: 0 } },
                  }}
                  slides={[
                    ...(hasMainImage
                      ? [
                          {
                            src: `${CLOUD_STORAGE_URL}/characters/${id}`,
                            alt: name,
                            title: name,
                          },
                        ]
                      : []),
                    ...extraImages.map(({ path, caption }, idx) => ({
                      src: `${CLOUD_STORAGE_URL}/character-gallery/${id}/${path}`,
                      alt: caption || `Image ${idx + 1}`,
                      title: caption,
                    })),
                  ]}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md>
            <Box
              sx={{
                display: {
                  xs: 'none',
                  md: 'block',
                },
                pt: 8,
                mb: 3,
              }}
            >
              <Typography variant='h1'>{name}</Typography>
              <Typography sx={{ color: 'text.secondary' }}>
                {category}
              </Typography>
            </Box>
            <Box component='section' sx={{ mb: 3 }}>
              <Typography>
                {description || 'No description available.'}
              </Typography>
              {descriptionSourceName && (
                <Typography color='text.secondary' sx={{ mt: 2 }}>
                  Source:{' '}
                  {descriptionSourceUrl ? (
                    <Link
                      href={descriptionSourceUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      sx={{
                        color: 'text.secondary',
                        '&:hover, &:focus': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {descriptionSourceName}
                    </Link>
                  ) : (
                    descriptionSourceName
                  )}
                </Typography>
              )}
            </Box>
            {formattedGames.length > 0 && (
              <Box
                sx={{
                  mb: voiceActors.length > 0 || hasOtherInformation ? 3 : 0,
                }}
              >
                <Typography variant='h2' sx={{ mb: 2 }}>
                  Game Appearances
                </Typography>
                <Grid container spacing={2}>
                  {formattedGames.slice(0, 8).map((game) => (
                    <Grid item xs={6} xs3={4} sm4={3} key={game.id}>
                      <GameItem {...game} />
                    </Grid>
                  ))}
                </Grid>
                {formattedGames.length > 8 && (
                  <>
                    <Collapse in={isGamesExpanded}>
                      <Box sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                          {formattedGames.slice(8).map((game) => (
                            <Grid item xs={6} xs3={4} sm4={3} key={game.id}>
                              <GameItem {...game} />
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    </Collapse>
                    <ButtonBase
                      onClick={() => {
                        setIsGamesExpanded((prev) => !prev);
                      }}
                      focusRipple
                      sx={{
                        mt: 1,
                      }}
                      aria-label='view character gallery'
                    >
                      <Typography color='text.secondary' fontSize={14}>
                        {isGamesExpanded
                          ? 'Show less'
                          : `Show all (+${formattedGames.length - 8})`}
                      </Typography>
                    </ButtonBase>
                  </>
                )}
              </Box>
            )}
            {voiceActors.length > 0 && (
              <Box component='section' mb={hasOtherInformation ? 3 : 0}>
                <Typography variant='h2' sx={{ mb: 2 }}>
                  Voice Actors
                </Typography>
                <Stack direction='column' spacing={1}>
                  {voiceActors.map((voiceActor) => (
                    <ButtonBase
                      key={voiceActor.staffId}
                      focusRipple
                      component={Link}
                      href={`/staff/${voiceActor.staffId}`}
                      sx={{
                        display: 'block',
                        width: '100%',
                        borderRadius: 2,
                        '&:hover > .MuiPaper-root, &:focus > .MuiPaper-root': {
                          boxShadow: ({ shadows }) => shadows[6],
                        },
                      }}
                      aria-label='view character gallery'
                    >
                      <Paper
                        sx={{
                          px: 2,
                          py: 1.5,
                        }}
                      >
                        <Stack direction='row' spacing={2}>
                          <Box
                            sx={{
                              position: 'relative',
                              height: 40,
                            }}
                          >
                            <Avatar
                              src={
                                staffInfoCache[voiceActor.staffId]?.hasAvatar
                                  ? `${CLOUD_STORAGE_URL}/staff/${voiceActor.staffId}`
                                  : undefined
                              }
                              alt={
                                staffInfoCache[voiceActor.staffId]?.hasAvatar
                                  ? undefined
                                  : staffInfoCache[voiceActor.staffId]?.name ||
                                    'voice actor avatar'
                              }
                              imgProps={{
                                loading: 'lazy',
                              }}
                              sx={{
                                width: 40,
                                height: 40,
                                backgroundColor: 'text.disabled',
                              }}
                            />
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: -3,
                                right: -3,
                                width: 22,
                                height: 18,
                                backgroundColor: 'background.paper',
                                borderRadius: 1,
                              }}
                            >
                              <Box
                                component={ReactCountryFlag}
                                countryCode={
                                  COUNTRIES.find(
                                    ({ language }) =>
                                      language === voiceActor.language
                                  )!.countryCode
                                }
                                svg
                                sx={{
                                  display: 'block',
                                  m: '3px !important',
                                  mt: '-4px !important',
                                  width: '16px !important',
                                  height: 'auto !important',
                                  borderRadius: 1,
                                }}
                                aria-label={voiceActor.language}
                              />
                            </Box>
                          </Box>
                          <Box>
                            <Typography sx={{ fontWeight: 'medium' }}>
                              {staffInfoCache[voiceActor.staffId]?.name ||
                                'Unknown staff'}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 14,
                                color: 'text.secondary',
                              }}
                              aria-label='description'
                            >
                              {voiceActor.description}
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    </ButtonBase>
                  ))}
                </Stack>
              </Box>
            )}
            {hasOtherInformation && (
              <Box component='section'>
                <Typography variant='h2' mb={2}>
                  Other Information
                </Typography>
                {aliases && aliases.length > 0 && (
                  <Paper sx={{ mb: 1, px: 2, py: 1.5 }}>
                    <Typography component='h3' fontWeight='bold'>
                      Aliases
                    </Typography>
                    <Box component='ul' sx={{ m: 0, pl: 2 }}>
                      {aliases.map((alias) => (
                        <li key={alias}>{alias}</li>
                      ))}
                    </Box>
                  </Paper>
                )}
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  );
};

export default CharacterInfo;
