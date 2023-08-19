export const formatReleaseYear = (dateStr: string) => {
  if (!dateStr) return 'Unknown release year';

  const date = new Date(dateStr);
  const year = date.getFullYear();

  if (dateStr.length >= 4) return year.toString();

  return 'Unknown';
};
