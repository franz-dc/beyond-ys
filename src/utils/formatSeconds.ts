export const formatSeconds = (seconds: number) => {
  if (seconds < 0) {
    return '0:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutesLeft = Math.floor((seconds - hours * 3600) / 60);
  const secondsLeft = Math.floor(seconds - hours * 3600 - minutesLeft * 60);

  return `${hours ? `${hours}:` : ''}${
    hours ? minutesLeft.toString().padStart(2, '0') : minutesLeft
  }:${secondsLeft.toString().padStart(2, '0')}`;
};
