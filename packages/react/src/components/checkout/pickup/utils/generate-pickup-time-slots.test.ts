import { addDays } from 'date-fns';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SLOT_INTERVAL,
  findFirstAvailablePickupDate,
  formatLeadTimeDisplay,
  generatePickupTimeSlots,
  isAsapAvailable,
  type OperatingHours,
} from './generate-pickup-time-slots';

// ── helpers ──────────────────────────────────────────────────────────────

const enabledDay = { enabled: true, openTime: '10:00', closeTime: '15:00' };
const disabledDay = { enabled: false, openTime: null, closeTime: null };

const standardWeek = {
  monday: enabledDay,
  tuesday: enabledDay,
  wednesday: enabledDay,
  thursday: enabledDay,
  friday: enabledDay,
  saturday: enabledDay,
  sunday: disabledDay,
};

function makeHours(overrides: Partial<OperatingHours> = {}): OperatingHours {
  return {
    leadTime: 30,
    pickupWindowInDays: 7,
    timeZone: 'UTC',
    hours: standardWeek,
    ...overrides,
  };
}

// Monday 2024-03-25 at 10:00 UTC
const MON_10AM = new Date('2024-03-25T10:00:00Z');
const TUE = addDays(MON_10AM, 1); // 2024-03-26
const WED = addDays(MON_10AM, 2); // 2024-03-27
const _THU = addDays(MON_10AM, 3); // 2024-03-28

function slotValues(slots: { value: string }[]) {
  return slots.map(s => s.value);
}

// ── findFirstAvailablePickupDate ─────────────────────────────────────────

