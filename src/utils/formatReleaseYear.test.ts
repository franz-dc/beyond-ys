import { formatReleaseYear } from './formatReleaseYear';

describe('formatReleaseYear', () => {
  it('should return "Unknown release year" if dateStr is empty', () => {
    expect(formatReleaseYear('')).toBe('Unknown release year');
  });
  it('should return "Unknown release year" if dateStr is not a valid date', () => {
    expect(formatReleaseYear('foo')).toBe('Unknown release year');
  });
});
