import { describe, expect, it } from 'vitest';
import { formatTime } from './local-pickup';

describe('formatTime', () => {
  it('should format 24-hour time to 12-hour format without minutes', () => {
    expect(formatTime('09:00')).toBe('9am');
    expect(formatTime('17:00')).toBe('5pm');
    expect(formatTime('12:00')).toBe('12pm');
    expect(formatTime('00:00')).toBe('12am');
  });

  it('should format 24-hour time to 12-hour format with minutes', () => {
    expect(formatTime('09:30')).toBe('9:30am');
    expect(formatTime('17:15')).toBe('5:15pm');
    expect(formatTime('12:45')).toBe('12:45pm');
    expect(formatTime('00:30')).toBe('12:30am');
  });

  it('should return empty string for null or empty input', () => {
    expect(formatTime(null)).toBe('');
    expect(formatTime('')).toBe('');
  });

  it('should return as-is if already formatted with am/pm', () => {
    expect(formatTime('9:00 AM')).toBe('9:00 AM');
    expect(formatTime('5:30 pm')).toBe('5:30 pm');
    expect(formatTime('12 PM')).toBe('12 PM');
  });

  it('should handle edge cases', () => {
    expect(formatTime('01:00')).toBe('1am');
    expect(formatTime('13:00')).toBe('1pm');
    expect(formatTime('23:59')).toBe('11:59pm');
    expect(formatTime('9:')).toBe('9am'); // Empty minutes
    expect(formatTime('14:05')).toBe('2:05pm'); // Single digit minutes
  });
});
