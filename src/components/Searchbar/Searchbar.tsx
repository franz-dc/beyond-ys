import { FC } from 'react';

import { Box } from '@mui/material';
import type { BoxProps } from '@mui/material';

export interface SearchbarProps extends BoxProps<'input'> {
  ContainerProps?: BoxProps;
}

const Searchbar: FC<SearchbarProps> = ({ ContainerProps, ...rest }) => {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 300,
        ...ContainerProps?.sx,
      }}
    >
      <Box
        component='input'
        type='text'
        placeholder='Search'
        {...rest}
        sx={{
          width: '100%',
          px: 2,
          py: 1.5,
          borderRadius: 2,
          border: 'none',
          outline: 'none',
          color: 'text.primary',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          backgroundColor: 'background.paper',
          ...rest.sx,
        }}
      />
    </Box>
  );
};

export default Searchbar;