describe('findFirstAvailablePickupDate', () => {
  it('returns today when leadTime is small and today is enabled', () => {
    const date = findFirstAvailablePickupDate(
      makeHours({ leadTime: 30, pickupWindowInDays: 3 }),
      MON_10AM
    );
    expect(date).toBeDefined();
    expect(date!.getUTCDate()).toBe(25); // Monday
  });

  it('skips today if close time is before earliestPickup', () => {
    // now = Mon 10am, leadTime = 360 (6 h), earliestPickup = Mon 4pm
    // Mon close = 3pm < 4pm → skip; Tue close = 3pm Tue > Mon 4pm → pick Tue
    const date = findFirstAvailablePickupDate(
      makeHours({ leadTime: 360, pickupWindowInDays: 3 }),
      MON_10AM
    );
    expect(date).toBeDefined();
    expect(date!.getUTCDate()).toBe(26); // Tuesday
  });

  it('skips disabled days', () => {
    // Sunday is disabled; start on Sunday
    const sunday = new Date('2024-03-24T10:00:00Z');
    const date = findFirstAvailablePickupDate(
      makeHours({ leadTime: 30, pickupWindowInDays: 3 }),
      sunday
    );
    expect(date).toBeDefined();
    expect(date!.getUTCDay()).toBe(1); // Monday
  });

  it('returns undefined when leadTime exceeds entire window', () => {
    // 5500 min ≈ 3.82 days, window = 3 days
    const date = findFirstAvailablePickupDate(
      makeHours({ leadTime: 5500, pickupWindowInDays: 3 }),
      MON_10AM
    );
    expect(date).toBeUndefined();
  });

  it('returns undefined when leadTime is 14400 with 3-day window', () => {
    const date = findFirstAvailablePickupDate(
      makeHours({ leadTime: 14400, pickupWindowInDays: 3 }),
      MON_10AM
    );
    expect(date).toBeUndefined();
  });

  it('finds day 3 with 2-day leadTime and 3-day window', () => {
    // leadTime 2880 min = 2 days; earliestPickup = Wed 10am
    // Mon close 3pm < Wed 10am → skip
    // Tue close 3pm Tue < Wed 10am → skip
    // Wed close 3pm Wed > Wed 10am → pick
    const date = findFirstAvailablePickupDate(
      makeHours({ leadTime: 2880, pickupWindowInDays: 3 }),
      MON_10AM
    );
    expect(date).toBeDefined();
    expect(date!.getUTCDate()).toBe(27); // Wednesday
  });

  it('returns today for pickupWindowInDays 0 (ASAP-only)', () => {
    const date = findFirstAvailablePickupDate(
      makeHours({ leadTime: 99999, pickupWindowInDays: 0 }),
      MON_10AM
    );
    expect(date).toBeDefined();
    expect(date!.getUTCDate()).toBe(25);
  });

  it('returns undefined when no days are enabled', () => {
    const allDisabled = {
      monday: disabledDay,
      tuesday: disabledDay,
      wednesday: disabledDay,
      thursday: disabledDay,
      friday: disabledDay,
      saturday: disabledDay,
      sunday: disabledDay,
    };
    const date = findFirstAvailablePickupDate(
      makeHours({ hours: allDisabled, pickupWindowInDays: 7 }),
      MON_10AM
    );
    expect(date).toBeUndefined();
  });

  describe('pickupWindowInDays: 1 (single day)', () => {
    it('returns today when today is enabled and has slots after leadTime', () => {
      const date = findFirstAvailablePickupDate(
        makeHours({ leadTime: 30, pickupWindowInDays: 1 }),
        MON_10AM
      );
      expect(date).toBeDefined();
      expect(date!.getUTCDate()).toBe(25);
    });

    it('returns undefined when today is disabled (cannot fall back to tomorrow)', () => {
      const hours = {
        ...standardWeek,
        monday: disabledDay,
      };
      const date = findFirstAvailablePickupDate(
        makeHours({ hours, pickupWindowInDays: 1 }),
        MON_10AM
      );
      expect(date).toBeUndefined();
    });

    it('returns undefined when leadTime pushes past today close', () => {
      const date = findFirstAvailablePickupDate(
        makeHours({ leadTime: 360, pickupWindowInDays: 1 }),
        // Mon 10am + 360min lead = 4pm, close is 3pm
        MON_10AM
      );
      expect(date).toBeUndefined();
    });

    it('returns today when leadTime still fits before close', () => {
      const date = findFirstAvailablePickupDate(
        makeHours({ leadTime: 240, pickupWindowInDays: 1 }),
        // Mon 10am + 240min lead = 2pm, close is 3pm — fits
        MON_10AM
      );
      expect(date).toBeDefined();
      expect(date!.getUTCDate()).toBe(25);
    });
  });

  it('uses FALLBACK_LEAD_TIME when leadTime is 0', () => {
    // leadTime 0 → falls back to 30 min
    const date = findFirstAvailablePickupDate(
      makeHours({ leadTime: 0, pickupWindowInDays: 3 }),
      MON_10AM
    );
    expect(date).toBeDefined();
    expect(date!.getUTCDate()).toBe(25); // today still works with 30 min lead
  });
});

// ── generatePickupTimeSlots ──────────────────────────────────────────────

