import { FC, useEffect, useRef, useState } from 'react';

import { keyframes } from '@emotion/react';
import {
  Box,
  Grid,
  IconButton,
  Paper,
  Slider,
  Stack,
  Typography,
  alpha,
  styled,
  useTheme,
} from '@mui/material';
import Image from 'next/image';
import Marquee from 'react-fast-marquee';
import {
  MdPause,
  MdPlayArrow,
  MdRepeat,
  MdRepeatOne,
  MdShuffle,
  MdSkipNext,
  MdSkipPrevious,
  MdVolumeDown,
  MdVolumeMute,
  MdVolumeOff,
  MdVolumeUp,
} from 'react-icons/md';
import { PlayerState, useYoutube } from 'react-youtube-music-player';

import { formatSeconds } from '~/utils';

import Link from '../Link';

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

const StyledSlider = styled(Slider)(({ theme }) => ({
  color: theme.palette.text.primary,
  '&.Mui-active, &.MuiSlider-dragging': {
    '& .MuiSlider-track': {
      color: theme.palette.primary.main,
    },
  },
  '&:hover': {
    '& .MuiSlider-track': {
      color: theme.palette.primary.main,
    },
    '& .MuiSlider-thumb': {
      width: 12,
      height: 12,
    },
  },
  height: 4,
  '& .MuiSlider-thumb': {
    // transition: 'box-shadow 0.1s, color 0.1s, width 0.1s, height 0.1s',
    transition: 'all 0.1s',
    width: 0,
    height: 0,
    '&:before': {
      // boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
    },
    '&:hover, &.Mui-focusVisible': {
      boxShadow: '0px 0px 0px 6px rgb(255 255 255 / 16%)',
    },
    '&.Mui-active': {
      boxShadow: `0px 0px 0px 6px ${alpha(theme.palette.primary.main, 0.16)}`,
      width: 12,
      height: 12,
      color: theme.palette.primary.main,
    },
  },
  '& .MuiSlider-rail': {
    opacity: 0.2,
  },
  '& .MuiSlider-track': {
    transition: 'all 0.1s',
  },
}));

