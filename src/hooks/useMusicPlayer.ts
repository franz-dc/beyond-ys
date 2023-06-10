import { useContext } from 'react';

import { MusicPlayerContext } from '~/contexts';

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);

  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }

  return context;
};
