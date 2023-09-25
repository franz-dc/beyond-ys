import { useEffect, useState } from 'react';

import {
  Alert,
  AlertTitle,
  Box,
  ButtonBase,
  Collapse,
  Grid,
  Paper,
  Stack,
  // SvgIcon,
  // Tooltip,
  Typography,
} from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import type { GetStaticPaths, GetStaticProps } from 'next';
import { MdCircle } from 'react-icons/md';

import {
  CharacterItem,
  Link,
  MainLayout,
  MusicItem,
  StoryTimeline,
} from '~/components';
import { cacheCollection, gamesCollection } from '~/configs';
import {
  CATEGORIES_WITH_PAGES,
  CATEGORIES_WITH_TIMELINE,
  CLOUD_STORAGE_URL,
  GAME_PLATFORMS,
} from '~/constants';
import { useMusicPlayer } from '~/hooks';
import {
  GameCacheSchema,
  GameSchema,
  MusicAlbumCacheSchema,
  StaffInfoCacheSchema,
} from '~/schemas';
import { formatReleaseDate } from '~/utils';

type Params = {
  gameId: string;
};

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  if (process.env.USE_EMPTY_STATIC_PATHS === 'true')
    return { paths: [], fallback: 'blocking' };

  const cachedGamesDoc = await getDoc<Record<string, GameCacheSchema>>(
    doc(cacheCollection, 'games')
  );

  const cachedGames = cachedGamesDoc.data() || {};

  return {
    paths: Object.keys(cachedGames).map((gameId) => ({
      params: { gameId },
    })),
    fallback: 'blocking',
  };
};

type ExtendedGameSchema = GameSchema & {
  id: string;
  staffInfoCache: Record<string, StaffInfoCacheSchema>;
  cachedMusicAlbums: Record<string, MusicAlbumCacheSchema>;
};

export const getStaticProps: GetStaticProps<ExtendedGameSchema> = async ({
  params,
}) => {
  const gameId = params?.gameId as string;

  if (!gameId) return { notFound: true };

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
    staffInfoCache: {},
    cachedMusicAlbums: {},
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

  if (data.soundtrackIds.length > 0) {
    // doing it this way to parallelize the requests and save time
    const [staffInfoCache, cachedMusicAlbumsRes] = await Promise.allSettled([
      getDoc(doc(cacheCollection, 'staffInfo')),
      getDoc(doc(cacheCollection, 'musicAlbums')),
    ]);

    if (staffInfoCache.status === 'fulfilled') {
      data.staffInfoCache = staffInfoCache.value.data() || {};
    }

    if (cachedMusicAlbumsRes.status === 'fulfilled') {
      data.cachedMusicAlbums = cachedMusicAlbumsRes.value.data() || {};
    }
  }

  return { props: data };
};