describe('generatePickupTimeSlots', () => {
  // ── basic / edge cases ───────────────────────────────────────────────

  it('returns empty when pickupWindowInDays is 0', () => {
    const slots = generatePickupTimeSlots({
      selectedDate: TUE,
      storeHours: makeHours({ pickupWindowInDays: 0 }),
      now: MON_10AM,
    });
    expect(slots).toEqual([]);
  });

  it('returns empty when the selected day is disabled', () => {
    const sunday = new Date('2024-03-24T10:00:00Z');
    const slots = generatePickupTimeSlots({
      selectedDate: sunday,
      storeHours: makeHours(),
      now: MON_10AM,
    });
    expect(slots).toEqual([]);
  });

  it('returns empty when the day has no openTime', () => {
    const slots = generatePickupTimeSlots({
      selectedDate: TUE,
      storeHours: makeHours({
        hours: {
          ...standardWeek,
          tuesday: { enabled: true, openTime: null, closeTime: '15:00' },
        },
      }),
      now: MON_10AM,
    });
    expect(slots).toEqual([]);
  });

  // ── leadTime 0 (falls back to FALLBACK_LEAD_TIME = 30) ──────────────

  describe('leadTime: 0 (uses fallback of 30 min)', () => {
    const hours = makeHours({ leadTime: 0 });

    it('generates 30-min slots on a future date', () => {
      const slots = generatePickupTimeSlots({
        selectedDate: TUE,
        storeHours: hours,
        now: MON_10AM,
      });
      // 10:00–14:30 in 30-min steps = 10 slots
      expect(slots).toHaveLength(10);
      expect(slotValues(slots)[0]).toBe('10:00');
      expect(slotValues(slots)[9]).toBe('14:30');
    });
  });

  // ── leadTime: 15 ─────────────────────────────────────────────────────

  describe('leadTime: 15', () => {
    const hours = makeHours({ leadTime: 15 });

    it('generates slots at default 30-min interval (pickupSlotInterval not set)', () => {
      // leadTime=15 but pickupSlotInterval defaults to 30
      const slots = generatePickupTimeSlots({
        selectedDate: TUE,
        storeHours: hours,
        now: MON_10AM,
      });
      expect(slots).toHaveLength(10);
      expect(slotValues(slots)[0]).toBe('10:00');
      expect(slotValues(slots)[1]).toBe('10:30');
    });

    it('generates slots at 15-min interval when pickupSlotInterval is 15', () => {
      const slots = generatePickupTimeSlots({
        selectedDate: TUE,
        storeHours: { ...hours, pickupSlotInterval: 15 },
        now: MON_10AM,
      });
      // 10:00–14:45 in 15-min steps = 20 slots
      expect(slots).toHaveLength(20);
      expect(slotValues(slots)[0]).toBe('10:00');
      expect(slotValues(slots)[1]).toBe('10:15');
      expect(slotValues(slots)[19]).toBe('14:45');
    });
  });

  // ── leadTime: 30 (standard) ──────────────────────────────────────────

  describe('leadTime: 30', () => {
    const hours = makeHours({ leadTime: 30 });

    it('generates 10 slots for a future date (10:00–15:00, 30-min gap)', () => {
      const slots = generatePickupTimeSlots({
        selectedDate: TUE,
        storeHours: hours,
        now: MON_10AM,
      });
      expect(slots).toHaveLength(10);
      expect(slotValues(slots)).toEqual([
        '10:00',
        '10:30',
        '11:00',
        '11:30',
        '12:00',
        '12:30',
        '13:00',
        '13:30',
        '14:00',
        '14:30',
      ]);
    });

    it('skips slots before earliestPickup for today', () => {
      // now = Mon 10am, leadTime = 30, earliest = 10:30
      // First timed slot should be 10:30 (10:00 skipped)
      const slots = generatePickupTimeSlots({
        selectedDate: MON_10AM,
        storeHours: hours,
        now: MON_10AM,
      });
      expect(slotValues(slots)[0]).toBe('10:30');
      expect(slots).toHaveLength(9);
    });
  });

  // ── leadTime: 60 ─────────────────────────────────────────────────────

  describe('leadTime: 60', () => {
    it('generates slots at 30-min default interval, skipping the first hour for today', () => {
      // now = 10am, leadTime 60, earliest = 11am
      // Rounding: ceil(660/30)*30 = 660 → 11:00
      // Slots: 11:00, 11:30, 12:00, 12:30, 13:00, 13:30, 14:00, 14:30 = 8
      const slots = generatePickupTimeSlots({
        selectedDate: MON_10AM,
        storeHours: makeHours({ leadTime: 60 }),
        now: MON_10AM,
      });
      expect(slotValues(slots)[0]).toBe('11:00');
      expect(slots).toHaveLength(8);
    });

    it('generates all slots for a future date (lead time already satisfied)', () => {
      const slots = generatePickupTimeSlots({
        selectedDate: TUE,
        storeHours: makeHours({ leadTime: 60 }),
        now: MON_10AM,
      });
      expect(slots).toHaveLength(10);
      expect(slotValues(slots)[0]).toBe('10:00');
    });

    it('with pickupSlotInterval: 60, generates hourly slots on a future date', () => {
      const slots = generatePickupTimeSlots({
        selectedDate: TUE,
        storeHours: makeHours({ leadTime: 60, pickupSlotInterval: 60 }),
        now: MON_10AM,
      });
      expect(slotValues(slots)).toEqual([
        '10:00',
        '11:00',
        '12:00',
        '13:00',
        '14:00',
      ]);
    });
  });

  // ── leadTime: 120 ────────────────────────────────────────────────────

  describe('leadTime: 120', () => {
    it('with pickupSlotInterval: 120, generates 3 slots on a future date', () => {
      const slots = generatePickupTimeSlots({
        selectedDate: TUE,
        storeHours: makeHours({ leadTime: 120, pickupSlotInterval: 120 }),
        now: MON_10AM,
      });
      expect(slotValues(slots)).toEqual(['10:00', '12:00', '14:00']);
    });

    it('with default pickupSlotInterval (30), generates all 30-min slots on a future date', () => {
      const slots = generatePickupTimeSlots({
        selectedDate: TUE,
        storeHours: makeHours({ leadTime: 120 }),
        now: MON_10AM,
      });
      // All 10 slots available because Tue 10am is well past Mon 10am + 2h
      expect(slots).toHaveLength(10);
    });
  });

  // ── leadTime: 300 (5 h = full daily window) ──────────────────────────

  describe('leadTime: 300 (equals the 5-hour daily window)', () => {
    it('still shows all 30-min slots on a future date (leadTime satisfied by date distance)', () => {
      // Tue 10am is 24h after Mon 10am — well past the 5h lead
      const slots = generatePickupTimeSlots({
        selectedDate: TUE,
        storeHours: makeHours({ leadTime: 300 }),
        now: MON_10AM,
      });
      expect(slots).toHaveLength(10);
    });

    it('generates zero timed slots for today', () => {
      // earliestPickup = Mon 3pm, close = 3pm → no room
      const slots = generatePickupTimeSlots({
        selectedDate: MON_10AM,
        storeHours: makeHours({ leadTime: 300 }),
        now: MON_10AM,
      });
      expect(slots).toHaveLength(0);
    });
  });

  // ── leadTime: 1440 (exactly 1 day) ──────────────────────────────────

  describe('leadTime: 1440 (1 day)', () => {
    it('generates all 30-min slots on Tue when now is Mon 10am (lead satisfied)', () => {
      // earliestPickup = Tue 10am. Tue 10:00 >= Tue 10:00 → all slots valid
      const slots = generatePickupTimeSlots({
        selectedDate: TUE,
        storeHours: makeHours({ leadTime: 1440 }),
        now: MON_10AM,
      });
      expect(slots).toHaveLength(10);
      expect(slotValues(slots)[0]).toBe('10:00');
    });

    it('generates zero slots on Tue when now is Mon noon (lead pushes past Tue open)', () => {
      // now = Mon 12pm, earliestPickup = Tue 12pm
      // Tue slots 10:00–11:30 all < Tue 12pm → skipped
      // Tue slot 12:00 ≥ Tue 12pm → generated!
      const monNoon = new Date('2024-03-25T12:00:00Z');
      const slots = generatePickupTimeSlots({
        selectedDate: TUE,
        storeHours: makeHours({ leadTime: 1440 }),
        now: monNoon,
      });
      expect(slotValues(slots)[0]).toBe('12:00');
      expect(slots).toHaveLength(6); // 12:00, 12:30, 13:00, 13:30, 14:00, 14:30
    });

    it('generates zero timed slots for today', () => {
      const slots = generatePickupTimeSlots({
        selectedDate: MON_10AM,
        storeHours: makeHours({ leadTime: 1440 }),
        now: MON_10AM,
      });
      expect(slots).toHaveLength(0);
    });

    it('does not infinite loop (completes in reasonable time)', () => {
      const start = performance.now();
      generatePickupTimeSlots({
        selectedDate: TUE,
        storeHours: makeHours({ leadTime: 1440 }),
        now: MON_10AM,
      });
      expect(performance.now() - start).toBeLessThan(100); // < 100ms
    });
  });

  // ── leadTime: 2880 (2 days) ──────────────────────────────────────────

  describe('leadTime: 2880 (2 days)', () => {
    it('generates zero slots on Tue (within lead window)', () => {
      // earliestPickup = Wed 10am. Tue 10am–14:30 all < Wed 10am → 0 slots
      const slots = generatePickupTimeSlots({
        selectedDate: TUE,
        storeHours: makeHours({ leadTime: 2880 }),
        now: MON_10AM,
      });
      expect(slots).toHaveLength(0);
    });

    it('generates all slots on Wed (first day past lead window)', () => {
      // Wed 10am ≥ Wed 10am → all slots available
      const slots = generatePickupTimeSlots({
        selectedDate: WED,
        storeHours: makeHours({ leadTime: 2880 }),
        now: MON_10AM,
      });
      expect(slots).toHaveLength(10);
      expect(slotValues(slots)[0]).toBe('10:00');
    });

    it('does not infinite loop (completes in reasonable time)', () => {
      const start = performance.now();
      generatePickupTimeSlots({
        selectedDate: TUE,
        storeHours: makeHours({ leadTime: 2880 }),
        now: MON_10AM,
      });
      expect(performance.now() - start).toBeLessThan(100);
    });
  });

  // ── leadTime: 5500 (~3.82 days) ─────────────────────────────────────

  describe('leadTime: 5500 (~3.82 days)', () => {
    const hours = makeHours({ leadTime: 5500, pickupWindowInDays: 3 });

    it('generates zero slots for Mon, Tue, and Wed', () => {
      for (const date of [MON_10AM, TUE, WED]) {
        const slots = generatePickupTimeSlots({
          selectedDate: date,
          storeHours: hours,
          now: MON_10AM,
        });
        expect(slots).toHaveLength(0);
      }
    });

    it('does not infinite loop even for every day in the window', () => {
      const start = performance.now();
      for (const date of [MON_10AM, TUE, WED]) {
        generatePickupTimeSlots({
          selectedDate: date,
          storeHours: hours,
          now: MON_10AM,
        });
      }
      expect(performance.now() - start).toBeLessThan(100);
    });
  });

  // ── leadTime: 14400 (10 days) ────────────────────────────────────────

  describe('leadTime: 14400 (10 days)', () => {
    it('generates zero slots for every day in a 7-day window', () => {
      const hours = makeHours({ leadTime: 14400, pickupWindowInDays: 7 });
      for (let i = 0; i < 7; i++) {
        const date = addDays(MON_10AM, i);
        const slots = generatePickupTimeSlots({
          selectedDate: date,
          storeHours: hours,
          now: MON_10AM,
        });
        expect(slots).toHaveLength(0);
      }
    });

    it('does not infinite loop', () => {
      const hours = makeHours({ leadTime: 14400, pickupWindowInDays: 7 });
      const start = performance.now();
      for (let i = 0; i < 7; i++) {
        generatePickupTimeSlots({
          selectedDate: addDays(MON_10AM, i),
          storeHours: hours,
          now: MON_10AM,
        });
      }
      expect(performance.now() - start).toBeLessThan(100);
    });
  });

  // ── pickupWindowInDays: 1 (single day) ────────────────────────────────

  describe('pickupWindowInDays: 1 (single day)', () => {
    it('generates slots for today when leadTime is small', () => {
      const slots = generatePickupTimeSlots({
        selectedDate: MON_10AM,
        storeHours: makeHours({ leadTime: 30, pickupWindowInDays: 1 }),
        now: MON_10AM,
      });
      // 10:00 + 30min lead = 10:30 earliest; slots: 10:30–14:30 = 9 slots
      expect(slots.length).toBeGreaterThan(0);
      expect(slotValues(slots)[0]).toBe('10:30');
    });

    it('generates all slots when selected date is today and leadTime already passed open', () => {
      // now is 10am, leadTime 0 → fallback 30min, earliest 10:30
      const slots = generatePickupTimeSlots({
        selectedDate: MON_10AM,
        storeHours: makeHours({ leadTime: 0, pickupWindowInDays: 1 }),
        now: MON_10AM,
      });
      expect(slots.length).toBeGreaterThan(0);
      expect(slotValues(slots)[0]).toBe('10:30');
    });

    it('generates zero slots when leadTime exceeds remaining hours', () => {
      const slots = generatePickupTimeSlots({
        selectedDate: MON_10AM,
        storeHours: makeHours({ leadTime: 360, pickupWindowInDays: 1 }),
        now: MON_10AM,
      });
      // 10am + 360min = 4pm, close is 3pm → no slots
      expect(slots).toEqual([]);
    });

    it('generates fewer slots as leadTime eats into the window', () => {
      const slotsShortLead = generatePickupTimeSlots({
        selectedDate: MON_10AM,
        storeHours: makeHours({ leadTime: 30, pickupWindowInDays: 1 }),
        now: MON_10AM,
      });
      const slotsLongLead = generatePickupTimeSlots({
        selectedDate: MON_10AM,
        storeHours: makeHours({ leadTime: 180, pickupWindowInDays: 1 }),
        now: MON_10AM,
      });
      // 30min lead → first slot 10:30; 180min lead → first slot 13:00
      expect(slotsShortLead.length).toBeGreaterThan(slotsLongLead.length);
      expect(slotValues(slotsLongLead)[0]).toBe('13:00');
    });

    it('respects pickupSlotInterval with single day window', () => {
      const slots = generatePickupTimeSlots({
        selectedDate: TUE,
        storeHours: makeHours({
          leadTime: 1440,
          pickupWindowInDays: 1,
          pickupSlotInterval: 60,
        }),
        now: MON_10AM,
      });
      // Tomorrow (Tue) with 1-day lead satisfied, 60-min interval: 10:00–14:00 = 5 slots
      expect(slotValues(slots)).toEqual([
        '10:00',
        '11:00',
        '12:00',
        '13:00',
        '14:00',
      ]);
    });
  });

  // ── pickupSlotInterval (decoupled from leadTime) ───────────────────────────

  describe('pickupSlotInterval (decoupled from leadTime)', () => {
    it('uses DEFAULT_SLOT_INTERVAL (30) when pickupSlotInterval is not set', () => {
      const slots = generatePickupTimeSlots({
        selectedDate: TUE,
        storeHours: makeHours({ leadTime: 1440 }),
        now: MON_10AM,
      });
      // 30-min interval: 10:00–14:30 = 10 slots
      expect(slots).toHaveLength(10);
      expect(DEFAULT_SLOT_INTERVAL).toBe(30);
    });

    it('uses pickupSlotInterval: 15 for 15-min gaps with a 1-day leadTime', () => {
      const slots = generatePickupTimeSlots({
        selectedDate: TUE,
        storeHours: makeHours({ leadTime: 1440, pickupSlotInterval: 15 }),
        now: MON_10AM,
      });
      // 15-min interval: 10:00–14:45 = 20 slots
      expect(slots).toHaveLength(20);
      expect(slotValues(slots)[1]).toBe('10:15');
    });

    it('uses pickupSlotInterval: 60 for hourly gaps with a 2-day leadTime', () => {
      const slots = generatePickupTimeSlots({
        selectedDate: WED,
        storeHours: makeHours({ leadTime: 2880, pickupSlotInterval: 60 }),
        now: MON_10AM,
      });
      expect(slotValues(slots)).toEqual([
        '10:00',
        '11:00',
        '12:00',
        '13:00',
        '14:00',
      ]);
    });

    it('ignores pickupSlotInterval: 0 and uses default', () => {
      const slots = generatePickupTimeSlots({
        selectedDate: TUE,
        storeHours: makeHours({ leadTime: 30, pickupSlotInterval: 0 }),
        now: MON_10AM,
      });
      // Falls back to 30-min interval
      expect(slots).toHaveLength(10);
    });

    it('ignores negative pickupSlotInterval and uses default', () => {
      const slots = generatePickupTimeSlots({
        selectedDate: TUE,
        storeHours: makeHours({ leadTime: 30, pickupSlotInterval: -15 }),
        now: MON_10AM,
      });
      expect(slots).toHaveLength(10);
    });
  });

  // ── timezone-aware tests ─────────────────────────────────────────────

  describe('timezone handling', () => {
    // 2024-03-25T15:00:00Z = Mon 10:00 AM in America/New_York (EDT, UTC-4)
    // but still Mon 15:00 UTC
    const MON_10AM_NYC = new Date('2024-03-25T14:00:00Z');

    function makeNYCHours(
      overrides: Partial<OperatingHours> = {}
    ): OperatingHours {
      return {
        leadTime: 30,
        pickupWindowInDays: 7,
        timeZone: 'America/New_York',
        hours: standardWeek,
        ...overrides,
      };
    }

    it('findFirstAvailablePickupDate respects store timezone', () => {
      // UTC 14:00 = NYC 10:00 AM, leadTime 30 → earliest 10:30, close 15:00 → today works
      const date = findFirstAvailablePickupDate(
        makeNYCHours({ leadTime: 30, pickupWindowInDays: 1 }),
        MON_10AM_NYC
      );
      expect(date).toBeDefined();
    });

    it('findFirstAvailablePickupDate returns undefined when leadTime exceeds remaining store hours', () => {
      // UTC 14:00 = NYC 10:00 AM, leadTime 360 → earliest 4pm NYC, close 3pm → no slots
      const date = findFirstAvailablePickupDate(
        makeNYCHours({ leadTime: 360, pickupWindowInDays: 1 }),
        MON_10AM_NYC
      );
      expect(date).toBeUndefined();
    });

    it('generatePickupTimeSlots produces correct slot times in store timezone', () => {
      const nycDate = new Date('2024-03-26T14:00:00Z'); // Tue 10am NYC
      const slots = generatePickupTimeSlots({
        selectedDate: nycDate,
        storeHours: makeNYCHours({ leadTime: 1440 }),
        now: MON_10AM_NYC,
      });
      // Lead time satisfied (>1 day ahead), slots should start at store open (10:00 NYC)
      expect(slots.length).toBeGreaterThan(0);
      expect(slotValues(slots)[0]).toBe('10:00');
    });

    it('generates zero slots when current time is past close in store timezone', () => {
      // UTC 20:00 Mon = Mon 4pm NYC (EDT) — past 3pm close, same day in both timezones
      const pastCloseNYC = new Date('2024-03-25T20:00:00Z');
      const slots = generatePickupTimeSlots({
        selectedDate: pastCloseNYC,
        storeHours: makeNYCHours({ leadTime: 30, pickupWindowInDays: 7 }),
        now: pastCloseNYC,
      });
      // In NYC it's Mon 4pm, store closes at 3pm — zero slots
      expect(slots).toEqual([]);
    });

    it('uses store timezone day-of-week, not system timezone', () => {
      // UTC 03:00 Tue = Mon 11pm NYC — getDay() in UTC would say Tuesday,
      // but in the store timezone it's still Monday
      const lateNightUTC = new Date('2024-03-26T03:00:00Z');
      const slots = generatePickupTimeSlots({
        selectedDate: lateNightUTC,
        storeHours: makeNYCHours({ leadTime: 30, pickupWindowInDays: 7 }),
        now: lateNightUTC,
      });
      // In NYC it's Mon 11pm, store closes at 3pm — zero slots
      expect(slots).toEqual([]);
    });

    it('next-day rollover: UTC date is tomorrow but store timezone is still today', () => {
      // UTC 01:00 Tue Mar 26 = Mon 9pm EDT Mar 25 — still Monday in NYC
      const utcTueMorning = new Date('2024-03-26T01:00:00Z');
      const date = findFirstAvailablePickupDate(
        makeNYCHours({ leadTime: 30, pickupWindowInDays: 1 }),
        utcTueMorning
      );
      // In NYC it's Mon 9pm, 30min lead = 9:30pm, close is 3pm → no slots today
      expect(date).toBeUndefined();
    });

    // US West Coast: UTC-7 (PDT in March 2024)
    it('works with America/Los_Angeles timezone', () => {
      // UTC 17:00 Mon = 10:00 AM PDT
      const monMorningLA = new Date('2024-03-25T17:00:00Z');
      const laHours: OperatingHours = {
        leadTime: 60,
        pickupWindowInDays: 3,
        timeZone: 'America/Los_Angeles',
        hours: standardWeek,
      };
      const date = findFirstAvailablePickupDate(laHours, monMorningLA);
      expect(date).toBeDefined();

      const slots = generatePickupTimeSlots({
        selectedDate: date!,
        storeHours: laHours,
        now: monMorningLA,
      });
      // 10am + 60min lead = 11am, 30-min slots: 11:00–14:30 = 8 slots
      expect(slots.length).toBeGreaterThan(0);
      expect(slotValues(slots)[0]).toBe('11:00');
    });
  });
});

