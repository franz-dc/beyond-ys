import { Box, Button, Typography } from '@mui/material';
import Image from 'next/image';

import { Link, MainLayout } from '~/components';

import Img from '../../../public/assets/500.webp';

const Error = () => {
  return (
    <MainLayout title='Something Went Wrong'>
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
            width: {
              xs: 250,
              sm: 320,
            },
            maxWidth: 'calc(100vw - 32px)',
            height: 'auto',
            mb: 3,
            pl: {
              xs: '54px',
              sm: '70px',
            },
          }}
          unoptimized
        />
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Typography variant='h1'>Something went wrong</Typography>
          <Typography>Mishy saw something really bad and ran away.</Typography>
        </Box>
        <Button component={Link} href='/'>
          Return Home
        </Button>
      </Box>
    </MainLayout>
  );
};

export default Error;
