import { addDays, format, set } from 'date-fns';
import { format as formatTz, toZonedTime } from 'date-fns-tz';
import { CalendarIcon, ChevronDown, Clock, MapPin, Store } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useApplyFulfillmentLocation } from '@/components/checkout/delivery/utils/use-apply-fulfillment-location';
import { NotesForm } from '@/components/checkout/notes/notes-form';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGoDaddyContext } from '@/godaddy-provider';
import { cn } from '@/lib/utils';
import { eventIds } from '@/tracking/events';
import { TrackingEventType, track } from '@/tracking/track';
import type { CheckoutSessionLocation, StoreHours } from '@/types';

const FALLBACK_LEAD_TIME = 30; // Default lead time in minutes

import { useFormContext } from 'react-hook-form';

// Map day of week to the corresponding property in hours
const dayToProperty = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
} as const;

type TimeSlot = {
  label: string;
  value: string;
};

function parseISODate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Pretty print a plain "HH:mm" or already-formatted string.
 * No time-zone conversion – we keep exactly what the merchant supplied.
 */
export function formatTime(timeStr: string | null) {
  if (!timeStr) return '';

  // If the string already contains am/pm, assume merchant formatting
  if (/[ap]m$/i.test(timeStr.trim())) return timeStr;

  const [hStr, mStr = '00'] = timeStr.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  const period = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;

  return m === 0
    ? `${h12}${period}`
    : `${h12}:${String(m).padStart(2, '0')}${period}`;
}

