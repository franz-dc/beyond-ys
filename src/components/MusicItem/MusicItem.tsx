import { FC, useState } from 'react';

import {
  Box,
  ButtonBase,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import { MdMusicNote, MdPlayArrow } from 'react-icons/md';

import { useMusicPlayer } from '~/hooks';
import { formatSeconds } from '~/utils';

import Link from '../Link';

export interface MusicItemProps {
  id: string;
  title: string;
  artists: {
    name: string;
    link: string;
  }[];
  duration: number;
  trackNumber: number;
  youtubeId?: string;
  albumName?: string;
  albumId?: string;
  albumUrl?: string;
  // we are not manipulating nowPlaying state in this component
  // because we don't know the playlist surrounding this item
  // so we are passing the function to the parent component
  onPlay?: () => void;
}

const MusicItem: FC<MusicItemProps> = ({
  id,
  title,
  artists,
  duration,
  trackNumber,
  albumName: initialAlbumName,
  albumId,
  albumUrl,
  youtubeId,
  onPlay,
}) => {
  const albumName = albumUrl
    ? initialAlbumName || 'Unknown album'
    : initialAlbumName || 'No album';

  const { nowPlaying } = useMusicPlayer();

  const [isHovered, setIsHovered] = useState(false);

  return (
    <Paper
      sx={{
        position: 'relative',
        px: 2,
        py: 1.5,
        '&:hover, &:focus-within': {
          boxShadow: ({ shadows }) => shadows[6],
        },
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // onDoubleClick={() => {
      //   if (nowPlaying?.id === id) return;
      //   onPlay?.();
      // }}
    >
      <Stack direction='row' spacing={2}>
        <Box
          sx={{
            width: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            sx={{
              color: nowPlaying?.id === id ? 'primary.main' : 'text.secondary',
              opacity: isHovered || nowPlaying?.id === id ? 0 : 1,
              userSelect: 'none',
            }}
          >
            {trackNumber}
          </Typography>
          <Box
            sx={{
              position: 'absolute',
              display: isHovered || nowPlaying?.id === id ? 'block' : 'none',
            }}
          >
            <IconButton
              size='small'
              disabled={nowPlaying?.id === id}
              onClick={() => {
                if (nowPlaying?.id === id) return;
                onPlay?.();
              }}
            >
              <Box
                component={MdPlayArrow}
                sx={{
                  color:
                    nowPlaying?.id === id ? 'primary.main' : 'text.primary',
                  width: 28,
                  height: 28,
                }}
              />
            </IconButton>
          </Box>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box
            title={albumName}
            className='default-bg'
            sx={{
              position: 'relative',
              width: 42,
              height: 42,
              minWidth: 42,
              minHeight: 42,
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <Box
              component={MdMusicNote}
              sx={{
                position: 'absolute',
                display: 'flex',
                width: 42,
                height: 42,
                p: 0.5,
                color: 'divider',
              }}
            />
            {albumUrl && (
              <Image
                key={albumUrl}
                src={albumUrl}
                alt={albumName}
                width={42}
                height={42}
                style={{
                  width: 42,
                  height: 42,
                  objectFit: 'cover',
                  userSelect: 'none',
                  // hide alt text on firefox
                  color: 'transparent',
                }}
                unoptimized
              />
            )}
            {albumId && (
              <ButtonBase
                component={Link}
                href={`/music/${albumId}`}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                }}
                aria-label={albumName}
              />
            )}
          </Box>
        </Box>
        <Box sx={{ width: '100%' }}>
          <Typography
            sx={{
              fontWeight: 'medium',
              userSelect: 'none',
              color:
                nowPlaying?.id === id
                  ? 'primary.main'
                  : !!youtubeId
                  ? 'text.primary'
                  : 'text.secondary',
            }}
            aria-label='title'
          >
            {title}
          </Typography>
          <Typography
            sx={{
              fontSize: 14,
              color: 'text.secondary',
              userSelect: 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
            }}
            aria-label='artist'
          >
            {artists.length !== 0
              ? artists.map((artist, idx) => (
                  // eslint-disable-next-line react/jsx-indent
                  <Typography
                    component='span'
                    key={artist.name}
                    sx={{ fontSize: 'inherit' }}
                  >
                    <Link
                      href={artist.link}
                      sx={{
                        color: 'text.secondary',
                        textDecoration: 'none',
                        '&:hover, &:focus': {
                          textDecoration: 'underline',
                        },
                        '&:focus': {
                          outline: 'none',
                          color: 'primary.main',
                        },
                      }}
                    >
                      {artist.name}
                    </Link>
                    {
                      // Add a comma after each artist except the last one
                      idx !== artists.length - 1 && ', '
                    }
                  </Typography>
                ))
              : 'Unknown Composer'}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <Typography
            sx={{
              color: 'text.secondary',
              userSelect: 'none',
            }}
            aria-label='duration'
          >
            {duration > 0 && formatSeconds(duration)}
          </Typography>
        </Box>
      </Stack>
      <ButtonBase
        onClick={() => {
          if (nowPlaying?.id === id) return;
          onPlay?.();
        }}
        sx={{
          display: {
            xs: 'block',
            md: 'none',
          },
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: 2,
        }}
      />
    </Paper>
  );
};

export default MusicItem;
