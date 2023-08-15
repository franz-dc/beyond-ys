import type { PropsWithChildren } from 'react';

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

import {
  gagharvStoryTimeline,
  trailsStoryTimeline,
  ysStoryTimeline,
} from '~/constants';

import Link from '../Link';

type StoryTimelineWrapperProps = PropsWithChildren<{
  isVertical: boolean;
}>;

const StoryTimelineWrapper = ({
  isVertical,
  children,
}: StoryTimelineWrapperProps) => (
  <Box component='section' sx={{ mb: 4 }}>
    <Typography
      variant='h2'
      id='story-timeline'
      sx={{
        mb: isVertical
          ? 1
          : {
              xs: 1,
              md: 3,
            },
      }}
    >
      Story Timeline
    </Typography>
    {children}
  </Box>
);

export interface StoryTimelineProps {
  id: string;
  category: string;
  showAll?: boolean;
  forceVertical?: boolean;
}

const StoryTimeline = ({
  id,
  category,
  showAll,
  forceVertical,
}: StoryTimelineProps) => {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));

  const createTimelineComponent = ({
    id,
    timeline,
    timelineUrl,
    resizeStepIcon,
  }: {
    id: string;
    timeline: {
      ids: string[];
      name: string;
      stepLabel: string;
      stepSubLabel?: string;
    }[];
    timelineUrl: string;
    resizeStepIcon?: boolean;
  }) => {
    const gameIndex = timeline.findIndex((game) => game.ids.includes(id));

    if (!showAll && gameIndex === -1) return null;

    const timelineLength = timeline.length;
    const preTimelineLength = gameIndex - 2;
    const postTimelineLength = timelineLength - gameIndex - 3;
    const hasPrevGame = gameIndex > 0;
    const prevGameHasPrevGame = gameIndex > 1;
    const hasNextGame = gameIndex < timelineLength - 1;
    const nextGameHasNextGame = gameIndex < timelineLength - 2;

    // only show 3 games on the timeline at a time, including the current game
    const shortenedTimeline = timeline.slice(
      hasPrevGame ? gameIndex - (prevGameHasPrevGame ? 2 : 1) : gameIndex,
      hasNextGame ? gameIndex + (nextGameHasNextGame ? 3 : 2) : gameIndex + 1
    );

    return (
      <StoryTimelineWrapper isVertical={forceVertical || !mdUp}>
        <Stepper
          nonLinear
          activeStep={!showAll ? gameIndex : undefined}
          alternativeLabel={!forceVertical && mdUp}
          orientation={!forceVertical && mdUp ? 'horizontal' : 'vertical'}
        >
          {!showAll && preTimelineLength > 0 && (
            <Step>
              <StepButton
                component={Link}
                href={timelineUrl}
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
          {(showAll ? timeline : shortenedTimeline).map((game) => (
            <Step key={game.ids[0]}>
              {game.ids.includes(id) ? (
                <StepLabel
                  StepIconComponent={() => (
                    <StepIcon icon={game.stepLabel} active />
                  )}
                  sx={{
                    '& text': {
                      fontWeight: 'medium',
                      fontSize:
                        resizeStepIcon && game.stepLabel.length > 2
                          ? '0.65rem'
                          : '0.75rem',
                    },
                  }}
                  optional={
                    (forceVertical || !mdUp) && game.stepSubLabel ? (
                      <Typography variant='caption'>
                        {game.stepSubLabel}
                      </Typography>
                    ) : null
                  }
                >
                  <Typography
                    component='span'
                    color='primary.main'
                    fontSize={!forceVertical && mdUp ? 'inherit' : undefined}
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
                  optional={
                    (forceVertical || !mdUp) && game.stepSubLabel ? (
                      <Typography variant='caption'>
                        {game.stepSubLabel}
                      </Typography>
                    ) : null
                  }
                >
                  <StepLabel
                    StepIconComponent={() => <StepIcon icon={game.stepLabel} />}
                    sx={{
                      '& text': {
                        fontWeight: 'medium',
                        fontSize:
                          resizeStepIcon && game.stepLabel.length > 2
                            ? '0.65rem'
                            : '0.75rem',
                      },
                    }}
                  >
                    <Typography
                      component='span'
                      color='text.primary'
                      fontSize={!forceVertical && mdUp ? 'inherit' : undefined}
                    >
                      {game.name}
                    </Typography>
                  </StepLabel>
                </StepButton>
              )}
            </Step>
          ))}
          {!showAll && postTimelineLength > 0 && (
            <Step>
              <StepButton
                component={Link}
                href={timelineUrl}
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
      </StoryTimelineWrapper>
    );
  };

  if (category === 'Ys Series') {
    return createTimelineComponent({
      id,
      timeline: ysStoryTimeline,
      timelineUrl: '/ys-series#story-timeline',
    });
  }

  if (category === 'Trails Series') {
    return createTimelineComponent({
      id,
      timeline: trailsStoryTimeline,
      timelineUrl: '/trails-series#story-timeline',
      resizeStepIcon: true,
    });
  }

  if (category === 'Gagharv Trilogy') {
    return createTimelineComponent({
      id,
      timeline: gagharvStoryTimeline,
      timelineUrl: '/gagharv-trilogy#story-timeline',
    });
  }

  return null;
};

export default StoryTimeline;