const MusicPlayer: FC<MusicPlayerProps> = ({
  title,
  artists,
  youtubeId,
  albumName,
  albumUrl,
}) => {
  const theme = useTheme();

  // used to get react-youtube-music-player's ready state
  const [isReady, setIsReady] = useState(false);

  // currentTime from react-youtube-music-player does not update in real time
  // so we use this state to keep track of the current time (seconds)
  const [actualCurrentTime, setActualCurrentTime] = useState(0);

  // last time when currentTime was updated (date in milliseconds)
  const [timeLastUpdated, setTimeLastUpdated] = useState(new Date().getTime());
  const [lastRecordedCurrentTime, setLastRecordedCurrentTime] = useState(0);

  // controls state
  const [isShuffleOn, setIsShuffleOn] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');

  const {
    playerDetails: { currentTime, duration, volume, state },
    actions: { playVideo, pauseVideo, seekTo, setVolume },
  } = useYoutube({
    id: youtubeId,
    type: 'video',
    options: {
      origin: process.env.NEXT_PUBLIC_SITE_URL,
      autoplay: true,
    },
    events: {
      onReady: () => {
        setIsReady(true);
        setWasPlaying(true);
      },
      onStateChange: (e) => {
        const currentTime = e.target.getCurrentTime();
        setActualCurrentTime(currentTime);
        setLastRecordedCurrentTime(currentTime);
        setTimeLastUpdated(new Date().getTime());

        if (!('mediaSession' in navigator)) return;
        switch (e.data) {
          case PlayerState.PLAYING:
            navigator.mediaSession.playbackState = 'playing';
            break;
          case PlayerState.PAUSED:
            navigator.mediaSession.playbackState = 'paused';
            break;
          case PlayerState.BUFFERING:
            navigator.mediaSession.playbackState = 'paused';
            break;
          case PlayerState.UNSTARTED:
            navigator.mediaSession.playbackState = 'none';
            break;
          case PlayerState.ENDED:
            navigator.mediaSession.playbackState = 'none';
            break;
        }
      },
    },
  });

  const [isVolumeInitialized, setIsVolumeInitialized] = useState(false);

  // we use a separate state for volume because there are bugs with the volume
  // api where it doesn't update the volume properly on initial load
  const [clientVolume, setClientVolume] = useState(100);

  const [isMuted, setIsMuted] = useState(false);
  const [unmutedVolume, setUnmutedVolume] = useState(100);

  // used in conjunction with the buffer state, this is used to determine if
  // the video was playing before buffering
  const [wasPlaying, setWasPlaying] = useState(false);

  // remove old embeds when a new one is loaded
  const [lastYoutubeId, setLastYoutubeId] = useState(youtubeId);

  useEffect(() => {
    if (youtubeId === lastYoutubeId) return;
    // remove iframe
    document.getElementById(`youtube-player-${lastYoutubeId}`)?.remove();
    // removed iframe becomes a div so we remove that too
    document.getElementById(`youtube-player-${lastYoutubeId}`)?.remove();
    setLastYoutubeId(youtubeId);
    setIsReady(false);
  }, [lastYoutubeId, youtubeId]);

  // loop video if repeatMode is 'one'
  useEffect(() => {
    if (repeatMode !== 'one') return;
    if (state !== PlayerState.ENDED) return;
    playVideo();
  }, [playVideo, repeatMode, state]);

  // update actualCurrentTime when currentTime changes
  // currentTime does not update in real time so we use this to keep track of
  // the current time
  useEffect(() => {
    if (currentTime === lastRecordedCurrentTime) return;
    setLastRecordedCurrentTime(currentTime);
    setTimeLastUpdated(new Date().getTime());
  }, [currentTime, lastRecordedCurrentTime]);

  // add the time elapsed since the last time currentTime was updated and
  // update this value every 1 second
  useEffect(() => {
    const interval = setInterval(() => {
      if (state === PlayerState.PLAYING) {
        const newActualCurrentTime =
          lastRecordedCurrentTime +
          (new Date().getTime() - timeLastUpdated) / 1000;

        setActualCurrentTime(newActualCurrentTime);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastRecordedCurrentTime, state, timeLastUpdated]);

  // change volume when client volume changes
  useEffect(() => {
    if (!isVolumeInitialized || !isReady || volume === clientVolume) return;
    setVolume(clientVolume);
  }, [isVolumeInitialized, isReady, clientVolume, setVolume, volume]);

  // set volume on mount
  useEffect(() => {
    if (isVolumeInitialized || !isReady) return;

    const isMuted = localStorage.getItem('isMuted');

    // parse and validate isMuted then set it
    if (isMuted === 'true') {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }

    const volume = localStorage.getItem('volume');

    // parse and validate volume then set it
    if (volume) {
      const parsedVolume = parseFloat(volume);
      if (!isNaN(parsedVolume) && parsedVolume >= 0 && parsedVolume <= 100) {
        setClientVolume(parsedVolume);
        setUnmutedVolume(parsedVolume);
      }
    } else {
      setClientVolume(100);
      setUnmutedVolume(100);
      localStorage.setItem('volume', '100');
    }

    setIsVolumeInitialized(true);
  }, [isVolumeInitialized, isReady]);

  // media session api
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist: artists.map((artist) => artist.name).join(', '),
      album: albumName,
      // TODO: add album art
      // artwork: [],
    });

    navigator.mediaSession.setActionHandler('play', () => {
      setWasPlaying(true);
      playVideo();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      alert('pause');
      setWasPlaying(false);
      pauseVideo();
    });

    navigator.mediaSession.setActionHandler('seekbackward', () => {
      let newTime = currentTime - 10;
      if (newTime < 0) newTime = 0;

      seekTo(newTime, true);
      setActualCurrentTime(newTime);
      setLastRecordedCurrentTime(newTime);
      setTimeLastUpdated(new Date().getTime());
    });

    navigator.mediaSession.setActionHandler('seekforward', () => {
      let newTime = currentTime + 10;
      if (newTime > duration) newTime = duration;

      seekTo(newTime, true);
      setActualCurrentTime(newTime);
      setLastRecordedCurrentTime(newTime);
      setTimeLastUpdated(new Date().getTime());
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      // TODO: Implement this
      // eslint-disable-next-line no-console
      console.log('Previous track');
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      // TODO: Implement this
      // eslint-disable-next-line no-console
      console.log('Next track');
    });

    return () => {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
    };
  }, [
    title,
    artists,
    albumName,
    playVideo,
    pauseVideo,
    seekTo,
    currentTime,
    duration,
  ]);

  // TODO: add ended state (with logic for last item in queue)
  const isPaused =
    (!wasPlaying && state === PlayerState.UNSTARTED) ||
    state === PlayerState.PAUSED ||
    state === PlayerState.ENDED ||
    (!wasPlaying && state === PlayerState.BUFFERING) ||
    state === PlayerState.CUED;

  const slideUp = keyframes`
    from {
      transform: translateY(100%);
    }

    to {
      transform: translateY(0);
    }
  `;

  const [overflowActive, setOverflowActive] = useState(false);

  const overflowingText = useRef<HTMLSpanElement | null>(null);

  const checkOverflow = (textContainer: HTMLSpanElement | null): boolean => {
    if (textContainer)
      return (
        textContainer.offsetHeight < textContainer.scrollHeight ||
        textContainer.offsetWidth < textContainer.scrollWidth
      );
    return false;
  };

  useEffect(() => {
    if (checkOverflow(overflowingText.current)) {
      setOverflowActive(true);
      return;
    }

    setOverflowActive(false);
    // add youtubeId to dependency array to recheck overflow when video changes
  }, [overflowActive, youtubeId]);

  const artistsComponent = (
    <>
      {artists.length !== 0
        ? artists.map((artist, idx) => (
            // eslint-disable-next-line react/jsx-indent
            <Typography
              component='span'
              key={artist.name}
              sx={{ fontSize: 'inherit' }}
            >
              <Link
                href={artist.link}
                sx={{
                  color: 'text.secondary',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                {artist.name}
              </Link>
              {
                // Add a comma after each artist except the last one
                idx !== artists.length - 1 && ', '
              }
            </Typography>
          ))
        : 'Unknown Composer'}
    </>
  );

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        boxShadow: ({ shadows }) => shadows[6],
        px: 2,
        py: 1.5,
        borderTopWidth: 1,
        borderTopStyle: 'solid',
        borderTopColor: (t) => alpha(t.palette.divider, 0.05),
        borderRadius: 0,
        zIndex: 1,
        // animate the player on render
        animation: `${slideUp} 0.3s ease`,
      }}
    >
      <Stack
        direction='row'
        spacing={1}
        sx={{
          mt: -1,
          mb: {
            xs: 0,
            md: 0.5,
          },
        }}
      >
        <Box
          sx={{
            display: {
              xs: 'none',
              md: 'flex',
            },
            alignItems: 'center',
            width: 40,
            fontSize: '0.875rem',
            color: 'text.secondary',
          }}
        >
          {formatSeconds(actualCurrentTime)}
        </Box>
        <StyledSlider
          aria-label='time-indicator'
          size='small'
          value={actualCurrentTime}
          min={0}
          step={1}
          max={duration}
          onChange={(_, value) => {
            seekTo(value as number, true);
            setActualCurrentTime(value as number);
            setLastRecordedCurrentTime(value as number);
            setTimeLastUpdated(new Date().getTime());
          }}
          sx={{
            ml: {
              xs: '0!important',
              md: '8px!important',
            },
          }}
        />
        <Box
          sx={{
            display: {
              xs: 'none',
              md: 'flex',
            },
            alignItems: 'center',
            justifyContent: 'flex-end',
            width: 40,
            fontSize: '0.875rem',
            color: 'text.secondary',
            textAlign: 'right',
          }}
        >
          {formatSeconds(
            duration - actualCurrentTime > 0 ? duration - actualCurrentTime : 0
          )}
        </Box>
      </Stack>
      <Grid container spacing={2}>
        <Grid item xs>
          <Stack direction='row' spacing={2}>
            <Box
              className='default-bg'
              sx={{
                width: 42,
                height: 42,
                minWidth: 42,
                minHeight: 42,
                borderRadius: 1,
              }}
            >
              {albumUrl && (
                <Image
                  src={albumUrl}
                  alt='Album art'
                  width={42}
                  height={42}
                  style={{
                    borderRadius: 4,
                    width: 42,
                    height: 42,
                    objectFit: 'cover',
                    userSelect: 'none',
                    // hide alt text on firefox
                    color: 'transparent',
                  }}
                  unoptimized
                />
              )}
            </Box>
            <Box sx={{ width: '100%', position: 'relative' }}>
              <Typography
                sx={{
                  fontWeight: 'medium',
                  userSelect: 'none',
                  color: !!youtubeId ? 'text.primary' : 'text.secondary',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                {title}
              </Typography>
              <Typography
                sx={{
                  position: 'absolute',
                  fontSize: 14,
                  color: 'text.secondary',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  visibility: overflowActive ? 'hidden' : 'visible',
                  opacity: overflowActive ? 0 : 1,
                  width: {
                    // half screen width - player padding - controls - album art - spacing
                    xs: 'calc(100vw - 32px - 140px - 42px - 16px)',
                    // full screen width - player padding - half controls - album art - spacing - extra
                    md: 'calc(50vw - 32px - 114px - 42px - 16px)',
                    // minus extra on large screens
                    lg: 'calc(50vw - 32px - 114px - 42px - 16px - 50px)',
                    xl: 'calc(50vw - 32px - 114px - 42px - 16px - 100px)',
                  },
                }}
                ref={overflowingText}
              >
                {artistsComponent}
              </Typography>
              {overflowActive && (
                <Box
                  sx={{
                    maxWidth: {
                      lg: 'calc(50vw - 32px - 114px - 42px - 16px - 50px)',
                      xl: 'calc(50vw - 32px - 114px - 42px - 16px - 100px)',
                    },
                  }}
                >
                  <Marquee
                    speed={10}
                    delay={2}
                    pauseOnHover
                    gradient
                    gradientWidth={8}
                    gradientColor={
                      theme.palette.mode === 'dark'
                        ? [22, 26, 34]
                        : [255, 255, 255]
                    }
                  >
                    <Typography
                      sx={{
                        fontSize: 14,
                        color: 'text.secondary',
                        userSelect: 'none',
                        pr: 8,
                      }}
                    >
                      {artistsComponent}
                    </Typography>
                  </Marquee>
                </Box>
              )}
            </Box>
          </Stack>
        </Grid>
        <Grid item xs='auto'>
          <Stack
            direction='row'
            spacing={1}
            sx={{
              mr: {
                xs: -2.5,
                md: 0,
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <IconButton
                size='small'
                onClick={() => setIsShuffleOn((prev) => !prev)}
                aria-label='shuffle'
                sx={{
                  display: {
                    xs: 'none',
                    md: 'flex',
                  },
                  fontSize: 24,
                  color: isShuffleOn ? 'primary.main' : 'text.secondary',
                }}
              >
                <MdShuffle />
              </IconButton>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <IconButton
                size='small'
                aria-label='previous'
                sx={{ fontSize: 28 }}
              >
                <MdSkipPrevious />
              </IconButton>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <IconButton
                size='small'
                onClick={() => {
                  if (isPaused) {
                    setWasPlaying(true);
                    playVideo();
                  } else {
                    setWasPlaying(false);
                    pauseVideo();
                  }
                }}
                aria-label={isPaused ? 'play' : 'pause'}
                sx={{ m: '-8px !important', fontSize: 42 }}
              >
                {isPaused ? <MdPlayArrow /> : <MdPause />}
              </IconButton>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <IconButton size='small' aria-label='next' sx={{ fontSize: 28 }}>
                <MdSkipNext />
              </IconButton>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <IconButton
                size='small'
                onClick={() =>
                  setRepeatMode((prev) =>
                    prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none'
                  )
                }
                aria-label={
                  repeatMode === 'none'
                    ? 'repeat all'
                    : repeatMode === 'all'
                    ? 'repeat one'
                    : 'disable repeat'
                }
                sx={{
                  display: {
                    xs: 'none',
                    md: 'flex',
                  },
                  fontSize: 24,
                  color:
                    repeatMode !== 'none' ? 'primary.main' : 'text.secondary',
                }}
              >
                {repeatMode === 'one' ? <MdRepeatOne /> : <MdRepeat />}
              </IconButton>
            </Box>
          </Stack>
        </Grid>
        <Grid
          item
          xs
          sx={{
            display: {
              xs: 'none',
              md: 'flex',
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            <IconButton
              size='small'
              onClick={() => {
                const newMuted = !isMuted;
                if (newMuted) {
                  setClientVolume(0);
                } else {
                  setClientVolume(unmutedVolume);
                }
                setIsMuted(newMuted);
                localStorage.setItem('isMuted', (!isMuted).toString());
              }}
              aria-label={isMuted ? 'unmute' : 'mute'}
              sx={{ mr: 0.5, color: 'text.secondary', fontSize: 24 }}
              disableRipple
            >
              {isMuted ? (
                <MdVolumeOff />
              ) : volume === 0 ? (
                <MdVolumeMute />
              ) : volume < 50 ? (
                <MdVolumeDown />
              ) : (
                <MdVolumeUp />
              )}
            </IconButton>
            <StyledSlider
              aria-label='volume'
              size='small'
              value={clientVolume}
              min={0}
              max={100}
              step={0.1}
              onChange={(_, value) => {
                setIsMuted(false);
                setClientVolume(value as number);
                setUnmutedVolume(value as number);
                localStorage.setItem('volume', value.toString());
              }}
              sx={{
                maxWidth: 120,
                '& .MuiSlider-thumb': {
                  '&::after': {
                    display: 'none',
                  },
                },
              }}
            />
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default MusicPlayer;
