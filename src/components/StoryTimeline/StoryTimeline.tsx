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
    const gameIndex = ysStoryTimeline.findIndex((game) => game.id === id);

    if (gameIndex === -1) return null;

    const timelineLength = ysStoryTimeline.length;
    const preTimelineLength = gameIndex - 1;
    const postTimelineLength = timelineLength - gameIndex - 2;
    const hasPrevGame = gameIndex > 0;
    const hasNextGame = gameIndex < timelineLength - 1;

    const shortenedTimeline = ysStoryTimeline.slice(
      hasPrevGame ? gameIndex - 1 : gameIndex,
      hasNextGame ? gameIndex + 2 : gameIndex + 1
    );

    return (
      <Box>
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
            <Step key={game.id}>
              {game.id === id ? (
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
                  href={`/games/${game.id}`}
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
