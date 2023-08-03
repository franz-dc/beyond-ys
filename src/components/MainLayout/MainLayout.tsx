import type { PropsWithChildren } from 'react';

import { Box, Container } from '@mui/material';
import type { BoxProps, ContainerProps } from '@mui/material';
import Head from 'next/head';

import { SITE_NAME } from '~/constants';

import Footer from '../Footer';
import Navbar from '../Navbar';

export interface MainLayoutProps extends BoxProps {
  title?: string;
  description?: string;
  image?: string;
  ContainerProps?: ContainerProps;
}

const MainLayout = ({
  title,
  description = "Bringing light to Falcom's works of art.",
  image,
  children,
  ContainerProps,
  ...rest
}: PropsWithChildren<MainLayoutProps>) => (
  <Box
    {...rest}
    sx={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      ...rest?.sx,
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
      {...ContainerProps}
      sx={{ flexGrow: 1, position: 'relative', ...ContainerProps?.sx }}
    >
      {children}
    </Container>
    <Footer />
  </Box>
);

export default MainLayout;
