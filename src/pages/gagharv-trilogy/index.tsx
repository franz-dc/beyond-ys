import { Box, Divider, Grid, Paper, Typography } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import type { GetStaticProps } from 'next';
import Image from 'next/image';

import gagharvTrilogyBg from '~/../public/assets/gagharv-trilogy-bg.webp';
import { GameItem, Link, MainLayout, StoryTimeline } from '~/components';
import { cacheCollection } from '~/configs';
import { GameCacheSchema } from '~/schemas';

type Props = {
  games: (GameCacheSchema & { id: string })[];
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const cachedGamesDoc = await getDoc<Record<string, GameCacheSchema>>(
    doc(cacheCollection, 'games')
  );

  const cachedGames = cachedGamesDoc.data() || {};

  const games = Object.entries(cachedGames)
    // game sorting: most recent first, empty release date last
    .sort(([, { releaseDate: a }], [, { releaseDate: b }]) => {
      if (!a) return 1;
      if (!b) return -1;
      return (b as string).localeCompare(a as string);
    })
    .filter(([, { category }]) => category === 'Gagharv Trilogy')
    .map(([id, game]) => ({ id, ...game }));

  return {
    props: { games },
  };
};

const GagharvTrilogy = ({ games }: Props) => {
  const sources = [
    {
      name: 'Gagharv',
      url: 'https://nihon-falcom.fandom.com/wiki/Gagharv',
    },
    {
      name: 'Gagharv Timeline',
      url: 'https://nihon-falcom.fandom.com/wiki/Gagharv/Timeline',
    },
    {
      name: 'Tirasweel',
      url: 'https://gagharv.fandom.com/wiki/Tirasweel',
    },
    {
      name: 'El Phildin',
      url: 'https://gagharv.fandom.com/wiki/El_Phildin',
    },
    {
      name: 'Weltluna',
      url: 'https://gagharv.fandom.com/wiki/Weltluna',
    },
  ];

  return (
    <MainLayout
      title='Gagharv Trilogy'
      description='The Gagharv Trilogy introduces players to a fantastical realm steeped in mythology, magic, and mystery. From the outset, it captivates with its rich lore, unique cultures, and enigmatic tales that weave together to form a cohesive and engaging narrative experience.'
    >
      <Box
        className='paper-bg'
        sx={{
          position: 'relative',
          height: {
            xs: 100,
            md: 150,
          },
          borderRadius: 4,
          mb: 2,
          overflow: 'hidden',
        }}
      >
        <Box
          component={Image}
          src={gagharvTrilogyBg}
          alt='gagharv trilogy hero'
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </Box>
      <Box component='header'>
        <Typography variant='h1'>Gagharv Trilogy</Typography>
        <Typography color='text.secondary'>ガガーブトリロジー</Typography>
      </Box>
      <Divider light sx={{ my: 2 }} />
      <Box component='section' sx={{ mb: 3 }}>
        <Typography>
          The Gagharv Trilogy introduces players to a fantastical realm steeped
          in mythology, magic, and mystery. From the outset, it captivates with
          its rich lore, unique cultures, and enigmatic tales that weave
          together to form a cohesive and engaging narrative experience.
        </Typography>
      </Box>
      <Box component='section' sx={{ mb: 3 }}>
        <Typography variant='h2' sx={{ mb: 1 }}>
          The Divided Lands
        </Typography>
        <Typography gutterBottom>
          The trilogy takes place in a world divided into three continents:
          Tirasweel and El Phildin, which are separated by the rift of Gagharv,
          and Weltluna, isolated by the Great Serpent&apos;s Backbone.
        </Typography>
        <Paper component='section' sx={{ mb: 2, p: 2 }}>
          <Typography variant='h3' sx={{ mb: 1 }}>
            Tirasweel
          </Typography>
          <Typography>
            The central setting of the first game in the trilogy,{' '}
            <Link href='the-legend-of-heroes-iii-white-witch'>
              Prophecy of the Moonlight Witch
            </Link>
            , is a realm shrouded in mysticism and steeped in legends. At the
            heart of continent lies the story of the enigmatic Moonlight Witch,
            whose prophecies and actions drive the events of the game.
          </Typography>
        </Paper>
        <Paper component='section' sx={{ mb: 2, p: 2 }}>
          <Typography variant='h3' sx={{ mb: 1 }}>
            El Phildin
          </Typography>
          <Typography>
            In{' '}
            <Link href='the-legend-of-heroes-iv-a-tear-of-vermillion'>
              A Tear of Vermillion
            </Link>
            , the second installment of the Gagharv Trilogy, players are
            transported to El Phildin, which is also known as the land where the
            gods sleep. The story on the this setting starts with the
            game&apos;s protagonist, <Link href='characters/avin'>Avin</Link>,
            embarks on a journey to find his sister,{' '}
            <Link href='characters/eimelle'>Eimelle</Link>.
          </Typography>
        </Paper>
        <Paper component='section' sx={{ mb: 2, p: 2 }}>
          <Typography variant='h3' sx={{ mb: 1 }}>
            Weltluna
          </Typography>
          <Typography>
            The final installment,{' '}
            <Link href='the-legend-of-heroes-v-song-of-the-ocean'>
              Song of the Ocean
            </Link>
            , introduces players to the isolated continent of Weltluna,
            separated by Gagharv and Great Serpent&apos;s Backbone. Players take
            on the roles of <Link href='characters/forte'>Forte</Link>,{' '}
            <Link href='characters/una'>Una</Link>, and{' '}
            <Link href='characters/mcbain'>McBain</Link> as they embark on a
            quest to find Leone&apos;s Resonance Stones.
          </Typography>
        </Paper>
      </Box>
      <StoryTimeline id='' category='Gagharv Trilogy' showAll forceVertical />
      <Box component='section' sx={{ mt: -2, mb: 3 }}>
        <Typography variant='h2' sx={{ mb: 2 }}>
          Games
        </Typography>
        <Grid container spacing={2}>
          {games.map((game) => (
            <Grid item xs={6} xs3={4} sm4={3} md={2.4} key={game.id}>
              <GameItem {...game} prefetch={false} />
            </Grid>
          ))}
        </Grid>
      </Box>
      <Box component='section'>
        <Typography variant='h2' sx={{ mb: 1 }}>
          Sources
        </Typography>
        <Box component='ul' sx={{ m: 0, pl: 2 }}>
          {sources.map((source, idx) => (
            <li key={idx}>
              <Link href={source.url} target='_blank' rel='noopener noreferrer'>
                {source.name}
              </Link>
            </li>
          ))}
        </Box>
      </Box>
    </MainLayout>
  );
};

export default GagharvTrilogy;
