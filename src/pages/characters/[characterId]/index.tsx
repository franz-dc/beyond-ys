import { useState } from 'react';

import {
  Avatar,
  Box,
  ButtonBase,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { ReactCountryFlag } from 'react-country-flag';
import { MdNoAccounts } from 'react-icons/md';
import { Lightbox } from 'yet-another-react-lightbox';
import { Captions } from 'yet-another-react-lightbox/plugins';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';

import { Link, MainLayout } from '~/components';
import { cacheCollection, charactersCollection, storage } from '~/configs';
import { COUNTRIES } from '~/constants';
import { CharacterSchema } from '~/schemas';

interface Props extends CharacterSchema {
  id: string;
  mainImageUrl?: string;
  extraImageUrls: Record<string, string>;
  staffAvatarUrls: Record<string, string>;
  staffNames: Record<string, string>;
}

export const getServerSideProps: GetServerSideProps<Props> = async (
  context
) => {
  const { characterId: characterIdRaw } = context.query;
  const characterId = String(characterIdRaw);

  const docSnap = await getDoc(doc(charactersCollection, characterId));

  if (!docSnap.exists()) {
    console.error(`Character with id "${characterId}" does not exist.`);
    return { notFound: true };
  }

  const [staffNamesDocRes, mainImageUrlRes, ...imageUrlsRes] =
    await Promise.allSettled([
      getDoc(doc(cacheCollection, 'staffNames')),
      getDownloadURL(ref(storage, `characters/${characterId}`)),
      ...docSnap
        .data()
        .extraImages.map(({ path }) => getDownloadURL(ref(storage, path))),
      ...docSnap
        .data()
        .voiceActors.map(({ staffId }) =>
          getDownloadURL(ref(storage, `staff-avatars/${staffId}`))
        ),
    ]);

  const staffNames =
    staffNamesDocRes.status === 'fulfilled'
      ? staffNamesDocRes.value.data() || {}
      : {};

  const data: Props = {
    ...docSnap.data(),
    id: characterId,
    updatedAt: docSnap.data()?.updatedAt?.toMillis() || null,
    staffNames,
    extraImageUrls: {},
    staffAvatarUrls: {},
  };

  if (mainImageUrlRes.status === 'fulfilled' && mainImageUrlRes.value) {
    data.mainImageUrl = mainImageUrlRes.value;
  }

  const extraImageUrlsRes = imageUrlsRes.slice(0, data.extraImages.length);
  const staffAvatarUrlsRes = imageUrlsRes.slice(data.extraImages.length);

  data.extraImageUrls = extraImageUrlsRes.reduce<Record<string, string>>(
    (acc, res, idx) => {
      if (res.status === 'fulfilled' && res.value) {
        acc[data.extraImages[idx].path] = res.value;
      }
      return acc;
    },
    {}
  );

  data.staffAvatarUrls = staffAvatarUrlsRes.reduce<Record<string, string>>(
    (acc, res, idx) => {
      if (res.status === 'fulfilled' && res.value) {
        acc[data.voiceActors[idx].staffId] = res.value;
      }
      return acc;
    },
    {}
  );

  return { props: data };
};

const CharacterInfo = ({
  name,
  category,
  accentColor,
  description = 'No description available.',
  descriptionSourceName,
  descriptionSourceUrl,
  imageDirection,
  mainImageUrl,
  gameIds,
  cachedGameNames,
  voiceActors,
  staffNames,
  staffAvatarUrls,
  extraImages,
  extraImageUrls,
}: Props) => {
  const formattedGames = gameIds
    .map((gameId) => ({
      id: gameId,
      name: cachedGameNames[gameId],
    }))
    .filter((g) => !!g.name);

  const [photoIndex, setPhotoIndex] = useState(-1);

  return (
    <MainLayout title={name}>
      <Head>
        <meta name='description' content={description} />
        <meta name='og:title' content={name} />
        <meta name='og:description' content={description} />
        {!!mainImageUrl && <meta name='og:image' content={mainImageUrl} />}
      </Head>
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
          backgroundImage: `linear-gradient(${accentColor}99, rgba(0, 0, 0, 0))`,
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
                  {mainImageUrl ? (
                    <ButtonBase
                      focusRipple
                      onClick={() => setPhotoIndex(0)}
                      sx={{
                        borderRadius: 2,
                      }}
                    >
                      <Box
                        component='img'
                        src={mainImageUrl || '/images/placeholder.png'}
                        alt={name}
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
                        >
                          <Box
                            component='img'
                            src={extraImageUrls[image.path]}
                            sx={{
                              width: 39,
                              height: 56,
                              objectFit: 'cover',
                              borderRadius: 1,
                              backgroundColor: 'background.paper',
                            }}
                            onClick={() =>
                              setPhotoIndex(mainImageUrl ? idx + 1 : idx)
                            }
                          />
                        </ButtonBase>
                      ))}
                    </Stack>
                  </Box>
                </Stack>
                <Lightbox
                  open={photoIndex >= 0}
                  close={() => setPhotoIndex(-1)}
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
                  plugins={[Captions]}
                  slides={[
                    ...(mainImageUrl
                      ? [{ src: mainImageUrl, alt: name, description: name }]
                      : []),
                    ...extraImages.map(({ path, caption }, idx) => ({
                      src: extraImageUrls[path],
                      alt: caption || `Image ${idx + 1}`,
                      description: caption || `Image ${idx + 1}`,
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
              <Box sx={{ mb: voiceActors.length > 0 ? 3 : 0 }}>
                <Typography variant='h2' sx={{ mb: 2 }}>
                  Game Appearances
                </Typography>
                <Grid container spacing={1}>
                  {formattedGames.map((game) => (
                    <Grid item key={game.id} xs={12} sm2={6}>
                      <ButtonBase
                        focusRipple
                        component={Link}
                        href={`/games/${game.id}`}
                        sx={{
                          width: '100%',
                          height: '100%',
                          borderRadius: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            height: '100%',
                            px: 2,
                            py: 1.5,
                            backgroundColor: 'background.paper',
                            borderRadius: 2,
                          }}
                        >
                          <Typography>{game.name}</Typography>
                        </Box>
                      </ButtonBase>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            {voiceActors.length > 0 && (
              <Box>
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
                      }}
                    >
                      <Box
                        sx={{
                          backgroundColor: 'background.paper',
                          px: 2,
                          py: 1.5,
                          borderRadius: 2,
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
                              src={staffAvatarUrls[voiceActor.staffId]}
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
                              />
                            </Box>
                          </Box>
                          <Box>
                            <Typography sx={{ fontWeight: 'medium' }}>
                              {staffNames[voiceActor.staffId] ||
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
                      </Box>
                    </ButtonBase>
                  ))}
                </Stack>
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  );
};

export default CharacterInfo;
