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
      <Box key={ysSubcategories[0]!.name} sx={{ width: 250 }}>
        <NavMenuList
          labelPrefix='ys-series-menu'
          subcategory={ysSubcategories[0]!}
        />
      </Box>
      <Stack
        direction='column'
        spacing={2}
        divider={<Divider light sx={{ pt: 1 }} />}
      >
        {ysSubcategories.slice(1, 3).map((subcategory) => (
          <Box key={subcategory.name} sx={{ width: 200 }}>
            <NavMenuList
              labelPrefix='trails-games-menu'
              subcategory={subcategory}
            />
          </Box>
        ))}
      </Stack>
      <Box key={ysSubcategories[3]!.name} sx={{ width: 250 }}>
        <NavMenuList
          labelPrefix='ys-series-menu'
          subcategory={ysSubcategories[3]!}
        />
      </Box>
    </Stack>
  );
};

export default YsSeriesMenu;
