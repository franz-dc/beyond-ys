import { useState } from 'react';

import {
  Box,
  ButtonBase,
  Collapse,
  Grid,
  Stack,
  // SvgIcon,
  // Tooltip,
  Typography,
} from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { GetServerSideProps } from 'next';
import Head from 'next/head';

import {
  CharacterItem,
  MainLayout,
  MusicItem,
  StoryTimeline,
} from '~/components';
import { cacheCollection, gamesCollection, storage } from '~/configs';
import {
  CATEGORIES_WITH_TIMELINE,
  // GAME_PLATFORMS,
} from '~/constants';
import { useMusicPlayer } from '~/hooks';
import { GameSchema } from '~/schemas';

type ExtendedGameSchema = GameSchema & {
  id: string;
  bannerUrl?: string;
  coverUrl?: string;
  characterImageUrls?: Record<string, string>;
  staffNames: Record<string, string>;
  albumNames: Record<string, string>;
  albumArtUrls: Record<string, string>;
};

export const getServerSideProps: GetServerSideProps<
  ExtendedGameSchema
> = async (context) => {
  const { gameId: gameIdRaw } = context.query;

  const gameId = String(gameIdRaw);

  const docRef = doc(gamesCollection, gameId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    console.error(`Game with id "${gameId}" does not exist.`);
    return { notFound: true };
  }

  const data: ExtendedGameSchema = {
    ...docSnap.data(),
    id: gameId,
    updatedAt: docSnap.data().updatedAt.toMillis(),
    characterImageUrls: {},
    albumArtUrls: {},
    staffNames: {},
    albumNames: {},
    // convert cachedSoundtracks updatedAt to milliseconds
    cachedSoundtracks: Object.entries(docSnap.data().cachedSoundtracks).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: {
          ...value,
          updatedAt: value.updatedAt.toMillis(),
        },
      }),
      {}
    ),
  };

  const soundtrackAlbums = [
    ...new Set(Object.values(data.cachedSoundtracks).map((s) => s.albumId)),
  ].filter(Boolean);

  // doing it this way to parallelize the requests and save time
  const res = await Promise.allSettled([
    getDownloadURL(ref(storage, `game-banners/${gameId}`)),
    getDownloadURL(ref(storage, `game-covers/${gameId}`)),
    getDoc(doc(cacheCollection, 'staffNames')),
    getDoc(doc(cacheCollection, 'albumNames')),
    ...data.characterIds.map((characterId) =>
      getDownloadURL(ref(storage, `character-avatars/${characterId}`))
    ),
    ...soundtrackAlbums.map((albumId) =>
      getDownloadURL(ref(storage, `album-arts/${albumId}`))
    ),
  ]);

  const characterIdsLength = data.characterIds.length;
  const soundtrackAlbumsLength = soundtrackAlbums.length;

  const bannerUrlRes = res[0];
  const coverUrlRes = res[1];
  const staffNamesRes = res[2];
  const albumNamesRes = res[3];
  const characterImageUrlsRes = res.slice(
    4,
    4 + characterIdsLength
  ) as PromiseFulfilledResult<string>[];
  const soundtrackAlbumImageUrlsRes = res.slice(
    4 + characterIdsLength,
    4 + characterIdsLength + soundtrackAlbumsLength
  ) as PromiseFulfilledResult<string>[];

  if (bannerUrlRes.status === 'fulfilled') {
    data.bannerUrl = bannerUrlRes.value;
  }

  if (coverUrlRes.status === 'fulfilled') {
    data.coverUrl = coverUrlRes.value;
  }

  if (staffNamesRes.status === 'fulfilled') {
    data.staffNames = staffNamesRes.value.data() || {};
  }

  if (albumNamesRes.status === 'fulfilled') {
    data.albumNames = albumNamesRes.value.data() || {};
  }

  characterImageUrlsRes.forEach((characterImageUrlRes, idx) => {
    if (characterImageUrlRes.status === 'fulfilled') {
      data.characterImageUrls![data.characterIds[idx]] =
        characterImageUrlRes.value;
    }
  });

  soundtrackAlbumImageUrlsRes.forEach((albumImageUrlRes, idx) => {
    if (albumImageUrlRes.status === 'fulfilled') {
      data.albumArtUrls![soundtrackAlbums[idx]] = albumImageUrlRes.value;
    }
  });

  return { props: data };
};

