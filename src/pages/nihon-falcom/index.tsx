import { Box, Divider, Stack, Typography } from '@mui/material';
import Image from 'next/image';

import falcomLogo from '~/../public/assets/falcom-logo.webp';
import heroBg from '~/../public/assets/landing-hero-bg.webp';
import { Link, MainLayout, StaffMemberItem } from '~/components';

const NihonFalcom = () => {
  // roles are used as descriptions to reuse the StaffMemberItem component
  const notableStaff = [
    {
      id: 'masayuki-kato',
      name: 'Masayuki Kato',
      roles: ["Founder of Falcom, currently serves as the company's chairman."],
      hasAvatar: false,
    },
    {
      id: 'toshihiro-kondo',
      name: 'Toshihiro Kondo',
      roles: [
        'Current president of Falcom. He also does scenario writing, and game directing.',
      ],
      hasAvatar: false,
    },
    {
      id: 'yoshio-kiya',
      name: 'Yoshio Kiya',
      roles: [
        "One of the programmers in Falcom's formative years. He was the main programmer for Falcom's early games.",
      ],
      hasAvatar: false,
    },
    {
      id: 'yuzo-koshiro',
      name: 'Yuzo Koshiro',
      roles: [
        "One of the early composers for Falcom that left a lasting impact on the company's music.",
      ],
      hasAvatar: false,
    },
  ];

  const sources = [
    {
      name: 'The History of Nihon Falcom',
      url: 'https://honeysanime.com/the-history-of-nihon-falcom',
    },
    {
      name: 'Game Design Essentials (Dragon Slayer)',
      url: 'https://web.archive.org/web/20220123080015/https://www.gamasutra.com/view/feature/4066/game_design_essentials_20_rpgs.php?page=13',
    },
  ];

  return (
    <MainLayout
      title='Nihon Falcom'
      description='Founded in 1981 by Masayuki Kato, Falcom emerged as a humble yet ambitious player in the burgeoning world of interactive entertainment.'
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
          src={heroBg}
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
          src={falcomLogo}
          alt='falcom logo'
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
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
        <Typography variant='h1'>Nihon Falcom</Typography>
        <Typography color='text.secondary'>日本ファルコム株式会社</Typography>
      </Box>
      <Divider light sx={{ my: 2 }} />
      <Box component='section' sx={{ mb: 3 }}>
        <Typography>
          Founded in 1981 by{' '}
          <Link href='/staff/masayuki-kato'>Masayuki Kato</Link>, Falcom emerged
          as a humble yet ambitious player in the burgeoning world of
          interactive entertainment. The seeds of its inception were sown by the
          aspirations of visionaries like{' '}
          <Link href='/staff/yoshio-kiya'>Yoshio Kiya</Link>, one of the
          programmers in Falcom&apos;s formative years, who drew inspiration
          from iconic titles such as &quot;Wizardry&quot; and
          &quot;Ultima.&quot;
        </Typography>
      </Box>
      <Box component='section' sx={{ mb: 3 }}>
        <Typography variant='h2' sx={{ mb: 1 }}>
          A Galactic Inspiration
        </Typography>
        <Typography>
          Kato&apos;s fascination with the science fiction genre, particularly
          the iconic Star Wars franchise, led him to a moment of serendipitous
          inspiration. The name &quot;Falcom&quot; finds its roots in the
          legendary starship, the Millennium Falcon, piloted by the iconic Han
          Solo in the Star Wars saga. The name resonated deeply with Kato,
          encapsulating a sense of adventure, exploration, and limitless
          possibilities—all qualities he envisioned for his nascent game
          development venture.
        </Typography>
      </Box>
      <Box component='section' sx={{ mb: 3 }}>
        <Typography variant='h2' sx={{ mb: 1 }}>
          Dragon Slayer: Forging the RPG Legacy
        </Typography>
        <Typography gutterBottom>
          At the heart of Falcom&apos;s storied journey lies the pivotal role of{' '}
          <Link href='/games/dragon-slayer'>Dragon Slayer</Link>, a game that
          not only marked the company&apos;s breakthrough but also left an
          enduring influence on the landscape of video game RPGs. This landmark
          title laid the foundation for many of the genre&apos;s conventions and
          set the stage for Falcom&apos;s future innovations.
        </Typography>
        <Typography gutterBottom>
          The impact of Dragon Slayer rippled throughout the RPG genre,
          inspiring both developers and gamers alike. The game&apos;s innovative
          mechanics and immersive storytelling inspired a new wave of game
          designers to experiment with similar concepts, resulting in the
          proliferation of RPGs that incorporated experience-based character
          progression and intricate fantasy worlds.
        </Typography>
        <Typography>
          The nature of Dragon Slayer&apos;s game elements laid the groundwork
          for the interconnected narratives and world-building that would become
          a hallmark of later RPG series, including Falcom&apos;s own{' '}
          <Link href='/trails-series'>Trails sub-series</Link>. The success of
          Dragon Slayer emboldened other developers to explore the potential of
          narrative-driven gameplay, leading to the rich and intricate
          storytelling that RPG enthusiasts cherish.
        </Typography>
      </Box>
      <Box component='section' sx={{ mb: 3 }}>
        <Typography variant='h2' sx={{ mb: 1 }}>
          Ys: An Epic Evolution
        </Typography>
        <Typography gutterBottom>
          The <Link href='/ys-series'>Ys series</Link>, another jewel in
          Falcom&apos;s crown, centers around the adventures of Adol Christin, a
          red-haired protagonist with an insatiable thirst for exploration.
          Known for its real-time action combat, engaging storylines, and
          exceptional soundtracks, Ys offers players a fast-paced RPG experience
          that strikes a balance between adrenaline-pumping battles and deep
          lore in contrast to the more traditional turn-based combat of the
          Dragon Slayer series.
        </Typography>
        <Typography>
          Central to the game&apos;s impact is its music, a hallmark of
          Falcom&apos;s games. The evocative compositions by{' '}
          <Link href='/staff/yuzo-koshiro'>Yuzo Koshiro</Link> and{' '}
          <Link href='/staff/mieko-ishikawa'>Mieko Ishikawa</Link> have become
          inseparable from the Ys experience, creating an auditory journey that
          enhances the game&apos;s emotional resonance. This musical synergy
          breathed life into Falcom&apos;s worlds, fostering a sense of
          immersion that would become a defining characteristic of the
          company&apos;s RPGs.
        </Typography>
      </Box>
      <Box component='section' sx={{ mb: 3 }}>
        <Typography variant='h2' sx={{ mb: 1 }}>
          Falcom&apos;s Influential Music
        </Typography>
        <Typography>
          One of the most distinctive hallmarks of Falcom&apos;s games is the
          unparalleled impact of its music. The company&apos;s in-house music
          team, known as Falcom Sound Team JDK, has crafted melodies that
          transcend mere background accompaniment, elevating gameplay to an
          emotional and immersive experience.
        </Typography>
      </Box>
      <Box component='section' sx={{ mb: 3 }}>
        <Typography variant='h2'>Notable Staff</Typography>
        <Typography color='text.secondary' sx={{ mb: 2 }}>
          Current / Former
        </Typography>
        <Stack spacing={1} sx={{ mb: 1 }}>
          {notableStaff.map((staffMember) => (
            <StaffMemberItem
              key={staffMember.id}
              disableEllipsis
              {...staffMember}
            />
          ))}
        </Stack>
        <Link href='/staff'>and many more!</Link>
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

export default NihonFalcom;
