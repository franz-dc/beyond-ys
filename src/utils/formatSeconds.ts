export const formatSeconds = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutesLeft = Math.floor((seconds - hours * 3600) / 60);
  const secondsLeft = Math.floor(seconds - hours * 3600 - minutesLeft * 60);
  return `${hours ? `${hours}:` : ''}${minutesLeft}:${secondsLeft
    .toString()
    .padStart(2, '0')}`;
};
