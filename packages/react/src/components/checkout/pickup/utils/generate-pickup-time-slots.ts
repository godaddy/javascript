import { addDays, format, set } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export const DEFAULT_SLOT_INTERVAL = 30;
export const FALLBACK_LEAD_TIME = 30;

export const dayToProperty = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
} as const;

export type DayHours = {
  enabled: boolean;
  openTime: string | null;
  closeTime: string | null;
};

export type WeekHours = {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
};

export type OperatingHours = {
  leadTime: number;
  pickupWindowInDays: number;
  timeZone: string;
  hours: WeekHours;
  /**
   * Interval in minutes between selectable pickup time slots.
   * Defaults to DEFAULT_SLOT_INTERVAL (30) when not provided.
   *
   * Intentionally separate from `leadTime`:
   *   – leadTime = how much advance notice the store needs
   *   – pickupSlotInterval = the gap between choosable times (e.g. 30 → 10:00, 10:30, 11:00…)
   */
  pickupSlotInterval?: number | null;
};

export type TimeSlot = {
  label: string;
  value: string;
};

/**
 * Format a lead time in minutes for display.
 * e.g. 90 → "1 hour 30 minutes", 60 → "1 hour", 45 → "45 minutes"
 */
export function formatLeadTimeDisplay(
  leadTimeMinutes: number,
  labels: { hour: string; hours: string; minutes: string }
): string {
  const hours = Math.floor(leadTimeMinutes / 60);
  const mins = leadTimeMinutes % 60;
  if (hours === 0) return `${mins} ${labels.minutes}`;
  if (mins === 0) return `${hours} ${hours === 1 ? labels.hour : labels.hours}`;
  return `${hours} ${hours === 1 ? labels.hour : labels.hours} ${mins} ${labels.minutes}`;
}

/**
 * Determine whether an ASAP pickup option should be shown for today.
 * True when the store can fulfill the order (now + leadTime) before closing.
 */
export function isAsapAvailable(
  nowMinutesSinceMidnight: number,
  leadTimeMinutes: number,
  closeTimeMinutes: number
): boolean {
  return nowMinutesSinceMidnight + leadTimeMinutes < closeTimeMinutes;
}

/** Resolve the effective slot interval, with fallback. */
function getSlotInterval(hours: OperatingHours): number {
  return hours.pickupSlotInterval && hours.pickupSlotInterval > 0
    ? hours.pickupSlotInterval
    : DEFAULT_SLOT_INTERVAL;
}

/**
 * Find the first date within the pickup window that has at least one
 * bookable time slot, accounting for lead time.
 *
 * Returns `undefined` when no date in the window qualifies (e.g. when
 * leadTime exceeds the entire pickup window).
 */
export function findFirstAvailablePickupDate(
  storeHours: OperatingHours,
  now?: Date
): Date | undefined {
  if (storeHours.pickupWindowInDays === 0) {
    // ASAP-only mode — always today
    return toZonedTime(now ?? new Date(), storeHours.timeZone);
  }

  const leadTimeMinutes = storeHours.leadTime || FALLBACK_LEAD_TIME;
  const zonedNow = toZonedTime(now ?? new Date(), storeHours.timeZone);
  const earliestPickup = new Date(zonedNow.getTime() + leadTimeMinutes * 60000);

  let dateToCheck = new Date(now ?? Date.now());
  const maxDays = storeHours.pickupWindowInDays;

  for (let i = 0; i < maxDays; i++) {
    const zonedDate = toZonedTime(dateToCheck, storeHours.timeZone);
    const dayOfWeek = zonedDate.getDay();
    const dayProperty = dayToProperty[dayOfWeek as keyof typeof dayToProperty];
    const dayHours = storeHours.hours[dayProperty];

    if (dayHours?.enabled && dayHours.closeTime) {
      const [closeH, closeM] = dayHours.closeTime.split(':').map(Number);
      const dayCloseTime = set(zonedDate, {
        hours: closeH,
        minutes: closeM,
        seconds: 0,
        milliseconds: 0,
      });

      if (dayCloseTime > earliestPickup) {
        return zonedDate;
      }
    }

    dateToCheck = addDays(dateToCheck, 1);
  }

  return undefined;
}

