import { FC } from 'react';

import {
  Box,
  Step,
  StepButton,
  StepIcon,
  StepLabel,
  Stepper,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import { ysStoryTimeline } from '~/constants/ysStoryTimeline';

import Link from '../Link';

export interface StoryTimelineProps {
  id: string;
  category: string;
}

const StoryTimeline: FC<StoryTimelineProps> = ({ id, category }) => {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));

  if (category === 'Ys Series') {
    const gameIndex = ysStoryTimeline.findIndex((game) =>
      game.ids.includes(id)
    );

    if (gameIndex === -1) return null;

    const timelineLength = ysStoryTimeline.length;
    const preTimelineLength = gameIndex - 1;
    const postTimelineLength = timelineLength - gameIndex - 2;
    const hasPrevGame = gameIndex > 0;
    const prevGameHasPrevGame = gameIndex > 1;
    const hasNextGame = gameIndex < timelineLength - 1;
    const nextGameHasNextGame = gameIndex < timelineLength - 2;

    // only show 3 games on the timeline at a time, including the current game
    const shortenedTimeline = ysStoryTimeline.slice(
      hasPrevGame ? gameIndex - (prevGameHasPrevGame ? 2 : 1) : gameIndex,
      hasNextGame ? gameIndex + (nextGameHasNextGame ? 3 : 2) : gameIndex + 1
    );

    return (
      <Box component='section' sx={{ mb: 4 }}>
        <Typography
          component='h2'
          variant='h2'
          sx={{
            mb: {
              xs: 1,
              md: 3,
            },
          }}
        >
          Story Timeline
        </Typography>
        <Stepper
          nonLinear
          activeStep={gameIndex}
          alternativeLabel={mdUp}
          orientation={mdUp ? 'horizontal' : 'vertical'}
        >
          {preTimelineLength > 0 && (
            <Step>
              <StepButton
                component={Link}
                href='/ys-timeline'
                aria-label='previous games'
                sx={{
                  color: 'text.primary',
                  '&:hover': {
                    color: 'text.primary',
                  },
                }}
              >
                <StepLabel
                  StepIconComponent={() => (
                    <StepIcon icon={`+${preTimelineLength}`} />
                  )}
                  sx={{
                    '& svg': {
                      color: 'background.default',
                      borderRadius: '50%',
                      border: (theme) =>
                        `1px solid ${theme.palette.text.secondary}`,
                    },
                    '& text': {
                      color: 'text.primary',
                      fill: 'currentColor',
                      fontWeight: 'medium',
                    },
                  }}
                />
              </StepButton>
            </Step>
          )}
          {shortenedTimeline.map((game) => (
            <Step key={game.ids[0]}>
              {game.ids.includes(id) ? (
                <StepLabel
                  StepIconComponent={() => (
                    <StepIcon icon={game.stepLabel} active />
                  )}
                  sx={{
                    '& text': {
                      fontWeight: 'medium',
                    },
                  }}
                >
                  <Typography
                    component='span'
                    color='primary.main'
                    fontSize='inherit'
                  >
                    {game.name}
                  </Typography>
                </StepLabel>
              ) : (
                <StepButton
                  component={Link}
                  href={`/games/${game.ids[0]}`}
                  sx={{
                    color: 'text.primary',
                    '&:hover': {
                      color: 'text.primary',
                    },
                  }}
                >
                  <StepLabel
                    StepIconComponent={() => <StepIcon icon={game.stepLabel} />}
                    sx={{
                      '& text': {
                        fontWeight: 'medium',
                      },
                    }}
                  >
                    <Typography
                      component='span'
                      color='text.primary'
                      fontSize='inherit'
                    >
                      {game.name}
                    </Typography>
                  </StepLabel>
                </StepButton>
              )}
            </Step>
          ))}
          {postTimelineLength > 0 && (
            <Step>
              <StepButton
                component={Link}
                href='/ys-timeline'
                aria-label='future games'
                sx={{
                  color: 'text.primary',
                  '&:hover': {
                    color: 'text.primary',
                  },
                }}
              >
                <StepLabel
                  StepIconComponent={() => (
                    <StepIcon icon={`+${postTimelineLength}`} />
                  )}
                  sx={{
                    '& svg': {
                      color: 'background.default',
                      borderRadius: '50%',
                      border: (theme) =>
                        `1px solid ${theme.palette.text.secondary}`,
                    },
                    '& text': {
                      color: 'text.primary',
                      fill: 'currentColor',
                      fontWeight: 'medium',
                    },
                  }}
                />
              </StepButton>
            </Step>
          )}
        </Stepper>
      </Box>
    );
  }

  return null;
};

export default StoryTimeline;
