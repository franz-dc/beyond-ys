export const formatReleaseDate = (dateStr: string) => {
  if (!dateStr) return 'Unknown release date';

  const date = new Date(dateStr);
  const year = date.getFullYear();

  if (dateStr.length === 4) return year.toString();

  if (dateStr.length === 7) {
    const month = date.toLocaleString('default', { month: 'long' });
    return `${month} ${year}`;
  }

  if (dateStr.length === 10) {
    const month = date.toLocaleString('default', { month: 'long' });
    const day = date.getDate();
    return `${day} ${month} ${year}`;
  }

  return 'Unknown';
};
