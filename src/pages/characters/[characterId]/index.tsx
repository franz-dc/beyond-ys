import { useState } from 'react';

import {
  Avatar,
  Box,
  ButtonBase,
  Collapse,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { GetServerSideProps } from 'next';
import { ReactCountryFlag } from 'react-country-flag';
import { MdNoAccounts } from 'react-icons/md';
import { Lightbox } from 'yet-another-react-lightbox';
import { Captions, Counter } from 'yet-another-react-lightbox/plugins';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/counter.css';

import { Link, MainLayout } from '~/components';
import { cacheCollection, charactersCollection, storage } from '~/configs';
import { CLOUD_STORAGE_URL, COUNTRIES } from '~/constants';
import { CharacterSchema } from '~/schemas';

interface Props extends CharacterSchema {
  id: string;
  // using getDownloadURL instead of direct url for determining if image exists
  // this affects lightbox logic if removed
  mainImageUrl?: string;
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

  const [staffNamesDocRes, mainImageUrlRes] = await Promise.allSettled([
    getDoc(doc(cacheCollection, 'staffNames')),
    getDownloadURL(ref(storage, `characters/${characterId}`)),
  ]);

  const data: Props = {
    ...docSnap.data(),
    id: characterId,
    updatedAt: docSnap.data()?.updatedAt?.toMillis() || null,
    staffNames:
      staffNamesDocRes.status === 'fulfilled'
        ? staffNamesDocRes.value.data() || {}
        : {},
  };

  if (mainImageUrlRes.status === 'fulfilled' && mainImageUrlRes.value) {
    data.mainImageUrl = mainImageUrlRes.value;
  }

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
  mainImageUrl,
  gameIds,
  cachedGameNames,
  voiceActors,
  staffNames,
  extraImages,
}: Props) => {
  const formattedGames = gameIds
    .map((gameId) => ({
      id: gameId,
      name: cachedGameNames[gameId],
    }))
    .filter((g) => !!g.name);

  const [photoIndex, setPhotoIndex] = useState(-1);

  const [isGamesExpanded, setIsGamesExpanded] = useState(false);

  return (
    <MainLayout title={name} description={description} image={mainImageUrl}>
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
                            src={`${CLOUD_STORAGE_URL}/${image.path}`}
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
                      {extraImages[3] && (
                        <ButtonBase
                          focusRipple
                          sx={{
                            position: 'relative',
                            width: 39, // (180 - 8 * 3) / 4
                            height: 56,
                            borderRadius: 1,
                          }}
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
                            onClick={() => setPhotoIndex(mainImageUrl ? 4 : 3)}
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
                    ...(mainImageUrl
                      ? [{ src: mainImageUrl, alt: name, title: name }]
                      : []),
                    ...extraImages.map(({ path, caption }, idx) => ({
                      src: `${CLOUD_STORAGE_URL}/character-gallery/${id}/${path}`,
                      alt: caption || `Image ${idx + 1}`,
                      title: caption || `Image ${idx + 1}`,
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
                <Stack direction='column' spacing={1}>
                  {formattedGames.slice(0, 10).map((game) => (
                    <ButtonBase
                      key={game.id}
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
                  ))}
                </Stack>
                {formattedGames.length > 10 && (
                  <>
                    <Collapse in={isGamesExpanded}>
                      <Box sx={{ mt: 1 }}>
                        <Stack direction='column' spacing={1}>
                          {formattedGames.slice(10).map((game) => (
                            <ButtonBase
                              key={game.id}
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
                          ))}
                        </Stack>
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
                    >
                      <Typography color='text.secondary' fontSize={14}>
                        {isGamesExpanded
                          ? 'Show less'
                          : `Show all (+${formattedGames.length - 10})`}
                      </Typography>
                    </ButtonBase>
                  </>
                )}
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
                              src={`${CLOUD_STORAGE_URL}/staff/${voiceActor.staffId}`}
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