const GamePage = ({
  id,
  name,
  category,
  bannerUrl,
  coverUrl,
  // platforms,
  // releaseDate: releaseDateRaw,
  description = 'No description available.',
  characterIds,
  characterSpoilerIds,
  cachedCharacters,
  characterImageUrls,
  soundtrackIds,
  albumArtUrls,
  cachedSoundtracks,
  staffNames,
  albumNames,
}: ExtendedGameSchema) => {
  const { setNowPlaying, setQueue } = useMusicPlayer();

  // const releaseYear = releaseDateRaw
  //   ? new Date(releaseDateRaw).getFullYear()
  //   : null;

  const formattedSoundtracks = soundtrackIds
    .map((soundtrackId) => {
      const soundtrack = cachedSoundtracks[soundtrackId];

      if (!soundtrack) return null;

      return {
        ...soundtrack,
        id: soundtrackId,
        artists: [
          // populate composers
          ...soundtrack.composerIds.map((c) =>
            staffNames[c]
              ? {
                  name: staffNames[c],
                  link: `/staff/${c}`,
                }
              : null
          ),
          // populate arrangers
          ...soundtrack.arrangerIds.map((a) =>
            staffNames[a]
              ? {
                  name: `${staffNames[a]} (Arr.)`,
                  link: `/staff/${a}`,
                }
              : null
          ),
          // populate other artists
          ...soundtrack.otherArtists.map((a) =>
            staffNames[a.staffId]
              ? {
                  name: `${staffNames[a.staffId]} (${a.role || 'Other'})`,
                  link: `/staff/${a.staffId}`,
                }
              : null
          ),
        ].filter((a): a is Exclude<typeof a, null> => !!a),
      };
    })
    .filter((s): s is Exclude<typeof s, null> => !!s);

  const [isCharacterSpoilersShown, setIsCharacterSpoilersShown] =
    useState(false);

  const [isSoundtracksExpanded, setIsSoundtracksExpanded] = useState(false);

  return (
    <MainLayout title={name}>
      <Head>
        <meta name='og:title' content={name} />
        <meta name='og:description' content={description} />
        {!!(coverUrl || bannerUrl) && (
          <meta name='og:image' content={coverUrl || bannerUrl} />
        )}
      </Head>
      <Box
        sx={{
          height: {
            xs: 120,
            sm: 160,
            md: 200,
          },
          borderRadius: 4,
          backgroundColor: 'headerBackground',
        }}
      >
        {bannerUrl && (
          <Box
            component='img'
            src={bannerUrl}
            alt='game banner'
            sx={{
              width: '100%',
              height: {
                xs: 120,
                sm: 160,
                md: 200,
              },
              objectFit: 'cover',
              borderRadius: 4,
              backgroundColor: 'headerBackground',
              color: 'headerBackground',
            }}
          />
        )}
      </Box>
      <Box
        sx={{
          mt: {
            xs: '-96px',
            md: '-104px',
          },
          mx: {
            xs: 2,
            md: 3,
          },
          mb: {
            xs: 2,
            md: 3,
          },
        }}
      >
        <Grid
          container
          spacing={{
            xs: 2,
            md: 3,
          }}
        >
          <Grid item xs='auto'>
            {coverUrl ? (
              <Box
                component='img'
                src={coverUrl}
                alt='game cover'
                sx={{
                  width: {
                    xs: 120,
                    md: 175,
                  },
                  height: 'auto',
                  borderRadius: 2,
                }}
              />
            ) : (
              <Box
                sx={{
                  width: {
                    xs: 120,
                    md: 175,
                  },
                  height: {
                    xs: 160,
                    md: 250,
                  },
                  borderRadius: 2,
                  backgroundColor: 'background.paper',
                }}
              />
            )}
          </Grid>
          <Grid item xs>
            <Box
              sx={{
                mt: {
                  xs: '96px',
                  md: '96px',
                },
              }}
            >
              <Typography variant='h1'>{name}</Typography>
              <Typography fontSize={18} color='text.secondary' mb={2}>
                {category}
              </Typography>
              {/* <Stack
                direction='row'
                spacing={2}
                sx={{
                  mt: 1,
                  mb: {
                    xs: 0,
                    md: 1.5,
                  },
                }}
              >
                {platforms.map((platform) => {
                  const platformObj = GAME_PLATFORMS[platform];

                  if (!platformObj) return null;

                  if (platformObj.iconType === 'component') {
                    return (
                      <Tooltip key={platform} title={platformObj.name} arrow>
                        <SvgIcon
                          sx={{
                            width: platformObj.width,
                            color: 'text.primary',
                            opacity: 0.65,
                          }}
                        >
                          <platformObj.icon />
                        </SvgIcon>
                      </Tooltip>
                    );
                  }

                  return (
                    <Tooltip key={platform} title={platformObj.name}>
                      <Box
                        component='img'
                        src={platformObj.icon.src}
                        alt={platformObj.name}
                        sx={{
                          width: platformObj.width,
                          filter: 'invert(1)',
                          opacity: 0.65,
                        }}
                      />
                    </Tooltip>
                  );
                })}
              </Stack> */}
              <Typography
                sx={{
                  display: {
                    xs: 'none',
                    md: 'block',
                  },
                }}
              >
                {description}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
      <Box
        component='section'
        sx={{
          display: {
            xs: 'block',
            md: 'none',
          },
          mb: 4,
        }}
      >
        <Typography component='h2' variant='h2' mb={1}>
          Description
        </Typography>
        <Typography>{description}</Typography>
      </Box>
      {characterIds.length > 0 && (
        <Box component='section' sx={{ mb: 1 }}>
          <Box
            sx={{
              mb: characterSpoilerIds.length > 0 ? 2 : 4,
            }}
          >
            <Typography component='h2' variant='h2'>
              Characters
            </Typography>
            {characterSpoilerIds.length > 0 && (
              <ButtonBase
                onClick={() => {
                  setIsCharacterSpoilersShown((prev) => !prev);
                }}
                focusRipple
                sx={{ mt: -1 }}
              >
                <Typography color='text.secondary' fontSize={14}>
                  {isCharacterSpoilersShown ? 'Hide spoilers' : 'Show spoilers'}
                </Typography>
              </ButtonBase>
            )}
          </Box>
          <Grid container spacing={2}>
            {characterIds.map((characterId) => {
              const foundCharacterCache = cachedCharacters[characterId];
              if (!foundCharacterCache) return null;

              const foundCharacterImageUrl = characterImageUrls?.[characterId];

              return (
                <Grid item xs={12} xs2={6} sm={4} md={3} key={characterId}>
                  <CharacterItem
                    id={characterId}
                    name={foundCharacterCache.name}
                    accentColor={foundCharacterCache.accentColor}
                    image={foundCharacterImageUrl}
                    imageDirection={foundCharacterCache.imageDirection}
                    isSpoiler={characterSpoilerIds.includes(characterId)}
                    isSpoilerShown={isCharacterSpoilersShown}
                    sx={{
                      mb: 3,
                    }}
                  />
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
      {/* @ts-ignore */}
      {CATEGORIES_WITH_TIMELINE.includes(category) && (
        <StoryTimeline id={id} category={category} />
      )}
      {formattedSoundtracks.length > 0 && (
        <Box component='section' sx={{ mb: 4 }}>
          <Typography component='h2' variant='h2' mb={2}>
            Soundtracks
          </Typography>
          <Stack spacing={1}>
            {formattedSoundtracks.slice(0, 10).map((soundtrack, idx) => (
              <MusicItem
                key={idx}
                id={soundtrack.id}
                title={soundtrack.title}
                artists={soundtrack.artists}
                youtubeId={soundtrack.youtubeId}
                duration={soundtrack.duration}
                trackNumber={idx + 1}
                albumName={albumNames[soundtrack.albumId]}
                albumUrl={albumArtUrls![soundtrack.albumId]}
                onPlay={
                  !!soundtrack.youtubeId
                    ? () => {
                        setNowPlaying({
                          id: soundtrack.id,
                          title: soundtrack.title,
                          youtubeId: soundtrack.youtubeId,
                          artists: soundtrack.artists,
                          albumName: albumNames[soundtrack.albumId],
                          albumUrl: albumArtUrls![soundtrack.albumId],
                        });
                        setQueue(
                          formattedSoundtracks.map((s) => ({
                            id: s.id,
                            title: s.title,
                            youtubeId: s.youtubeId,
                            artists: s.artists,
                            albumName: albumNames[soundtrack.albumId],
                            albumUrl: albumArtUrls![soundtrack.albumId],
                          }))
                        );
                      }
                    : undefined
                }
              />
            ))}
            {formattedSoundtracks.length > 10 && (
              <Collapse in={isSoundtracksExpanded}>
                <Stack spacing={1}>
                  {formattedSoundtracks.slice(10).map((soundtrack, idx) => (
                    <MusicItem
                      key={idx}
                      id={soundtrack.id}
                      title={soundtrack.title}
                      artists={soundtrack.artists}
                      youtubeId={soundtrack.youtubeId}
                      duration={soundtrack.duration}
                      trackNumber={idx + 11}
                      albumName={albumNames[soundtrack.albumId]}
                      albumUrl={albumArtUrls![soundtrack.albumId]}
                      onPlay={
                        !!soundtrack.youtubeId
                          ? () => {
                              setNowPlaying({
                                id: soundtrack.id,
                                title: soundtrack.title,
                                youtubeId: soundtrack.youtubeId,
                                artists: soundtrack.artists,
                                albumName: albumNames[soundtrack.albumId],
                                albumUrl: albumArtUrls![soundtrack.albumId],
                              });
                              setQueue(
                                formattedSoundtracks.map((s) => ({
                                  id: s.id,
                                  title: s.title,
                                  youtubeId: s.youtubeId,
                                  artists: s.artists,
                                  albumName: albumNames[soundtrack.albumId],
                                  albumUrl: albumArtUrls![soundtrack.albumId],
                                }))
                              );
                            }
                          : undefined
                      }
                    />
                  ))}
                </Stack>
              </Collapse>
            )}
          </Stack>
          {formattedSoundtracks.length > 10 && (
            <ButtonBase
              onClick={() => {
                setIsSoundtracksExpanded((prev) => !prev);
              }}
              focusRipple
              sx={{
                mt: isSoundtracksExpanded ? 1 : -1,
              }}
            >
              <Typography color='text.secondary' fontSize={14}>
                {isSoundtracksExpanded
                  ? 'Show less'
                  : `Show all (+${formattedSoundtracks.length - 10})`}
              </Typography>
            </ButtonBase>
          )}
        </Box>
      )}
    </MainLayout>
  );
};

export default GamePage;
