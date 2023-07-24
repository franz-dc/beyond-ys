/* eslint-disable react/jsx-indent */
import { FC, MouseEvent, ReactNode, useEffect, useState } from 'react';

import {
  AppBar,
  Avatar,
  Box,
  Collapse,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Stack,
  SvgIcon,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { signInWithPopup } from 'firebase/auth';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { FiChevronDown } from 'react-icons/fi';
import { IoMdMoon, IoMdSunny } from 'react-icons/io';
import {
  MdClose,
  MdExpandMore,
  MdLogin,
  MdLogout,
  MdMenu,
} from 'react-icons/md';

import { auth, googleAuthProvider } from '~/configs';
import {
  USER_ROLES,
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
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Tooltip
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
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
            // @ts-ignore - strong type causes error though
            boxShadow: ({ shadows }) => shadows[6],
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
          color: isOpen ? 'text.primary' : 'text.secondary',
          '&:focus, &:focus-visible': {
            outline: 'none',
            textDecoration: 'underline',
          },
          '& svg': {
            transform: isOpen ? 'rotate(180deg)' : 'none',
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
};

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

  // account menu
  const [isSignedIn, setIsSignedIn] = useState(false);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    // triggering isSignedIn state on click due to SSR
    setIsSignedIn(typeof window !== 'undefined' && !!auth.currentUser);
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  const signIn = async () => {
    try {
      handleClose();
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err) {
      console.error(err);
    }
  };

  const signOut = async () => {
    try {
      handleClose();
      await auth.signOut();
    } catch (err) {
      console.error(err);
    }
  };

  const { theme, resolvedTheme, setTheme } = useTheme();

  // change theme if changed in other tab
  useEffect(() => {
    const channel = new BroadcastChannel('theme');
    channel.onmessage = (e: MessageEvent<string>) => {
      if (['light', 'dark'].includes(e.data) && e.data !== resolvedTheme) {
        setTheme(e.data);
      }
    };
    return () => channel.close();
  }, [resolvedTheme, setTheme]);

  // reuse toggle theme component
  const ToggleThemeComponent = (
    <MenuItem
      key='toggle-theme'
      onClick={() => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
        // broadcast theme change to other tabs
        const channel = new BroadcastChannel('theme');
        channel.postMessage(resolvedTheme === 'dark' ? 'light' : 'dark');
        channel.close();
      }}
    >
      <ListItemIcon>
        <SvgIcon fontSize='small' inheritViewBox>
          {theme === 'dark' ? <IoMdMoon /> : <IoMdSunny />}
        </SvgIcon>
      </ListItemIcon>
      <ListItemText>
        Theme: {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
      </ListItemText>
    </MenuItem>
  );

  const [photoURL, setPhotoURL] = useState<string | undefined>(undefined);
  const [displayName, setDisplayName] = useState<string>('Unknown User');
  const [userRole, setUserRole] = useState<string>('Contributor');

  useEffect(() => {
    return auth.onAuthStateChanged(async (user) => {
      if (user) {
        setPhotoURL(user.photoURL || undefined);
        setDisplayName(user.displayName || 'Unknown User');
        const tokenRes = await user.getIdTokenResult();
        const role: string = tokenRes?.claims.role || 'contributor';
        if (role) {
          // @ts-ignore
          setUserRole(USER_ROLES[role] || role);
        }
      } else {
        setPhotoURL(undefined);
        setDisplayName('Unknown User');
        setUserRole('Contributor');
      }
    });
  });

  return (
    <>
      <AppBar
        component='nav'
        position='relative'
        sx={{ zIndex: 101, backgroundColor: 'transparent !important' }}
      >
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
              id='account-menu-button'
              aria-controls={open ? 'account-menu' : undefined}
              aria-haspopup='true'
              aria-expanded={open ? 'true' : undefined}
              color='inherit'
              aria-label='menu'
              onClick={handleClick}
              sx={{
                ml: 1,
                mr: {
                  md: '-4px',
                },
                p: 0.5,
                color: 'text.secondary',
              }}
            >
              <Avatar
                src={photoURL}
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: 'text.secondary',
                }}
              />
            </IconButton>
            <Menu
              id='account-menu'
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{
                'aria-labelledby': 'basic-button',
              }}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              slotProps={{
                paper: {
                  sx: {
                    px: 1.5,
                    py: 0.5,
                    backgroundImage: 'none',
                    '& .MuiMenuItem-root': {
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                    },
                    '& .MuiListItemText-primary': {
                      fontSize: '0.875rem',
                      fontWeight: 'medium',
                    },
                    '& .MuiListItemIcon-root': {
                      minWidth: 32,
                      color: 'text.secondary',
                    },
                  },
                },
              }}
            >
              {isSignedIn
                ? [
                    <ListItem
                      key='account-info'
                      className='default-bg'
                      sx={{
                        pl: 1.2, // icon have extra space on sides
                        pr: 1.5,
                        py: 0,
                        mb: 1,
                        backgroundColor: 'background.default',
                        borderRadius: 1,
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: '46px !important',
                        }}
                      >
                        <Avatar
                          src={photoURL}
                          sx={{
                            width: 36,
                            height: 36,
                            backgroundColor: 'text.secondary',
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={displayName}
                        secondary={userRole}
                      />
                    </ListItem>,
                    ToggleThemeComponent,
                    <Divider key='divider' light sx={{ mb: 1 }} />,
                    <MenuItem key='sign-out' onClick={signOut}>
                      <ListItemIcon>
                        <SvgIcon fontSize='small' inheritViewBox>
                          <MdLogout />
                        </SvgIcon>
                      </ListItemIcon>
                      <ListItemText>Sign out</ListItemText>
                    </MenuItem>,
                  ]
                : [
                    ToggleThemeComponent,
                    <Divider key='divider' light sx={{ mb: 1 }} />,
                    <MenuItem key='sign-in' onClick={signIn}>
                      <ListItemIcon>
                        <SvgIcon fontSize='small' inheritViewBox>
                          <MdLogin />
                        </SvgIcon>
                      </ListItemIcon>
                      <ListItemText>Sign in</ListItemText>
                    </MenuItem>,
                  ]}
            </Menu>
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
                ml: 0.5,
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
            backgroundColor: ({ palette }) =>
              palette.background.default + '!important',
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
