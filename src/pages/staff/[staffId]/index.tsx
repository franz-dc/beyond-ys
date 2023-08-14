import { useEffect, useState } from 'react';

import {
  Avatar,
  Box,
  ButtonBase,
  Collapse,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import type { GetStaticPaths, GetStaticProps } from 'next';

import { Link, MainLayout, MusicItem } from '~/components';
import { cacheCollection, staffInfosCollection } from '~/configs';
import { CLOUD_STORAGE_URL } from '~/constants';
import { useMusicPlayer } from '~/hooks';
import {
  GameCacheSchema,
  MusicAlbumCacheSchema,
  StaffInfoCacheSchema,
  StaffInfoSchema,
} from '~/schemas';

type Params = {
  staffId: string;
};

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  if (process.env.USE_EMPTY_STATIC_PATHS === 'true')
    return { paths: [], fallback: 'blocking' };

  const staffsDoc = await getDoc<Record<string, StaffInfoCacheSchema>>(
    doc(cacheCollection, 'staffInfo')
  );

  const staffInfoCache = staffsDoc.data() || {};

  return {
    paths: Object.keys(staffInfoCache).map((staffId) => ({
      params: { staffId },
    })),
    fallback: 'blocking',
  };
};

type Props = StaffInfoSchema & {
  id: string;
  staffInfoCache: Record<string, StaffInfoCacheSchema>;
  cachedGames: Record<string, GameCacheSchema>;
  cachedMusicAlbums: Record<string, MusicAlbumCacheSchema>;
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const staffId = params?.staffId as string;

  if (!staffId) return { notFound: true };

  const docRef = doc(staffInfosCollection, staffId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    console.error(`Staff member with id "${staffId}" does not exist.`);
    return { notFound: true };
  }

  const data: Props = {
    ...docSnap.data(),
    id: staffId,
    updatedAt: docSnap.data().updatedAt.toMillis(),
    staffInfoCache: {},
    cachedGames: {},
    cachedMusicAlbums: {},
    // remove updatedAt from cachedMusic values to prevent next.js errors
    cachedMusic: Object.fromEntries(
      Object.entries(docSnap.data().cachedMusic).map(
        ([key, { updatedAt, ...m }]) => [key, m]
      )
    ),
  };

  const [staffInfoCacheRes, cachedGamesRes, cachedMusicAlbumsRes] =
    await Promise.allSettled([
      getDoc(doc(cacheCollection, 'staffInfo')),
      getDoc(doc(cacheCollection, 'games')),
      getDoc(doc(cacheCollection, 'musicAlbums')),
    ]);

  if (staffInfoCacheRes.status === 'fulfilled') {
    data.staffInfoCache = staffInfoCacheRes.value.data() || {};
  }

  if (cachedGamesRes.status === 'fulfilled') {
    data.cachedGames = cachedGamesRes.value.data() || {};
  }

  if (cachedMusicAlbumsRes.status === 'fulfilled') {
    data.cachedMusicAlbums = cachedMusicAlbumsRes.value.data() || {};
  }

  return { props: data };
};

const GameInvolvementItem = ({
  gameId,
  roles,
  name,
  order,
}: Props['games'][0] & {
  name: string;
  order: number;
}) => (
  <Paper
    key={gameId}
    sx={{
      overflow: 'hidden',
      '&:hover, &:focus-within': {
        boxShadow: ({ shadows }) => shadows[6],
      },
    }}
  >
    <ButtonBase
      focusRipple
      component={Link}
      href={`/games/${gameId}`}
      sx={{
        display: 'block',
        width: '100%',
        px: 2,
        py: 1.5,
      }}
    >
      <Stack direction='row' spacing={2}>
        <Box
          sx={{
            width: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
          }}
        >
          {order}
        </Box>
        <Box sx={{ width: '100%' }}>
          <Typography sx={{ fontWeight: 'medium' }}>{name}</Typography>
          <Typography
            sx={{
              fontSize: 14,
              color: 'text.secondary',
            }}
          >
            {roles.join(', ') || 'Unknown role'}
          </Typography>
        </Box>
      </Stack>
    </ButtonBase>
  </Paper>
);

