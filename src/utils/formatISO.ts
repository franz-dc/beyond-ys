export const formatISO = (
  date: Date,
  precision: 'year' | 'month' | 'day' | 'minute' | 'second' | 'millisecond'
) => {
  const dateStr = date.toISOString();
  switch (precision) {
    case 'year':
      return dateStr.slice(0, 4);
    case 'month':
      return dateStr.slice(0, 7);
    case 'day':
      return dateStr.slice(0, 10);
    case 'minute':
      return dateStr.slice(0, 16);
    case 'second':
      return dateStr.slice(0, 19);
    case 'millisecond':
      return dateStr.slice(0, 23);
  }
};
