import { FC, ReactNode, useState } from 'react';

import {
  AppBar,
  Box,
  Collapse,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Stack,
  SvgIcon,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import { FiChevronDown } from 'react-icons/fi';
import { MdClose, MdExpandMore, MdMenu } from 'react-icons/md';

import {
  exploreMenuItems,
  otherGamesSubcategories,
  trailsSubcategories,
  ysSubcategories,
} from '~/constants';

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
  menuItems?: {
    id: string;
    name: string;
    items: {
      name: string;
      href: string;
    }[];
    hideSubheader?: boolean;
  }[];
  onNavigate?: () => void;
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

const DrawerItem = ({
  id,
  name,
  href,
  menuItems,
  onNavigate,
}: NavItemWithMenuProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <ListItemButton
        component={menuItems ? 'div' : Link}
        href={menuItems ? undefined : href}
        onClick={menuItems ? () => setIsExpanded((prev) => !prev) : onNavigate}
        sx={{ borderRadius: 2 }}
      >
        <ListItemText
          primary={name}
          sx={{ '& span': { fontSize: '1rem !important' } }}
        />
        {menuItems && (
          <SvgIcon
            sx={{
              ml: 2,
              mr: -0.5,
              transform: isExpanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.1s ease-in-out',
            }}
          >
            <MdExpandMore />
          </SvgIcon>
        )}
      </ListItemButton>
      {menuItems && (
        <Collapse in={isExpanded}>
          {menuItems.map((menuItem) => (
            <List
              key={menuItem.id}
              component='div'
              dense
              disablePadding
              aria-labelledby={`${id}-${menuItem.id}-list-subheader`}
              subheader={
                !menuItem.hideSubheader ? (
                  <ListSubheader
                    component='div'
                    disableSticky
                    id={`${id}-${menuItem.id}-list-subheader`}
                    sx={{
                      pl: 4,
                      pb: 0.5,
                      lineHeight: 'unset',
                      backgroundColor: 'background.default',
                    }}
                  >
                    {menuItem.name}
                    <Divider light sx={{ mt: 1 }} />
                  </ListSubheader>
                ) : undefined
              }
              sx={{
                mb: 2,
                '&:first-of-type': {
                  mt: 1,
                },
              }}
            >
              {menuItem.items.map((item) => (
                <ListItemButton
                  key={item.name}
                  component={Link}
                  href={item.href}
                  sx={{
                    ml: 2,
                    py: 0.25,
                    borderRadius: 2,
                  }}
                  onClick={onNavigate}
                >
                  <ListItemText primary={item.name} />
                </ListItemButton>
              ))}
            </List>
          ))}
        </Collapse>
      )}
    </>
  );
};

const Navbar = () => {
  const navTextLinks = [
    {
      id: 'ys-series',
      name: 'Ys Series',
      href: '/games#ys-series',
      MenuComponent: <YsSeriesMenu />,
      menuItems: ysSubcategories,
    },
    {
      id: 'trails-series',
      name: 'Trails Series',
      href: '/games#trails-series',
      MenuComponent: <TrailsSeriesMenu />,
      menuItems: trailsSubcategories,
    },
    {
      id: 'other-games',
      name: 'Other Games',
      href: '/games',
      MenuComponent: <OtherGamesMenu />,
      menuItems: otherGamesSubcategories,
    },
    {
      id: 'explore',
      name: 'Explore',
      href: '/',
      MenuComponent: <ExploreMenu />,
      menuItems: exploreMenuItems,
    },
  ];

  const drawerWidth = 300;
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
  };

  return (
    <>
      <AppBar component='nav' position='relative' sx={{ zIndex: 101 }}>
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
            <IconButton
              // edge='end'
              color='inherit'
              aria-label='menu'
              onClick={handleDrawerToggle}
              sx={{
                display: {
                  xs: 'inline-flex',
                  md: 'none',
                },
                ml: 1,
                mr: '-10px',
                color: 'text.secondary',
              }}
            >
              <MdMenu />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>
      <Drawer
        variant='temporary'
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: 'blur(4px)',
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
            },
          },
        }}
        anchor='right'
        PaperProps={{
          sx: {
            m: 2,
            p: 1,
            pt: 1.5,
            width: 'calc(100% - 2rem)',
            height: 'calc(100% - 2rem)',
            maxWidth: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: 'background.default',
            backgroundImage: 'none',
          },
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
        }}
      >
        <Box component='nav'>
          <Stack direction='row' spacing={2} sx={{ mb: 1.5, mr: 1 }}>
            <Typography
              sx={{
                display: 'flex',
                alignItems: 'center',
                ml: 2,
                color: 'text.secondary',
                width: '100%',
              }}
            >
              Menu
            </Typography>
            <IconButton size='small' onClick={handleDrawerToggle}>
              <MdClose />
            </IconButton>
          </Stack>
          <Divider light sx={{ mx: 2 }} />
          <List dense>
            {navTextLinks.map((item) => (
              <DrawerItem
                key={item.id}
                onNavigate={handleDrawerToggle}
                {...item}
              />
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Navbar;
