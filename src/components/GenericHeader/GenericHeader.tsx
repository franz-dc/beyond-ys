import { FC } from 'react';

import { Box, Typography } from '@mui/material';

export interface GenericHeaderProps {
  title: string;
}

const GenericHeader: FC<GenericHeaderProps> = ({ title }) => {
  return (
    <Box
      sx={{
        height: 100,
        backgroundColor: 'background.header',
        borderRadius: 4,
      }}
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
