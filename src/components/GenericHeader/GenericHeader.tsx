import { Box, Typography } from '@mui/material';
import type { BoxProps } from '@mui/material';

export interface GenericHeaderProps extends BoxProps {
  title: string;
  subtitle?: string;
  gutterBottom?: boolean;
}

const GenericHeader = ({
  title,
  subtitle,
  gutterBottom,
  ...rest
}: GenericHeaderProps) => {
  return (
    <Box
      {...rest}
      className='header-bg'
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        minHeight: 100,
        backgroundColor: 'headerBackground',
        borderRadius: 4,
        mb: gutterBottom ? 3 : 0,
        ...rest.sx,
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2,
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
          {title}
        </Typography>
        {subtitle && (
          <Typography
            sx={{
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default GenericHeader;
