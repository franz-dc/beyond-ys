import { Box, Divider, Stack } from '@mui/material';

import { otherGamesSubcategories } from '~/constants';

import NavMenuList from './NavMenuList';

const OtherGamesMenu = () => {
  return (
    <Stack
      direction='row'
      spacing={2}
      divider={<Divider orientation='vertical' flexItem light />}
    >
      <Box sx={{ width: 200 }}>
        <NavMenuList
          labelPrefix='other-games-menu'
          subcategory={otherGamesSubcategories[0]}
        />
      </Box>
      <Stack
        direction='column'
        spacing={2}
        divider={<Divider light sx={{ pt: 1 }} />}
      >
        {otherGamesSubcategories.slice(1, 4).map((subcategory) => (
          <Box key={subcategory.name} sx={{ width: 200 }}>
            <NavMenuList
              labelPrefix='other-games-menu'
              subcategory={subcategory}
            />
          </Box>
        ))}
      </Stack>
      <Box sx={{ width: 200 }}>
        <NavMenuList
          labelPrefix='other-games-menu'
          subcategory={otherGamesSubcategories[4]}
        />
      </Box>
    </Stack>
  );
};

export default OtherGamesMenu;