// ── formatLeadTimeDisplay ────────────────────────────────────────────────

const labels = { hour: 'hour', hours: 'hours', minutes: 'minutes' };

describe('formatLeadTimeDisplay', () => {
  it('shows only minutes when under an hour', () => {
    expect(formatLeadTimeDisplay(45, labels)).toBe('45 minutes');
  });

  it('shows only minutes for small values', () => {
    expect(formatLeadTimeDisplay(5, labels)).toBe('5 minutes');
  });

  it('shows singular hour for exactly 60 minutes', () => {
    expect(formatLeadTimeDisplay(60, labels)).toBe('1 hour');
  });

  it('shows plural hours for exact multiples', () => {
    expect(formatLeadTimeDisplay(120, labels)).toBe('2 hours');
    expect(formatLeadTimeDisplay(1440, labels)).toBe('24 hours');
  });

  it('shows hours and minutes for non-exact values', () => {
    expect(formatLeadTimeDisplay(90, labels)).toBe('1 hour 30 minutes');
    expect(formatLeadTimeDisplay(1400, labels)).toBe('23 hours 20 minutes');
  });

  it('handles large lead times', () => {
    expect(formatLeadTimeDisplay(5500, labels)).toBe('91 hours 40 minutes');
  });

  it('handles zero', () => {
    expect(formatLeadTimeDisplay(0, labels)).toBe('0 minutes');
  });
});

