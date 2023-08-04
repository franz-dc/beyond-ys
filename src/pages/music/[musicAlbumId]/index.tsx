import { Box, Grid, Stack, Typography } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { GetServerSideProps } from 'next';
import { MdAlbum } from 'react-icons/md';

import { MainLayout, MusicItem } from '~/components';
import { cacheCollection, musicAlbumsCollection } from '~/configs';
import { CLOUD_STORAGE_URL } from '~/constants';
import { useMusicPlayer } from '~/hooks';
import { MusicAlbumSchema, StaffInfoCacheSchema } from '~/schemas';
import { formatReleaseDate } from '~/utils';
interface Props {
  id: string;
  musicAlbum: MusicAlbumSchema;
  staffInfo: Record<string, StaffInfoCacheSchema>;
}

export const getServerSideProps: GetServerSideProps<Props> = async ({
  query,
  res,
}) => {
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=60, stale-while-revalidate=3600'
  );

  const { musicAlbumId: musicAlbumIdRaw } = query;

  const musicAlbumId = String(musicAlbumIdRaw);

  const docSnap = await getDoc(doc(musicAlbumsCollection, musicAlbumId));

  if (!docSnap.exists()) {
    console.error(`Music album with id "${musicAlbumId}" does not exist.`);
    return { notFound: true };
  }

  const musicAlbum = docSnap.data();

  const staffInfoCacheDoc = await getDoc(doc(cacheCollection, 'staffInfo'));

  return {
    props: {
      id: musicAlbumId,
      musicAlbum: {
        ...musicAlbum,
        updatedAt: musicAlbum.updatedAt.toMillis(),
        // remove updatedAt from cachedMusic values to prevent next.js errors
        cachedMusic: Object.fromEntries(
          Object.entries(musicAlbum.cachedMusic).map(
            ([key, { updatedAt, ...m }]) => [key, m]
          )
        ),
      },
      staffInfo: staffInfoCacheDoc.data() || {},
    },
  };
};

const AlbumInfo = ({
  id,
  musicAlbum: { name, releaseDate, musicIds, cachedMusic, hasAlbumArt },
  staffInfo,
}: Props) => {
  const { setNowPlaying, setQueue } = useMusicPlayer();

  const formattedMusic = musicIds
    .map((musicId) => {
      const soundtrack = cachedMusic[musicId];
      const hasArrangerOrOtherArtists =
        soundtrack.arrangerIds.length > 0 || soundtrack.otherArtists.length > 0;

      if (!soundtrack) return null;

      return {
        ...soundtrack,
        id: musicId,
        artists: [
          // populate composers
          ...soundtrack.composerIds.map((c) => {
            const foundStaffName = staffInfo[c]?.name;
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
            const foundStaffName = staffInfo[a]?.name;
            return foundStaffName
              ? {
                  name: `${foundStaffName} (Arr.)`,
                  link: `/staff/${a}`,
                }
              : null;
          }),
          // populate other artists
          ...soundtrack.otherArtists.map((a) => {
            const foundStaffName = staffInfo[a.staffId]?.name;
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
    .filter((s): s is Exclude<typeof s, null> => !!s);

  return (
    <MainLayout title={name} image={`${CLOUD_STORAGE_URL}/album-arts/${id}`}>
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
            xs: '-120px',
            sm: '-80px',
          },
          mx: {
            xs: 2,
            sm: 3,
          },
          mb: 3,
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
                position: 'relative',
                justifyContent: {
                  xs: 'center',
                  sm: 'flex-start',
                },
                mt: {
                  xs: '40px',
                  sm: 0,
                },
              }}
            >
              <Box
                className='default-bg'
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: {
                    xs: 'calc(50% - 80px)',
                    sm: 0,
                  },
                  width: 160,
                  height: 160,
                  borderRadius: 3,
                }}
              />
              {hasAlbumArt ? (
                <Box
                  component='img'
                  src={`${CLOUD_STORAGE_URL}/album-arts/${id}`}
                  sx={{
                    position: 'relative',
                    width: 144, // 160 - 16
                    height: 144,
                    m: 1,
                    borderRadius: 2,
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <Box
                  className='paper-bg'
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    width: 144, // 160 - 16
                    height: 144,
                    m: 1,
                    borderRadius: 2,
                  }}
                >
                  <Box
                    component={MdAlbum}
                    sx={{
                      width: 'calc(100% - 1.5rem)',
                      height: 'calc(100% - 1.5rem)',
                      m: 'auto',
                      color: 'divider',
                    }}
                  />
                </Box>
              )}
            </Box>
          </Grid>
          <Grid item xs={12} sm>
            <Box
              sx={{
                mt: {
                  xs: '8px',
                  sm: '76px',
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
                {formatReleaseDate(releaseDate as string)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
      <Stack spacing={1}>
        {formattedMusic.map((soundtrack, idx) => (
          <MusicItem
            key={idx}
            id={soundtrack.id}
            title={soundtrack.title}
            artists={soundtrack.artists}
            youtubeId={soundtrack.youtubeId}
            duration={soundtrack.duration}
            trackNumber={idx + 1}
            albumId={soundtrack.albumId}
            albumName={name}
            albumUrl={`${CLOUD_STORAGE_URL}/album-arts/${id}`}
            onPlay={
              !!soundtrack.youtubeId
                ? () => {
                    setNowPlaying({
                      id: soundtrack.id,
                      title: soundtrack.title,
                      youtubeId: soundtrack.youtubeId,
                      artists: soundtrack.artists,
                      albumName: name,
                      albumUrl: `${CLOUD_STORAGE_URL}/album-arts/${id}`,
                    });
                    setQueue(
                      formattedMusic.map((s) => ({
                        id: s.id,
                        title: s.title,
                        youtubeId: s.youtubeId,
                        artists: s.artists,
                        albumName: name,
                        albumUrl: `${CLOUD_STORAGE_URL}/album-arts/${id}`,
                      }))
                    );
                  }
                : undefined
            }
          />
        ))}
      </Stack>
    </MainLayout>
  );
};

export default AlbumInfo;
