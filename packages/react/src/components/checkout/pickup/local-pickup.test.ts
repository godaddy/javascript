import { describe, expect, it } from 'vitest';
import { formatTime } from './local-pickup';
import type { StoreHours } from '@/types';

/**
 * Helper function to determine if the date/time picker should be shown.
 * This mirrors the condition used in LocalPickupForm:
 * `storeHours && storeHours.pickupWindowInDays !== 0`
 */
function shouldShowDateTimePicker(storeHours: StoreHours | undefined | null): boolean {
  return Boolean(storeHours && storeHours.pickupWindowInDays !== 0);
}

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

describe('shouldShowDateTimePicker', () => {
  const baseStoreHours: StoreHours = {
    pickupWindowInDays: 7,
    leadTime: 30,
    timeZone: 'America/New_York',
    hours: {
      sunday: { enabled: false, openTime: null, closeTime: null },
      monday: { enabled: true, openTime: '09:00', closeTime: '18:00' },
      tuesday: { enabled: true, openTime: '09:00', closeTime: '18:00' },
      wednesday: { enabled: true, openTime: '09:00', closeTime: '18:00' },
      thursday: { enabled: true, openTime: '09:00', closeTime: '18:00' },
      friday: { enabled: true, openTime: '09:00', closeTime: '18:00' },
      saturday: { enabled: false, openTime: null, closeTime: null },
    },
  };

  describe('when storeHours is undefined (merchant has no operatingHours)', () => {
    it('should NOT show date/time picker', () => {
      expect(shouldShowDateTimePicker(undefined)).toBe(false);
    });
  });

  describe('when storeHours is null', () => {
    it('should NOT show date/time picker', () => {
      expect(shouldShowDateTimePicker(null)).toBe(false);
    });
  });

  describe('when storeHours exists but pickupWindowInDays is 0 (ASAP only)', () => {
    it('should NOT show date/time picker', () => {
      const storeHours: StoreHours = {
        ...baseStoreHours,
        pickupWindowInDays: 0,
      };
      expect(shouldShowDateTimePicker(storeHours)).toBe(false);
    });
  });

  describe('when storeHours exists and pickupWindowInDays > 0', () => {
    it('should show date/time picker with pickupWindowInDays = 1', () => {
      const storeHours: StoreHours = {
        ...baseStoreHours,
        pickupWindowInDays: 1,
      };
      expect(shouldShowDateTimePicker(storeHours)).toBe(true);
    });

    it('should show date/time picker with pickupWindowInDays = 7', () => {
      const storeHours: StoreHours = {
        ...baseStoreHours,
        pickupWindowInDays: 7,
      };
      expect(shouldShowDateTimePicker(storeHours)).toBe(true);
    });

    it('should show date/time picker with pickupWindowInDays = 30', () => {
      const storeHours: StoreHours = {
        ...baseStoreHours,
        pickupWindowInDays: 30,
      };
      expect(shouldShowDateTimePicker(storeHours)).toBe(true);
    });
  });

  describe('edge cases - the bug we fixed', () => {
    it('should NOT show picker when storeHours is undefined (fixes: undefined !== 0 was true)', () => {
      // Before the fix: `storeHours?.pickupWindowInDays !== 0` 
      // When storeHours is undefined, this evaluates to `undefined !== 0` which is TRUE (bug!)
      // After the fix: `storeHours && storeHours.pickupWindowInDays !== 0`
      // When storeHours is undefined, the first condition fails, so it returns FALSE (correct!)
      const result = shouldShowDateTimePicker(undefined);
      expect(result).toBe(false);
    });
  });
});
