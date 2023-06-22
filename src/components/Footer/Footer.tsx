import {
  Box,
  Container,
  Divider,
  Grid,
  Stack,
  SvgIcon,
  Tooltip,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import { MdEmail } from 'react-icons/md';
import { SiDiscord, SiGithub, SiReddit, SiYoutube } from 'react-icons/si';

import { useMusicPlayer } from '~/hooks';

import logo from '../../../public/assets/logo.png';
import Link from '../Link';

const Footer = () => {
  const { nowPlaying } = useMusicPlayer();

  const textLinks = [
    {
      name: 'About',
      href: '/about',
    },
    {
      name: 'FAQs',
      href: '/frequently-asked-questions',
    },
  ];

  const iconLinks = [
    {
      name: 'Email',
      href: 'mailto:hello@beyondys.com',
      icon: MdEmail,
      type: 'email',
    },
    {
      name: 'GitHub: Beyond Ys',
      href: 'https://github.com/franz-dc/beyond-ys',
      icon: SiGithub,
      type: 'link',
    },
    {
      name: 'YouTube: Falcom Music Channel',
      href: 'https://www.youtube.com/@FalcomMusicChannel',
      icon: SiYoutube,
      type: 'link',
    },
    {
      name: 'Reddit: Nihon Falcom',
      href: 'https://www.reddit.com/r/Falcom',
      icon: SiReddit,
      type: 'link',
    },
    {
      name: 'Discord: Falcom',
      href: 'https://discord.me/falcom',
      icon: SiDiscord,
      type: 'link',
    },
  ];

  return (
    <Box
      sx={{
        mt: 3,
        py: 3,
        backgroundColor: 'background.paper',
        gridRowStart: 3,
        gridRowEnd: 4,
      }}
    >
      <Container maxWidth='md'>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item>
                <Image src={logo} width={64} alt='Logo' unoptimized />
              </Grid>
              <Grid item>
                <Typography variant='h2'>Beyond Ys</Typography>
                <Typography color='textSecondary'>
                  Bringing light to Falcom&apos;s works of art
                </Typography>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={3}>
            <Stack spacing={1}>
              {textLinks.map((link) => (
                <Box key={link.name}>
                  <Link href={link.href} sx={{ color: 'text.primary' }}>
                    {link.name}
                  </Link>
                </Box>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} md={3}>
            <Stack spacing={2} direction='row'>
              {iconLinks.map((link) => (
                <Tooltip key={link.name} title={link.name}>
                  <Link
                    href={link.href}
                    sx={{ color: 'text.primary' }}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <SvgIcon
                      component={link.icon}
                      fontSize='small'
                      sx={{
                        transition: (theme) =>
                          theme.transitions.create('color', {
                            duration: theme.transitions.duration.shortest,
                          }),
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'text.primary',
                        },
                      }}
                    />
                  </Link>
                </Tooltip>
              ))}
            </Stack>
          </Grid>
        </Grid>
        <Divider light sx={{ mb: 2 }} />
        <Grid
          container
          sx={{
            color: 'text.secondary',
            fontSize: '0.75rem',
            mb: !!nowPlaying
              ? {
                  xs: '89px',
                  md: '93px',
                }
              : 0,
            transition: 'margin-bottom 0.3s ease',
          }}
        >
          <Grid item xs={12} md>
            Site made with 🤍 by{' '}
            <Link
              href='mailto:hello@beyondys.com'
              target='_blank'
              rel='noopener noreferrer'
              color='text.secondary'
              fontWeight='medium'
              fontSize='inherit'
            >
              Franz DC
            </Link>
          </Grid>
          <Grid item xs={12} md='auto'>
            Games and assets by{' '}
            <Link
              href='https://www.falcom.co.jp'
              color='text.secondary'
              fontWeight='medium'
              fontSize='inherit'
              target='_blank'
              rel='noopener noreferrer'
            >
              Nihon Falcom Corporation
            </Link>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Footer;
