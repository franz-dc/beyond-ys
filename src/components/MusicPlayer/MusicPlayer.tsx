import { FC } from 'react';

import { Box, Button, alpha } from '@mui/material';
import { useYoutube } from 'react-youtube-music-player';

export interface MusicPlayerProps {
  title: string;
  artists: {
    name: string;
    link: string;
  }[];
  youtubeId: string;
  albumName?: string;
  albumUrl?: string;
}

const MusicPlayer: FC<MusicPlayerProps> = ({
  title,
  artists,
  youtubeId,
  // albumName,
  // albumUrl,
}) => {
  const {
    actions: { playVideo },
  } = useYoutube({
    id: youtubeId,
    type: 'video',
  });

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: '1rem',
        left: '1rem',
        right: '1rem',
        backgroundColor: 'background.paper',
        boxShadow: 4,
        px: 2,
        py: 1.5,
        borderRadius: 2,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: (t) => alpha(t.palette.divider, 0.05),
      }}
    >
      <Button variant='contained' color='primary' onClick={playVideo}>
        Play
      </Button>
      {title}-{JSON.stringify(artists)}
    </Box>
  );
};

export default MusicPlayer;
