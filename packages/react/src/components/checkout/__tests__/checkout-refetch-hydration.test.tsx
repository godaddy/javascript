import { act, screen, waitFor } from '@testing-library/react';
import { useFormContext } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import {
  advanceCheckoutDebounce,
  buildDraftOrder,
  buildShippingAddress,
  flushPromises,
  getNamedInput,
  renderCheckout,
  typeIntoNamedField,
  waitForCheckoutReady,
} from './checkout-test-env';

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
