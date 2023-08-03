import { Box, Grid, Paper, Stack, Tooltip, Typography } from '@mui/material';
import Image from 'next/image';

import { GenericHeader, Link, MainLayout } from '~/components';
import { CONTRIBUTOR_PLATFORMS } from '~/constants';

// cspell:disable
import franzdcAvatar from '../../../public/assets/franzdc-avatar.webp';
import josepAvatar from '../../../public/assets/josep-avatar.webp';
import kotoraAvatar from '../../../public/assets/kotora-avatar.webp';
// cspell:enable

const About = () => {
  const description =
    "Welcome to Beyond Ys, a destination for the fans and people who want to know Falcom's works! This website is created to celebrate and share our love for all things Falcom.";

  // cspell:disable
  const contributors = [
    {
      name: 'Franz DC',
      description:
        'Creator of Beyond Ys. Fan of the Ys series and Falcom music since 2008. ',
      avatar: franzdcAvatar,
      platforms: {
        github: {
          label: 'GitHub: Franz DC',
          link: 'https://github.com/franz-dc',
        },
        youtube: {
          label: 'YouTube: Rinnosuke',
          link: 'https://youtube.com/c/Rinnosuke',
        },
      },
    },
    {
      name: 'Josep',
      description:
        'Owner of the Falcom Music Channel and Nihon Falcom (Sound Team J.D.K./jdk) Composer Breakdown Project.',
      avatar: josepAvatar,
      platforms: {
        youtube: {
          label: 'YouTube: Falcom Music Channel',
          link: 'https://youtube.com/c/FalcomMusicChannel',
        },
        twitter: {
          label: 'Twitter: Josep',
          link: 'https://twitter.com/jdkluv',
        },
        googleSheets: {
          label: 'Google Sheets: Composer Breakdown Project',
          link: 'https://docs.google.com/spreadsheets/d/1zE387MG1GcGzPsvj7XjwP4Jcg9lz0Bz15yrYtGHpc1I',
        },
      },
    },
    {
      name: 'Kotora',
      description:
        "Admin of Falcom Staff Roll where all credits from all of Falcom's games are documented.",
      avatar: kotoraAvatar,
      platforms: {
        douban: {
          label: 'Douban: Falcom Daisuki',
          link: 'https://site.douban.com/120173',
        },
        atwiki: {
          label: '@Wiki: Falcom Staff Roll',
          link: 'https://w.atwiki.jp/falcom_staff',
        },
      },
    },
  ];

  // cspell:enable
  return (
    <MainLayout title='About' description={description}>
      <GenericHeader title='About' />
      <Typography
        sx={{
          textAlign: 'center',
          fontSize: '1.25rem',
          maxWidth: 500,
          mx: 'auto',
          my: 6,
        }}
      >
        {description}
      </Typography>
      <Box sx={{ mb: 4 }}>
        {contributors.map((contributor) => (
          <Paper
            key={contributor.name}
            component='section'
            sx={{
              mb: 2,
              px: 3,
              py: 2,
              borderRadius: 4,
            }}
          >
            <Grid
              container
              spacing={{
                xs: 1,
                sm: 3,
              }}
            >
              <Grid item xs={12} sm='auto'>
                <Box
                  sx={{
                    width: '100%',
                    '& > *': {
                      display: 'flex',
                      mx: 'auto',
                    },
                  }}
                >
                  <Image
                    src={contributor.avatar}
                    width={64}
                    height={64}
                    alt='avatar'
                    style={{
                      borderRadius: '50%',
                    }}
                  />
                </Box>
              </Grid>
              <Grid
                item
                xs={12}
                sm
                sx={{
                  textAlign: {
                    xs: 'center',
                    sm: 'left',
                  },
                }}
              >
                <Typography variant='h2'>{contributor.name}</Typography>
                <Stack
                  direction='row'
                  spacing={1.5}
                  sx={{
                    mt: 1,
                    mb: 1.5,
                    justifyContent: {
                      xs: 'center',
                      sm: 'flex-start',
                    },
                  }}
                >
                  {Object.entries(contributor.platforms).map(
                    ([platform, { label, link }]) => {
                      const platformObj =
                        CONTRIBUTOR_PLATFORMS?.[platform] ||
                        CONTRIBUTOR_PLATFORMS?.other;

                      return (
                        <Tooltip key={platform} title={label} arrow>
                          <Link
                            href={link}
                            target='_blank'
                            rel='noopener noreferrer'
                            sx={{
                              '&:focus': {
                                outline: 'none',
                              },
                              '&:hover > span, &:focus > span': {
                                opacity: 1,
                              },
                            }}
                          >
                            <Box
                              component='span'
                              sx={{
                                width: platformObj.width,
                                color: 'text.primary',
                                opacity: 0.65,
                                transition: 'opacity 0.1s ease-in-out',
                              }}
                            >
                              <platformObj.icon />
                            </Box>
                          </Link>
                        </Tooltip>
                      );
                    }
                  )}
                </Stack>
                <Typography>{contributor.description}</Typography>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Box>
      <Box component='section' sx={{ mb: 4 }}>
        <Typography variant='h2' sx={{ mb: 1 }}>
          Contributing
        </Typography>
        <Typography gutterBottom>
          As of now, there is no way to directly contribute to the contents of
          this website yet. In the future, depending on the outcome of this
          project, it might be implemented. In the meantime, you can email at{' '}
          <Link
            href='mailto:hello@beyondys.com'
            target='_blank'
            rel='noopener noreferrer'
          >
            hello@beyondys.com
          </Link>{' '}
          for suggestions, new features, or new content for this site. If you
          are interested in contributing to the codebase, please refer to the{' '}
          <Link
            href='https://github.com/franz-dc/beyond-ys'
            target='_blank'
            rel='noopener noreferrer'
          >
            GitHub repository
          </Link>{' '}
          for more information.
        </Typography>
        {/* cspell:disable */}
        <Typography>
          As an alternative, you can start contributing through other means like
          sharing knowledge at dedicated wikis (
          <Link
            href='https://nihon-falcom.fandom.com'
            target='_blank'
            rel='noopener noreferrer'
          >
            Falcomverse Wiki
          </Link>
          ,{' '}
          <Link
            href='https://isu.fandom.com'
            target='_blank'
            rel='noopener noreferrer'
          >
            Ys Wiki
          </Link>
          ,{' '}
          <Link
            href='https://kiseki.fandom.com'
            target='_blank'
            rel='noopener noreferrer'
          >
            Kiseki Wiki
          </Link>
          , and{' '}
          <Link
            href='https://gagharv.fandom.com'
            target='_blank'
            rel='noopener noreferrer'
          >
            Gagharv Wiki
          </Link>
          ). You can also contribute to the{' '}
          <Link
            href='https://docs.google.com/spreadsheets/d/1zE387MG1GcGzPsvj7XjwP4Jcg9lz0Bz15yrYtGHpc1I'
            target='_blank'
            rel='noopener noreferrer'
          >
            Composer Breakdown Project
          </Link>{' '}
          by providing more information about the staff and/or their works, or
          by doing guess contributions.
        </Typography>
        {/* cspell:enable */}
      </Box>
      <Box component='section'>
        <Typography variant='h2' sx={{ mb: 1 }}>
          Disclaimer
        </Typography>
        <Typography gutterBottom>
          Beyond Ys is an independent fan website and is not associated with or
          endorsed by Falcom or its official representatives.
        </Typography>
        <Typography gutterBottom>
          All copyrighted content, trademarks, and intellectual property
          featured on this website are the property of their respective owners.
        </Typography>
        <Typography gutterBottom>
          While every effort is made to ensure the accuracy of the information
          provided on this website, it is not guaranteed for its completeness or
          timeliness. It is advised to verify information through additional
          sources.
        </Typography>
        <Typography>
          This website contains links to external websites for informational
          purposes only. The owner of this site has no control over the content
          or privacy practices of these external sites and is not responsible
          for any consequences that may arise from visiting them.
        </Typography>
      </Box>
    </MainLayout>
  );
};

export default About;