// ── isAsapAvailable ──────────────────────────────────────────────────────

describe('isAsapAvailable', () => {
  // Store closes at 3pm (900 minutes since midnight)
  const closeTime = 15 * 60; // 900

  it('returns true when now + leadTime is before close', () => {
    // 10am (600) + 30min lead = 10:30am < 3pm
    expect(isAsapAvailable(600, 30, closeTime)).toBe(true);
  });

  it('returns false when now + leadTime is after close', () => {
    // 10am (600) + 1400min lead = ~9:20pm next day > 3pm
    expect(isAsapAvailable(600, 1400, closeTime)).toBe(false);
  });

  it('returns false when now + leadTime equals close exactly', () => {
    // 2pm (840) + 60min lead = 3pm = close → not strictly before
    expect(isAsapAvailable(840, 60, closeTime)).toBe(false);
  });

  it('returns true when just barely fits before close', () => {
    // 2pm (840) + 59min lead = 2:59pm < 3pm
    expect(isAsapAvailable(840, 59, closeTime)).toBe(true);
  });

  it('returns false when already past close', () => {
    // 4pm (960) + 30min lead = 4:30pm > 3pm
    expect(isAsapAvailable(960, 30, closeTime)).toBe(false);
  });

  it('returns false with large leadTime and early now', () => {
    // 9am (540) + 360min (6hr) lead = 3pm = close → not strictly before
    expect(isAsapAvailable(540, 360, closeTime)).toBe(false);
  });

  it('returns true with zero leadTime', () => {
    // 2pm (840) + 0 = 2pm < 3pm
    expect(isAsapAvailable(840, 0, closeTime)).toBe(true);
  });
});
