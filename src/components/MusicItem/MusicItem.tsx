import { FC, useState } from 'react';

import { Box, IconButton, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import { MdPlayArrow } from 'react-icons/md';
import { parse } from 'tinyduration';

import { useMusicPlayer } from '~/hooks';

import Link from '../Link';

export interface MusicItemProps {
  id: string;
  title: string;
  artists: {
    name: string;
    link: string;
  }[];
  duration: string; // ISO 8601 duration
  trackNumber: number;
  youtubeId?: string;
  albumName?: string;
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
  albumName,
  albumUrl,
  youtubeId,
  onPlay,
}) => {
  const { nowPlaying } = useMusicPlayer();

  const [isHovered, setIsHovered] = useState(false);

  const durationObj = parse(duration || 'PT0S');
  const formattedDuration = `${
    (durationObj.hours || 0) * 60 + (durationObj.minutes || 0)
  }:${(durationObj.seconds || 0).toString().padStart(2, '0')}`;

  return (
    <Box
      sx={{
        backgroundColor: 'background.paper',
        px: 2,
        py: 1.5,
        borderRadius: 2,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={() => {
        if (nowPlaying?.id === id) return;
        onPlay?.();
      }}
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
            width: 42,
            height: 42,
            minWidth: 42,
            minHeight: 42,
            borderRadius: 1,
            backgroundColor: 'background.default',
          }}
        >
          {albumUrl && (
            <Image
              src={albumUrl}
              alt={albumName!}
              width={42}
              height={42}
              style={{
                borderRadius: 1,
                width: 42,
                height: 42,
                objectFit: 'cover',
                userSelect: 'none',
              }}
              unoptimized
            />
          )}
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
          >
            {title}
          </Typography>
          <Typography
            sx={{ fontSize: 14, color: 'text.secondary', userSelect: 'none' }}
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
                        '&:hover': {
                          textDecoration: 'underline',
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
          >
            {!!duration && formattedDuration}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};

export default MusicItem;
