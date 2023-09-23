import { Box, Divider, Stack } from '@mui/material';

import { trailsSubcategories } from '~/constants';

import NavMenuList from './NavMenuList';

const TrailsSeriesMenu = () => {
  return (
    <Stack
      direction='row'
      spacing={2}
      divider={<Divider orientation='vertical' flexItem light />}
    >
      <Stack
        direction='column'
        spacing={2}
        divider={<Divider light sx={{ pt: 1 }} />}
      >
        {trailsSubcategories.slice(0, 2).map((subcategory) => (
          <Box key={subcategory.name} sx={{ width: 200 }}>
            <NavMenuList
              labelPrefix='trails-games-menu'
              subcategory={subcategory}
            />
          </Box>
        ))}
      </Stack>
      <Stack
        direction='column'
        spacing={2}
        divider={<Divider light sx={{ pt: 1 }} />}
      >
        {trailsSubcategories.slice(2, 4).map((subcategory) => (
          <Box key={subcategory.name} sx={{ width: 200 }}>
            <NavMenuList
              labelPrefix='trails-games-menu'
              subcategory={subcategory}
            />
          </Box>
        ))}
      </Stack>
      <Stack
        direction='column'
        spacing={2}
        divider={<Divider light sx={{ pt: 1 }} />}
      >
        {trailsSubcategories.slice(4, 6).map((subcategory) => (
          <Box key={subcategory.name} sx={{ width: 200 }}>
            <NavMenuList
              labelPrefix='trails-games-menu'
              subcategory={subcategory}
            />
          </Box>
        ))}
      </Stack>
    </Stack>
  );
};

export default TrailsSeriesMenu;
