import { FC, PropsWithChildren } from 'react';

import { Box, Container } from '@mui/material';
import Head from 'next/head';

import { SITE_NAME } from '~/constants';

import Footer from '../Footer';
import Navbar from '../Navbar';

export interface MainLayoutProps {
  title?: string;
  description?: string;
  image?: string;
}

const MainLayout: FC<PropsWithChildren<MainLayoutProps>> = ({
  title,
  description = "Bringing light to Falcom's works of art.",
  image,
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
      <meta name='og:title' content={title || SITE_NAME} />
      <meta name='description' content={description} />
      <meta name='og:description' content={description} />
      {image && <meta name='og:image' content={image} />}
    </Head>
    <Navbar />
    <Container
      component='main'
      maxWidth='md'
      sx={{ flexGrow: 1, position: 'relative' }}
    >
      {children}
    </Container>
    <Footer />
  </Box>
);

export default MainLayout;
