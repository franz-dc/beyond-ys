import { Box, Divider, Grid, Paper, Typography } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import type { GetStaticProps } from 'next';
import Image, { type StaticImageData } from 'next/image';

import calvardEmblem from '~/../public/assets/calvard-emblem.webp';
import crossbellEmblem from '~/../public/assets/crossbell-emblem.webp';
import ereboniaCrest from '~/../public/assets/erebonia-crest.webp';
import liberlCrest from '~/../public/assets/liberl-crest.webp';
import trailsLogo from '~/../public/assets/trails-logo.webp';
import trailsSeriesBg from '~/../public/assets/trails-series-bg.webp';
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
    // game sorting:  most recent first, empty release date last
    .sort(([, { releaseDate: a }], [, { releaseDate: b }]) => {
      if (!a) return 1;
      if (!b) return -1;
      return (b as string).localeCompare(a as string);
    })
    .filter(([, { category }]) =>
      ['Trails Series', 'Ys / Trails Series'].includes(category)
    )
    .map(([id, game]) => ({ id, ...game }));

  return {
    props: { games },
  };
};

const zemuriaLocations = [
  {
    name: 'Liberl Kingdom',
    description:
      "Liberl is often the starting point for new players, and it's a kingdom characterized by lush forests, picturesque landscapes, and advanced orbal technology. The Liberl Arc introduces players to the world of bracers and their role in maintaining peace and order.",
    image: liberlCrest,
  },
  {
    name: 'Crossbell State',
    description:
      'Crossbell is a bustling metropolis at the heart of Zemuria, known for its technological advancements and complex political landscape. This arc delves into themes of corruption, espionage, and the impact of power struggles on the lives of ordinary citizens.',
    image: crossbellEmblem,
  },
  {
    name: 'Erebonian Empire',
    description:
      'The Erebonian Empire is a powerful nation with a rich history, towering cities, and a strict class system. The Erebonia Arc explores themes of social disparity, imperialism, and the consequences of wielding great power.',
    image: ereboniaCrest,
  },
  {
    name: 'Republic of Calvard',
    description:
      'Calvard, a former monarchy, is a nation of diverse cultures and traditions. The Calvard Arc explores the impact of war on the lives of ordinary citizens, while giving players a new real-time combat system to master.',
    image: calvardEmblem,
  },
];

const ZemuriaLocation = ({
  name,
  description,
  image,
}: {
  name: string;
  description: string;
  image: StaticImageData;
}) => (
  <Paper component='section' sx={{ mb: 2, p: 2 }}>
    <Grid
      container
      spacing={2}
      flexDirection={{
        xs: 'column-reverse',
        sm: 'row',
      }}
    >
      <Grid item xs={12} sm>
        <Typography
          variant='h3'
          sx={{
            mb: {
              xs: 2,
              sm: 1,
            },
            textAlign: {
              xs: 'center',
              sm: 'left',
            },
          }}
        >
          {name}
        </Typography>
        <Typography>{description}</Typography>
      </Grid>
      <Grid item xs={12} sm='auto'>
        <Box
          component={Image}
          src={image}
          alt='liberl crest'
          sx={{
            display: 'block',
            width: 100,
            height: 'auto',
            mx: {
              xs: 'auto',
              sm: 0,
            },
            mb: {
              xs: -1,
              sm: 0,
            },
          }}
        />
      </Grid>
    </Grid>
  </Paper>
);

