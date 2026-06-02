import { act, screen, waitFor } from '@testing-library/react';
import { useFormContext } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { DeliveryMethods } from '@/components/checkout/delivery/delivery-methods';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import {
  advanceCheckoutDebounce,
  buildDraftOrder,
  buildPickupLocation,
  buildShippingAddress,
  flushPromises,
  getNamedInput,
  renderCheckout,
  typeIntoNamedField,
  waitForCheckoutReady,
} from './checkout-test-env';

function ClientStateProbe() {
  const form = useFormContext();
  const values = form.watch([
    'pickupLocationId',
    'pickupDate',
    'pickupTime',
    'pickupLeadTime',
    'pickupTimezone',
    'paymentMethod',
    'tipAmount',
    'tipPercentage',
    'stripePaymentIntent',
    'stripePaymentIntentId',
  ]);

  return (
    <div>
      <button
        type='button'
        onClick={() => {
          form.setValue('pickupLocationId', 'pickup-loc');
          form.setValue('pickupDate', '2026-01-05');
          form.setValue('pickupTime', 'ASAP');
          form.setValue('pickupLeadTime', 45);
          form.setValue('pickupTimezone', 'America/New_York');
          form.setValue('paymentMethod', 'card');
          form.setValue('tipAmount', 375);
          form.setValue('tipPercentage', 15);
          form.setValue('stripePaymentIntent', 'pi_client_secret');
          form.setValue('stripePaymentIntentId', 'pi_123');
        }}
      >
        Seed client state
      </button>
      <pre data-testid='client-state'>
        {JSON.stringify({
          pickupLocationId: values[0],
          pickupDate: values[1],
          pickupTime: values[2],
          pickupLeadTime: values[3],
          pickupTimezone: values[4],
          paymentMethod: values[5],
          tipAmount: values[6],
          tipPercentage: values[7],
          stripePaymentIntent: values[8],
          stripePaymentIntentId: values[9],
        })}
      </pre>
    </div>
  );
}

function BillingToggleProbe() {
  const form = useFormContext();
  const useShipping = form.watch('paymentUseShippingAddress');

  return (
    <div>
      <button
        type='button'
        onClick={() => {
          form.setValue('paymentUseShippingAddress', false, {
            shouldDirty: true,
          });
        }}
      >
        Toggle billing off
      </button>
      <button
        type='button'
        onClick={() => {
          form.reset(
            { ...form.getValues(), paymentUseShippingAddress: true },
            { keepDirtyValues: true }
          );
        }}
      >
        Simulate refetch hydration
      </button>
      <div data-testid='payment-use-shipping-address'>
        {String(useShipping)}
      </div>
    </div>
  );
}

