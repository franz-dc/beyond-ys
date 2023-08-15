import { Box, Divider, Grid, Paper, Typography } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import type { GetStaticProps } from 'next';
import Image from 'next/image';

import ysBumpSystem from '~/../public/assets/ys-bump-system.webp';
import ysLogo from '~/../public/assets/ys-logo.webp';
import ysNapishtimMechanics from '~/../public/assets/ys-napishtim-mechanics.webp';
import ysPartySystem from '~/../public/assets/ys-party-system.webp';
import ysSeriesBg from '~/../public/assets/ys-series-bg.webp';
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
    // game sorting:
    // 1. alphabetical
    // 2. most recent first, empty release date last
    .sort(([, { name: a }], [, { name: b }]) => a.localeCompare(b))
    .sort(([, { releaseDate: a }], [, { releaseDate: b }]) => {
      if (!a) return 1;
      if (!b) return -1;
      return (b as string).localeCompare(a as string);
    })
    .filter(([, { category }]) =>
      ['Ys Series', 'Ys / Trails Series'].includes(category)
    )
    .map(([id, game]) => ({ id, ...game }));

  return {
    props: { games },
  };
};

const YsSeries = ({ games }: Props) => {
  const sources = [
    {
      name: 'Ys (series)',
      url: 'https://isu.fandom.com/wiki/Ys_(series)',
    },
    {
      name: 'Ys Simplified Timeline',
      url: 'https://isu.fandom.com/wiki/Timeline',
    },
  ];

  return (
    <MainLayout
      title='Ys Series'
      description='Embark on an epic adventure alongside Adol Christin, a red-haired adventurer whose thirst for exploration and insatiable curiosity lead him to distant lands filled with mystery, danger, and heroism.'
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
          src={ysSeriesBg}
          alt='falcom hero background'
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'bottom 20% right',
            opacity: 0.4,
            filter: 'blur(2px) brightness(0.4)',
          }}
        />
        <Box
          component={Image}
          src={ysLogo}
          alt='ys logo'
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            minWidth: 220,
            width: {
              xs: '60%',
              xs2: '50%',
              sm: '40%',
              sm2: '30%',
              md: 350,
            },
            height: 'auto',
          }}
        />
      </Box>
      <Box component='header'>
        <Typography variant='h1'>Ys Series</Typography>
        <Typography color='text.secondary'>イースシリーズ</Typography>
      </Box>
      <Divider light sx={{ my: 2 }} />
      <Box component='section' sx={{ mb: 3 }}>
        <Typography>
          The Ys series has significantly influenced RPG gameplay dynamics
          through its innovative real-time action combat. Departing from the
          traditional turn-based model, Ys introduced a fast-paced, skill-based
          combat system that requires players to time their attacks, dodge enemy
          assaults, and strategize in the heat of battle. This departure from
          convention has encouraged other developers to experiment with combat
          mechanics, resulting in a more diverse array of RPG gameplay
          experiences.
        </Typography>
      </Box>
      <Box component='section' sx={{ mb: 3 }}>
        <Typography variant='h2' sx={{ mb: 1 }}>
          A Symphony of Blades and Adventures
        </Typography>
        <Typography>
          Embark on an epic adventure alongside Adol Christin, a red-haired
          adventurer whose thirst for exploration and insatiable curiosity lead
          him to distant lands filled with mystery, danger, and heroism. From
          his humble beginnings on the Isle of Esteria to encounters with
          ancient civilizations and mystical beings, the Ys series weaves a
          tapestry of quests that capture the essence of adventure.
        </Typography>
      </Box>
      <Box component='section' sx={{ mb: 3 }}>
        <Typography variant='h2' sx={{ mb: 1 }}>
          Evolution of Mechanics
        </Typography>
        <Typography gutterBottom>
          Throughout the years, it embraced an evolution of mechanics that
          pushed the boundaries of Falcom&apos;s RPG gameplay.
        </Typography>
        <Paper component='section' sx={{ mb: 2, p: 2 }}>
          <Grid container spacing={2} direction={{ sm3: 'row-reverse' }}>
            <Grid item xs={12} sm3={3}>
              <Box
                sx={{
                  pt: { sm3: 3.625 },
                  width: '100%',
                  height: '100%',
                }}
              >
                <Box
                  component={Image}
                  src={ysBumpSystem}
                  alt='ys bump system'
                  sx={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    borderRadius: 2,
                    objectFit: 'cover',
                    aspectRatio: {
                      xs: '32/9',
                      md: 'unset',
                    },
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm3={9}>
              <Typography variant='h3' sx={{ mb: 1 }}>
                The Bump System
              </Typography>
              <Typography>
                In its early iterations, Adol engaged enemies by physically
                colliding with them, a departure from traditional turn-based
                combat. This innovation laid the foundation for the series&apos;
                action-oriented gameplay, encouraging players to strategize
                their movements and timing. The Bump System also introduced
                another element of risk and reward, as players could choose to
                avoid enemies or engage them for experience points.
              </Typography>
            </Grid>
          </Grid>
        </Paper>
        <Paper component='section' sx={{ mb: 2, p: 2 }}>
          <Grid container spacing={2} direction={{ sm3: 'row-reverse' }}>
            <Grid item xs={12} sm3={3}>
              <Box
                sx={{
                  pt: { sm3: 3.625 },
                  width: '100%',
                  height: '100%',
                }}
              >
                <Box
                  component={Image}
                  src={ysNapishtimMechanics}
                  alt='ys napishtim mechanics'
                  sx={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    borderRadius: 2,
                    objectFit: 'cover',
                    aspectRatio: {
                      xs: '32/9',
                      md: 'unset',
                    },
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm3={9}>
              <Typography variant='h3' sx={{ mb: 1 }}>
                Skillful Maneuvers and Strategy
              </Typography>
              <Typography>
                As the series progressed, so did its combat mechanics. Ys II
                introduced magical abilities, enhancing Adol&apos;s repertoire
                of combat strategies. Subsequent titles evolved further, having
                dedicated attacks with unique combos and blending real-time
                action with tactical elements, creating a dynamic experience
                that demanded quick thinking and precise execution.
              </Typography>
            </Grid>
          </Grid>
        </Paper>
        <Paper component='section' sx={{ mb: 2, p: 2 }}>
          <Grid container spacing={2} direction={{ sm3: 'row-reverse' }}>
            <Grid item xs={12} sm3={3}>
              <Box
                sx={{
                  pt: { sm3: 3.625 },
                  width: '100%',
                  height: '100%',
                }}
              >
                <Box
                  component={Image}
                  src={ysPartySystem}
                  alt='ys party system'
                  sx={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    borderRadius: 2,
                    objectFit: 'cover',
                    aspectRatio: {
                      xs: '32/9',
                      md: 'unset',
                    },
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm3={9}>
              <Typography variant='h3' sx={{ mb: 1 }}>
                Party System
              </Typography>
              <Typography>
                In later entries of the Ys series, players found themselves
                accompanied by a diverse cast of allies, each with their unique
                skills and abilities. This shift introduced strategic depth,
                enabling players to harness the strengths of different
                characters to overcome challenges. The inclusion of a party
                system expanded the series&apos; gameplay possibilities, adding
                a new layer of complexity to battles and interactions.
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>
      <StoryTimeline id='' category='Ys Series' showAll forceVertical />
      <Box component='section' sx={{ mb: 3 }}>
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

export default YsSeries;
