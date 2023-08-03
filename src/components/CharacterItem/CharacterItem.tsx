import { Box, ButtonBase, Typography } from '@mui/material';
import type { BoxProps, ButtonBaseProps } from '@mui/material';
import { MdNoAccounts } from 'react-icons/md';

import ImageWithFallback from '../ImageWithFallback';
import Link from '../Link';
import type { LinkProps } from '../Link';

export interface CharacterItemProps
  extends ButtonBaseProps<any, Partial<LinkProps>> {
  id: string;
  name: string;
  accentColor: string;
  image?: string;
  isSpoiler?: boolean;
  isSpoilerShown?: boolean;
  BoxProps?: BoxProps;
  disableLink?: boolean; // for use in avatar preview
}

const CharacterItem = ({
  id,
  name,
  accentColor,
  image,
  isSpoiler = false,
  isSpoilerShown = true,
  BoxProps,
  disableLink = false,
  ...rest
}: CharacterItemProps) => {
  return (
    // @ts-ignore
    <ButtonBase
      {...rest}
      focusRipple
      component={disableLink ? 'div' : Link}
      href={disableLink ? undefined : `/characters/${id}`}
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
          transition: 'background-color 0.1s ease-in-out',
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
              color: 'white',
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
        {image ? (
          <Box
            sx={{
              position: 'absolute',
              top: -36,
              right: 0,
              width: 100,
              height: 100,
            }}
          >
            <ImageWithFallback
              src={image}
              width={100}
              height={100}
              alt={name}
              style={{
                borderBottomRightRadius: 8,
                filter: isSpoiler && !isSpoilerShown ? 'brightness(0)' : 'none',
                transition: 'filter 0.1s ease-in-out',
              }}
              unoptimized
            />
          </Box>
        ) : (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              right: 8,
              width: 56,
              height: 56,
            }}
          >
            <Box
              component={MdNoAccounts}
              sx={{
                width: '100%',
                height: '100%',
                color: 'divider',
              }}
            />
          </Box>
        )}
      </Box>
    </ButtonBase>
  );
};

export default CharacterItem;
