import { FC, useState } from 'react';

import { Box, ButtonBase, Paper, Typography, alpha } from '@mui/material';

import { CLOUD_STORAGE_URL } from '~/constants';
import { GameCacheSchema } from '~/schemas';

import Link from '../Link';

export interface GameItemProps extends GameCacheSchema {
  id: string;
}

const GameItem: FC<GameItemProps> = ({ id, name, hasCoverImage }) => {
  // `isLoaded` disabled for now because it does not always trigger
  // const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  return (
    <Paper
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        // p: 1.5,
        overflow: 'hidden',
        '&:hover, &:focus-within': {
          '& .game-cover-overlay': {
            opacity: 1,
          },
          '& img': {
            transform: 'scale(1.05)',
          },
          boxShadow: ({ shadows }) => shadows[6],
        },
      }}
    >
      <Box>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            aspectRatio: '2 / 3',
          }}
        >
          {!isError && hasCoverImage && (
            <Box
              component='img'
              src={`${CLOUD_STORAGE_URL}/game-covers/${id}`}
              loading='lazy'
              alt={name}
              sx={{
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                // hide alt text on firefox
                color: 'transparent',
                // opacity: isLoaded ? 1 : 0,
                // transition: [
                //   'opacity 0.1s ease-in-out',
                //   'transform 0.1s ease-in-out',
                // ].join(','),
                transition: 'transform 0.1s ease-in-out',
              }}
              // onLoad={() => setIsLoaded(true)}
              onError={() => setIsError(true)}
            />
          )}
        </Box>
        <Box
          className='game-cover-overlay'
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            px: 1.5,
            py: 1,
            backgroundColor: ({ palette }) =>
              alpha(palette.background.paper, 0.75),
            backdropFilter: 'blur(4px)',
            opacity: {
              xs: 1,
              md: 0,
            },
            transition: 'opacity 0.1s ease-in-out',
          }}
        >
          <Typography
            id={`${id}-name`}
            sx={{
              fontSize: {
                xs: '0.875rem',
                sm: '1rem',
              },
              fontWeight: 'medium',
            }}
          >
            {name}
          </Typography>
          {/* {releaseDate && (
            <Typography variant='caption' color='text.secondary'>
              {releaseDate as string}
            </Typography>
          )} */}
        </Box>
      </Box>
      <ButtonBase
        component={Link}
        href={`/games/${id}`}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: 2,
        }}
        aria-labelledby={`${id}-name`}
      />
    </Paper>
  );
};

export default GameItem;
