import { useState } from 'react';

import { Box, ButtonBase, Grid, Paper, Stack, Typography } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import type { GetServerSideProps } from 'next';
import { MdAlbum } from 'react-icons/md';
import { useDebouncedCallback } from 'use-debounce';

import { GenericHeader, Link, MainLayout, Searchbar } from '~/components';
import { cacheCollection } from '~/configs';
import { CLOUD_STORAGE_URL } from '~/constants';
import { MusicAlbumCacheSchema } from '~/schemas';

interface Props {
  description: string;
  musicAlbumCache: Record<string, MusicAlbumCacheSchema>;
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const musicAlbumCacheDoc = await getDoc(doc(cacheCollection, 'musicAlbums'));

  if (!musicAlbumCacheDoc.exists()) {
    throw new Error('Music album cache does not exist');
  }

  return {
    props: {
      description: 'Soundtracks and arrangements made by Falcom',
      musicAlbumCache: musicAlbumCacheDoc.data(),
    },
  };
};

const AlbumArt = ({
  id,
  hasAlbumArt,
}: {
  id: string;
  hasAlbumArt: boolean;
}) => {
  const [isError, setIsError] = useState(false);

  return (
    <Box
      className='default-bg'
      sx={{
        display: 'flex',
        width: {
          xs: 42,
          xs3: '100%',
        },
        height: {
          xs: 42,
          xs3: 'auto',
        },
        aspectRatio: '1/1',
        mb: {
          xs: 0,
          xs3: 1,
        },
        borderRadius: 1,
      }}
    >
      {isError || !hasAlbumArt ? (
        <Box
          component={MdAlbum}
          sx={{
            m: 'auto',
            width: 'calc(100% - 4rem)',
            height: 'calc(100% - 4rem)',
            color: 'divider',
          }}
        />
      ) : (
        <Box
          component='img'
          src={`${CLOUD_STORAGE_URL}/album-arts/${id}`}
          loading='lazy'
          sx={{
            width: '100%',
            aspectRatio: '1/1',
            objectFit: 'cover',
            borderRadius: 1,
          }}
          onError={() => setIsError(true)}
        />
      )}
    </Box>
  );
};

const Music = ({ description, musicAlbumCache }: Props) => {
  // sort albums by release date - latest first
  const sortedAlbums = Object.entries(musicAlbumCache).sort(
    ([, { releaseDate: a }], [, { releaseDate: b }]) => {
      // music albums without a release date are sorted last
      const aDate = a ? new Date(a) : new Date('9999-12-31');
      const bDate = b ? new Date(b) : new Date('9999-12-31');

      return bDate.getTime() - aDate.getTime();
    }
  );

  const [searchQuery, setSearchQuery] = useState('');

  const debounce = useDebouncedCallback((searchQuery) => {
    setSearchQuery(searchQuery);
  }, 500);

  return (
    <MainLayout title='Music' description={description}>
      <GenericHeader title='Music' subtitle={description} gutterBottom />
      <Searchbar
        onChange={(e) => debounce(e.target.value.toLowerCase())}
        ContainerProps={{
          sx: {
            mb: 2,
          },
        }}
      />
      <Grid
        container
        spacing={{
          xs: 1,
          xs3: 2,
        }}
      >
        {(!searchQuery
          ? sortedAlbums // if search query is empty, do not bother filtering
          : sortedAlbums.filter(([, album]) =>
              album.name.toLowerCase().includes(searchQuery)
            )
        ).map(([id, album]) => (
          <Grid key={id} item xs={12} xs3={4} sm3={3}>
            <Paper
              sx={{
                display: 'flex',
                flexDirection: {
                  xs: 'row',
                  xs3: 'column',
                },
                position: 'relative',
                px: 2,
                py: {
                  xs: 1.5,
                  xs3: 2,
                },
                '&:hover, &:focus-within': {
                  boxShadow: ({ shadows }) => shadows[6],
                },
              }}
            >
              <Stack
                direction={{
                  xs: 'row',
                  xs3: 'column',
                }}
                spacing={{
                  xs: 2,
                  xs3: 0.5,
                }}
              >
                <AlbumArt id={id} hasAlbumArt={album.hasAlbumArt} />
                <Box>
                  <Typography
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: {
                        xs: 1,
                        xs3: 2,
                      },
                      WebkitBoxOrient: 'vertical',
                      height: {
                        xs: '1.4rem', // 1 line + 0.4 line height
                        xs3: '2.8rem', // 2 lines + 2 * 0.4 line height
                      },
                      mb: {
                        xs: 0.5,
                        xs3: 1,
                      },
                      fontWeight: 'medium',
                    }}
                  >
                    {album.name}
                  </Typography>
                  <Typography
                    color='text.secondary'
                    fontSize={14}
                    lineHeight={1}
                  >
                    {album.releaseDate
                      ? new Date(album.releaseDate).getFullYear()
                      : 'Unknown'}
                  </Typography>
                </Box>
              </Stack>
              <ButtonBase
                component={Link}
                href={`/music/${id}`}
                focusRipple
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  borderRadius: 2,
                }}
              />
            </Paper>
          </Grid>
        ))}
      </Grid>
    </MainLayout>
  );
};

export default Music;
