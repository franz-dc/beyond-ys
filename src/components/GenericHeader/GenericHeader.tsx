import { FC } from 'react';

import { Box, Typography } from '@mui/material';
import type { BoxProps } from '@mui/material';

export interface GenericHeaderProps extends BoxProps {
  title: string;
  gutterBottom?: boolean;
}

const GenericHeader: FC<GenericHeaderProps> = ({
  title,
  gutterBottom,
  ...rest
}) => {
  return (
    <Box
      sx={{
        height: 100,
        backgroundColor: 'background.header',
        borderRadius: 4,
        mb: gutterBottom ? 3 : 0,
        ...rest.sx,
      }}
      {...rest}
    >
      <Typography
        variant='h1'
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          height: '100%',
          px: 3,
          pb: 1,
        }}
      >
        {title}
      </Typography>
    </Box>
  );
};

export default GenericHeader;
