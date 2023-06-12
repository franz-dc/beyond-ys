import { Box, Grid, Stack, SvgIcon, Tooltip, Typography } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { GetServerSideProps } from 'next';
import Head from 'next/head';

import {
  MainLayout,
  MusicItem,
  MusicItemProps,
  StoryTimeline,
} from '~/components';
import { gamesCollection, staffCollection, storage } from '~/configs';
import { CATEGORIES_WITH_TIMELINE, PLATFORMS } from '~/constants';
import { useMusicPlayer } from '~/hooks';
import { GameSchema, StaffSchema } from '~/schemas';

type ExtendedStaffSchema = StaffSchema & {
  id: string;
};

type ExtendedGameSchema = GameSchema & {
  id: string;
  staffDocs: Record<string, ExtendedStaffSchema>;
};

export const getServerSideProps: GetServerSideProps<
  ExtendedGameSchema
> = async (context) => {
  const { gameId } = context.query;

  const docRef = doc(gamesCollection, String(gameId));
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    console.error(`Game with id "${gameId}" does not exist.`);
    return { notFound: true };
  }

  const data = docSnap.data();

  if (data.bannerPath) {
    try {
      const bannerUrl = await getDownloadURL(ref(storage, data.bannerPath));
      data.bannerUrl = bannerUrl;
    } catch (error) {
      console.error(error);
    }
  }

  if (data.coverPath) {
    try {
      const coverUrl = await getDownloadURL(ref(storage, data.coverPath));
      data.coverUrl = coverUrl;
    } catch (error) {
      console.error(error);
    }
  }

  // aggregate soundtrack staff
  const staffIds = data.cachedSoundtracks.reduce(
    (acc: string[], soundtrack) => {
      return [
        ...soundtrack.composerIds,
        ...soundtrack.arrangerIds,
        ...soundtrack.otherArtists.map((a) => a.staffId),
      ];
    },
    []
  );

  const staffDocsPromise = await Promise.allSettled(
    staffIds.map((staffId) => getDoc(doc(staffCollection, staffId)))
  );

  const staffDocs = (
    staffDocsPromise
      .map((res) =>
        res.status === 'fulfilled'
          ? { ...res.value.data(), id: res.value.id }
          : null
      )
      .filter(Boolean) as ExtendedStaffSchema[]
  ).reduce((acc: ExtendedGameSchema['staffDocs'], staff) => {
    acc[staff!.id] = staff;
    return acc;
  }, {});

  return {
    props: { ...data, staffDocs, id: String(gameId) },
  };
};

const GamePage = ({
  id,
  name,
  category,
  bannerUrl,
  coverUrl,
  platforms,
  description = 'No description available.',
  cachedSoundtracks,
  staffDocs,
}: ExtendedGameSchema) => {
  const { setNowPlaying, setQueue } = useMusicPlayer();

  const formattedSoundtracks = cachedSoundtracks.map((soundtrack) => ({
    ...soundtrack,
    artists: [
      // populate composers
      ...soundtrack.composerIds.map((c) =>
        staffDocs[c]
          ? {
              name: staffDocs[c].name,
              link: `/staff/${c}`,
            }
          : null
      ),
      // populate arrangers
      ...soundtrack.arrangerIds.map((a) =>
        staffDocs[a]
          ? {
              name: `${staffDocs[a].name} (Arr.)`,
              link: `/staff/${a}`,
            }
          : null
      ),
      // populate other artists
      ...soundtrack.otherArtists.map((a) =>
        staffDocs[a.staffId]
          ? {
              name: `${staffDocs[a.staffId].name} (${a.role || 'Other'})`,
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
          backgroundColor: 'background.header',
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
              backgroundColor: 'background.header',
              color: 'background.header',
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
          mb: 3,
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
                    xs: 150,
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
              <Stack
                direction='row'
                spacing={2}
                sx={{
                  mt: 0.5,
                  mb: {
                    xs: 0,
                    md: 1,
                  },
                }}
              >
                {platforms.map((platform) => {
                  const platformObj = PLATFORMS[platform];

                  if (!platformObj) return null;

                  if (platformObj.iconType === 'component') {
                    return (
                      <Tooltip key={platform} title={platformObj.name}>
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
                        src={platformObj.icon}
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
              </Stack>
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
          mb: 3,
        }}
      >
        <Typography component='h2' variant='h2' gutterBottom>
          Description
        </Typography>
        <Typography>{description}</Typography>
      </Box>
      <Box component='section' sx={{ mb: 3 }}>
        <Typography component='h2' variant='h2' gutterBottom>
          Characters
        </Typography>
        UNDER CONSTRUCTION
      </Box>
      {/* @ts-ignore */}
      {CATEGORIES_WITH_TIMELINE.includes(category) && (
        <Box component='section' sx={{ mb: 3 }}>
          <Typography component='h2' variant='h2' sx={{ mb: 2 }}>
            Story Timeline
          </Typography>
          <StoryTimeline id={id} category={category} />
        </Box>
      )}
      {formattedSoundtracks.length > 0 && (
        <Box component='section' sx={{ mb: 3 }}>
          <Typography component='h2' variant='h2' gutterBottom>
            Soundtracks
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

export default GamePage;
