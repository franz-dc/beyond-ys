import { useState } from 'react';

import { Box, Divider, Grid, Typography } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import type { GetStaticProps } from 'next';
import { useDebouncedCallback } from 'use-debounce';

import {
  CharacterItem,
  GenericHeader,
  MainLayout,
  Searchbar,
} from '~/components';
import { cacheCollection } from '~/configs';
import { CLOUD_STORAGE_URL } from '~/constants';
import { CharacterCacheSchema } from '~/schemas';

type CategorizedCharacters = Record<
  string,
  Record<string, (CharacterCacheSchema & { id: string })[]>
>;

interface CharacterListProps {
  // category -> first letter -> characters
  categorizedCharacters: CategorizedCharacters;
}

export const getStaticProps: GetStaticProps<CharacterListProps> = async () => {
  const charactersDoc = await getDoc(doc(cacheCollection, 'characters'));

  const charactersCache: Record<string, CharacterCacheSchema> =
    charactersDoc.data() || {};

  // categorize characters by their category and first letter
  const categorizedCharacters = Object.entries(charactersCache)
    .sort(([, a], [, b]) => a.name.localeCompare(b.name))
    .reduce<CategorizedCharacters>((acc, [id, { name, category, ...rest }]) => {
      const firstLetter = (name[0] ?? '').toUpperCase();

      if (!acc[category]) {
        acc[category] = {};
      }

      if (!acc[category]![firstLetter]) {
        acc[category]![firstLetter] = [];
      }

      acc[category]![firstLetter]!.push({
        id,
        name,
        category,
        ...rest,
      });

      return acc;
    }, {});

  return {
    props: {
      categorizedCharacters,
    },
  };
};

const CharacterList = ({ categorizedCharacters }: CharacterListProps) => {
  const description = "List of all characters from Falcom's games.";

  const [searchQuery, setSearchQuery] = useState('');

  const debounce = useDebouncedCallback((searchQuery) => {
    setSearchQuery(searchQuery);
  }, 500);

  return (
    <MainLayout title='Characters' description={description}>
      <GenericHeader title='Characters' subtitle={description} gutterBottom />
      <Searchbar
        onChange={(e) => debounce(e.target.value)}
        ContainerProps={{ sx: { mb: 3 } }}
      />
      {
        // render a list of categories
        Object.entries(categorizedCharacters)
          // prioritize "Ys Series" then "Trails Series" then others alphabetically
          .sort(([a], [b]) => {
            if (a === 'Ys Series') return -1;
            if (b === 'Ys Series') return 1;

            if (a === 'Trails Series') return -1;
            if (b === 'Trails Series') return 1;

            return a.localeCompare(b);
          })
          .map(([category, characters]) => {
            const filteredCharacters = Object.entries(characters)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([firstLetter, characters]) => {
                const filteredCharacters = characters.filter(({ name }) =>
                  name.toLowerCase().includes(searchQuery)
                );

                if (filteredCharacters.length === 0) {
                  return null;
                }

                return (
                  <Box key={firstLetter} sx={{ mb: 1 }}>
                    <Typography variant='h3' component='h2' sx={{ mb: 2 }}>
                      {firstLetter}
                    </Typography>
                    <Grid container spacing={2}>
                      {filteredCharacters.map(
                        ({ id, name, category, hasAvatar }) => (
                          <Grid key={id} item xs={12} xs2={6} sm2={4} md={3}>
                            <CharacterItem
                              id={id}
                              name={name}
                              category={category}
                              accentColor='#3c4151'
                              image={
                                hasAvatar
                                  ? `${CLOUD_STORAGE_URL}/character-avatars/${id}`
                                  : undefined
                              }
                              prefetch={false}
                              sx={{ mb: 3 }}
                            />
                          </Grid>
                        )
                      )}
                    </Grid>
                  </Box>
                );
              });

            if (filteredCharacters.every((x) => x === null)) {
              return null;
            }

            return (
              <Box key={category}>
                <Typography variant='h2' sx={{ mb: 1 }}>
                  {category}
                </Typography>
                <Divider light sx={{ mb: 2 }} />
                {filteredCharacters}
              </Box>
            );
          }, [])
      }
    </MainLayout>
  );
};

export default CharacterList;
