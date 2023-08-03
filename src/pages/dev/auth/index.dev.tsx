import { useEffect, useState } from 'react';

import {
  Alert,
  AlertTitle,
  Avatar,
  Box,
  Button,
  Stack,
  Typography,
} from '@mui/material';
import { signInWithPopup } from 'firebase/auth';

import { GenericHeader, MainLayout } from '~/components';
import { auth, googleAuthProvider } from '~/configs';
import { USER_ROLES } from '~/constants';

const Auth = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err) {
      console.error(err);
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error(err);
    }
  };

  const [photoURL, setPhotoURL] = useState<string | undefined>(undefined);
  const [displayName, setDisplayName] = useState<string>('Unknown User');
  const [userRole, setUserRole] = useState<string>('Contributor');

  useEffect(() => {
    return auth.onAuthStateChanged(async (user) => {
      if (user) {
        setIsSignedIn(true);
        setPhotoURL(user.photoURL || undefined);
        setDisplayName(user.displayName || 'Unknown User');
        const tokenRes = await user.getIdTokenResult();
        const role: string = tokenRes?.claims.role || 'contributor';
        if (role) {
          // @ts-ignore
          setUserRole(USER_ROLES[role] || role);
        }
      } else {
        setIsSignedIn(false);
        setPhotoURL(undefined);
        setDisplayName('Unknown User');
        setUserRole('Contributor');
      }
    });
  });

  return (
    <MainLayout title='Auth'>
      <GenericHeader title='Auth' gutterBottom />
      {isSignedIn ? (
        <>
          <Alert severity='success' sx={{ mb: 2 }}>
            <AlertTitle>Signed In</AlertTitle>
            You can make changes to the database.
          </Alert>
          <Box
            className='paper-bg'
            sx={{
              px: 2,
              py: 1,
              mb: 2,
              backgroundColor: 'background.default',
              borderRadius: 2,
            }}
          >
            <Stack direction='row' spacing={2}>
              <Avatar
                src={photoURL}
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: 'text.secondary',
                }}
              />
              <Box>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 'medium' }}>
                  {displayName}
                </Typography>
                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                  }}
                >
                  {userRole}
                </Typography>
              </Box>
            </Stack>
          </Box>
          <Button onClick={signOut}>Sign Out</Button>
        </>
      ) : (
        <>
          <Alert severity='warning' sx={{ mb: 2 }}>
            <AlertTitle>Not Signed In</AlertTitle>
            Sign in to make changes to the database.
          </Alert>
          <Button onClick={signIn}>Sign In</Button>
        </>
      )}
    </MainLayout>
  );
};

export default Auth;
