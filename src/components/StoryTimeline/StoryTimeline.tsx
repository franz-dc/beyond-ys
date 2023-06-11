import { FC } from 'react';

import {
  Box,
  Step,
  StepButton,
  StepIcon,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';

import { ysStoryTimeline } from '~/constants/ysStoryTimeline';

import Link from '../Link';

export interface StoryTimelineProps {
  id: string;
  category: string;
}

const StoryTimeline: FC<StoryTimelineProps> = ({ id, category }) => {
  if (category === 'Ys Series') {
    const gameIndex = ysStoryTimeline.findIndex((game) => game.id === id);

    if (gameIndex === -1) return null;

    // const timelineLength = ysStoryTimeline.length;

    return (
      <Box>
        <Stepper nonLinear alternativeLabel activeStep={gameIndex}>
          {ysStoryTimeline.map((game) => (
            <Step key={game.id}>
              {game.id === id ? (
                <StepLabel
                  StepIconComponent={() => (
                    <StepIcon icon={game.stepLabel} active />
                  )}
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
                  sx={{ color: 'text.primary' }}
                >
                  <StepLabel
                    StepIconComponent={() => <StepIcon icon={game.stepLabel} />}
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
        </Stepper>
      </Box>
    );
  }

  return null;
};

export default StoryTimeline;
