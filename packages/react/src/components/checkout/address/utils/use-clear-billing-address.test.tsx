import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import {
  type CheckoutFormData,
  checkoutContext,
} from '@/components/checkout/checkout';
import {
  DraftOrderSyncProvider,
  type DraftOrderSyncRegistration,
} from '@/components/checkout/order/draft-order-sync-provider';
import {
  useDraftOrderFieldDirtyMarker,
  useRegisterDraftOrderFieldSync,
} from '@/components/checkout/order/use-draft-order-sync';
import { PaymentAddressToggle } from '@/components/checkout/payment/utils/payment-address-toggle';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import { GoDaddyProvider } from '@/godaddy-provider';
import {
  buildCheckoutSession,
  buildDraftOrder,
  createTestQueryClient,
  getOperations,
  mockGodaddyApi,
  waitForOperation,
} from '../../__tests__/checkout-test-env';

function ShippingSyncProbe() {
  const registration = React.useMemo<DraftOrderSyncRegistration>(
    () => ({
      id: 'shipping-name',
      fieldNames: ['shippingFirstName', 'shippingLastName'],
      debounceMs: 1000,
      enabled: ({ values, draftOrder }) =>
        Boolean(
          draftOrder &&
            values.shippingFirstName?.trim() &&
            values.shippingLastName?.trim() &&
            ((draftOrder.shipping?.firstName || '') !==
              values.shippingFirstName ||
              (draftOrder.shipping?.lastName || '') !== values.shippingLastName)
        ),
      buildPatch: ({ values }) => ({
        shipping: {
          firstName: values.shippingFirstName.trim(),
          lastName: values.shippingLastName.trim(),
        },
      }),
    }),
    []
  );

  useRegisterDraftOrderFieldSync(registration);
  useDraftOrderFieldDirtyMarker({
    id: 'shipping-name',
    fieldNames: ['shippingFirstName', 'shippingLastName'],
  });

  return null;
}

function BillingProbe() {
  const form = useFormContext<CheckoutFormData>();

  return (
    <>
      <ShippingSyncProbe />
      <input
        aria-label='shippingFirstName'
        {...form.register('shippingFirstName')}
      />
      <input
        aria-label='shippingLastName'
        {...form.register('shippingLastName')}
      />
      <PaymentAddressToggle />
      {[
        'billingFirstName',
        'billingLastName',
        'billingPhone',
        'billingAddressLine1',
        'billingAddressLine2',
        'billingAddressLine3',
        'billingAdminArea4',
        'billingAdminArea3',
        'billingAdminArea2',
        'billingAdminArea1',
        'billingPostalCode',
        'billingCountryCode',
      ].map(name => (
        <input
          key={name}
          aria-label={name}
          {...form.register(name as keyof CheckoutFormData)}
        />
      ))}
    </>
  );
}

function ClearBillingHarness({
  session,
  paymentUseShippingAddress = true,
}: {
  session: ReturnType<typeof buildCheckoutSession>;
  paymentUseShippingAddress?: boolean;
}) {
  const form = useForm<CheckoutFormData>({
    defaultValues: {
      paymentUseShippingAddress,
      shippingFirstName: 'Ship',
      shippingLastName: 'Buyer',
      shippingPhone: '+12015550123',
      shippingAddressLine1: '123 Shipping St',
      shippingAddressLine2: 'Unit 4',
      shippingAddressLine3: 'Floor 2',
      shippingAdminArea4: 'Neighborhood',
      shippingAdminArea3: 'District',
      shippingAdminArea2: 'Jasper',
      shippingAdminArea1: 'GA',
      shippingPostalCode: '30143',
      shippingCountryCode: 'US',
      billingFirstName: 'Bill',
      billingLastName: 'Buyer',
      billingPhone: '+12015550123',
      billingAddressLine1: '123 Billing St',
      billingAddressLine2: 'Unit 4',
      billingAddressLine3: 'Floor 2',
      billingAdminArea4: 'Neighborhood',
      billingAdminArea3: 'District',
      billingAdminArea2: 'Jasper',
      billingAdminArea1: 'GA',
      billingPostalCode: '30143',
      billingCountryCode: 'US',
    } as CheckoutFormData,
  });

  return (
    <FormProvider {...form}>
      <checkoutContext.Provider
        value={{
          session,
          jwt: undefined,
          isConfirmingCheckout: false,
          setIsConfirmingCheckout: () => undefined,
          checkoutErrors: undefined,
          setCheckoutErrors: () => undefined,
        }}
      >
        <DraftOrderSyncProvider>
          <BillingProbe />
        </DraftOrderSyncProvider>
      </checkoutContext.Provider>
    </FormProvider>
  );
}

