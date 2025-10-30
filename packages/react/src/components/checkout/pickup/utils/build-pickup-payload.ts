import { format as formatTz, toZonedTime } from 'date-fns-tz';

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

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function buildPickupPayload({
  pickupDate,
  pickupTime,
  pickupLocationId,
  leadTime = 0,
  timezone = 'UTC',
}: FormFields): PickupPayload {
  let date: Date;

  if (pickupTime === 'ASAP') {
    const now = new Date();
    now.setMinutes(now.getMinutes() + leadTime);
    date = toZonedTime(now, timezone ?? 'UTC');
  } else if (pickupDate && pickupTime) {
    const baseDate =
      typeof pickupDate === 'string' ? parseDate(pickupDate) : pickupDate;
    const [hours, minutes] = pickupTime.split(':').map(Number);
    const zonedDate = toZonedTime(baseDate, timezone ?? 'UTC');
    zonedDate.setHours(hours || 0, minutes || 0, 0, 0);
    date = zonedDate;
  } else if (pickupDate) {
    date = typeof pickupDate === 'string' ? parseDate(pickupDate) : pickupDate;
  } else {
    date = new Date();
  }

  const isoString = formatTz(date, "yyyy-MM-dd'T'HH:mm:ssXXX", {
    timeZone: timezone ?? 'UTC',
  });

  return {
    fulfillmentStartAt: isoString,
    fulfillmentEndAt: isoString,
    fulfillmentLocationId: pickupLocationId ?? null,
  };
}
