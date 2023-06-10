import { FC, PropsWithChildren } from 'react';

import { Box, Container } from '@mui/material';
import Head from 'next/head';

import { SITE_NAME } from '~/constants';

import Footer from '../Footer';
import Navbar from '../Navbar';

export interface MainLayoutProps {
  title?: string;
}

const MainLayout: FC<PropsWithChildren<MainLayoutProps>> = ({
  title,
  children,
}) => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
    }}
  >
    <Head>
      <title>{title ? `${title} - ${SITE_NAME}` : SITE_NAME}</title>
    </Head>
    <Navbar />
    <Container component='main' maxWidth='md' sx={{ flexGrow: 1 }}>
      {children}
    </Container>
    <Footer />
  </Box>
);

export default MainLayout;
