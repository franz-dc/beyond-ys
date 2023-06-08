import { Box, Divider, Stack } from '@mui/material';

import { exploreMenuItems } from '~/constants';

import NavMenuList from './NavMenuList';

const ExploreMenu = () => {
  return (
    <Stack
      direction='row'
      spacing={2}
      divider={<Divider orientation='vertical' flexItem light />}
      sx={{ mt: -1 }}
    >
      {exploreMenuItems.map((subcategory) => (
        <Box key={subcategory.name} sx={{ width: 120 }}>
          <NavMenuList labelPrefix='explore-menu' subcategory={subcategory} />
        </Box>
      ))}
    </Stack>
  );
};

export default ExploreMenu;
