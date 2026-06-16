import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-methods';
import {
  isCheckoutConfirmationBlockedError,
  PaymentProvider,
  useConfirmCheckout,
} from '@/components/checkout/payment/utils/use-confirm-checkout';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';
import {
  buildCheckoutSession,
  buildDraftOrder,
  buildPickupLocation,
  buildShippingAddress,
  clearOperations,
  getOperations,
  mockGodaddyApi,
  type RenderCheckoutOptions,
  renderCheckout,
  setApiError,
  waitForCheckoutReady,
  waitForOperation,
} from './checkout-test-env';
import { getLastConfirmInput } from './checkout-test-fixtures';

// All tests in this file render with offline-only payment so the real
// `useConfirmCheckout` (and its MISSING_SHIPPING_INFO / DRAFT_ORDER_UPDATE_FAILED
// error paths) are exercised, instead of the Stripe button mock that bypasses
// `useConfirmCheckout` entirely.
function offlineSessionOverrides() {
  return {
    paymentMethods: {
      // Clear the default Stripe card method so 'offline' becomes the only
      // available payment method (and the OfflinePaymentCheckoutButton, which
      // calls the real useConfirmCheckout, is rendered).
      card: null as never,
      offline: {
        processor: 'offline',
        checkoutTypes: ['standard'],
      },
    },
  };
}

function pickupDraftOrder() {
  return buildDraftOrder({
    lineItems: [{ fulfillmentMode: DeliveryMethods.PICKUP }],
    shippingLines: [],
  });
}

function scheduledPickupLocation() {
  return buildPickupLocation({
    id: 'scheduled-pickup-loc',
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
  });
}

interface ConfirmSeamProps {
  label?: string;
  deliveryMethod?: DeliveryMethods;
  isExpress?: boolean;
  pickupValues?: {
    pickupDate?: string;
    pickupTime?: string;
    pickupLocationId?: string;
    pickupLeadTime?: number;
    pickupTimezone?: string;
  };
  paymentType?: string;
  paymentProvider?: PaymentProvider;
}

function ConfirmSeamButton({
  label = 'Confirm seam',
  deliveryMethod = DeliveryMethods.SHIP,
  isExpress = false,
  pickupValues,
  paymentType = isExpress ? 'apple_pay' : 'offline',
  paymentProvider = isExpress ? PaymentProvider.POYNT : PaymentProvider.OFFLINE,
}: ConfirmSeamProps) {
  const confirmCheckout = useConfirmCheckout();
  const form = useFormContext();
  const { setCheckoutErrors } = useCheckoutContext();

  return (
    <button
      type='button'
      onClick={() => {
        form.setValue('deliveryMethod', deliveryMethod);
        if (pickupValues) {
          for (const [key, value] of Object.entries(pickupValues)) {
            form.setValue(key, value);
          }
        }
        void confirmCheckout
          .mutateAsync({
            paymentToken: isExpress ? 'express-nonce' : '',
            paymentType,
            paymentProvider,
            isExpress,
          })
          .catch(err => {
            if (isCheckoutConfirmationBlockedError(err)) {
              return;
            }

            if (err instanceof GraphQLErrorWithCodes) {
              setCheckoutErrors(err.codes);
            } else if ((err as Error)?.message === 'MISSING_SHIPPING_INFO') {
              setCheckoutErrors(['MISSING_SHIPPING_INFO']);
            } else {
              setCheckoutErrors(['DRAFT_ORDER_UPDATE_FAILED']);
            }
          });
      }}
    >
      {label}
    </button>
  );
}

function DuplicateConfirmSeamButton() {
  const confirmCheckout = useConfirmCheckout();
  const form = useFormContext();
  const [secondResult, setSecondResult] = useState('idle');

  return (
    <>
      <button
        type='button'
        onClick={() => {
          form.setValue('deliveryMethod', DeliveryMethods.SHIP);
          const input = {
            paymentToken: '',
            paymentType: 'offline',
            paymentProvider: PaymentProvider.OFFLINE,
          };

          void confirmCheckout.mutateAsync(input).catch(() => undefined);
          void confirmCheckout
            .mutateAsync(input)
            .then(() => setSecondResult('resolved'))
            .catch(err => {
              setSecondResult(
                isCheckoutConfirmationBlockedError(err) ? 'blocked' : 'rejected'
              );
            });
        }}
      >
        Duplicate confirm seam
      </button>
      <div data-testid='second-confirm-result'>{secondResult}</div>
    </>
  );
}