const GamePage = ({
  id,
  name,
  category,
  subcategory,
  platforms,
  releaseDate,
  description = 'No description available.',
  descriptionSourceName,
  descriptionSourceUrl,
  characterIds,
  characterSpoilerIds,
  cachedCharacters,
  soundtrackIds,
  cachedSoundtracks,
  staffInfoCache,
  cachedMusicAlbums,
  hasBannerImage,
  hasCoverImage,
  aliases,
  noLocalizations,
}: ExtendedGameSchema) => {
  const { setNowPlaying, setQueue } = useMusicPlayer();

  const formattedSoundtracks = soundtrackIds
    .map((soundtrackId) => {
      const soundtrack = cachedSoundtracks[soundtrackId];
      if (!soundtrack) return null;

      const hasArrangerOrOtherArtists =
        soundtrack.arrangerIds.length > 0 || soundtrack.otherArtists.length > 0;
      const filteredOtherArtists = soundtrack.otherArtists.filter(
        (otherArtist) =>
          !soundtrack.composerIds.includes(otherArtist.staffId) &&
          !soundtrack.arrangerIds.includes(otherArtist.staffId)
      );

      return {
        ...soundtrack,
        id: soundtrackId,
        artists: [
          // populate composers
          ...soundtrack.composerIds.map((composerId) => {
            const foundStaffName = staffInfoCache[composerId]?.name;
            const otherRoles = soundtrack.otherArtists
              .filter((otherArtist) => otherArtist.staffId === composerId)
              .map((otherArtist) => otherArtist.role);
            return foundStaffName
              ? {
                  name: hasArrangerOrOtherArtists
                    ? `${foundStaffName} (${['Comp.', ...otherRoles].join(
                        ', '
                      )})`
                    : foundStaffName,
                  link: `/staff/${composerId}`,
                }
              : null;
          }),
          // populate arrangers
          ...soundtrack.arrangerIds.map((arrangerId) => {
            const foundStaffName = staffInfoCache[arrangerId]?.name;
            const otherRoles = soundtrack.otherArtists
              .filter((otherArtist) => otherArtist.staffId === arrangerId)
              .map((otherArtist) => otherArtist.role);
            return foundStaffName
              ? {
                  name: hasArrangerOrOtherArtists
                    ? `${foundStaffName} (${['Arr.', ...otherRoles].join(
                        ', '
                      )})`
                    : foundStaffName,
                  link: `/staff/${arrangerId}`,
                }
              : null;
          }),
          // populate other artists
          ...filteredOtherArtists.map((otherArtist) => {
            const foundStaff = staffInfoCache[otherArtist.staffId]?.name;
            return foundStaff
              ? {
                  name: `${foundStaff} (${otherArtist.role || 'Other'})`,
                  link: `/staff/${otherArtist.staffId}`,
                }
              : null;
          }),
        ].filter((a): a is Exclude<typeof a, null> => !!a),
      };
    })
    .filter((s): s is Exclude<typeof s, null> => !!s);

  const [isCharacterSpoilersShown, setIsCharacterSpoilersShown] =
    useState(false);

  const [isSoundtracksExpanded, setIsSoundtracksExpanded] = useState(false);

  const [isCharactersExpanded, setIsCharactersExpanded] = useState(false);

  // NextJS keeps the states on page change, so we need to reset it
  useEffect(() => {
    setIsCharacterSpoilersShown(false);
    setIsSoundtracksExpanded(false);
  }, [id]);

  const hasOtherInformation =
    (!!aliases && aliases.length > 0) || !!releaseDate || platforms.length > 0;

  const categoryPageInfo = CATEGORIES_WITH_PAGES.find(
    (c) => c.name === category
  );

  return (
    <MainLayout
      title={name}
      description={description}
      image={`${CLOUD_STORAGE_URL}/game-covers/${id}`}
    >
      {noLocalizations && (
        <Alert severity='info' sx={{ mb: 2 }}>
          <AlertTitle>
            This game has not been localized to English yet.
          </AlertTitle>
          Its availability in languages other than the original remains pending.
          Fan translations may or may not be available.
        </Alert>
      )}
      <Box
        className='header-bg'
        sx={{
          height: {
            xs: 120,
            sm: 160,
            md: 200,
          },
          borderRadius: 4,
        }}
      >
        {hasBannerImage && (
          <Box
            component='img'
            src={`${CLOUD_STORAGE_URL}/game-banners/${id}`}
            alt='game banner'
            sx={{
              display: 'block',
              width: {
                xs: 'calc(100% + 32px)',
                sm: '100%',
              },
              height: {
                xs: 120,
                sm: 160,
                md: 200,
              },
              mx: {
                xs: -2,
                sm: 0,
              },
              objectFit: 'cover',
              borderRadius: {
                xs: 0,
                sm: 4,
              },
              backgroundColor: 'headerBackground',
              color: 'headerBackground',
            }}
            key={id}
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
          <Grid item xs={12} sm='auto'>
            <Box
              sx={{
                mx: {
                  xs: 'auto',
                  sm: 0,
                },
                position: 'relative',
                width: {
                  xs: 120,
                  md: 175,
                },
                aspectRatio: '2 / 3',
                color: 'transparent',
                borderRadius: 2,
              }}
            >
              <Box
                className='default-bg'
                sx={{
                  position: 'absolute',
                  display: 'block',
                  top: -8,
                  left: -8,
                  right: -8,
                  bottom: -8,
                  borderRadius: 3,
                }}
              >
                {hasCoverImage ? (
                  <Box
                    component='img'
                    src={`${CLOUD_STORAGE_URL}/game-covers/${id}`}
                    alt='game cover'
                    sx={{
                      display: 'block',
                      width: 'calc(100% - 16px)',
                      height: 'calc(100% - 16px)',
                      m: 1,
                      objectFit: 'cover',
                      borderRadius: 2,
                      zIndex: 1,
                    }}
                    key={id}
                  />
                ) : (
                  <Box
                    className='paper-bg'
                    sx={{
                      width: 'calc(100% - 16px)',
                      height: 'calc(100% - 16px)',
                      m: 1,
                      borderRadius: 2,
                    }}
                  />
                )}
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm>
            <Box
              sx={{
                mt: {
                  sm: '96px',
                },
                textAlign: {
                  xs: 'center',
                  sm: 'left',
                },
              }}
            >
              <Typography
                variant='h1'
                sx={{
                  fontSize: {
                    xs: '1.75rem',
                    sm: '2rem',
                  },
                }}
              >
                {name}
              </Typography>
              <Typography fontSize={18} color='text.secondary' mb={2}>
                {categoryPageInfo ? (
                  <Link
                    href={`/${categoryPageInfo.slug}`}
                    sx={{
                      color: 'text.secondary',
                      outline: 'none',
                      '&:hover, &:focus': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {categoryPageInfo.name}
                  </Link>
                ) : (
                  category
                )}
                {subcategory && (
                  <>
                    <MdCircle
                      style={{
                        display: 'inline-block',
                        verticalAlign: 'middle',
                        marginBottom: 2,
                        marginLeft: '0.5rem',
                        marginRight: '0.5rem',
                        fontSize: '0.35rem',
                      }}
                    />
                    {subcategory}
                  </>
                )}
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
        <Box component='section' sx={{ mb: 4 }}>
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
          <Grid container spacing={2} sx={{ mb: -3 }}>
            {characterIds.slice(0, 8).map((characterId) => {
              const foundCharacterCache = cachedCharacters[characterId];
              if (!foundCharacterCache) return null;

              return (
                <Grid item xs={12} xs2={6} sm2={4} md={3} key={characterId}>
                  <CharacterItem
                    id={characterId}
                    name={foundCharacterCache.name}
                    accentColor={foundCharacterCache.accentColor}
                    image={
                      foundCharacterCache.hasAvatar
                        ? `${CLOUD_STORAGE_URL}/character-avatars/${characterId}`
                        : undefined
                    }
                    isSpoiler={characterSpoilerIds.includes(characterId)}
                    isSpoilerShown={isCharacterSpoilersShown}
                    sx={{ mb: 3 }}
                  />
                </Grid>
              );
            })}
          </Grid>
          {characterIds.length > 8 && (
            <>
              <Collapse in={isCharactersExpanded}>
                <Grid container spacing={2} sx={{ pt: 5 }}>
                  {characterIds.slice(8).map((characterId) => {
                    const foundCharacterCache = cachedCharacters[characterId];
                    if (!foundCharacterCache) return null;

                    return (
                      <Grid
                        item
                        xs={12}
                        xs2={6}
                        sm2={4}
                        md={3}
                        key={characterId}
                      >
                        <CharacterItem
                          id={characterId}
                          name={foundCharacterCache.name}
                          accentColor={foundCharacterCache.accentColor}
                          image={
                            foundCharacterCache.hasAvatar
                              ? `${CLOUD_STORAGE_URL}/character-avatars/${characterId}`
                              : undefined
                          }
                          isSpoiler={characterSpoilerIds.includes(characterId)}
                          isSpoilerShown={isCharacterSpoilersShown}
                          sx={{ mb: 3 }}
                        />
                      </Grid>
                    );
                  })}
                </Grid>
              </Collapse>
              <ButtonBase
                onClick={() => {
                  setIsCharactersExpanded((prev) => !prev);
                }}
                focusRipple
                sx={{
                  mt: isCharactersExpanded ? -3 : 2,
                  transition: 'margin-top 0.15s ease-in-out',
                }}
              >
                <Typography color='text.secondary' fontSize={14}>
                  {isCharactersExpanded
                    ? 'Show less'
                    : `Show all (+${characterIds.length - 8})`}
                </Typography>
              </ButtonBase>
            </>
          )}
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
                albumId={soundtrack.albumId}
                albumName={cachedMusicAlbums[soundtrack.albumId]?.name}
                albumUrl={
                  soundtrack.albumId &&
                  cachedMusicAlbums[soundtrack.albumId]?.hasAlbumArt
                    ? `${CLOUD_STORAGE_URL}/album-arts/${soundtrack.albumId}`
                    : undefined
                }
                onPlay={
                  !!soundtrack.youtubeId
                    ? () => {
                        setNowPlaying({
                          id: soundtrack.id,
                          title: soundtrack.title,
                          youtubeId: soundtrack.youtubeId,
                          artists: soundtrack.artists,
                          albumName:
                            cachedMusicAlbums[soundtrack.albumId]?.name,
                          albumUrl:
                            soundtrack.albumId &&
                            cachedMusicAlbums[soundtrack.albumId]?.hasAlbumArt
                              ? `${CLOUD_STORAGE_URL}/album-arts/${soundtrack.albumId}`
                              : undefined,
                        });
                        setQueue(
                          formattedSoundtracks.map((s) => ({
                            id: s.id,
                            title: s.title,
                            youtubeId: s.youtubeId,
                            artists: s.artists,
                            albumName: cachedMusicAlbums[s.albumId]?.name,
                            albumUrl:
                              s.albumId &&
                              cachedMusicAlbums[s.albumId]?.hasAlbumArt
                                ? `${CLOUD_STORAGE_URL}/album-arts/${s.albumId}`
                                : undefined,
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
                      albumId={soundtrack.albumId}
                      albumName={cachedMusicAlbums[soundtrack.albumId]?.name}
                      albumUrl={
                        soundtrack.albumId &&
                        cachedMusicAlbums[soundtrack.albumId]?.hasAlbumArt
                          ? `${CLOUD_STORAGE_URL}/album-arts/${soundtrack.albumId}`
                          : undefined
                      }
                      onPlay={
                        !!soundtrack.youtubeId
                          ? () => {
                              setNowPlaying({
                                id: soundtrack.id,
                                title: soundtrack.title,
                                youtubeId: soundtrack.youtubeId,
                                artists: soundtrack.artists,
                                albumName:
                                  cachedMusicAlbums[soundtrack.albumId]?.name,
                                albumUrl:
                                  soundtrack.albumId &&
                                  cachedMusicAlbums[soundtrack.albumId]
                                    ?.hasAlbumArt
                                    ? `${CLOUD_STORAGE_URL}/album-arts/${soundtrack.albumId}`
                                    : undefined,
                              });
                              setQueue(
                                formattedSoundtracks.map((s) => ({
                                  id: s.id,
                                  title: s.title,
                                  youtubeId: s.youtubeId,
                                  artists: s.artists,
                                  albumName: cachedMusicAlbums[s.albumId]?.name,
                                  albumUrl:
                                    s.albumId &&
                                    cachedMusicAlbums[s.albumId]?.hasAlbumArt
                                      ? `${CLOUD_STORAGE_URL}/album-arts/${s.albumId}`
                                      : undefined,
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
          {releaseDate && (
            <Paper sx={{ mb: 1, px: 2, py: 1.5 }}>
              <Typography component='h3' fontWeight='bold'>
                Release Date
              </Typography>
              <Typography>
                {formatReleaseDate(releaseDate as string)}
              </Typography>
            </Paper>
          )}
          {platforms.length > 0 && (
            <Paper sx={{ mb: 1, px: 2, py: 1.5 }}>
              <Typography component='h3' fontWeight='bold'>
                Platforms
              </Typography>
              <Box component='ul' sx={{ m: 0, pl: 2 }}>
                {platforms.map((platform) => {
                  const platformName = GAME_PLATFORMS[platform]?.name;
                  if (!platformName) return null;
                  return <li key={platform}>{platformName}</li>;
                })}
              </Box>
            </Paper>
          )}
        </Box>
      )}
    </MainLayout>
  );
};

export default GamePage;
