import { Box, Button, Typography } from '@mui/material';
import Image from 'next/image';

import { Link, MainLayout } from '~/components';

import Img from '../../../public/assets/404.webp';

const NotFound = () => {
  return (
    <MainLayout title='Page Not Found'>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          py: 3,
        }}
      >
        <Box
          component={Image}
          src={Img}
          alt='404'
          sx={{
            width: 250,
            height: 'auto',
            ml: '80px',
            mb: 3,
          }}
          unoptimized
        />
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Typography variant='h1'>Page not found</Typography>
          <Typography>
            Mishy tried to get your page but cannot find it.
          </Typography>
        </Box>
        <Button component={Link} href='/'>
          Return Home
        </Button>
      </Box>
    </MainLayout>
  );
};

export default NotFound;
