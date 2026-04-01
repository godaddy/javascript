import { format as formatTz, fromZonedTime, toZonedTime } from 'date-fns-tz';

type FormFields = {
  pickupDate?: string | Date | null;
  pickupTime?: string | null;
  pickupLocationId?: string | null;
  leadTime?: number;
  timezone: string | null;
};

type PickupPayload = {
  fulfillmentStartAt: string; // ISO string
  fulfillmentEndAt: string; // ISO string
  fulfillmentLocationId: string | null;
};

/**
 * Extract a yyyy-MM-dd date string from either a string or Date.
 * When given a Date, reads its local (runtime) fields — this is safe
 * because the calendar UI stores dates as yyyy-MM-dd strings or as
 * midnight-local Date objects whose year/month/day are always correct.
 */
function toDateString(pickupDate: string | Date): string {
  if (typeof pickupDate === 'string') return pickupDate;
  const y = pickupDate.getFullYear();
  const m = String(pickupDate.getMonth() + 1).padStart(2, '0');
  const d = String(pickupDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function buildPickupPayload({
  pickupDate,
  pickupTime,
  pickupLocationId,
  leadTime = 0,
  timezone = 'UTC',
}: FormFields): PickupPayload {
  const tz = timezone ?? 'UTC';
  let date: Date;

  if (pickupTime === 'ASAP') {
    const now = new Date();
    now.setMinutes(now.getMinutes() + leadTime);
    date = toZonedTime(now, tz);
  } else if (pickupDate && pickupTime) {
    const dateStr = toDateString(pickupDate);
    const [hours, minutes] = pickupTime.split(':').map(Number);
    const h = String(hours || 0).padStart(2, '0');
    const m = String(minutes || 0).padStart(2, '0');

    // Build the wall-clock datetime in the store timezone, then convert to
    // a correct UTC instant via fromZonedTime before creating the zoned
    // representation that formatTz expects.
    const utcDate = fromZonedTime(`${dateStr}T${h}:${m}:00`, tz);
    date = toZonedTime(utcDate, tz);
  } else if (pickupDate) {
    const dateStr = toDateString(pickupDate);
    const utcDate = fromZonedTime(`${dateStr}T00:00:00`, tz);
    date = toZonedTime(utcDate, tz);
  } else {
    date = toZonedTime(new Date(), tz);
  }

  const isoString = formatTz(date, "yyyy-MM-dd'T'HH:mm:ssXXX", {
    timeZone: tz,
  });

  return {
    fulfillmentStartAt: isoString,
    fulfillmentEndAt: isoString,
    fulfillmentLocationId: pickupLocationId ?? null,
  };
}
