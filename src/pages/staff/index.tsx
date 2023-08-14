import { useState } from 'react';

import { Box, Grid, Typography } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import type { GetStaticProps } from 'next';
import { useDebouncedCallback } from 'use-debounce';

import {
  GenericHeader,
  MainLayout,
  Searchbar,
  StaffMemberItem,
} from '~/components';
import { cacheCollection } from '~/configs';
import { StaffInfoCacheSchema } from '~/schemas';
interface StaffListProps {
  categorizedStaffInfoCache: Record<
    string,
    (StaffInfoCacheSchema & { id: string })[]
  >;
  description: string;
}

export const getStaticProps: GetStaticProps<StaffListProps> = async () => {
  const staffInfoCache = await getDoc<Record<string, StaffInfoCacheSchema>>(
    doc(cacheCollection, 'staffInfo')
  );

  // categorize staff members by their first letter
  const categorizedStaffInfoCache = Object.entries(staffInfoCache.data() || {})
    .sort(([, { name: a }], [, { name: b }]) => a.localeCompare(b))
    .reduce<StaffListProps['categorizedStaffInfoCache']>(
      (acc, [id, staffMember]) => {
        const firstLetter = staffMember.name[0].toUpperCase();

        if (!acc[firstLetter]) {
          acc[firstLetter] = [];
        }

        acc[firstLetter].push({
          id,
          ...staffMember,
        });

        return acc;
      },
      {}
    );

  return {
    props: {
      categorizedStaffInfoCache,
      description:
        "Current and former people involved with the production of Falcom's works",
    },
  };
};

const StaffList = ({
  categorizedStaffInfoCache,
  description,
}: StaffListProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const debounce = useDebouncedCallback((searchQuery) => {
    setSearchQuery(searchQuery);
  }, 500);

  return (
    <MainLayout title='Staff' description={description}>
      <GenericHeader title='Staff' subtitle={description} gutterBottom />
      <Searchbar
        onChange={(e) => debounce(e.target.value.toLowerCase())}
        ContainerProps={{
          sx: {
            mb: 3,
          },
        }}
      />
      {
        // render a list of letters
        Object.entries(categorizedStaffInfoCache)
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
                <Grid
                  container
                  spacing={{
                    xs: 1,
                    sm: 2,
                  }}
                >
                  {filteredStaffMembers.map((staffMember) => (
                    <Grid item key={staffMember.id} xs={12} sm={6} md={4}>
                      <StaffMemberItem {...staffMember} />
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
