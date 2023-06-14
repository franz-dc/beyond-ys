import { Avatar, Box, Grid, Paper, Stack, Typography } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { GetServerSideProps } from 'next';
import Head from 'next/head';

import { Link, MainLayout, MusicItem, MusicItemProps } from '~/components';
import { cacheCollection, staffInfosCollection, storage } from '~/configs';
import { useMusicPlayer } from '~/hooks';
import { StaffInfoSchema } from '~/schemas';

type Props = StaffInfoSchema & {
  id: string;
  staffNames: Record<string, string>;
  gameNames: Record<string, string>;
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

  const data = docSnap.data();

  try {
    const avatarUrl = await getDownloadURL(
      ref(storage, `staff-avatars/${staffId}`)
    );
    data.avatarUrl = avatarUrl;
  } catch (error) {
    console.error(error);
  }

  const staffNames = await getDoc(doc(cacheCollection, 'staffNames'));
  const gameNames = await getDoc(doc(cacheCollection, 'gameNames'));

  return {
    props: {
      ...data,
      staffNames: staffNames.data() || {},
      gameNames: gameNames.data() || {},
      id: staffId,
      updatedAt: data.updatedAt.toMillis(),
    },
  };
};

const StaffInfo = ({
  name,
  description = 'No description available.',
  descriptionSourceName,
  descriptionSourceUrl,
  roles,
  games,
  avatarUrl,
  cachedMusic,
  staffNames,
  gameNames,
}: Props) => {
  const { setNowPlaying, setQueue } = useMusicPlayer();

  const formattedSoundtracks = cachedMusic.map((soundtrack) => ({
    ...soundtrack,
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
              link: `/staff/${a}`,
            }
          : null
      ),
    ].filter(Boolean) as MusicItemProps['artists'],
  }));

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
          backgroundColor: 'background.header',
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
                    backgroundColor: 'background.avatar',
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
            {formattedSoundtracks.map((soundtrack, idx) => (
              <MusicItem
                key={idx}
                id={soundtrack.id}
                title={soundtrack.title}
                artists={soundtrack.artists}
                youtubeId={soundtrack.youtubeId}
                duration={soundtrack.duration}
                trackNumber={idx + 1}
                onPlay={
                  !!soundtrack.youtubeId
                    ? () => {
                        setNowPlaying({
                          id: soundtrack.id,
                          title: soundtrack.title,
                          youtubeId: soundtrack.youtubeId,
                          artists: soundtrack.artists,
                          // TODO: albumName
                          // TODO: albumUrl
                        });
                        setQueue(
                          formattedSoundtracks.map((s) => ({
                            id: s.id,
                            title: s.title,
                            youtubeId: s.youtubeId,
                            artists: s.artists,
                            // TODO: albumName
                            // TODO: albumUrl
                          }))
                        );
                      }
                    : undefined
                }
              />
            ))}
          </Stack>
        </Box>
      )}
    </MainLayout>
  );
};

export default StaffInfo;
