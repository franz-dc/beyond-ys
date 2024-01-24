import { formatReleaseDate } from './formatReleaseDate';

describe('formatReleaseDate', () => {
  it('should return "Unknown release date" if dateStr is empty', () => {
    expect(formatReleaseDate('')).toBe('Unknown release date');
  });
  it('should return "Unknown release date" if dateStr is not a valid date', () => {
    expect(formatReleaseDate('foo')).toBe('Unknown release date');
  });
  it('should return the year if dateStr is a valid year', () => {
    expect(formatReleaseDate('2021')).toBe('2021');
  });
  // month and day are not tested due to the use of Date.toLocaleString
});