const TrailsSeries = ({ games }: Props) => {
  const sources = [
    {
      name: 'Trails Series',
      url: 'https://nihon-falcom.fandom.com/wiki/Trails_Series',
    },
    {
      name: 'Timeline of Zemurian history',
      url: 'https://kiseki.fandom.com/wiki/Timeline_of_Zemurian_history',
    },
  ];

  return (
    <MainLayout
      title='Trails Series'
      description='Within the sprawling landscape of RPGs, few series have achieved the intricate narrative depth and world-building prowess of the Trails (Kiseki) series. Renowned for its sprawling narratives, multi-faceted characters, and meticulous attention to detail, the Trails series has captivated players and set a new standard for storytelling in the gaming world.'
      image={trailsLogo.src}
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
          src={trailsSeriesBg}
          alt='trails hero background'
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.4,
            filter: 'blur(2px) brightness(0.4)',
          }}
        />
        <Box
          component={Image}
          src={trailsLogo}
          alt='trails logo'
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            py: {
              xs: 0.5,
              md: 1,
            },
            width: 'auto',
            height: '100%',
          }}
        />
      </Box>
      <Box component='header'>
        <Typography variant='h1'>Trails Series</Typography>
        <Typography color='text.secondary'>軌跡シリーズ</Typography>
      </Box>
      <Divider light sx={{ my: 2 }} />
      <Box component='section' sx={{ mb: 3 }}>
        <Typography>
          Within the sprawling landscape of RPGs, few series have achieved the
          intricate narrative depth and world-building prowess of the Trails
          (Kiseki) series. Renowned for its sprawling narratives, multi-faceted
          characters, and meticulous attention to detail, the Trails series has
          captivated players and set a new standard for storytelling in the
          gaming world.
        </Typography>
      </Box>
      <Box component='section' sx={{ mb: 3 }}>
        <Typography variant='h2' sx={{ mb: 1 }}>
          Pioneering the Path
        </Typography>
        <Typography>
          The Trails series embarked on its ambitious journey with the Trails in
          the Sky sub-series. Set in the enchanting continent of Zemuria,
          players followed the adventures of{' '}
          <Link href='/characters/estelle-bright'>Estelle Bright</Link> and{' '}
          <Link href='/characters/joshua-bright'>Joshua Bright</Link> as they
          unveiled a tapestry of political intrigue, personal growth, and
          mysteries that spanned generations. The first few titles laid the
          groundwork for what would become a narrative epic of immense
          proportions.
        </Typography>
      </Box>
      <Box component='section' sx={{ mb: 3 }}>
        <Typography variant='h2' sx={{ mb: 1 }}>
          Adaptations and Beyond
        </Typography>
        <Typography>
          The Trails series&apos; foray into anime began with adaptations of its
          beloved narratives. Titles like{' '}
          <Link href='/games/the-legend-of-heroes-trails-in-the-sky'>
            Trails in the Sky
          </Link>{' '}
          and{' '}
          <Link href='/games/the-legend-of-heroes-trails-of-cold-steel'>
            Trails of Cold Steel
          </Link>{' '}
          received manga and anime treatments, enabling fans to witness their
          favorite characters and events in a visually stunning format. These
          adaptations strive to capture the essence of the games&apos;
          storytelling while presenting them in a manner that complements the
          strengths of animation.
        </Typography>
      </Box>
      <Box component='section' sx={{ mb: 3 }}>
        <Typography variant='h2' sx={{ mb: 1 }}>
          Navigating the Vast World of Zemuria
        </Typography>
        <Typography gutterBottom>
          In the expansive world of the Trails series, the continent of Zemuria
          takes center stage. A land filled with diverse landscapes, cultures,
          and political intrigues, Zemuria serves as the backdrop for the epic
          tales woven throughout the series.
        </Typography>
        {zemuriaLocations.map((location) => (
          <ZemuriaLocation key={location.name} {...location} />
        ))}
      </Box>
      <Box component='section' sx={{ mb: 3 }}>
        <Typography variant='h2' sx={{ mb: 1 }}>
          Where do I start?
        </Typography>
        <Typography>
          The series is divided into multiple interconnected story arcs, each
          contributing to an epic, overarching narrative. It is recommended to
          play the games in release order (Liberl &gt; Crossbell &gt; Erebonia
          &gt; Calvard) to fully appreciate the story and world-building. Your
          journey begins with{' '}
          <Link href='/games/the-legend-of-heroes-trails-in-the-sky'>
            Trails in the Sky
          </Link>
          !
        </Typography>
      </Box>
      <StoryTimeline id='' category='Trails Series' showAll forceVertical />
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

export default TrailsSeries;
