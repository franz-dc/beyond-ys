import { FC } from 'react';

import { Box, ButtonBase, Typography } from '@mui/material';
import type { BoxProps, ButtonBaseProps } from '@mui/material';

import FallbackImg from '../../../public/assets/character-avatar-fallback.webp';
import ImageWithFallback from '../ImageWithFallback';
import Link from '../Link';
import type { LinkProps } from '../Link';

export interface CharacterItemProps
  extends ButtonBaseProps<any, Partial<LinkProps>> {
  id: string;
  name: string;
  accentColor: string;
  image?: string;
  imageDirection?: 'left' | 'right';
  isSpoiler?: boolean;
  isSpoilerShown?: boolean;
  BoxProps?: BoxProps;
}

const CharacterItem: FC<CharacterItemProps> = ({
  id,
  name,
  accentColor,
  image,
  imageDirection = 'left',
  isSpoiler,
  isSpoilerShown,
  BoxProps,
  ...rest
}) => {
  return (
    <ButtonBase
      {...rest}
      component={Link}
      focusRipple
      href={`/characters/${id}`}
      sx={{
        width: '100%',
        borderRadius: 2,
        transition: 'transform 0.15s ease-in-out',
        '&:hover, &:focus': {
          transform: 'translateY(-2px)',
        },
        ...rest.sx,
      }}
    >
      <Box
        sx={{
          backgroundColor: accentColor || 'headerBackground',
          height: 64,
          width: '100%',
          borderRadius: 2,
        }}
        {...BoxProps}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            position: 'relative',
            height: '100%',
            pl: 1,
            pr: '104px',
            py: 0.5,
          }}
        >
          <Typography
            sx={{
              display: '-webkit-box',
              position: 'relative',
              fontWeight: 'medium',
              lineHeight: 1.2,
              whiteSpace: 'initial',
              WebkitLineClamp: 3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              WebkitBoxOrient: 'vertical',
              boxOrient: 'vertical',
              // not directly overriding the name value for SEO purposes
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: accentColor || 'headerBackground',
                opacity: isSpoiler && !isSpoilerShown ? 1 : 0,
                transition: 'opacity 0.1s ease-in-out',
              },
              '&::after':
                isSpoiler && !isSpoilerShown
                  ? {
                      content: '"?"',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                    }
                  : {},
            }}
          >
            {name}
          </Typography>
        </Box>
        <Box
          sx={{
            position: 'absolute',
            top: -36,
            right: 0,
            width: 100,
            height: 100,
            // mt: '-36px',
          }}
        >
          <ImageWithFallback
            src={image || FallbackImg}
            fallback={FallbackImg}
            width={100}
            height={100}
            alt={name}
            style={{
              borderBottomLeftRadius: imageDirection === 'right' ? 8 : 0,
              borderBottomRightRadius: imageDirection === 'left' ? 8 : 0,
              transform: imageDirection === 'right' ? 'scaleX(-1)' : 'none',
              filter: isSpoiler && !isSpoilerShown ? 'brightness(0)' : 'none',
              transition: 'filter 0.1s ease-in-out',
            }}
            unoptimized
          />
        </Box>
      </Box>
    </ButtonBase>
  );
};

export default CharacterItem;
