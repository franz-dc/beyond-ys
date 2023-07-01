export const formatReleaseDate = (dateStr: string) => {
  if (!dateStr) return 'Unknown release date';

  const date = new Date(dateStr);
  const year = date.getFullYear();

  // TODO: add month and day logic
  return year;
};