/**
 * Generate available timed pickup slots for a specific date.
 *
 * Does NOT include the ASAP option — that is a presentation concern
 * handled by the component for "today" only.
 *
 * Uses `pickupSlotInterval` (default 30 min) for the gap between slots, and
 * `leadTime` only for the earliest-pickup constraint (now + leadTime).
 */
export function generatePickupTimeSlots({
  selectedDate,
  storeHours,
  now: nowInput,
}: {
  selectedDate: Date;
  storeHours: OperatingHours;
  now?: Date;
}): TimeSlot[] {
  const tz = storeHours.timeZone;
  const leadTimeMinutes = storeHours.leadTime || FALLBACK_LEAD_TIME;
  const pickupSlotInterval = getSlotInterval(storeHours);

  if (storeHours.pickupWindowInDays === 0) return [];

  const zonedSelected = toZonedTime(selectedDate, tz);
  const dayOfWeek = zonedSelected.getDay();
  const dayProperty = dayToProperty[dayOfWeek as keyof typeof dayToProperty];
  const hoursForDay = storeHours.hours[dayProperty];

  if (
    !hoursForDay?.enabled ||
    !hoursForDay.openTime ||
    !hoursForDay.closeTime
  ) {
    return [];
  }

  const [openTimeHours, openTimeMins] = hoursForDay.openTime
    .split(':')
    .map(Number);
  const [closeTimeHours, closeTimeMins] = hoursForDay.closeTime
    .split(':')
    .map(Number);

  // All date math uses zoned dates so comparisons are consistent
  // when the UTC date and store-local date differ (e.g. UTC Tue 3am = NYC Mon 11pm).
  const now = toZonedTime(nowInput ?? new Date(), tz);
  const earliestPickup = new Date(now.getTime() + leadTimeMinutes * 60000);

  const openTime = set(new Date(zonedSelected), {
    hours: openTimeHours,
    minutes: openTimeMins,
    seconds: 0,
    milliseconds: 0,
  });

  const closeDateTime = set(new Date(zonedSelected), {
    hours: closeTimeHours,
    minutes: closeTimeMins,
    seconds: 0,
    milliseconds: 0,
  });

  const isToday =
    format(zonedSelected, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');

  let currentTime = set(new Date(zonedSelected), {
    hours: openTimeHours,
    minutes: openTimeMins,
    seconds: 0,
    milliseconds: 0,
  });

  // For today, round currentTime forward past earliestPickup
  if (isToday && earliestPickup > openTime) {
    const minutesSinceMidnight =
      earliestPickup.getHours() * 60 + earliestPickup.getMinutes();
    const roundedMinutes =
      Math.ceil(minutesSinceMidnight / pickupSlotInterval) * pickupSlotInterval;
    currentTime = set(openTime, {
      hours: Math.floor(roundedMinutes / 60),
      minutes: roundedMinutes % 60,
      seconds: 0,
    });
  }

  const slots: TimeSlot[] = [];

  while (true) {
    const currentSlotHours = currentTime.getHours();
    const currentSlotMins = currentTime.getMinutes();

    const isAfterOrAtOpeningTime =
      currentSlotHours > openTimeHours ||
      (currentSlotHours === openTimeHours && currentSlotMins >= openTimeMins);

    // Full-Date comparison prevents infinite loops when pickupSlotInterval
    // or leadTime causes the date to overflow into the next day.
    if (!isAfterOrAtOpeningTime || currentTime >= closeDateTime) {
      break;
    }

    // Skip slots before the earliest possible pickup (now + leadTime).
    // Applied to ALL dates so that large lead times correctly produce
    // zero slots on future dates still within the lead-time window.
    if (currentTime < earliestPickup) {
      currentTime = set(currentTime, {
        minutes: currentTime.getMinutes() + pickupSlotInterval,
      });
      continue;
    }

    const timeString = format(currentTime, 'HH:mm');
    const slotLabel = format(currentTime, 'h:mm a');

    slots.push({ label: slotLabel, value: timeString });

    currentTime = set(currentTime, {
      minutes: currentTime.getMinutes() + pickupSlotInterval,
    });
  }

  return slots;
}
