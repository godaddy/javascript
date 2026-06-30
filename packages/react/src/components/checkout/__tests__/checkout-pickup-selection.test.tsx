import { screen, waitFor } from '@testing-library/react';
import { addDays } from 'date-fns';
import { describe, expect, it } from 'vitest';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import {
  buildCheckoutSession,
  buildDraftOrder,
  buildPickupLocation,
  clearOperations,
  flushPromises,
  getOperations,
  mockGodaddyApi,
  renderCheckout,
  setApiError,
  waitForCheckoutReady,
  waitForOperation,
} from './checkout-test-env';
import { getLastConfirmInput } from './checkout-test-fixtures';

function offlinePaymentMethods() {
  return {
    card: null as never,
    offline: {
      processor: 'offline',
      checkoutTypes: ['standard'],
    },
  };
}

function scheduledLocation(overrides = {}) {
  return buildPickupLocation({
    operatingHours: {
      timeZone: 'America/New_York',
      leadTime: 30,
      pickupWindowInDays: 3,
      pickupSlotInterval: 60,
      hours: {
        sunday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
        monday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
        tuesday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
        wednesday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
        thursday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
        friday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
        saturday: { enabled: true, openTime: '09:00', closeTime: '17:00' },
      },
    },
    ...overrides,
  });
}

