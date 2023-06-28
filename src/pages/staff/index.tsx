import { FC, useState } from 'react';

import {
  Avatar,
  Box,
  ButtonBase,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import type { GetServerSideProps } from 'next';
import { useDebouncedCallback } from 'use-debounce';

import { GenericHeader, Link, MainLayout } from '~/components';
import { cacheCollection } from '~/configs';
import { CLOUD_STORAGE_URL } from '~/constants';
interface StaffListProps {
  categorizedStaffNames: Record<
    string,
    {
      id: string;
      name: string;
      roles: string[];
    }[]
  >;
  description: string;
}

export const getServerSideProps: GetServerSideProps<
  StaffListProps
> = async () => {
  const staffNamesDoc = await getDoc(doc(cacheCollection, 'staffNames'));
  const staffRolesDoc = await getDoc(doc(cacheCollection, 'staffRoles'));

  const staffNames = staffNamesDoc.data() || {};
  const staffRoles = staffRolesDoc.data() || {};

  // categorize staff members by their first letter
  const categorizedStaffNames = Object.entries(staffNames)
    .sort(([, a], [, b]) => a.localeCompare(b))
    .reduce<
      Record<
        string,
        {
          id: string;
          name: string;
          roles: string[];
        }[]
      >
    >((acc, [id, name]) => {
      const firstLetter = name[0].toUpperCase();

      if (!acc[firstLetter]) {
        acc[firstLetter] = [];
      }

      acc[firstLetter].push({
        id,
        name,
        roles: staffRoles[id] || [],
      });

      return acc;
    }, {});

  return {
    props: {
      categorizedStaffNames,
      description:
        "Current and former members involved with the production of Falcom's works",
    },
  };
};

const StaffList: FC<StaffListProps> = ({
  categorizedStaffNames,
  description,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const debounce = useDebouncedCallback((searchQuery) => {
    setSearchQuery(searchQuery);
  }, 500);

  return (
    <MainLayout title='Staff' description={description}>
      <GenericHeader title='Staff' subtitle={description} gutterBottom />
      <Box
        sx={{
          width: '100%',
          maxWidth: 300,
          mb: 3,
        }}
      >
        <Box
          component='input'
          type='text'
          placeholder='Search'
          sx={{
            width: '100%',
            px: 2,
            py: 1.5,
            borderRadius: 2,
            border: 'none',
            outline: 'none',
            color: 'text.primary',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            backgroundColor: 'background.paper',
          }}
          onChange={(e) => debounce(e.target.value.toLowerCase())}
        />
      </Box>
      {
        // render a list of letters
        Object.entries(categorizedStaffNames)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([letter, staffMembers]) => {
            // filter out staff members that don't match the search query
            const filteredStaffMembers = !!searchQuery
              ? staffMembers.filter(({ name, roles }) =>
                  `${name} ${roles.join(' ')}`
                    .toLowerCase()
                    .includes(searchQuery)
                )
              : staffMembers;

            // hide the letter if there are no staff members for it
            if (!filteredStaffMembers.length) {
              return null;
            }

            return (
              <Box key={letter} sx={{ mb: 3 }}>
                <Typography variant='h3' component='h2' sx={{ mb: 1 }}>
                  {letter}
                </Typography>
                <Grid container spacing={2}>
                  {staffMembers.map(({ id, name, roles }) => (
                    <Grid item key={id} xs={12} sm={6} md={4}>
                      <ButtonBase
                        component={Link}
                        href={`/staff/${id}`}
                        sx={{
                          display: 'block',
                          mb: 1,
                          borderRadius: 2,
                        }}
                      >
                        <Paper
                          sx={{
                            px: 2,
                            py: 1.5,
                          }}
                        >
                          <Stack direction='row' spacing={2}>
                            <Avatar
                              src={`${CLOUD_STORAGE_URL}/staff-avatars/${id}`}
                              imgProps={{
                                loading: 'lazy',
                              }}
                              sx={{
                                width: 40,
                                height: 40,
                                backgroundColor: 'text.disabled',
                              }}
                            />
                            <Box>
                              <Typography sx={{ fontWeight: 'medium' }}>
                                {name}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: 14,
                                  color: 'text.secondary',
                                }}
                                aria-label='artist'
                              >
                                {roles.join(', ') || 'Unknown role'}
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      </ButtonBase>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            );
          })
      }
    </MainLayout>
  );
};

export default StaffList;