describe('Checkout refetch hydration', () => {
  it('hydrates pristine fields from draft-order refetch without clobbering dirty fields', async () => {
    const { user, queryClient, session } = renderCheckout({
      draftOrderOverrides: {
        shipping: {
          firstName: 'Initial',
          lastName: 'Buyer',
          address: buildShippingAddress({ addressLine1: '123 Old St' }),
        },
      },
    });
    await waitForCheckoutReady();

    await typeIntoNamedField(user, 'shippingFirstName', 'Dirty');
    const updated = buildDraftOrder({
      shipping: {
        firstName: 'Server',
        lastName: 'Updated',
        address: buildShippingAddress({ addressLine1: '999 Server St' }),
      },
    });
    await act(async () => {
      queryClient.setQueryData(checkoutQueryKeys.draftOrder(session.id), {
        checkoutSession: { draftOrder: updated },
      });
      await flushPromises();
    });

    await waitFor(() => {
      expect(getNamedInput('shippingFirstName')).toHaveValue('Dirty');
      expect(getNamedInput('shippingLastName')).toHaveValue('Updated');
      expect(getNamedInput('shippingAddressLine1')).toHaveValue(
        '999 Server St'
      );
    });
  });

  it('preserves a sequential user edit during an active sync/refetch', async () => {
    const { user, queryClient, session } = renderCheckout({
      apiOverrides: { updateDraftOrderDelayMs: 500 },
    });
    await waitForCheckoutReady();

    await typeIntoNamedField(user, 'shippingAddressLine1', 'First Edit');
    await advanceCheckoutDebounce(1000);
    await typeIntoNamedField(user, 'shippingAddressLine1', 'Newer Edit');
    await act(async () => {
      queryClient.setQueryData(checkoutQueryKeys.draftOrder(session.id), {
        checkoutSession: {
          draftOrder: buildDraftOrder({
            shipping: {
              address: buildShippingAddress({
                addressLine1: 'Server During Busy',
              }),
            },
          }),
        },
      });
      await flushPromises();
    });

    expect(getNamedInput('shippingAddressLine1')).toHaveValue('Newer Edit');
  });

  it('preserves typed values when a refetch returns an empty draft order', async () => {
    const { user, queryClient, session } = renderCheckout();
    await waitForCheckoutReady();

    await typeIntoNamedField(user, 'shippingFirstName', 'Unsaved');
    await act(async () => {
      queryClient.setQueryData(checkoutQueryKeys.draftOrder(session.id), {
        checkoutSession: { draftOrder: null },
      });
      await flushPromises();
    });

    await waitFor(() => {
      expect(getNamedInput('shippingFirstName')).toHaveValue('Unsaved');
    });
  });

  it('preserves client-only checkout state across draft-order refetch hydration', async () => {
    const location = buildPickupLocation({
      id: 'pickup-loc',
      operatingHours: {
        timeZone: 'America/New_York',
        leadTime: 45,
        pickupWindowInDays: 0,
      },
    });
    const draftOrder = buildDraftOrder({
      lineItems: [{ fulfillmentMode: DeliveryMethods.PICKUP }],
      shippingLines: [],
    });
    const { user, queryClient, session } = renderCheckout({
      sessionOverrides: {
        enableTips: true,
        locations: [location],
        defaultOperatingHours: location.operatingHours,
      },
      draftOrder,
      checkoutProps: {
        targets: {
          'checkout.form.payment.after': ClientStateProbe,
        },
      },
    });
    await waitForCheckoutReady();

    await user.click(
      screen.getByRole('button', { name: /seed client state/i })
    );

    await act(async () => {
      queryClient.setQueryData(checkoutQueryKeys.draftOrder(session.id), {
        checkoutSession: {
          ...session,
          draftOrder: buildDraftOrder({
            lineItems: [{ fulfillmentMode: DeliveryMethods.PICKUP }],
            shippingLines: [],
            billing: { firstName: 'Server Refetch' },
          }),
        },
      });
      await flushPromises();
    });

    await waitFor(() => {
      expect(screen.getByTestId('client-state')).toHaveTextContent(
        '"pickupLocationId":"pickup-loc"'
      );
      expect(screen.getByTestId('client-state')).toHaveTextContent(
        '"pickupDate":"2026-01-05"'
      );
      expect(screen.getByTestId('client-state')).toHaveTextContent(
        '"pickupTime":"ASAP"'
      );
      expect(screen.getByTestId('client-state')).toHaveTextContent(
        '"pickupLeadTime":45'
      );
      expect(screen.getByTestId('client-state')).toHaveTextContent(
        '"pickupTimezone":"America/New_York"'
      );
      expect(screen.getByTestId('client-state')).toHaveTextContent(
        '"paymentMethod":"card"'
      );
      expect(screen.getByTestId('client-state')).toHaveTextContent(
        '"tipAmount":375'
      );
      expect(screen.getByTestId('client-state')).toHaveTextContent(
        '"tipPercentage":15'
      );
      expect(screen.getByTestId('client-state')).toHaveTextContent(
        '"stripePaymentIntent":"pi_client_secret"'
      );
      expect(screen.getByTestId('client-state')).toHaveTextContent(
        '"stripePaymentIntentId":"pi_123"'
      );
    });
  });

  it('preserves a user-toggled-off billing address switch across refetch', async () => {
    const { user } = renderCheckout({
      sessionOverrides: {
        enableLocalPickup: false,
        enableBillingAddressCollection: false,
      },
      draftOrderOverrides: {
        shipping: {
          firstName: 'Ship',
          lastName: 'Buyer',
          address: buildShippingAddress({
            adminArea1: '',
            countryCode: 'IE',
          }),
        },
        billing: {
          firstName: 'Ship',
          lastName: 'Buyer',
          address: buildShippingAddress({
            adminArea1: '',
            countryCode: 'IE',
          }),
        },
      },
      checkoutProps: {
        targets: {
          'checkout.form.payment.after': BillingToggleProbe,
        },
      },
    });
    await waitForCheckoutReady();

    expect(
      screen.getByTestId('payment-use-shipping-address')
    ).toHaveTextContent('true');

    await user.click(
      screen.getByRole('button', { name: /toggle billing off/i })
    );
    expect(
      screen.getByTestId('payment-use-shipping-address')
    ).toHaveTextContent('false');

    await user.click(
      screen.getByRole('button', { name: /simulate refetch hydration/i })
    );

    expect(
      screen.getByTestId('payment-use-shipping-address')
    ).toHaveTextContent('false');
  });
});