describe('Checkout pickup location and time selection', () => {
  it('switches the fulfillment location and recalculates taxes when a different store is picked', async () => {
    const locationA = buildPickupLocation({
      id: 'loc-a',
      isDefault: true,
      address: {
        addressLine1: '100 A St',
        addressLine2: '',
        addressLine3: '',
        adminArea1: 'GA',
        adminArea2: 'Jasper',
        adminArea3: 'Store A',
        adminArea4: '',
        postalCode: '30143',
        countryCode: 'US',
      },
    });
    const locationB = buildPickupLocation({
      id: 'loc-b',
      isDefault: false,
      address: {
        addressLine1: '200 B Ave',
        addressLine2: '',
        addressLine3: '',
        adminArea1: 'NY',
        adminArea2: 'Brooklyn',
        adminArea3: 'Store B',
        adminArea4: '',
        postalCode: '11201',
        countryCode: 'US',
      },
    });

    const draftOrder = buildDraftOrder();
    const session = buildCheckoutSession({
      draftOrder,
      locations: [locationA, locationB],
    });
    mockGodaddyApi({ session, draftOrder });

    const { user } = renderCheckout({ session, draftOrder });
    await waitForCheckoutReady();

    // Switch to pickup so the location selector becomes visible.
    await user.click(screen.getByRole('radio', { name: /local pickup/i }));
    await waitForOperation('ApplyCheckoutSessionFulfillmentLocation');
    clearOperations();

    // The store selector is rendered as a Radix Select trigger when there
    // are multiple locations. Open it and choose Store B.
    const storeTrigger = screen.getByRole('combobox', {
      name: /pickup location|select a store/i,
    });
    await user.click(storeTrigger);

    const storeB = await screen.findByRole('option', { name: /store b/i });
    await user.click(storeB);

    await waitForOperation('ApplyCheckoutSessionFulfillmentLocation');
    await waitForOperation('CalculateCheckoutSessionTaxes');
    await flushPromises();

    expect(
      getOperations('ApplyCheckoutSessionFulfillmentLocation').at(-1)?.input
    ).toMatchObject({ fulfillmentLocationId: 'loc-b' });
    expect(
      getOperations('CalculateCheckoutSessionTaxes').at(-1)?.input
    ).toMatchObject({
      destination: expect.objectContaining({ postalCode: '11201' }),
    });
  });

  it('ASAP-only locations set pickupTime to ASAP and hide date/time selectors', async () => {
    const { user } = renderCheckout();
    await waitForCheckoutReady();
    clearOperations();

    await user.click(screen.getByRole('radio', { name: /local pickup/i }));
    await waitForOperation('ApplyCheckoutSessionFulfillmentLocation');

    expect(document.body).toHaveTextContent(/jasper store/i);
    expect(screen.queryByText(/pickup date/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/preferred pickup time/i)
    ).not.toBeInTheDocument();
    expect(
      getOperations('CalculateCheckoutSessionTaxes').at(-1)?.input
    ).toMatchObject({
      destination: expect.objectContaining({ postalCode: '30143' }),
    });
  });

  it('scheduled pickup shows date and time selectors, updates selected values, and store hours expand', async () => {
    const location = scheduledLocation({
      id: 'scheduled-loc',
      isDefault: true,
      address: { adminArea3: 'Scheduled Store' },
    });
    const { user } = renderCheckout({
      sessionOverrides: {
        locations: [location],
        defaultOperatingHours: location.operatingHours,
      },
    });
    await waitForCheckoutReady();

    await user.click(screen.getByRole('radio', { name: /local pickup/i }));
    await waitForOperation('ApplyCheckoutSessionFulfillmentLocation');

    expect(await screen.findByText(/pickup date/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/preferred pickup time/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /pickup date/i })
    ).toBeInTheDocument();

    const timeTrigger = screen.getByRole('combobox', {
      name: /preferred pickup time/i,
    });
    await user.click(timeTrigger);
    const timeOptions = await screen.findAllByRole('option');
    const firstTimeOption = timeOptions.find(option =>
      /AM|PM|ASAP/i.test(option.textContent ?? '')
    );
    expect(firstTimeOption).toBeTruthy();
    const selectedTimeLabel = firstTimeOption?.textContent ?? '';
    await user.click(firstTimeOption as HTMLElement);
    expect(timeTrigger).toHaveTextContent(selectedTimeLabel);

    await user.click(screen.getByText(/see details/i));
    expect(document.body).toHaveTextContent(/Sunday:/i);
    expect(document.body).toHaveTextContent(/9am/i);
  });

  it('changing pickup location clears previous date/time before choosing the new schedule', async () => {
    const locationA = scheduledLocation({
      id: 'scheduled-a',
      isDefault: true,
      address: { adminArea3: 'Scheduled A' },
    });
    const locationB = scheduledLocation({
      id: 'scheduled-b',
      isDefault: false,
      address: {
        addressLine1: '300 B St',
        addressLine2: '',
        addressLine3: '',
        adminArea1: 'GA',
        adminArea2: 'Jasper',
        adminArea3: 'Scheduled B',
        adminArea4: '',
        postalCode: '30144',
        countryCode: 'US',
      },
    });
    const { user } = renderCheckout({
      sessionOverrides: {
        locations: [locationA, locationB],
        defaultOperatingHours: locationA.operatingHours,
      },
    });
    await waitForCheckoutReady();
    await user.click(screen.getByRole('radio', { name: /local pickup/i }));
    await waitForOperation('ApplyCheckoutSessionFulfillmentLocation');

    await waitFor(() => {
      expect(document.body).toHaveTextContent(/scheduled a/i);
      expect(screen.getByText(/preferred pickup time/i)).toBeInTheDocument();
    });
    clearOperations();

    await user.click(
      screen.getByRole('combobox', { name: /pickup location|select a store/i })
    );
    await user.click(
      await screen.findByRole('option', { name: /scheduled b/i })
    );

    await waitForOperation('ApplyCheckoutSessionFulfillmentLocation');
    await flushPromises();
    expect(
      getOperations('CalculateCheckoutSessionTaxes').at(-1)?.input
    ).toMatchObject({
      destination: expect.objectContaining({ postalCode: '30144' }),
    });
  });

  it('shows no available time slots when the selected date has no slots', async () => {
    const tomorrow = addDays(new Date(), 1);
    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ] as const;
    const tomorrowName = dayNames[tomorrow.getDay()];
    const closedDay = { enabled: false, openTime: null, closeTime: null };
    const location = scheduledLocation({
      id: 'no-slots-loc',
      operatingHours: {
        pickupWindowInDays: 2,
        hours: {
          sunday: closedDay,
          monday: closedDay,
          tuesday: closedDay,
          wednesday: closedDay,
          thursday: closedDay,
          friday: closedDay,
          saturday: closedDay,
          [tomorrowName]: {
            enabled: true,
            openTime: '17:00',
            closeTime: '17:00',
          },
        },
      },
    });
    const { user } = renderCheckout({
      sessionOverrides: {
        locations: [location],
        defaultOperatingHours: location.operatingHours,
      },
    });
    await waitForCheckoutReady();
    await user.click(screen.getByRole('radio', { name: /local pickup/i }));
    await waitForOperation('ApplyCheckoutSessionFulfillmentLocation');

    await waitFor(() => {
      expect(document.body).toHaveTextContent(/no available time slots/i);
    });
  });

  it('calculates taxes with pickup address even when fulfillment-location apply fails', async () => {
    const { user } = renderCheckout();
    await waitForCheckoutReady();
    clearOperations();
    setApiError('applyFulfillmentLocation', 'fulfillment failed');

    await user.click(screen.getByRole('radio', { name: /local pickup/i }));
    await waitForOperation('ApplyCheckoutSessionFulfillmentLocation');
    await waitForOperation('CalculateCheckoutSessionTaxes');

    expect(
      getOperations('CalculateCheckoutSessionTaxes').at(-1)?.input
    ).toMatchObject({
      destination: expect.objectContaining({ postalCode: '30143' }),
    });
  });

  it('reapplies the selected pickup location when refetched line items need pickup fulfillment sync', async () => {
    const location = buildPickupLocation({
      id: 'default-location',
      isDefault: true,
      address: {
        addressLine1: '599 Stegall Dr',
        addressLine2: '',
        addressLine3: '',
        adminArea1: 'GA',
        adminArea2: 'Jasper',
        adminArea3: 'Jasper Store',
        adminArea4: '',
        postalCode: '30143',
        countryCode: 'US',
      },
    });
    const draftOrder = buildDraftOrder({
      lineItems: [{ id: 'line-1', fulfillmentMode: 'PICKUP' }],
      shippingLines: [],
    });
    const session = buildCheckoutSession({
      draftOrder,
      locations: [location],
      defaultOperatingHours: location.operatingHours,
      paymentMethods: offlinePaymentMethods(),
    });

    const { queryClient } = renderCheckout({ session, draftOrder });
    await waitForCheckoutReady();
    await waitForOperation('ApplyCheckoutSessionFulfillmentLocation');
    clearOperations();

    const refetchedDraftOrder = buildDraftOrder({
      lineItems: [
        { id: 'line-1', fulfillmentMode: 'PICKUP' },
        { id: 'line-2', fulfillmentMode: 'NONE' },
      ],
      shippingLines: [],
    });

    queryClient.setQueryData(checkoutQueryKeys.draftOrder(session.id), {
      checkoutSession: { ...session, draftOrder: refetchedDraftOrder },
    });
    await flushPromises();

    await waitForOperation('ApplyCheckoutSessionFulfillmentLocation');
    await waitForOperation('CalculateCheckoutSessionTaxes');

    expect(
      getOperations('ApplyCheckoutSessionFulfillmentLocation')
    ).toHaveLength(1);
    expect(
      getOperations('ApplyCheckoutSessionFulfillmentLocation').at(-1)?.input
    ).toMatchObject({ fulfillmentLocationId: 'default-location' });
    expect(
      getOperations('CalculateCheckoutSessionTaxes').at(-1)?.input
    ).toMatchObject({
      destination: expect.objectContaining({ postalCode: '30143' }),
    });
  });

  it('preserves the default pickup location across refetches before confirming', async () => {
    const location = buildPickupLocation({
      id: 'default-location',
      isDefault: true,
      operatingHours: {
        timeZone: 'America/New_York',
        leadTime: 60,
        pickupWindowInDays: 0,
      },
    });
    const draftOrder = buildDraftOrder({
      lineItems: [{ fulfillmentMode: 'PICKUP' }],
      shippingLines: [],
    });
    const session = buildCheckoutSession({
      draftOrder,
      locations: [location],
      defaultOperatingHours: location.operatingHours,
      paymentMethods: offlinePaymentMethods(),
    });

    const { user, queryClient } = renderCheckout({ session, draftOrder });
    await waitForCheckoutReady();
    await waitForOperation('ApplyCheckoutSessionFulfillmentLocation');

    const refetchedDraftOrder = buildDraftOrder({
      lineItems: [{ fulfillmentMode: 'PICKUP' }],
      shippingLines: [],
      billing: { firstName: 'Server' },
    });

    queryClient.setQueryData(checkoutQueryKeys.draftOrder(session.id), {
      checkoutSession: { ...session, draftOrder: refetchedDraftOrder },
    });
    await flushPromises();
    clearOperations();

    await user.click(
      await screen.findByRole('button', { name: /complete your order/i })
    );
    await waitForOperation('ConfirmCheckoutSession');

    expect(getLastConfirmInput()).toMatchObject({
      fulfillmentLocationId: 'default-location',
    });
  });

  it('flows pickup lead time through the ASAP confirm payload fulfillment window', async () => {
    const location = buildPickupLocation({
      id: 'asap-loc',
      operatingHours: {
        timeZone: 'America/New_York',
        leadTime: 45,
        pickupWindowInDays: 0,
      },
    });
    const draftOrder = buildDraftOrder({
      lineItems: [{ fulfillmentMode: 'PICKUP' }],
    });
    const session = buildCheckoutSession({
      draftOrder,
      locations: [location],
      defaultOperatingHours: location.operatingHours,
      paymentMethods: offlinePaymentMethods(),
    });

    const { user } = renderCheckout({ session, draftOrder });
    await waitForCheckoutReady();

    await user.click(screen.getByRole('radio', { name: /local pickup/i }));
    await waitForOperation('ApplyCheckoutSessionFulfillmentLocation');
    clearOperations();

    await user.click(
      await screen.findByRole('button', { name: /complete your order/i })
    );
    await waitForOperation('ConfirmCheckoutSession');

    expect(getLastConfirmInput()).toMatchObject({
      fulfillmentLocationId: 'asap-loc',
      fulfillmentStartAt: '2026-01-05T10:45:00-05:00',
      fulfillmentEndAt: '2026-01-05T10:45:00-05:00',
    });
  });

  it('falls back to default operating-hours timezone when the pickup location has none', async () => {
    const location = buildPickupLocation({
      id: 'fallback-tz-loc',
      operatingHours: null,
    });
    const defaultOperatingHours = {
      ...buildPickupLocation().operatingHours,
      timeZone: 'America/Los_Angeles',
      leadTime: 15,
      pickupWindowInDays: 0,
    };
    const draftOrder = buildDraftOrder({
      lineItems: [{ fulfillmentMode: 'PICKUP' }],
    });
    const session = buildCheckoutSession({
      draftOrder,
      locations: [location],
      defaultOperatingHours,
      paymentMethods: offlinePaymentMethods(),
    });

    const { user } = renderCheckout({ session, draftOrder });
    await waitForCheckoutReady();

    await user.click(screen.getByRole('radio', { name: /local pickup/i }));
    await waitForOperation('ApplyCheckoutSessionFulfillmentLocation');
    clearOperations();

    await user.click(
      await screen.findByRole('button', { name: /complete your order/i })
    );
    await waitForOperation('ConfirmCheckoutSession');

    expect(getLastConfirmInput()).toMatchObject({
      fulfillmentLocationId: 'fallback-tz-loc',
      fulfillmentStartAt: '2026-01-05T07:15:00-08:00',
      fulfillmentEndAt: '2026-01-05T07:15:00-08:00',
    });
  });

  it('does not render pickup notes when notes collection is disabled', async () => {
    const { user } = renderCheckout({
      sessionOverrides: { enableNotesCollection: false },
    });
    await waitForCheckoutReady();

    await user.click(screen.getByRole('radio', { name: /local pickup/i }));
    await waitForOperation('ApplyCheckoutSessionFulfillmentLocation');

    expect(
      screen.queryByPlaceholderText(/notes or special instructions/i)
    ).not.toBeInTheDocument();
  });

  it('shows the single-location header and skips the store selector when only one location exists', async () => {
    const draftOrder = buildDraftOrder();
    const session = buildCheckoutSession({
      draftOrder,
      locations: [
        buildPickupLocation({
          id: 'only-loc',
          isDefault: true,
          address: {
            addressLine1: '599 Stegall Dr',
            addressLine2: '',
            addressLine3: '',
            adminArea1: 'GA',
            adminArea2: 'Jasper',
            adminArea3: 'Solo Store',
            adminArea4: '',
            postalCode: '30143',
            countryCode: 'US',
          },
        }),
      ],
    });
    mockGodaddyApi({ session, draftOrder });

    const { user } = renderCheckout({ session, draftOrder });
    await waitForCheckoutReady();

    await user.click(screen.getByRole('radio', { name: /local pickup/i }));
    await waitForOperation('ApplyCheckoutSessionFulfillmentLocation');

    // The store name appears (as the single location) but the combobox does
    // not render.
    expect(
      screen.queryByRole('combobox', { name: /pickup location/i })
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(document.body).toHaveTextContent(/Solo Store/);
    });
  });
});