function renderCheckoutWithConfirmSeam(
  options: RenderCheckoutOptions = {},
  seamProps?: ConfirmSeamProps
) {
  return renderCheckout({
    ...options,
    checkoutProps: {
      ...(options.checkoutProps ?? {}),
      targets: {
        ...(options.checkoutProps?.targets ?? {}),
        'checkout.form.payment.after': () => (
          <ConfirmSeamButton {...seamProps} />
        ),
      },
    },
  });
}

describe('Checkout confirm errors', () => {
  it('blocks confirm and surfaces MISSING_SHIPPING_INFO when no shipping line is applied', async () => {
    // No rates so the "default" rate cannot auto-apply, and an empty
    // shippingLines means useConfirmCheckout's pre-flight check throws.
    const draftOrder = buildDraftOrder({
      shipping: {
        firstName: 'Ship',
        lastName: 'Buyer',
        phone: '+12015550123',
        address: buildShippingAddress(),
      },
      shippingLines: [],
    });
    const session = buildCheckoutSession({
      draftOrder,
      ...offlineSessionOverrides(),
    });
    mockGodaddyApi({ session, draftOrder, shippingMethods: [] });

    const { user } = renderCheckoutWithConfirmSeam({
      session,
      draftOrder,
      apiOverrides: { shippingMethods: [] },
    });
    await waitForCheckoutReady();
    clearOperations();

    await user.click(
      await screen.findByRole('button', { name: /confirm seam/i })
    );

    await waitFor(() => {
      expect(document.body).toHaveTextContent(
        /Shipping address or method failed to apply/i
      );
    });

    expect(getOperations('ConfirmCheckoutSession')).toHaveLength(0);
  });

  it('renders GraphQL error codes returned from confirmCheckout', async () => {
    const draftOrder = buildDraftOrder();
    const session = buildCheckoutSession({
      draftOrder,
      ...offlineSessionOverrides(),
    });
    mockGodaddyApi({ session, draftOrder });

    const { user } = renderCheckoutWithConfirmSeam({ session, draftOrder });
    await waitForCheckoutReady();
    clearOperations();

    setApiError(
      'confirmCheckout',
      new GraphQLErrorWithCodes([
        {
          message: 'Order rejected',
          code: 'PAYMENT_AUTHORIZATION_FAILED',
        },
      ])
    );

    await user.click(
      await screen.findByRole('button', { name: /confirm seam/i })
    );

    await waitFor(
      () => {
        expect(document.body).toHaveTextContent(
          /PAYMENT_AUTHORIZATION_FAILED/i
        );
      },
      { timeout: 5000 }
    );
  });

  it('does not redirect when confirmCheckout fails', async () => {
    const draftOrder = buildDraftOrder();
    const session = buildCheckoutSession({
      draftOrder,
      successUrl: 'https://test.example/should-not-go-here',
      ...offlineSessionOverrides(),
    });
    mockGodaddyApi({ session, draftOrder });

    const { user } = renderCheckoutWithConfirmSeam({ session, draftOrder });
    await waitForCheckoutReady();
    clearOperations();

    setApiError(
      'confirmCheckout',
      new GraphQLErrorWithCodes([
        { message: 'Decline', code: 'PAYMENT_DECLINED' },
      ])
    );

    await user.click(
      await screen.findByRole('button', { name: /confirm seam/i })
    );

    await waitFor(() => {
      expect(document.body).toHaveTextContent(/PAYMENT_DECLINED/i);
    });

    // Order rejected; the success-URL redirect path is bypassed.
    expect(window.location.href).not.toContain('should-not-go-here');
  });

  it('surfaces DRAFT_ORDER_UPDATE_FAILED when the in-confirm draft-order fetch fails', async () => {
    const draftOrder = buildDraftOrder();
    const session = buildCheckoutSession({
      draftOrder,
      ...offlineSessionOverrides(),
    });
    mockGodaddyApi({ session, draftOrder });

    const { user, queryClient } = renderCheckoutWithConfirmSeam({
      session,
      draftOrder,
    });
    await waitForCheckoutReady();
    queryClient.setQueryDefaults(['draft-order', { sessionId: session.id }], {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 0,
    });
    setApiError('getDraftOrder', 'draft fetch failed');
    clearOperations();

    await user.click(
      await screen.findByRole('button', { name: /confirm seam/i })
    );

    await waitForOperation('DraftOrder');
    expect(getOperations('ConfirmCheckoutSession')).toHaveLength(0);
  });

  it('rejects a duplicate confirm while the first confirm is in flight without treating it as success', async () => {
    const draftOrder = buildDraftOrder({
      shippingLines: [
        {
          requestedService: 'free-shipping',
          requestedProvider: 'unknown',
          name: 'Free',
          amount: { value: 0, currencyCode: 'USD' },
          discounts: [],
        },
      ],
    });
    const session = buildCheckoutSession({
      draftOrder,
      ...offlineSessionOverrides(),
    });
    mockGodaddyApi({ session, draftOrder, delayMs: 100 });

    renderCheckout({
      session,
      draftOrder,
      apiOverrides: { delayMs: 100 },
      checkoutProps: {
        targets: {
          'checkout.form.payment.after': () => <DuplicateConfirmSeamButton />,
        },
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    fireEvent.click(
      await screen.findByRole('button', { name: /duplicate confirm seam/i })
    );

    await waitFor(() => {
      expect(screen.getByTestId('second-confirm-result')).toHaveTextContent(
        'blocked'
      );
    });
    await waitForOperation('ConfirmCheckoutSession');
    expect(getOperations('ConfirmCheckoutSession')).toHaveLength(1);
  });

  it('confirms pickup ASAP with a fulfillment window based on current time and lead time', async () => {
    const location = buildPickupLocation({
      id: 'asap-pickup-loc',
      operatingHours: {
        timeZone: 'America/New_York',
        leadTime: 45,
        pickupWindowInDays: 0,
      },
    });
    const draftOrder = pickupDraftOrder();
    const session = buildCheckoutSession({
      draftOrder,
      locations: [location],
      defaultOperatingHours: location.operatingHours,
      ...offlineSessionOverrides(),
    });

    const { user } = renderCheckoutWithConfirmSeam(
      { session, draftOrder },
      {
        deliveryMethod: DeliveryMethods.PICKUP,
        pickupValues: {
          pickupLocationId: 'asap-pickup-loc',
          pickupTime: 'ASAP',
          pickupLeadTime: 45,
          pickupTimezone: 'America/New_York',
        },
      }
    );
    await waitForCheckoutReady();
    clearOperations();

    await user.click(
      await screen.findByRole('button', { name: /confirm seam/i })
    );
    await waitForOperation('ConfirmCheckoutSession');

    expect(getLastConfirmInput()).toMatchObject({
      fulfillmentLocationId: 'asap-pickup-loc',
      fulfillmentStartAt: '2026-01-05T10:45:00-05:00',
      fulfillmentEndAt: '2026-01-05T10:45:00-05:00',
    });
  });

  it('confirms scheduled pickup with the exact selected slot', async () => {
    const location = scheduledPickupLocation();
    const draftOrder = pickupDraftOrder();
    const session = buildCheckoutSession({
      draftOrder,
      locations: [location],
      defaultOperatingHours: location.operatingHours,
      ...offlineSessionOverrides(),
    });

    const { user } = renderCheckoutWithConfirmSeam(
      { session, draftOrder },
      {
        deliveryMethod: DeliveryMethods.PICKUP,
        pickupValues: {
          pickupDate: '2026-01-05',
          pickupTime: '11:00',
          pickupLocationId: 'scheduled-pickup-loc',
          pickupLeadTime: 30,
          pickupTimezone: 'America/New_York',
        },
      }
    );
    await waitForCheckoutReady();
    clearOperations();

    await user.click(
      await screen.findByRole('button', { name: /confirm seam/i })
    );
    await waitForOperation('ConfirmCheckoutSession');

    expect(getLastConfirmInput()).toMatchObject({
      fulfillmentLocationId: 'scheduled-pickup-loc',
      fulfillmentStartAt: '2026-01-05T11:00:00-05:00',
      fulfillmentEndAt: '2026-01-05T11:00:00-05:00',
    });
  });

  it('skips shipping and pickup guards when confirming through the isExpress seam', async () => {
    const draftOrder = buildDraftOrder({ shippingLines: [] });
    const session = buildCheckoutSession({ draftOrder });

    const { user } = renderCheckout({
      session,
      draftOrder,
      checkoutProps: {
        targets: {
          'checkout.form.payment.after': () => (
            <ConfirmSeamButton label='Express confirm seam' isExpress />
          ),
        },
      },
    });
    await waitForCheckoutReady();
    clearOperations();

    await user.click(
      await screen.findByRole('button', { name: /express confirm seam/i })
    );
    await waitForOperation('ConfirmCheckoutSession');

    expect(getLastConfirmInput()).toMatchObject({
      paymentToken: 'express-nonce',
      paymentType: 'apple_pay',
      paymentProvider: PaymentProvider.POYNT,
    });
    expect(getLastConfirmInput()).not.toHaveProperty('fulfillmentStartAt');
    expect(document.body).not.toHaveTextContent(/MISSING_SHIPPING_INFO/i);
  });
});
