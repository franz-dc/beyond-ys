import { FC } from 'react';

import { Box } from '@mui/material';

export interface StoryTimelineProps {
  id: string;
  category: string;
}

const StoryTimeline: FC<StoryTimelineProps> = ({ id, category }) => {
  if (category === 'Ys Series') return <Box>UNDER CONSTRUCTION {id}</Box>;

  return null;
};

export default StoryTimeline;
