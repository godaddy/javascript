import { describe, expect, it, vi } from 'vitest';
import { buildPickupPayload } from './build-pickup-payload';

describe('buildPickupPayload', () => {
  describe('date + time (scheduled pickup)', () => {
    it('should produce the correct ISO string in the store timezone', () => {
      const result = buildPickupPayload({
        pickupDate: '2026-03-26',
        pickupTime: '13:00',
        pickupLocationId: 'loc-1',
        timezone: 'America/New_York',
      });

      // March 26 1:00 PM EDT = 2026-03-26T13:00:00-04:00
      expect(result.fulfillmentStartAt).toBe('2026-03-26T13:00:00-04:00');
      expect(result.fulfillmentEndAt).toBe('2026-03-26T13:00:00-04:00');
      expect(result.fulfillmentLocationId).toBe('loc-1');
    });

    it('should handle a timezone far from the browser timezone', () => {
      const result = buildPickupPayload({
        pickupDate: '2026-03-26',
        pickupTime: '09:30',
        pickupLocationId: 'loc-2',
        timezone: 'Asia/Kolkata',
      });

      // March 26 9:30 AM IST = 2026-03-26T09:30:00+05:30
      expect(result.fulfillmentStartAt).toBe('2026-03-26T09:30:00+05:30');
      expect(result.fulfillmentEndAt).toBe('2026-03-26T09:30:00+05:30');
    });

    it('should handle UTC timezone', () => {
      const result = buildPickupPayload({
        pickupDate: '2026-07-15',
        pickupTime: '18:45',
        pickupLocationId: 'loc-3',
        timezone: 'UTC',
      });

      // XXX token outputs "Z" for UTC
      expect(result.fulfillmentStartAt).toBe('2026-07-15T18:45:00Z');
      expect(result.fulfillmentEndAt).toBe('2026-07-15T18:45:00Z');
    });

    it('should handle a Date object for pickupDate', () => {
      // Date object for March 26, 2026 (local fields are what matter)
      const dateObj = new Date(2026, 2, 26);

      const result = buildPickupPayload({
        pickupDate: dateObj,
        pickupTime: '14:00',
        pickupLocationId: 'loc-4',
        timezone: 'America/Chicago',
      });

      // March 26 2:00 PM CDT = 2026-03-26T14:00:00-05:00
      expect(result.fulfillmentStartAt).toBe('2026-03-26T14:00:00-05:00');
    });

    it('should default missing hours/minutes to 0', () => {
      const result = buildPickupPayload({
        pickupDate: '2026-06-01',
        pickupTime: ':',
        pickupLocationId: 'loc-5',
        timezone: 'America/Los_Angeles',
      });

      // Midnight PDT
      expect(result.fulfillmentStartAt).toBe('2026-06-01T00:00:00-07:00');
    });

    it('should handle DST boundary correctly', () => {
      // Nov 1 2026 — US falls back from EDT to EST
      const result = buildPickupPayload({
        pickupDate: '2026-11-02',
        pickupTime: '10:00',
        pickupLocationId: 'loc-6',
        timezone: 'America/New_York',
      });

      // After fall-back, EST = UTC-5
      expect(result.fulfillmentStartAt).toBe('2026-11-02T10:00:00-05:00');
    });
  });

  describe('date only (no time)', () => {
    it('should default to midnight in the store timezone', () => {
      const result = buildPickupPayload({
        pickupDate: '2026-04-10',
        pickupTime: null,
        pickupLocationId: 'loc-7',
        timezone: 'America/New_York',
      });

      expect(result.fulfillmentStartAt).toBe('2026-04-10T00:00:00-04:00');
    });
  });

  describe('ASAP', () => {
    it('should add lead time and use the store timezone', () => {
      const fakeNow = new Date('2026-03-26T17:00:00.000Z'); // 1 PM EDT
      vi.useFakeTimers({ now: fakeNow });

      const result = buildPickupPayload({
        pickupTime: 'ASAP',
        pickupLocationId: 'loc-8',
        leadTime: 30,
        timezone: 'America/New_York',
      });

      // 1:00 PM + 30 min = 1:30 PM EDT
      expect(result.fulfillmentStartAt).toBe('2026-03-26T13:30:00-04:00');

      vi.useRealTimers();
    });
  });

  describe('no date and no time (fallback)', () => {
    it('should use current time in the store timezone', () => {
      const fakeNow = new Date('2026-03-26T20:00:00.000Z'); // 4 PM EDT
      vi.useFakeTimers({ now: fakeNow });

      const result = buildPickupPayload({
        pickupLocationId: 'loc-9',
        timezone: 'America/New_York',
      });

      expect(result.fulfillmentStartAt).toBe('2026-03-26T16:00:00-04:00');

      vi.useRealTimers();
    });
  });

  describe('timezone defaults', () => {
    it('should fall back to UTC when timezone is null', () => {
      const result = buildPickupPayload({
        pickupDate: '2026-03-26',
        pickupTime: '13:00',
        pickupLocationId: 'loc-10',
        timezone: null,
      });

      expect(result.fulfillmentStartAt).toBe('2026-03-26T13:00:00Z');
    });
  });

  describe('fulfillmentLocationId', () => {
    it('should pass through the location id', () => {
      const result = buildPickupPayload({
        pickupDate: '2026-03-26',
        pickupTime: '13:00',
        pickupLocationId: 'my-store',
        timezone: 'UTC',
      });

      expect(result.fulfillmentLocationId).toBe('my-store');
    });

    it('should default to null when location id is not provided', () => {
      const result = buildPickupPayload({
        pickupDate: '2026-03-26',
        pickupTime: '13:00',
        timezone: 'UTC',
      });

      expect(result.fulfillmentLocationId).toBeNull();
    });
  });
});
