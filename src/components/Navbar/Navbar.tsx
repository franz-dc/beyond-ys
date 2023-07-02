import { FC, ReactNode } from 'react';

import { AppBar, Box, Container, Stack, Toolbar, Tooltip } from '@mui/material';
import Image from 'next/image';
import { FiChevronDown } from 'react-icons/fi';

import logo from '../../../public/assets/logo.png';
import Link, { LinkProps } from '../Link';

import {
  ExploreMenu,
  OtherGamesMenu,
  TrailsSeriesMenu,
  YsSeriesMenu,
} from './components';

interface NavItemWithMenuProps {
  id: string;
  name: string;
  href: string;
  MenuComponent: ReactNode;
}

const NavItemWithMenu: FC<NavItemWithMenuProps & LinkProps> = ({
  id,
  name,
  href,
  MenuComponent,
}) => (
  <Tooltip
    title={MenuComponent}
    arrow
    componentsProps={{
      tooltip: {
        sx: {
          maxWidth: 'unset',
          backgroundColor: 'background.paper',
          p: 3,
          fontSize: 'unset',
          borderRadius: 2,
        },
      },
      arrow: {
        sx: {
          color: 'background.paper',
        },
      },
    }}
    PopperProps={{
      keepMounted: true,
      disablePortal: true,
      style: {
        zIndex: 9999,
      },
    }}
  >
    <Link
      id={`${id}-link`}
      href={href}
      sx={{
        color: 'text.secondary',
        '&:hover': {
          color: 'text.primary',
          '& svg': {
            transform: 'rotate(180deg) !important',
          },
        },
        '&:focus, &:focus-visible': {
          color: 'text.primary',
          outline: 'none',
          textDecoration: 'underline',
        },
      }}
    >
      {name}
      <FiChevronDown
        style={{
          display: 'inline-block',
          marginLeft: '0.25rem',
          verticalAlign: 'middle',
          // transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease-in-out',
          fontSize: '1rem',
        }}
      />
    </Link>
  </Tooltip>
);

const Navbar = () => {
  const navTextLinks = [
    {
      id: 'ys-series',
      name: 'Ys Series',
      href: '/games#ys-series',
      MenuComponent: <YsSeriesMenu />,
    },
    {
      id: 'trails-series',
      name: 'Trails Series',
      href: '/games#trails-series',
      MenuComponent: <TrailsSeriesMenu />,
    },
    {
      id: 'other-games',
      name: 'Other Games',
      href: '/games',
      MenuComponent: <OtherGamesMenu />,
    },
    {
      id: 'explore',
      name: 'Explore',
      href: '/',
      MenuComponent: <ExploreMenu />,
    },
  ];

  return (
    <AppBar component='nav' position='relative' sx={{ zIndex: 1 }}>
      <Container maxWidth='md'>
        <Toolbar disableGutters>
          <Box sx={{ flexGrow: 1 }}>
            <Link href='/'>
              <Image src={logo} width={40} alt='Logo' unoptimized />
            </Link>
          </Box>
          <Stack
            spacing={2}
            direction='row'
            sx={{
              display: {
                xs: 'none',
                md: 'flex',
              },
            }}
          >
            {navTextLinks.map((link) =>
              link.MenuComponent ? (
                <NavItemWithMenu
                  key={link.id}
                  id={link.id}
                  name={link.name}
                  href={link.href}
                  MenuComponent={link.MenuComponent}
                />
              ) : (
                <Link
                  key={link.id}
                  id={link.id}
                  href={link.href}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'text.primary',
                    },
                  }}
                >
                  {link.name}
                </Link>
              )
            )}
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
