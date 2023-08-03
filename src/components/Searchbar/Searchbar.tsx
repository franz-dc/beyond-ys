import { Box, Paper } from '@mui/material';
import type { BoxProps } from '@mui/material';

export interface SearchbarProps extends BoxProps<'input'> {
  ContainerProps?: BoxProps;
}

const Searchbar = ({ ContainerProps, ...rest }: SearchbarProps) => {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 300,
        ...ContainerProps?.sx,
      }}
    >
      <Paper
        component='input'
        type='text'
        placeholder='Search'
        {...rest}
        sx={{
          width: '100%',
          px: 2,
          py: 1.5,
          border: 'none',
          outline: 'none',
          color: 'text.primary',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          '&:focus': {
            boxShadow: ({ shadows }) => shadows[6],
          },
          ...rest.sx,
        }}
      />
    </Box>
  );
};

export default Searchbar;
