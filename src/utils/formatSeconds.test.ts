import { formatSeconds } from './formatSeconds';

describe('formatSeconds', () => {
  it('formats seconds', () => {
    expect(formatSeconds(0)).toBe('0:00');
    expect(formatSeconds(1)).toBe('0:01');
    expect(formatSeconds(59)).toBe('0:59');
    expect(formatSeconds(60)).toBe('1:00');
    expect(formatSeconds(61)).toBe('1:01');
    expect(formatSeconds(3599)).toBe('59:59');
    expect(formatSeconds(3600)).toBe('1:00:00');
    expect(formatSeconds(3601)).toBe('1:00:01');
    expect(formatSeconds(3661)).toBe('1:01:01');
  });
  it('returns 0:00 for negative numbers', () => {
    expect(formatSeconds(-1)).toBe('0:00');
    expect(formatSeconds(-60)).toBe('0:00');
    expect(formatSeconds(-3600)).toBe('0:00');
  });
});