const StaffInfo = ({
  id,
  name,
  description = 'No description available.',
  descriptionSourceName,
  descriptionSourceUrl,
  roles,
  games,
  musicIds,
  cachedMusic,
  cachedMusicAlbums,
  staffInfoCache,
  cachedGames,
  hasAvatar,
  aliases,
  relevantLinks,
}: Props) => {
  const { setNowPlaying, setQueue } = useMusicPlayer();

  const albumReleaseDateHash = Object.entries(cachedMusicAlbums).reduce<
    Record<string, string>
  >((acc, [albumId, album]) => {
    if (album.releaseDate) {
      acc[albumId] = album.releaseDate as string;
    }
    return acc;
  }, {});

  const formattedSoundtracks = musicIds
    .map((soundtrackId) => {
      const soundtrack = cachedMusic[soundtrackId];
      const hasArrangerOrOtherArtists =
        soundtrack.arrangerIds.length > 0 || soundtrack.otherArtists.length > 0;

      if (!soundtrack) return null;

      return {
        ...soundtrack,
        id: soundtrackId,
        artists: [
          // populate composers
          ...soundtrack.composerIds.map((c) => {
            const foundStaffName = staffInfoCache[c]?.name;
            return foundStaffName
              ? {
                  name: hasArrangerOrOtherArtists
                    ? `${foundStaffName} (Comp.)`
                    : foundStaffName,
                  link: `/staff/${c}`,
                }
              : null;
          }),
          // populate arrangers
          ...soundtrack.arrangerIds.map((a) => {
            const foundStaffName = staffInfoCache[a]?.name;
            return foundStaffName
              ? {
                  name: `${foundStaffName} (Arr.)`,
                  link: `/staff/${a}`,
                }
              : null;
          }),
          // populate other artists
          ...soundtrack.otherArtists.map((a) => {
            const foundStaffName = staffInfoCache[a.staffId]?.name;
            return foundStaffName
              ? {
                  name: `${foundStaffName} (${a.role || 'Other'})`,
                  link: `/staff/${a.staffId}`,
                }
              : null;
          }),
        ].filter((a): a is Exclude<typeof a, null> => !!a),
      };
    })
    .filter((s): s is Exclude<typeof s, null> => !!s)
    // sort by release date (descending), no release date at the end
    .sort((a, b) => {
      const aReleaseDate = albumReleaseDateHash[a.albumId];
      const bReleaseDate = albumReleaseDateHash[b.albumId];

      if (aReleaseDate && bReleaseDate) {
        return bReleaseDate.localeCompare(aReleaseDate);
      } else if (aReleaseDate) {
        return -1;
      } else if (bReleaseDate) {
        return 1;
      } else {
        return 0;
      }
    });

  const [isGameInvolvementsExpanded, setIsGameInvolvementsExpanded] =
    useState(false);
  const [isSoundtracksExpanded, setIsSoundtracksExpanded] = useState(false);

  // NextJS keeps the states on page change, so we need to reset it
  useEffect(() => {
    setIsSoundtracksExpanded(false);
  }, [id]);

  const hasOtherInformation =
    (!!aliases && aliases.length > 0) ||
    (!!relevantLinks && relevantLinks.length > 0);

  return (
    <MainLayout
      title={name}
      description={description}
      image={hasAvatar ? `${CLOUD_STORAGE_URL}/staff-avatars/${id}` : undefined}
    >
      <Box
        className='header-bg'
        sx={{
          height: 100,
          mx: {
            xs: -2,
            sm: 0,
          },
          borderRadius: {
            sm: 4,
          },
        }}
      />
      <Box
        sx={{
          mt: {
            xs: '-100px',
            sm: '-60px',
          },
          mx: {
            xs: 2,
            sm: 3,
          },
          mb: {
            xs: 3,
            sm: 2,
          },
        }}
      >
        <Grid
          container
          spacing={{
            xs: 0,
            sm: 2,
          }}
        >
          <Grid item xs={12} sm='auto'>
            <Box
              sx={{
                display: 'flex',
                justifyContent: {
                  xs: 'center',
                  sm: 'flex-start',
                },
                mt: {
                  xs: '20px',
                  sm: 0,
                },
              }}
            >
              <Avatar
                src={
                  hasAvatar
                    ? `${CLOUD_STORAGE_URL}/staff-avatars/${id}`
                    : undefined
                }
                alt={hasAvatar ? `${name} avatar` : undefined}
                sx={{
                  width: 128,
                  height: 128,
                  border: ({ palette }) =>
                    `8px solid ${palette.background.default}`,
                  backgroundColor: 'avatarBackground',
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm>
            <Box
              sx={{
                mt: {
                  xs: '0px',
                  sm: '56px',
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
              <Typography sx={{ color: 'text.secondary' }}>
                {roles.join(', ')}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
      {description && (
        <Box component='section' sx={{ mb: 4 }}>
          <Typography>{description}</Typography>
          {descriptionSourceName && (
            <Typography className='secondary-text' sx={{ mt: 2 }}>
              Source:{' '}
              {descriptionSourceUrl ? (
                <Link
                  href={descriptionSourceUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='secondary-text'
                  sx={{
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
      )}
      {games.length > 0 && (
        <Box component='section' sx={{ mb: 4 }}>
          <Typography component='h2' variant='h2' gutterBottom>
            Game Involvements
          </Typography>
          <Stack spacing={1}>
            {games.slice(0, 10).map((game, idx) => (
              <GameInvolvementItem
                key={game.gameId}
                order={idx + 1}
                name={cachedGames[game.gameId]?.name || 'Unknown game'}
                {...game}
              />
            ))}
          </Stack>
          {games.length > 10 && (
            <>
              <Collapse in={isGameInvolvementsExpanded}>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {games.slice(10).map((game, idx) => (
                    <GameInvolvementItem
                      key={game.gameId}
                      order={idx + 11}
                      name={cachedGames[game.gameId]?.name || 'Unknown game'}
                      {...game}
                    />
                  ))}
                </Stack>
              </Collapse>
              <ButtonBase
                onClick={() => {
                  setIsGameInvolvementsExpanded((prev) => !prev);
                }}
                focusRipple
                sx={{ mt: 1 }}
              >
                <Typography color='text.secondary' fontSize={14}>
                  {isGameInvolvementsExpanded
                    ? 'Show less'
                    : `Show all (+${games.length - 10})`}
                </Typography>
              </ButtonBase>
            </>
          )}
        </Box>
      )}
      {formattedSoundtracks.length > 0 && (
        <Box component='section' sx={{ mb: 4 }}>
          <Typography component='h2' variant='h2' gutterBottom>
            Music
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
          {relevantLinks && relevantLinks.length > 0 && (
            <Paper sx={{ mb: 1, px: 2, py: 1.5 }}>
              <Typography component='h3' fontWeight='bold'>
                Relevant Links
              </Typography>
              <Box component='ul' sx={{ m: 0, pl: 2 }}>
                {relevantLinks.map((link) => (
                  <li key={link.url}>
                    <Link
                      href={link.url}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </Box>
            </Paper>
          )}
        </Box>
      )}
    </MainLayout>
  );
};

export default StaffInfo;
