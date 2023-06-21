import { useState } from 'react';

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
import { getDownloadURL, ref } from 'firebase/storage';
import { GetServerSideProps } from 'next';
import Head from 'next/head';

import { Link, MainLayout, MusicItem } from '~/components';
import { cacheCollection, staffInfosCollection, storage } from '~/configs';
import { useMusicPlayer } from '~/hooks';
import { StaffInfoSchema } from '~/schemas';

type Props = StaffInfoSchema & {
  id: string;
  staffNames: Record<string, string>;
  gameNames: Record<string, string>;
  albumNames: Record<string, string>;
  albumArtUrls: Record<string, string>;
  avatarUrl?: string;
};

export const getServerSideProps: GetServerSideProps<Props> = async (
  context
) => {
  const { staffId: staffIdRaw } = context.query;

  const staffId = String(staffIdRaw);

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
    staffNames: {},
    gameNames: {},
    albumNames: {},
    albumArtUrls: {},
    // remove updatedAt from cachedMusic values to prevent next.js errors
    cachedMusic: Object.fromEntries(
      Object.entries(docSnap.data().cachedMusic).map(
        ([key, { updatedAt, ...m }]) => [key, m]
      )
    ),
  };

  try {
    const avatarUrl = await getDownloadURL(
      ref(storage, `staff-avatars/${staffId}`)
    );
    data.avatarUrl = avatarUrl;
  } catch (error) {
    console.error(error);
  }

  const musicAlbums = [
    ...new Set(Object.values(data.cachedMusic).map((s) => s.albumId)),
  ].filter(Boolean);

  const [
    staffNamesRes,
    gameNamesRes,
    albumNamesRes,
    ...musicAlbumImageUrlsRes
  ] = await Promise.allSettled([
    getDoc(doc(cacheCollection, 'staffNames')),
    getDoc(doc(cacheCollection, 'gameNames')),
    getDoc(doc(cacheCollection, 'albumNames')),
    ...musicAlbums.map((albumId) =>
      getDownloadURL(ref(storage, `album-arts/${albumId}`))
    ),
  ]);

  if (staffNamesRes.status === 'fulfilled') {
    data.staffNames = staffNamesRes.value.data() || {};
  }

  if (gameNamesRes.status === 'fulfilled') {
    data.gameNames = gameNamesRes.value.data() || {};
  }

  if (albumNamesRes.status === 'fulfilled') {
    data.albumNames = albumNamesRes.value.data() || {};
  }

  musicAlbumImageUrlsRes.forEach((albumImageUrlRes, idx) => {
    if (albumImageUrlRes.status === 'fulfilled') {
      data.albumArtUrls![musicAlbums[idx]] = albumImageUrlRes.value;
    }
  });

  return { props: data };
};

const StaffInfo = ({
  name,
  description = 'No description available.',
  descriptionSourceName,
  descriptionSourceUrl,
  roles,
  games,
  avatarUrl,
  musicIds,
  cachedMusic,
  albumNames,
  albumArtUrls,
  staffNames,
  gameNames,
}: Props) => {
  const { setNowPlaying, setQueue } = useMusicPlayer();

  const formattedSoundtracks = musicIds
    .map((soundtrackId) => {
      const soundtrack = cachedMusic[soundtrackId];

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

  const [isSoundtracksExpanded, setIsSoundtracksExpanded] = useState(false);

  return (
    <MainLayout title={name}>
      <Head>
        <meta name='og:title' content={name} />
        <meta name='og:description' content={description} />
        {!!avatarUrl && <meta name='og:image' content={avatarUrl} />}
      </Head>
      <Box
        sx={{
          height: 100,
          mx: {
            xs: -2,
            sm: 0,
          },
          borderRadius: {
            sm: 4,
          },
          backgroundColor: 'headerBackground',
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
              {avatarUrl ? (
                <Avatar
                  src={avatarUrl}
                  sx={{
                    width: 128,
                    height: 128,
                    border: ({ palette }) =>
                      `8px solid ${palette.background.default}`,
                  }}
                />
              ) : (
                <Avatar
                  sx={{
                    width: 128,
                    height: 128,
                    backgroundColor: 'avatarBackground',
                    border: ({ palette }) =>
                      `8px solid ${palette.background.default}`,
                  }}
                />
              )}
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
              <Typography variant='h1'>{name}</Typography>
              <Typography sx={{ color: 'text.secondary' }}>
                {roles.join(', ')}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
      <Box component='section' sx={{ mb: 4 }}>
        <Typography>{description}</Typography>
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
      {games.length > 0 && (
        <Box component='section' sx={{ mb: 4 }}>
          <Typography component='h2' variant='h2' gutterBottom>
            Involvements
          </Typography>
          <Stack spacing={1}>
            {games.map((game, idx) => (
              <Paper
                key={game.gameId}
                sx={{
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
                    {idx + 1}
                  </Box>
                  <Box sx={{ width: '100%' }}>
                    <Typography sx={{ fontWeight: 'medium' }}>
                      {gameNames[game.gameId] || 'Unknown game'}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 14,
                        color: 'text.secondary',
                      }}
                    >
                      {game.roles.join(', ') || 'Unknown role'}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
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

export default StaffInfo;
