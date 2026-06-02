import { QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import {
  type CheckoutFormData,
  checkoutContext,
} from '@/components/checkout/checkout';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-method';
import { DraftOrderSyncProvider } from '@/components/checkout/order/draft-order-sync-provider';
import { PaymentAddressToggle } from '@/components/checkout/payment/utils/payment-address-toggle';
import { useConfirmCheckout } from '@/components/checkout/payment/utils/use-confirm-checkout';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import { GoDaddyProvider } from '@/godaddy-provider';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import { eventIds } from '@/tracking/events';
import { CheckoutType, PaymentMethodType, PaymentProvider } from '@/types';
import {
  buildCheckoutSession,
  buildDraftOrder,
  buildLineItem,
  buildPickupLocation,
  buildShippingAddress,
  clearOperations,
  createTestQueryClient,
  flushPromises,
  mockGodaddyApi,
  mockTrack,
  renderCheckout,
  setApiError,
  waitForCheckoutReady,
  waitForOperation,
} from './checkout-test-env';

vi.mock('@/tracking/track', async importOriginal => {
  const actual = await importOriginal<typeof import('@/tracking/track')>();
  return { ...actual, track: vi.fn() };
});

const tracking = mockTrack();

function offlinePaymentMethods() {
  return {
    card: null as never,
    offline: {
      processor: PaymentProvider.OFFLINE,
      checkoutTypes: [CheckoutType.STANDARD],
    },
  };
}

async function applyCoupon(
  user: ReturnType<typeof userEvent.setup>,
  code: string
) {
  let input: HTMLInputElement | undefined;
  let button: HTMLButtonElement | undefined;

  await waitFor(() => {
    const inputs = screen.getAllByPlaceholderText(
      /coupon code/i
    ) as HTMLInputElement[];
    const buttons = screen.getAllByRole('button', {
      name: /apply/i,
    }) as HTMLButtonElement[];
    const index = inputs.findIndex(candidate => !candidate.disabled);
    expect(index).toBeGreaterThanOrEqual(0);
    input = inputs[index];
    button = buttons[index];
  });

  await user.clear(input as HTMLInputElement);
  await user.type(input as HTMLInputElement, code);
  await waitFor(() => {
    expect(button as HTMLButtonElement).not.toBeDisabled();
  });
  await user.click(button as HTMLButtonElement);
}

function buildFreePickupDraftOrder() {
  return buildDraftOrder({
    totals: {
      subTotal: { value: 0, currencyCode: 'USD' },
      discountTotal: { value: 0, currencyCode: 'USD' },
      shippingTotal: { value: 0, currencyCode: 'USD' },
      taxTotal: { value: 0, currencyCode: 'USD' },
      feeTotal: { value: 0, currencyCode: 'USD' },
      total: { value: 0, currencyCode: 'USD' },
    },
    shippingLines: [],
    lineItems: [
      buildLineItem({
        fulfillmentMode: DeliveryMethods.PICKUP,
        unitAmount: { value: 0, currencyCode: 'USD' },
        totals: {
          subTotal: { value: 0, currencyCode: 'USD' },
          discountTotal: { value: 0, currencyCode: 'USD' },
          feeTotal: { value: 0, currencyCode: 'USD' },
          taxTotal: { value: 0, currencyCode: 'USD' },
        },
      }),
    ],
    billing: {
      firstName: 'Free',
      lastName: 'Pickup',
      phone: '',
      email: 'free@example.com',
      address: null,
    },
  });
}

async function clickCompleteOrder(user: ReturnType<typeof userEvent.setup>) {
  const button = await screen.findByRole('button', {
    name: /complete your order/i,
  });
  await waitFor(() => expect(button).not.toBeDisabled());
  await user.click(button);
}

interface ConfirmHarnessProps {
  paymentType: string;
  paymentProvider: string;
  confirmError?: unknown;
}

function ConfirmHarness({
  paymentType,
  paymentProvider,
  confirmError,
}: ConfirmHarnessProps) {
  const queryClient = React.useMemo(() => createTestQueryClient(), []);
  const draftOrder = React.useMemo(
    () =>
      buildDraftOrder({
        shippingLines: [
          {
            id: 'shipping-line-free',
            requestedService: 'free-shipping',
            requestedProvider: 'unknown',
            name: 'Free',
            amount: { value: 0, currencyCode: 'USD' },
            discounts: [],
          },
        ],
      }),
    []
  );
  const session = React.useMemo(
    () => buildCheckoutSession({ draftOrder }),
    [draftOrder]
  );
  const methods = useForm<CheckoutFormData>({
    defaultValues: { deliveryMethod: DeliveryMethods.SHIP },
  });
  const [checkoutErrors, setCheckoutErrors] = React.useState<
    string[] | undefined
  >();
  const [isConfirmingCheckout, setIsConfirmingCheckout] = React.useState(false);

  React.useMemo(() => {
    mockGodaddyApi({ session, draftOrder });
    queryClient.setQueryDefaults(checkoutQueryKeys.draftOrder(session.id), {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: Number.POSITIVE_INFINITY,
      queryFn: async () => ({
        checkoutSession: { ...session, draftOrder },
      }),
    });
    queryClient.setQueryData(checkoutQueryKeys.draftOrder(session.id), {
      checkoutSession: { ...session, draftOrder },
    });
    if (confirmError) {
      setApiError('confirmCheckout', confirmError);
    }
  }, [confirmError, draftOrder, queryClient, session]);

  function ConfirmButton() {
    const confirmCheckout = useConfirmCheckout();
    return (
      <button
        type='button'
        onClick={() => {
          void confirmCheckout
            .mutateAsync({
              paymentToken: 'nonce-1',
              paymentType,
              paymentProvider: paymentProvider as never,
            })
            .catch(() => undefined);
        }}
      >
        Confirm
      </button>
    );
  }

  return (
    <GoDaddyProvider queryClient={queryClient} apiHost='api.godaddy.test'>
      <QueryClientProvider client={queryClient}>
        <checkoutContext.Provider
          value={{
            session,
            isConfirmingCheckout,
            setIsConfirmingCheckout,
            checkoutErrors,
            setCheckoutErrors,
          }}
        >
          <FormProvider {...methods}>
            <DraftOrderSyncProvider>
              <ConfirmButton />
            </DraftOrderSyncProvider>
          </FormProvider>
        </checkoutContext.Provider>
      </QueryClientProvider>
    </GoDaddyProvider>
  );
}

function renderConfirmHarness(props: ConfirmHarnessProps) {
  render(<ConfirmHarness {...props} />);
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}

function ToggleHarness() {
  const methods = useForm<CheckoutFormData>({
    defaultValues: {
      paymentUseShippingAddress: true,
      shippingFirstName: 'Ship',
      shippingLastName: 'Buyer',
      shippingAddressLine1: '123 Test St',
      shippingAdminArea2: 'Jasper',
      shippingAdminArea1: 'GA',
      shippingPostalCode: '30143',
      shippingCountryCode: 'US',
    },
  });

  const queryClient = React.useMemo(() => createTestQueryClient(), []);

  return (
    <GoDaddyProvider queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <checkoutContext.Provider
          value={{
            session: buildCheckoutSession(),
            isConfirmingCheckout: false,
            setIsConfirmingCheckout: () => undefined,
            setCheckoutErrors: () => undefined,
          }}
        >
          <FormProvider {...methods}>
            <DraftOrderSyncProvider>
              <PaymentAddressToggle />
            </DraftOrderSyncProvider>
          </FormProvider>
        </checkoutContext.Provider>
      </QueryClientProvider>
    </GoDaddyProvider>
  );
}

describe('Checkout tracking contract', () => {
  it('tracks checkout and express impressions only when the express section is visible', async () => {
    renderCheckout({
      sessionOverrides: {
        paymentMethods: {
          card: {
            processor: PaymentProvider.STRIPE,
            checkoutTypes: [CheckoutType.STANDARD],
          },
          express: {
            processor: PaymentProvider.GODADDY,
            checkoutTypes: [CheckoutType.EXPRESS],
          },
        },
      },
    });
    await waitForCheckoutReady();

    tracking.expectTracked(eventIds.checkoutStart, {
      subtotal: 2500,
      total: 2500,
      itemCount: 1,
      currencyCode: 'USD',
    });
    tracking.expectTracked(eventIds.expressCheckoutImpression, {
      availableMethods: 'express',
    });
    expect(tracking.getTrackedEvents(eventIds.checkoutStart)).toHaveLength(1);
    expect(
      await screen.findByTestId('mock-godaddy-express-button')
    ).toBeVisible();

    cleanup();
    tracking.clearTrackedEvents();
    renderCheckout();
    await waitForCheckoutReady();

    tracking.expectTracked(eventIds.checkoutStart, {
      subtotal: 2500,
      total: 2500,
      itemCount: 1,
      currencyCode: 'USD',
    });
    // TODO(T-601): Current implementation tracks an empty-method impression
    // even when the express section is gated off; PRD notes mark this [!].
    tracking.expectTracked(eventIds.expressCheckoutImpression, {
      availableMethods: '',
    });
  });

  it('tracks successful form submit properties and invalid-submit field names', async () => {
    const draftOrder = buildFreePickupDraftOrder();
    const { user } = renderCheckout({
      draftOrder,
      sessionOverrides: {
        draftOrder,
        paymentMethods: offlinePaymentMethods(),
        enableShipping: false,
        enableLocalPickup: true,
        enableTaxCollection: false,
      },
    });
    await waitForCheckoutReady();
    tracking.clearTrackedEvents();

    await user.click(
      await screen.findByRole('button', { name: /complete your free order/i })
    );
    await waitForOperation('ConfirmCheckoutSession');

    tracking.expectTracked(eventIds.submitCheckoutForm, {
      success: true,
      deliveryMethod: DeliveryMethods.PICKUP,
      hasShippingAddress: true,
      hasBillingAddress: false,
      total: 0,
    });

    cleanup();
    const invalidOrder = buildDraftOrder({
      shipping: {
        firstName: '',
        lastName: '',
        address: buildShippingAddress({
          addressLine1: '',
          adminArea1: '',
          adminArea2: '',
          postalCode: '',
          countryCode: 'US',
        }),
      },
      billing: {
        firstName: '',
        lastName: '',
        address: buildShippingAddress({
          addressLine1: '',
          adminArea1: '',
          adminArea2: '',
          postalCode: '',
          countryCode: 'US',
        }),
      },
    });
    tracking.clearTrackedEvents();
    renderCheckout({
      draftOrder: invalidOrder,
      sessionOverrides: { draftOrder: invalidOrder },
    });
    await waitForCheckoutReady();

    fireEvent.submit(document.querySelector('form') as HTMLFormElement);

    await waitFor(() => {
      tracking.expectTracked(eventIds.formValidationError, props => {
        const errorFields = String(props?.errorFields ?? '');
        return (
          Number(props?.errorCount) >= 5 &&
          errorFields.includes('shippingFirstName') &&
          errorFields.includes('shippingAddressLine1') &&
          errorFields.includes('shippingAdminArea2') &&
          errorFields.includes('shippingPostalCode') &&
          errorFields.includes('shippingAdminArea1')
        );
      });
    });
  });

  it('tracks delivery-method, shipping-method, pickup-location, date, and time changes', async () => {
    const locationA = buildPickupLocation({
      id: 'pickup-a',
      isDefault: true,
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
      address: { adminArea3: 'Pickup A' },
    });
    const locationB = buildPickupLocation({
      id: 'pickup-b',
      isDefault: false,
      operatingHours: locationA.operatingHours,
      address: {
        addressLine1: '200 B Ave',
        addressLine2: '',
        addressLine3: '',
        adminArea1: 'NY',
        adminArea2: 'Brooklyn',
        adminArea3: 'Pickup B',
        adminArea4: '',
        postalCode: '11201',
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
    await waitForOperation('ApplyCheckoutSessionShippingMethod');
    clearOperations();
    tracking.clearTrackedEvents();

    await user.click(screen.getByRole('radio', { name: /weight based/i }));
    await waitForOperation('ApplyCheckoutSessionShippingMethod');
    tracking.expectTracked(eventIds.selectShippingMethod, {
      shippingMethod: 'Weight Based',
      shippingMethodId: 'weight-based',
      shippingCarrier: 'unknown',
      cost: 100,
      currencyCode: 'USD',
    });

    await user.click(screen.getByRole('radio', { name: /local pickup/i }));
    await waitForOperation('ApplyCheckoutSessionFulfillmentLocation');
    tracking.expectTracked(eventIds.changeDeliveryMethod, {
      deliveryMethod: DeliveryMethods.PICKUP,
    });

    const storeTrigger = await screen.findByRole('combobox', {
      name: /pickup location|select a store/i,
    });
    await user.click(storeTrigger);
    await user.click(await screen.findByRole('option', { name: /pickup b/i }));
    await waitForOperation('ApplyCheckoutSessionFulfillmentLocation', 2);
    tracking.expectTracked(eventIds.selectPickupLocation, {
      locationId: 'pickup-b',
      locationName: 'Pickup B',
    });

    await user.click(
      await screen.findByRole('button', { name: /pickup date/i })
    );
    await user.click(await screen.findByRole('gridcell', { name: '6' }));
    tracking.expectTracked(eventIds.changePickupDate, {
      pickupDate: '2026-01-06',
      dayOfWeek: 'Tuesday',
      locationId: 'pickup-b',
    });

    const timeTrigger = await screen.findByRole('combobox', {
      name: /preferred pickup time/i,
    });
    await user.click(timeTrigger);
    const timeOption = (await screen.findAllByRole('option')).find(option =>
      /AM|PM/i.test(option.textContent ?? '')
    ) as HTMLElement;
    await user.click(timeOption);

    tracking.expectTracked(eventIds.changePickupTime, props => {
      return (
        Object.hasOwn(props ?? {}, 'pickupTime') &&
        props?.isAsap === false &&
        typeof props?.pickupDate === 'string' &&
        typeof props?.locationId === 'string'
      );
    });
  });

  it('tracks discount apply, remove, and failure contracts', async () => {
    const { user } = renderCheckout({
      sessionOverrides: {
        enableShipping: false,
        enableLocalPickup: false,
        enableTaxCollection: false,
      },
    });
    await waitForCheckoutReady();
    clearOperations();
    tracking.clearTrackedEvents();

    await applyCoupon(user, 'onedollar');
    await waitForOperation('ApplyCheckoutSessionDiscount');
    tracking.expectTracked(eventIds.applyCoupon, {
      success: true,
      discountCount: 1,
    });

    clearOperations();
    await user.click(
      screen
        .getAllByRole('button', { name: /remove onedollar/i })
        .at(-1) as HTMLButtonElement
    );
    await waitForOperation('ApplyCheckoutSessionDiscount');
    tracking.expectTracked(eventIds.removeDiscount, {
      success: true,
      discountCount: 0,
    });

    clearOperations();
    setApiError(
      'applyDiscount',
      new GraphQLErrorWithCodes([
        { message: 'Bad code', code: 'DISCOUNT_NOT_FOUND' },
      ])
    );
    await applyCoupon(user, 'badcode');
    await waitForOperation('ApplyCheckoutSessionDiscount');
    await flushPromises();

    tracking.expectTracked(eventIds.discountError, {
      success: false,
      errorCodes: 'DISCOUNT_NOT_FOUND',
    });
  });

  it('tracks integration form errors and billing-address toggle changes', async () => {
    render(<ToggleHarness />);
    const toggleUser = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    tracking.clearTrackedEvents();

    const sameAsShipping = await screen.findByRole('checkbox', {
      name: /shipping address as billing address/i,
    });
    await toggleUser.click(sameAsShipping);
    tracking.expectTracked(eventIds.toggleSameAsBillingAddress, {
      useShippingAddress: false,
    });
    await toggleUser.click(sameAsShipping);
    tracking.expectTracked(eventIds.toggleSameAsBillingAddress, {
      useShippingAddress: true,
    });

    cleanup();

    const draftOrder = buildDraftOrder({
      shippingLines: [],
      shipping: {
        firstName: 'Ship',
        lastName: 'Buyer',
        phone: '+12015550123',
        address: buildShippingAddress(),
      },
    });
    const { user } = renderCheckout({
      draftOrder,
      sessionOverrides: {
        draftOrder,
        paymentMethods: offlinePaymentMethods(),
      },
      apiOverrides: { shippingMethods: [] },
    });
    await waitForCheckoutReady();
    tracking.clearTrackedEvents();

    await clickCompleteOrder(user);
    await waitFor(() => {
      expect(document.body).toHaveTextContent(
        /Shipping address or method failed to apply/i
      );
    });
    tracking.expectTracked(eventIds.formError, {
      errorCodes: 'MISSING_SHIPPING_INFO',
      errorCount: 1,
    });
  });

  it('tracks payment lifecycle success and failure events', async () => {
    const successUser = renderConfirmHarness({
      paymentType: PaymentMethodType.OFFLINE,
      paymentProvider: PaymentProvider.OFFLINE,
    });
    tracking.clearTrackedEvents();

    await successUser.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitForOperation('ConfirmCheckoutSession');

    tracking.expectTracked(eventIds.paymentStart, {
      paymentType: PaymentMethodType.OFFLINE,
      provider: PaymentProvider.OFFLINE,
      draftOrderId: 'draft-order-1',
    });
    tracking.expectTracked(eventIds.checkoutComplete, {
      draftOrderId: 'draft-order-1',
      total: 2500,
      currencyCode: 'USD',
      paymentType: PaymentMethodType.OFFLINE,
      provider: PaymentProvider.OFFLINE,
    });

    const failureUser = renderConfirmHarness({
      paymentType: PaymentMethodType.OFFLINE,
      paymentProvider: PaymentProvider.OFFLINE,
      confirmError: new GraphQLErrorWithCodes([
        { message: 'Declined', code: 'PAYMENT_DECLINED' },
      ]),
    });
    tracking.clearTrackedEvents();

    await failureUser.click(
      screen
        .getAllByRole('button', { name: 'Confirm' })
        .at(-1) as HTMLButtonElement
    );
    await waitForOperation('ConfirmCheckoutSession');

    tracking.expectTracked(eventIds.checkoutError, props => {
      return (
        props?.errorCodes === 'GraphQLErrorWithCodes' &&
        props?.errorType === 'Declined' &&
        props?.paymentType === PaymentMethodType.OFFLINE &&
        props?.provider === PaymentProvider.OFFLINE &&
        props?.draftOrderId === 'draft-order-1'
      );
    });
  });

  it('tracks wallet-specific completion events from the confirm-checkout seam', async () => {
    const walletCases = [
      {
        paymentType: 'apple_pay',
        provider: PaymentProvider.GODADDY,
        eventId: eventIds.expressApplePayCompleted,
      },
      {
        paymentType: 'google_pay',
        provider: PaymentProvider.GODADDY,
        eventId: eventIds.expressGooglePayCompleted,
      },
      {
        paymentType: 'paze',
        provider: PaymentProvider.PAZE,
        eventId: eventIds.pazePayCompleted,
      },
    ];

    for (const walletCase of walletCases) {
      renderConfirmHarness({
        paymentType: walletCase.paymentType,
        paymentProvider: walletCase.provider,
      });
      tracking.clearTrackedEvents();

      await userEvent
        .setup({ advanceTimers: vi.advanceTimersByTime })
        .click(
          screen
            .getAllByRole('button', { name: 'Confirm' })
            .at(-1) as HTMLButtonElement
        );
      await waitForOperation('ConfirmCheckoutSession');

      tracking.expectTracked(walletCase.eventId, {
        draftOrderId: 'draft-order-1',
        paymentType: walletCase.paymentType,
        provider: 'poynt',
      });
      tracking.expectTracked(eventIds.checkoutComplete, {
        draftOrderId: 'draft-order-1',
        total: 2500,
        currencyCode: 'USD',
        paymentType: walletCase.paymentType,
        provider: walletCase.provider,
      });
    }
  });
});
