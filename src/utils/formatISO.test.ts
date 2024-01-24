import { formatISO } from './formatISO';

describe('formatISO', () => {
  const date = new Date('2000-01-01T00:00:00.000Z');

  it('should return the year if precision is "year"', () => {
    expect(formatISO(date, 'year')).toBe('2000');
  });
  it('should return the year and month if precision is "month"', () => {
    expect(formatISO(date, 'month')).toBe('2000-01');
  });
  it('should return the year, month and day if precision is "day"', () => {
    expect(formatISO(date, 'day')).toBe('2000-01-01');
  });
  it('should return the year, month, day and minute if precision is "minute"', () => {
    expect(formatISO(date, 'minute')).toBe('2000-01-01T00:00');
  });
  it('should return the year, month, day, minute and second if precision is "second"', () => {
    expect(formatISO(date, 'second')).toBe('2000-01-01T00:00:00');
  });
  it('should return the year, month, day, minute, second and millisecond if precision is "millisecond"', () => {
    expect(formatISO(date, 'millisecond')).toBe('2000-01-01T00:00:00.000');
  });
});