export function LocalPickupForm({
  showStoreHours = true,
}: {
  showStoreHours?: boolean;
}) {
  const form = useFormContext();
  const { session } = useCheckoutContext();
  const { t } = useGoDaddyContext();
  const applyFulfillmentLocation = useApplyFulfillmentLocation();
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const hasSingleLocation = session?.locations?.length === 1;

  // Get the store operating hours for a specific location with fallback to default
  const getStoreHours = useCallback(
    (locationId?: string): StoreHours | undefined => {
      if (!session) return undefined;
      if (locationId && session.locations) {
        const location = session.locations.find(loc => loc.id === locationId);
        if (location?.operatingHours) {
          return location.operatingHours;
        }
      }
      return session.defaultOperatingHours;
    },
    [session]
  );

  // Function to find the next available date for pickup
  const findAndSetNextAvailableDate = useCallback(
    (locationId: string) => {
      if (!session?.locations) return;
      const location = session.locations.find(loc => loc.id === locationId);
      if (!location) return;
      const locationHours = getStoreHours(locationId);
      if (!locationHours) return;
      form.setValue(
        'pickupLeadTime',
        locationHours.leadTime || FALLBACK_LEAD_TIME
      );

      if (locationHours.pickupWindowInDays === 0) {
        const today = new Date();
        const zonedToday = toZonedTime(today, locationHours.timeZone);
        setSelectedDate(zonedToday);
        form.setValue('pickupDate', format(zonedToday, 'yyyy-MM-dd'));
        form.setValue('pickupTime', 'ASAP');
        return;
      }

      let dateToCheck = new Date();
      const maxDays = locationHours.pickupWindowInDays;
      for (let i = 0; i < maxDays; i++) {
        const dayOfWeek = dateToCheck.getDay();
        const dayProperty =
          dayToProperty[dayOfWeek as keyof typeof dayToProperty];
        if (locationHours.hours[dayProperty]?.enabled) {
          const zonedDate = toZonedTime(dateToCheck, locationHours.timeZone);
          setSelectedDate(zonedDate);
          if (form.getValues('pickupDate') === '') {
            form.setValue('pickupDate', format(zonedDate, 'yyyy-MM-dd'));
          }
          break;
        }
        dateToCheck = addDays(dateToCheck, 1);
      }
    },
    [session?.locations, getStoreHours, form]
  );

  useEffect(() => {
    // Skip if we already have a selected location to avoid duplicate calls
    if (selectedLocationId) return;

    const pickupLocationId = form.getValues('pickupLocationId');
    if (
      session?.locations &&
      session.locations.length > 0 &&
      !pickupLocationId
    ) {
      const defaultLocation =
        session.locations.find(loc => loc.isDefault) || session.locations[0];
      if (defaultLocation?.id) {
        // Set local state first to prevent further executions
        setSelectedLocationId(defaultLocation.id);
        // Set form values
        form.setValue('pickupLocationId', defaultLocation.id);
        // Set timezone
        form.setValue(
          'pickupTimezone',
          defaultLocation.operatingHours?.timeZone ??
            session.defaultOperatingHours?.timeZone ??
            ''
        );

        applyFulfillmentLocation.mutate({
          fulfillmentLocationId: defaultLocation.id,
          locationAddress: defaultLocation.address,
        });
        findAndSetNextAvailableDate(defaultLocation.id);
      }
    }
  }, [
    session?.locations,
    form,
    findAndSetNextAvailableDate,
    session?.defaultOperatingHours,
    applyFulfillmentLocation,
    selectedLocationId,
  ]);

  useEffect(() => {
    if (availableTimeSlots.length > 0) {
      const currentTimeValue = form.getValues('pickupTime');
      const timeSlotExists = availableTimeSlots.some(
        slot => slot.value === currentTimeValue
      );
      if (!currentTimeValue || !timeSlotExists) {
        const firstTimeSlot = availableTimeSlots[0].value;
        form.setValue('pickupTime', firstTimeSlot);
      }
    }
  }, [availableTimeSlots, form]);

  const storeHours = getStoreHours(selectedLocationId);
  const locationTimeZone = storeHours?.timeZone;
  const today = new Date();
  const maxDate = storeHours?.pickupWindowInDays
    ? addDays(today, storeHours.pickupWindowInDays - 1)
    : undefined;

  const isDateBookable = useCallback(
    (date: Date) => {
      const hours = getStoreHours(selectedLocationId);
      if (!hours) return false;
      const dayOfWeek = date.getDay();
      const dayProperty =
        dayToProperty[dayOfWeek as keyof typeof dayToProperty];
      return hours.hours[dayProperty]?.enabled === true;
    },
    [selectedLocationId, getStoreHours]
  );

  // Generate time slots for the selected date
  useEffect(() => {
    if (!selectedDate || !selectedLocationId || !locationTimeZone) {
      setAvailableTimeSlots([]);
      return;
    }
    const locationHours = getStoreHours(selectedLocationId);
    if (!locationHours || locationHours.pickupWindowInDays === 0) {
      setAvailableTimeSlots([]);
      return;
    }

    const dayOfWeek = selectedDate.getDay();
    const dayProperty = dayToProperty[dayOfWeek as keyof typeof dayToProperty];
    const hoursForDay = locationHours.hours[dayProperty];
    if (!hoursForDay?.enabled) {
      setAvailableTimeSlots([]);
      return;
    }
    const leadTimeMinutes = locationHours.leadTime || FALLBACK_LEAD_TIME;
    // We'll get the raw open time values directly for consistency
    if (!hoursForDay.openTime) {
      setAvailableTimeSlots([]);
      return;
    }
    const openTimeHours = Number.parseInt(
      hoursForDay?.openTime?.split(':')?.[0] ?? '00',
      10
    );
    const openTimeMins = Number.parseInt(
      hoursForDay?.openTime?.split(':')?.[1] ?? '00',
      10
    );

    // Create a base date object for the selected date
    const baseDate = new Date(selectedDate);
    // Set hours and minutes directly to match opening time
    const openTime = set(baseDate, {
      hours: openTimeHours,
      minutes: openTimeMins,
      seconds: 0,
      milliseconds: 0,
    });
    // We'll get the raw close time values directly from the hours object

    const slots: TimeSlot[] = [];
    const isToday =
      formatTz(selectedDate, 'yyyy-MM-dd', { timeZone: locationTimeZone }) ===
      formatTz(new Date(), 'yyyy-MM-dd', { timeZone: locationTimeZone });

    // Extract hours and minutes for direct string comparison to avoid timezone issues
    if (!hoursForDay.closeTime) {
      setAvailableTimeSlots([]);
      return;
    }
    const closeTimeHours = Number.parseInt(
      hoursForDay?.closeTime?.split(':')?.[0] ?? '23',
      10
    );
    const closeTimeMins = Number.parseInt(
      hoursForDay?.closeTime?.split(':')?.[1] ?? '59',
      10
    );

    // Get the current time in the location's timezone only
    const now = toZonedTime(new Date(), locationTimeZone);
    const earliestPickup = isToday
      ? new Date(now.getTime() + leadTimeMinutes * 60000)
      : openTime;
    // Initialize currentTime to openTime (exactly matching the hours/minutes)
    let currentTime = set(new Date(selectedDate), {
      hours: openTimeHours,
      minutes: openTimeMins,
      seconds: 0,
      milliseconds: 0,
    });

    // Only add ASAP option if there will be at least one other time slot available today
    // Calculate if any time slots would be available after earliest pickup time
    let hasAvailableTimeSlots = false;
    if (isToday) {
      const nowInMinutes = now.getHours() * 60 + now.getMinutes();
      const closeTimeInMinutes = closeTimeHours * 60 + closeTimeMins;
      const minimumBufferMinutes = 30; // Same buffer as in our main logic

      // Check if there's enough time remaining in the day for at least one time slot
      if (nowInMinutes + minimumBufferMinutes < closeTimeInMinutes) {
        const leadTimeDisplay =
          leadTimeMinutes >= 60
            ? `${leadTimeMinutes / 60} ${leadTimeMinutes === 60 ? t.pickup.hour : t.pickup.hours}`
            : `${leadTimeMinutes} ${t.pickup.minutes}`;
        slots.push({
          label: `${t.pickup.asap} (${leadTimeDisplay})`,
          value: 'ASAP',
        });
        hasAvailableTimeSlots = true;
      }
      if (earliestPickup > openTime) {
        const minutesSinceMidnight =
          earliestPickup.getHours() * 60 + earliestPickup.getMinutes();
        const roundedMinutes =
          Math.ceil(minutesSinceMidnight / leadTimeMinutes) * leadTimeMinutes;
        currentTime = set(openTime, {
          hours: Math.floor(roundedMinutes / 60),
          minutes: roundedMinutes % 60,
          seconds: 0,
        });
      }

      // If no time slots will be available today, find the next available day
      if (!hasAvailableTimeSlots) {
        // Reset the slots array since we'll be finding a new day
        slots.length = 0;

        let nextAvailableDate = addDays(selectedDate, 1);
        const maxDays = storeHours?.pickupWindowInDays;
        let foundNextDay = false;

        for (let i = 1; i < maxDays; i++) {
          const nextDayOfWeek = nextAvailableDate.getDay();
          const nextDayProperty =
            dayToProperty[nextDayOfWeek as keyof typeof dayToProperty];

          if (storeHours?.hours[nextDayProperty]?.enabled) {
            // We found the next available day
            const nextDayZoned = toZonedTime(
              nextAvailableDate,
              locationTimeZone
            );
            setSelectedDate(nextDayZoned);
            form.setValue('pickupDate', format(nextDayZoned, 'yyyy-MM-dd'));
            foundNextDay = true;
            break;
          }

          nextAvailableDate = addDays(nextAvailableDate, 1);
        }

        // Early return as we'll rerun this effect with the new selected date
        if (foundNextDay) {
          return;
        }
      }
    }

    while (true) {
      // Get the current slot's hour and minute for comparison
      const currentSlotHours = currentTime.getHours();
      const currentSlotMins = currentTime.getMinutes();

      // Make sure current time is at or after opening time
      const isAfterOrAtOpeningTime =
        currentSlotHours > openTimeHours ||
        (currentSlotHours === openTimeHours && currentSlotMins >= openTimeMins);

      // If current time is at or after closing time, break
      if (
        !isAfterOrAtOpeningTime ||
        currentSlotHours > closeTimeHours ||
        (currentSlotHours === closeTimeHours &&
          currentSlotMins >= closeTimeMins)
      ) {
        break;
      }
      if (isToday) {
        // If current slot time is before the earliest pickup time (now + lead time), skip to next slot
        if (currentTime < earliestPickup) {
          currentTime = set(currentTime, {
            minutes: currentTime.getMinutes() + leadTimeMinutes,
          });
          continue;
        }

        const currentTimeInMinutes =
          currentTime.getHours() * 60 + currentTime.getMinutes();
        const nowInMinutes = now.getHours() * 60 + now.getMinutes();

        const minimumBufferMinutes =
          locationHours.leadTime || FALLBACK_LEAD_TIME; // Use locationHours.leadTime with fallback
        if (currentTimeInMinutes < nowInMinutes + minimumBufferMinutes) {
          currentTime = set(currentTime, {
            minutes: currentTime.getMinutes() + leadTimeMinutes,
          });
          continue;
        }
      }
      const timeString = formatTz(currentTime, 'HH:mm', {
        timeZone: locationTimeZone,
      });
      // Format the time in the location's timezone, not the user's timezone
      const slotLabel = formatTz(currentTime, 'h:mm a', {
        timeZone: locationTimeZone,
      });
      slots.push({
        label: slotLabel,
        value: timeString, // <-- Only HH:MM
      });
      currentTime = set(currentTime, {
        minutes: currentTime.getMinutes() + leadTimeMinutes,
      });
    }
    slots.sort((a, b) => {
      if (a.value === 'ASAP') return -1;
      if (b.value === 'ASAP') return 1;
      return a.value.localeCompare(b.value);
    });

    setAvailableTimeSlots(slots);
  }, [
    selectedDate,
    selectedLocationId,
    getStoreHours,
    form.setValue,
    storeHours,
    t.pickup.hour,
    t.pickup.hours,
    t.pickup.minutes,
    t.pickup.asap,
    locationTimeZone,
  ]);

  const formatAddress = (location: CheckoutSessionLocation) => {
    const { address } = location;
    const parts = [
      address.addressLine1,
      address.addressLine2,
      address.adminArea2 && address.adminArea1
        ? `${address.adminArea2}, ${address.adminArea1}`
        : address.adminArea2 || address.adminArea1,
      address.postalCode,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const getSelectedDateOpenHours = () => {
    if (!selectedDate || !displayHours) return null;
    const dayNum = selectedDate.getDay();
    const dayName = dayToProperty[dayNum as keyof typeof dayToProperty];
    const dayData = displayHours.hours[dayName];
    return (
      <div className='text-xs text-muted-foreground'>
        <span className='capitalize'>{t.days[dayName]}: </span>
        {dayData?.enabled
          ? `${formatTime(dayData.openTime)} – ${formatTime(dayData.closeTime)}`
          : t.general.closed}
      </div>
    );
  };

  // If in-store pickup is not enabled, return nothing
  if (!session?.enableLocalPickup || !session.locations?.length) {
    return null;
  }

  const selectedLocation = React.useMemo(
    () => session?.locations?.find(loc => loc.id === selectedLocationId),
    [selectedLocationId, session?.locations]
  );

  const displayHours = React.useMemo(
    () => (selectedLocationId ? getStoreHours(selectedLocationId) : undefined),
    [selectedLocationId, getStoreHours]
  );

  return (
    <div className='space-y-4'>
      <FormField
        control={form.control}
        name='pickupLocationId'
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.pickup.location}</FormLabel>
            {hasSingleLocation ? (
              <div className='h-auto sm:h-12 flex items-center border border-border rounded-md px-3 py-2 text-sm'>
                <div className='flex items-center w-full'>
                  <Store className='mr-2 h-4 w-4' />
                  <div>
                    <div className='text-left'>
                      {selectedLocation?.address.adminArea3}
                    </div>
                    <div className='text-xs text-muted-foreground flex items-center'>
                      <MapPin className='mr-1 h-3 w-3' />
                      {selectedLocation && formatAddress(selectedLocation)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Select
                onValueChange={value => {
                  if (!value) return;

                  field.onChange(value);
                  setSelectedLocationId(value);
                  setSelectedDate(undefined);
                  form.setValue('pickupDate', '');
                  form.setValue('pickupTime', '');

                  const location = session?.locations?.find(
                    loc => loc.id === value
                  );

                  // Track pickup location selection
                  track({
                    eventId: eventIds.selectPickupLocation,
                    type: TrackingEventType.CLICK,
                    properties: {
                      locationId: value,
                      locationName: location?.address?.adminArea3,
                    },
                  });

                  form.setValue(
                    'pickupTimezone',
                    location?.operatingHours?.timeZone ??
                      session.defaultOperatingHours?.timeZone ??
                      ''
                  );

                  applyFulfillmentLocation.mutate({
                    fulfillmentLocationId: value,
                    locationAddress: location?.address,
                  });
                  findAndSetNextAvailableDate(value);
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t.pickup.selectStore} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {session.locations?.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      <div className='flex items-center'>
                        <Store className='mr-2 h-4 w-4' />
                        <div>
                          <div className='text-left'>
                            {location.address.adminArea3}
                          </div>
                          <div className='text-xs text-muted-foreground flex items-center'>
                            <MapPin className='mr-1 h-3 w-3' />
                            {formatAddress(location)}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {storeHours?.pickupWindowInDays !== 0 && (
        <FormField
          control={form.control}
          name='pickupDate'
          render={({ field }) => (
            <FormItem className='flex flex-col'>
              <FormLabel>{t.pickup.date}</FormLabel>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      onClick={() => setIsCalendarOpen(true)}
                      variant='outline'
                      className={cn(
                        'h-12 w-full pl-3 text-left font-normal bg-card hover:bg-muted',
                        !field.value && 'text-muted-foreground'
                      )}
                      disabled={!selectedLocationId}
                    >
                      {parseISODate(field.value) ? (
                        format(parseISODate(field.value) as Date, 'PPP')
                      ) : (
                        <span>{t.pickup.selectDate}</span>
                      )}
                      <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={
                      field.value ? parseISODate(field.value) : undefined
                    }
                    onSelect={date => {
                      const currentSelectedDate = field.value
                        ? parseISODate(field.value)
                        : undefined;

                      if (!date && currentSelectedDate) {
                        return;
                      }

                      if (date) {
                        const formattedDate = format(date, 'yyyy-MM-dd');
                        field.onChange(formattedDate);
                        setSelectedDate(date);

                        // Track pickup date selection
                        track({
                          eventId: eventIds.changePickupDate,
                          type: TrackingEventType.CLICK,
                          properties: {
                            pickupDate: formattedDate,
                            dayOfWeek: format(date, 'EEEE'),
                            locationId: selectedLocationId,
                          },
                        });
                      } else {
                        field.onChange('');
                        setSelectedDate(undefined);
                        form.setValue('pickupTime', '');
                      }
                      setIsCalendarOpen(false);
                    }}
                    disabled={date => {
                      const todayStart = new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        today.getDate()
                      );
                      const dateToCheck = new Date(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate()
                      );
                      if (dateToCheck < todayStart) return true;
                      if (!isDateBookable(date)) return true;
                      if (maxDate) {
                        return date > maxDate;
                      }
                      return false;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {storeHours?.pickupWindowInDays !== 0 &&
        selectedDate &&
        availableTimeSlots.length > 0 && (
          <FormField
            control={form.control}
            name='pickupTime'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.pickup.time}</FormLabel>
                <Select
                  onValueChange={value => {
                    field.onChange(value);

                    // Track pickup time selection
                    track({
                      eventId: eventIds.changePickupTime,
                      type: TrackingEventType.CLICK,
                      properties: {
                        pickupTime: value,
                        isAsap: value === 'ASAP',
                        pickupDate: form.getValues('pickupDate'),
                        locationId: selectedLocationId,
                      },
                    });
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t.pickup.selectTime} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableTimeSlots.map(slot => (
                      <SelectItem key={slot.value} value={slot.value}>
                        <div className='flex items-center'>
                          <Clock className='mr-2 h-4 w-4' />
                          <span>{slot.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

      {storeHours?.pickupWindowInDays !== 0 &&
        selectedDate &&
        availableTimeSlots.length === 0 && (
          <div className='rounded-md bg-yellow-50 p-4'>
            <p className='text-sm text-yellow-700'>{t.pickup.noTimeSlots}</p>
          </div>
        )}

      {session?.enableNotesCollection ? <NotesForm /> : null}

      {selectedLocationId && displayHours && showStoreHours && (
        <Collapsible
          defaultOpen={false}
          className='text-sm border border-border rounded-md mt-2'
        >
          <CollapsibleTrigger
            asChild
            className='p-3 data-[state=closed]:hover:bg-muted'
          >
            <div className='flex items-center justify-between w-full'>
              <div>
                <div>{t.pickup.storeHours}</div>
                {getSelectedDateOpenHours()}
              </div>
              <div className='flex items-center'>
                <span className='mr-1 text-xs'>{t.pickup.seeDetails}</span>
                <ChevronDown className='h-4 w-4' />
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className='p-3 text-muted-foreground pt-0 space-y-2 overflow-hidden transition-all data-[state=closed]:animate-collapse data-[state=open]:animate-expand'>
            <div className='grid grid-cols-1 md:grid-cols-2 md:grid-flow-col-dense gap-x-6 gap-y-1'>
              {Object.entries(dayToProperty).map(([dayNum, dayName]) => {
                const dayData = displayHours.hours[dayName];
                const dayIndex = Number.parseInt(dayNum, 10);
                // Use fixed column placement instead of order
                // Sunday-Wed (0-3) in left column, Thu-Sat (4-6) in right column
                return (
                  <div
                    key={dayNum}
                    className={`flex text-xs flex-row justify-between mb-0 ${dayIndex <= 3 ? 'md:col-start-1 md:row-auto' : 'md:col-start-2 md:row-auto'}`}
                  >
                    <span className='capitalize font-medium'>
                      {t.days[dayName]}:
                    </span>
                    <span className='mt-1 md:mt-0'>
                      {dayData?.enabled
                        ? `${formatTime(dayData.openTime)} – ${formatTime(dayData.closeTime)}`
                        : t.general.closed}
                    </span>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