function renderClearBillingHarness({
  paymentUseShippingAddress = true,
}: {
  paymentUseShippingAddress?: boolean;
} = {}) {
  const draftOrder = buildDraftOrder();
  const session = buildCheckoutSession({ draftOrder });
  const queryClient = createTestQueryClient();

  mockGodaddyApi({ session, draftOrder });
  queryClient.setQueryData(checkoutQueryKeys.draftOrder(session.id), {
    checkoutSession: { ...session, draftOrder },
  });

  render(
    <GoDaddyProvider queryClient={queryClient} apiHost='api.godaddy.test'>
      <ClearBillingHarness
        session={session}
        paymentUseShippingAddress={paymentUseShippingAddress}
      />
    </GoDaddyProvider>
  );
}

describe('useClearBillingAddress', () => {
  it('clears all billing fields and queues a null billing patch when toggling off use-shipping', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderClearBillingHarness();

    const toggle = screen.getByRole('checkbox', {
      name: /use shipping address/i,
    });
    expect(toggle).toBeChecked();

    await user.click(toggle);

    for (const name of [
      'billingFirstName',
      'billingLastName',
      'billingPhone',
      'billingAddressLine1',
      'billingAddressLine2',
      'billingAddressLine3',
      'billingAdminArea4',
      'billingAdminArea3',
      'billingAdminArea2',
      'billingAdminArea1',
      'billingPostalCode',
      'billingCountryCode',
    ]) {
      expect(screen.getByLabelText(name)).toHaveValue('');
    }

    await waitForOperation('UpdateCheckoutSessionDraftOrder');
    await waitFor(() => {
      expect(
        getOperations('UpdateCheckoutSessionDraftOrder').at(-1)?.input
      ).toMatchObject({
        billing: null,
      });
    });
  });

  it('flushes pending shipping edits with the billing clear when toggling off use-shipping', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderClearBillingHarness();

    await user.clear(screen.getByLabelText('shippingFirstName'));
    await user.type(screen.getByLabelText('shippingFirstName'), 'Updated');

    const toggle = screen.getByRole('checkbox', {
      name: /use shipping address/i,
    });
    expect(toggle).toBeChecked();

    await user.click(toggle);

    await waitForOperation('UpdateCheckoutSessionDraftOrder');
    await waitFor(() => {
      expect(getOperations('UpdateCheckoutSessionDraftOrder')).toHaveLength(1);
    });
    expect(
      getOperations('UpdateCheckoutSessionDraftOrder')[0].input
    ).toMatchObject({
      shipping: { firstName: 'Updated', lastName: 'Buyer' },
      billing: null,
    });
  });

  it('flushes pending shipping edits with the billing copy when toggling on use-shipping', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderClearBillingHarness({ paymentUseShippingAddress: false });

    await user.clear(screen.getByLabelText('shippingFirstName'));
    await user.type(screen.getByLabelText('shippingFirstName'), 'Updated');

    const toggle = screen.getByRole('checkbox', {
      name: /use shipping address/i,
    });
    expect(toggle).not.toBeChecked();

    await user.click(toggle);

    await waitForOperation('UpdateCheckoutSessionDraftOrder');
    await waitFor(() => {
      expect(getOperations('UpdateCheckoutSessionDraftOrder')).toHaveLength(1);
    });
    expect(
      getOperations('UpdateCheckoutSessionDraftOrder')[0].input
    ).toMatchObject({
      shipping: { firstName: 'Updated', lastName: 'Buyer' },
      billing: { firstName: 'Updated', lastName: 'Buyer' },
    });
  });
});
