import { useState } from 'react';

import { Box, Divider, Grid, Typography } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import type { GetServerSideProps } from 'next';
import { useDebouncedCallback } from 'use-debounce';

import { GameItem, GenericHeader, MainLayout, Searchbar } from '~/components';
import { cacheCollection } from '~/configs';
import { GameCacheSchema } from '~/schemas';

type CategorizedGameSchema = Record<
  string, // category
  (GameCacheSchema & { id: string })[] // games
>;

interface Props {
  description: string;
  categorizedGames: [string, (GameCacheSchema & { id: string })[]][];
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const cachedGamesDoc = await getDoc<Record<string, GameCacheSchema>>(
    doc(cacheCollection, 'games')
  );

  const cachedGames = cachedGamesDoc.data() || {};

  const categorizedGames = Object.entries(
    Object.entries(cachedGames)
      // game sorting:
      // 1. alphabetical
      // 2. most recent first, empty release date last
      .sort(([, { name: a }], [, { name: b }]) => a.localeCompare(b))
      .sort(([, { releaseDate: a }], [, { releaseDate: b }]) => {
        if (!a) return 1;
        if (!b) return -1;
        return (b as string).localeCompare(a as string);
      })
      .reduce<CategorizedGameSchema>((acc, [id, game]) => {
        if (!game.category) {
          if (!acc.Uncategorized) {
            acc.Uncategorized = [];
          }
          acc.Uncategorized.push({ id, ...game });
          return acc;
        }

        if (!acc[game.category]) {
          acc[game.category] = [];
        }

        acc[game.category].push({ id, ...game });

        return acc;
      }, {})
  ).sort(([a], [b]) => {
    // category sorting:
    // Ys Series first, Trails Series second, rest a-z, Uncategorized last
    if (a === 'Ys Series') return -1;
    if (b === 'Ys Series') return 1;
    if (a === 'Trails Series') return -1;
    if (b === 'Trails Series') return 1;
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });

  return {
    props: {
      description: 'List of all games made or published by Falcom.',
      categorizedGames,
    },
  };
};

const GameList = ({ description, categorizedGames }: Props) => {
  const [searchQuery, setSearchQuery] = useState('');

  const debounce = useDebouncedCallback((searchQuery) => {
    setSearchQuery(searchQuery);
  }, 500);

  return (
    <MainLayout title='Games' description={description}>
      <GenericHeader title='Games' subtitle={description} gutterBottom />
      <Searchbar
        onChange={(e) => debounce(e.target.value)}
        ContainerProps={{ sx: { mb: 3 } }}
      />
      {categorizedGames.map(([category, games]) => (
        <Box key={category} sx={{ mb: 4 }}>
          <Typography variant='h2' sx={{ mb: 1 }}>
            {category}
          </Typography>
          <Divider light sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {games
              .filter(({ name }) =>
                name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((game) => (
                <Grid item xs={6} xs3={4} sm4={3} md={2.4} key={game.id}>
                  <GameItem {...game} />
                </Grid>
              ))}
          </Grid>
        </Box>
      ))}
    </MainLayout>
  );
};

export default GameList;
