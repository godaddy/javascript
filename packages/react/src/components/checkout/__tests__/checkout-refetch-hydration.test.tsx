import { screen, waitFor } from '@testing-library/react';
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
    queryClient.setQueryData(checkoutQueryKeys.draftOrder(session.id), {
      checkoutSession: { draftOrder: updated },
    });
    await flushPromises();

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

    expect(getNamedInput('shippingAddressLine1')).toHaveValue('Newer Edit');
  });

  it('preserves typed values when a refetch returns an empty draft order', async () => {
    const { user, queryClient, session } = renderCheckout();
    await waitForCheckoutReady();

    await typeIntoNamedField(user, 'shippingFirstName', 'Unsaved');
    queryClient.setQueryData(checkoutQueryKeys.draftOrder(session.id), {
      checkoutSession: { draftOrder: null },
    });
    await flushPromises();

    await waitFor(() => {
      expect(getNamedInput('shippingFirstName')).toHaveValue('Unsaved');
    });
  });

  it('preserves a user-toggled-off billing address switch across refetch', async () => {
    const { user, queryClient, session } = renderCheckout();
    await waitForCheckoutReady();

    const checkbox = screen.getByRole('checkbox', {
      name: /same as shipping|use shipping/i,
    });
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();

    queryClient.setQueryData(checkoutQueryKeys.draftOrder(session.id), {
      checkoutSession: {
        draftOrder: buildDraftOrder({
          shipping: {
            firstName: 'Server',
            address: buildShippingAddress({ addressLine1: '999 Server St' }),
          },
        }),
      },
    });
    await flushPromises();

    await waitFor(() => {
      expect(checkbox).not.toBeChecked();
    });
  });
});
