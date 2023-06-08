import { Box, Divider, Stack } from '@mui/material';

import { ysSubcategories } from '~/constants';

import NavMenuList from './NavMenuList';

const YsSeriesMenu = () => {
  return (
    <Stack
      direction='row'
      spacing={2}
      divider={<Divider orientation='vertical' flexItem light />}
    >
      {ysSubcategories.map((subcategory) => (
        <Box key={subcategory.name} sx={{ width: 250 }}>
          <NavMenuList labelPrefix='ys-series-menu' subcategory={subcategory} />
        </Box>
      ))}
    </Stack>
  );
};

export default YsSeriesMenu;
