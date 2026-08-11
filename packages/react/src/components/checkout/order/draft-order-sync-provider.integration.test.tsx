import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import {
  type CheckoutFormData,
  checkoutContext,
} from '@/components/checkout/checkout';
import {
  type DraftOrderPatch,
  DraftOrderSyncProvider,
  useDraftOrderSyncQueue,
} from '@/components/checkout/order/draft-order-sync-provider';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import { GoDaddyProvider } from '@/godaddy-provider';
import type { CheckoutSession, DraftOrder } from '@/types';
import {
  buildCheckoutSession,
  buildDraftOrder,
  createTestQueryClient,
  flushPromises,
  getOperations,
  mockGodaddyApi,
  setApiError,
  setApiErrorOnce,
  waitForOperation,
} from '../__tests__/checkout-test-env';
import { getLastUpdateInput } from '../__tests__/checkout-test-fixtures';

function SyncConsumer() {
  const {
    enqueueDraftOrderPatch,
    flushDraftOrderSync,
    markDraftOrderSyncDirty,
    registerDraftOrderSync,
  } = useDraftOrderSyncQueue();
  const form = useFormContext<CheckoutFormData>();

  React.useEffect(
    () =>
      registerDraftOrderSync({
        id: 'shipping-name',
        fieldNames: ['shippingFirstName', 'shippingLastName'],
        debounceMs: 100,
        enabled: ({ values, draftOrder }) =>
          Boolean(
            draftOrder &&
              values.shippingFirstName?.trim() &&
              values.shippingLastName?.trim() &&
              ((draftOrder.shipping?.firstName || '') !==
                values.shippingFirstName ||
                (draftOrder.shipping?.lastName || '') !==
                  values.shippingLastName)
          ),
        buildPatch: ({ values }) => ({
          shipping: {
            firstName: values.shippingFirstName.trim(),
            lastName: values.shippingLastName.trim(),
          },
        }),
      }),
    [registerDraftOrderSync]
  );

  return (
    <div>
      <input aria-label='first name' {...form.register('shippingFirstName')} />
      <input aria-label='last name' {...form.register('shippingLastName')} />
      <span data-testid='shipping-first-name-dirty'>
        {String(!!form.formState.dirtyFields.shippingFirstName)}
      </span>
      <span data-testid='shipping-first-name-value'>
        {useWatch({ control: form.control, name: 'shippingFirstName' })}
      </span>
      <button
        type='button'
        onClick={() =>
          enqueueDraftOrderPatch(
            { shipping: { firstName: 'Alpha' } } as DraftOrderPatch,
            { fieldNames: ['shippingFirstName'], debounceMs: 100 }
          )
        }
      >
        enqueue-a
      </button>
      <button
        type='button'
        onClick={() =>
          enqueueDraftOrderPatch(
            { shipping: { lastName: 'Beta' } } as DraftOrderPatch,
            { fieldNames: ['shippingLastName'], debounceMs: 100 }
          )
        }
      >
        enqueue-b
      </button>
      <button
        type='button'
        onClick={() =>
          enqueueDraftOrderPatch(
            { billing: { firstName: 'Immediate' } } as DraftOrderPatch,
            { immediate: true }
          )
        }
      >
        enqueue-immediate
      </button>
      <button type='button' onClick={() => void flushDraftOrderSync()}>
        flush
      </button>
      <button
        type='button'
        onClick={() => markDraftOrderSyncDirty('shipping-name')}
      >
        mark-shipping-name
      </button>
      <button
        type='button'
        onClick={() => {
          form.setValue('shippingFirstName', 'Initial', { shouldDirty: true });
          form.setValue('shippingLastName', 'Buyer', { shouldDirty: true });
          markDraftOrderSyncDirty('shipping-name');
        }}
      >
        revert-shipping-name
      </button>
      <button
        type='button'
        onClick={() =>
          void flushDraftOrderSync({
            includeCurrentValues: true,
            refetchLatestOrder: true,
          })
        }
      >
        flush-current-values
      </button>
      <button
        type='button'
        onClick={() =>
          void flushDraftOrderSync({
            includeCurrentValues: true,
            refetchLatestOrder: true,
            allowWhileConfirming: true,
          })
        }
      >
        flush-final
      </button>
    </div>
  );
}

function SyncHarness({
  session,
  draftOrder,
  isConfirmingCheckout = false,
}: {
  session: CheckoutSession | null;
  draftOrder: DraftOrder;
  isConfirmingCheckout?: boolean;
}) {
  const [confirming, setConfirming] = React.useState(isConfirmingCheckout);
  const form = useForm<CheckoutFormData>({
    defaultValues: {
      shippingFirstName: 'Initial',
      shippingLastName: 'Buyer',
    } as CheckoutFormData,
  });

  return (
    <FormProvider {...form}>
      <checkoutContext.Provider
        value={{
          session,
          jwt: undefined,
          isConfirmingCheckout: confirming,
          setIsConfirmingCheckout: setConfirming,
          checkoutErrors: undefined,
          setCheckoutErrors: () => undefined,
        }}
      >
        <DraftOrderSyncProvider>
          <SyncConsumer />
          <button type='button' onClick={() => setConfirming(true)}>
            start-confirming
          </button>
        </DraftOrderSyncProvider>
      </checkoutContext.Provider>
    </FormProvider>
  );
}

function renderSyncHarness({
  session: providedSession,
  draftOrder: providedDraftOrder,
  updateDraftOrderDelayMs = 0,
  isConfirmingCheckout = false,
}: {
  session?: CheckoutSession | null;
  draftOrder?: DraftOrder;
  updateDraftOrderDelayMs?: number;
  isConfirmingCheckout?: boolean;
} = {}) {
  const draftOrder = providedDraftOrder ?? buildDraftOrder();
  const session =
    providedSession === undefined
      ? buildCheckoutSession({ draftOrder })
      : providedSession;
  const queryClient = createTestQueryClient();

  mockGodaddyApi({
    session: session ?? buildCheckoutSession({ draftOrder }),
    draftOrder,
    updateDraftOrderDelayMs,
  });

  if (session?.id) {
    queryClient.setQueryData(checkoutQueryKeys.draftOrder(session.id), {
      checkoutSession: { ...session, draftOrder },
    });
  }

  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(
    <GoDaddyProvider
      queryClient={queryClient}
      apiHost='api.godaddy.test'
      clientId='client-1'
      storeId={session?.storeId ?? undefined}
      channelId={session?.channelId ?? undefined}
    >
      <SyncHarness
        session={session}
        draftOrder={draftOrder}
        isConfirmingCheckout={isConfirmingCheckout}
      />
    </GoDaddyProvider>
  );

  return { user, session, draftOrder };
}

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
  await flushPromises();
}

describe('DraftOrderSyncProvider integration', () => {
  it('drains in-flight work serially and sends later enqueues as a second mutation', async () => {
    const { user } = renderSyncHarness({ updateDraftOrderDelayMs: 500 });

    await user.click(screen.getByRole('button', { name: 'enqueue-a' }));
    await advance(100);
    await waitForOperation('UpdateCheckoutSessionDraftOrder');

    await user.click(screen.getByRole('button', { name: 'enqueue-b' }));
    expect(getOperations('UpdateCheckoutSessionDraftOrder')).toHaveLength(1);

    await advance(500);
    await waitForOperation('UpdateCheckoutSessionDraftOrder', 2);

    const updates = getOperations('UpdateCheckoutSessionDraftOrder');
    expect(updates[0].input).toMatchObject({
      shipping: { firstName: 'Alpha' },
    });
    expect(updates[1].input).toMatchObject({
      shipping: { lastName: 'Beta' },
    });
  });

  it('restores a failed patch once and merges it with the next enqueue', async () => {
    const { user } = renderSyncHarness();
    setApiErrorOnce('updateDraftOrder', new Error('try again'));

    await user.click(screen.getByRole('button', { name: 'enqueue-a' }));
    await advance(100);
    await waitForOperation('UpdateCheckoutSessionDraftOrder');
    await flushPromises();

    await user.click(screen.getByRole('button', { name: 'enqueue-b' }));
    await advance(100);
    await waitForOperation('UpdateCheckoutSessionDraftOrder', 2);

    expect(
      getOperations('UpdateCheckoutSessionDraftOrder')[1].input
    ).toMatchObject({
      shipping: { firstName: 'Alpha', lastName: 'Beta' },
    });
  });

  it('replaces a rejected registration patch with the corrected value instead of retrying it', async () => {
    const { user } = renderSyncHarness();
    setApiError('updateDraftOrder', new Error('invalid value'));

    await user.clear(screen.getByLabelText('first name'));
    await user.type(screen.getByLabelText('first name'), 'Bad');
    await user.click(
      screen.getByRole('button', { name: 'mark-shipping-name' })
    );
    await advance(100);
    await waitForOperation('UpdateCheckoutSessionDraftOrder');
    expect(getLastUpdateInput()).toMatchObject({
      shipping: { firstName: 'Bad' },
    });

    await user.clear(screen.getByLabelText('first name'));
    await user.type(screen.getByLabelText('first name'), 'Good');
    await user.click(
      screen.getByRole('button', { name: 'mark-shipping-name' })
    );
    await advance(100);
    await waitForOperation('UpdateCheckoutSessionDraftOrder', 2);

    expect(getLastUpdateInput()).toMatchObject({
      shipping: { firstName: 'Good' },
    });
  });

  it('drops a rejected registration patch when the field is reverted to the order value', async () => {
    const { user } = renderSyncHarness({
      draftOrder: buildDraftOrder({
        shipping: { firstName: 'Initial', lastName: 'Buyer' },
      }),
    });
    setApiErrorOnce('updateDraftOrder', new Error('invalid value'));

    await user.clear(screen.getByLabelText('first name'));
    await user.type(screen.getByLabelText('first name'), 'Bad');
    await user.click(
      screen.getByRole('button', { name: 'mark-shipping-name' })
    );
    await advance(100);
    await waitForOperation('UpdateCheckoutSessionDraftOrder');
    expect(getLastUpdateInput()).toMatchObject({
      shipping: { firstName: 'Bad' },
    });

    await user.click(
      screen.getByRole('button', { name: 'revert-shipping-name' })
    );
    await advance(100);
    await flushPromises();

    expect(getOperations('UpdateCheckoutSessionDraftOrder')).toHaveLength(1);
  });

  it('flushDraftOrderSync clears debounce work and waits for the mutation to settle', async () => {
    const { user } = renderSyncHarness({ updateDraftOrderDelayMs: 500 });

    await user.click(screen.getByRole('button', { name: 'enqueue-a' }));
    await user.click(screen.getByRole('button', { name: 'flush' }));

    await waitForOperation('UpdateCheckoutSessionDraftOrder');
    expect(getOperations('UpdateCheckoutSessionDraftOrder')).toHaveLength(1);

    await advance(499);
    expect(getOperations('UpdateCheckoutSessionDraftOrder')).toHaveLength(1);

    await advance(1);
    await waitFor(() => {
      expect(getLastUpdateInput()).toMatchObject({
        shipping: { firstName: 'Alpha' },
      });
    });
  });

  it('supports immediate enqueue without waiting for debounce', async () => {
    const { user } = renderSyncHarness();

    await user.click(screen.getByRole('button', { name: 'enqueue-immediate' }));
    await waitForOperation('UpdateCheckoutSessionDraftOrder');

    expect(getLastUpdateInput()).toMatchObject({
      billing: { firstName: 'Immediate' },
    });
  });

  it('debounces dirty registrations and builds the patch from current form values', async () => {
    const { user } = renderSyncHarness();

    await user.clear(screen.getByLabelText('first name'));
    await user.type(screen.getByLabelText('first name'), 'Registered');
    await user.clear(screen.getByLabelText('last name'));
    await user.type(screen.getByLabelText('last name'), 'Buyer');
    await user.click(
      screen.getByRole('button', { name: 'mark-shipping-name' })
    );
    await advance(100);
    await waitForOperation('UpdateCheckoutSessionDraftOrder');

    expect(getLastUpdateInput()).toMatchObject({
      shipping: { firstName: 'Registered', lastName: 'Buyer' },
    });
  });

  it('includeCurrentValues flushes registered values even before a dirty mark', async () => {
    const { user } = renderSyncHarness();

    await user.clear(screen.getByLabelText('first name'));
    await user.type(screen.getByLabelText('first name'), 'Current');
    await user.click(
      screen.getByRole('button', { name: 'flush-current-values' })
    );
    await waitForOperation('UpdateCheckoutSessionDraftOrder');

    expect(getLastUpdateInput()).toMatchObject({
      shipping: { firstName: 'Current', lastName: 'Buyer' },
    });
    expect(getOperations('DraftOrder').length).toBeGreaterThan(0);
  });

  it('skips registration patches while confirming unless the flush is the final sync', async () => {
    const { user } = renderSyncHarness({ isConfirmingCheckout: true });

    await user.click(
      screen.getByRole('button', { name: 'flush-current-values' })
    );
    await flushPromises();

    expect(getOperations('UpdateCheckoutSessionDraftOrder')).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: 'flush-final' }));
    await waitForOperation('UpdateCheckoutSessionDraftOrder');

    expect(getLastUpdateInput()).toMatchObject({
      shipping: { firstName: 'Initial', lastName: 'Buyer' },
    });
  });

  it('sends queued patches on the final sync even after confirmation started', async () => {
    const { user } = renderSyncHarness();

    await user.click(screen.getByRole('button', { name: 'enqueue-a' }));
    await user.click(screen.getByRole('button', { name: 'start-confirming' }));
    await advance(100);
    expect(getOperations('UpdateCheckoutSessionDraftOrder')).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: 'flush-final' }));
    await waitForOperation('UpdateCheckoutSessionDraftOrder');

    expect(
      getOperations('UpdateCheckoutSessionDraftOrder')[0].input
    ).toMatchObject({
      shipping: { firstName: 'Alpha' },
    });
  });

  it('ignores newly queued patches after checkout confirmation starts', async () => {
    const { user } = renderSyncHarness({ isConfirmingCheckout: true });

    await user.click(screen.getByRole('button', { name: 'enqueue-a' }));
    await advance(100);

    expect(getOperations('UpdateCheckoutSessionDraftOrder')).toHaveLength(0);
  });

  it('drops debounced queued patches when checkout confirmation starts', async () => {
    const { user } = renderSyncHarness();

    await user.click(screen.getByRole('button', { name: 'enqueue-a' }));
    await user.click(screen.getByRole('button', { name: 'start-confirming' }));
    await advance(100);

    expect(getOperations('UpdateCheckoutSessionDraftOrder')).toHaveLength(0);
  });

  it('drops queued patches when the checkout session is missing', async () => {
    const { user } = renderSyncHarness({ session: null });

    await user.click(screen.getByRole('button', { name: 'enqueue-a' }));
    await advance(100);

    expect(getOperations('UpdateCheckoutSessionDraftOrder')).toHaveLength(0);
  });

  it('drops queued patches when the draft order id is missing', async () => {
    const draftOrder = buildDraftOrder({ id: '' });
    const session = buildCheckoutSession({ draftOrder });
    const { user } = renderSyncHarness({ session, draftOrder });

    await user.click(screen.getByRole('button', { name: 'enqueue-a' }));
    await advance(100);

    expect(getOperations('UpdateCheckoutSessionDraftOrder')).toHaveLength(0);
  });

  it('resets successful fields with the latest user value as the new default', async () => {
    const { user } = renderSyncHarness();
    const input = screen.getByLabelText('first name');

    await user.clear(input);
    await user.type(input, 'Alpha');
    expect(input).toHaveValue('Alpha');
    expect(screen.getByTestId('shipping-first-name-dirty')).toHaveTextContent(
      'true'
    );

    await user.click(screen.getByRole('button', { name: 'enqueue-a' }));
    await advance(100);
    await waitForOperation('UpdateCheckoutSessionDraftOrder');

    await waitFor(() => {
      expect(screen.getByTestId('shipping-first-name-dirty')).toHaveTextContent(
        'false'
      );
    });
    expect(input).toHaveValue('Alpha');
    expect(getOperations('UpdateCheckoutSessionDraftOrder')).toHaveLength(1);
  });

  it('does not mark a field pristine when it changes while its save is in flight', async () => {
    const { user } = renderSyncHarness({ updateDraftOrderDelayMs: 500 });
    const input = screen.getByLabelText('first name');

    await user.clear(input);
    await user.type(input, 'Alpha');
    await user.click(screen.getByRole('button', { name: 'enqueue-a' }));
    await advance(100);
    await waitForOperation('UpdateCheckoutSessionDraftOrder');

    await user.clear(input);
    await user.type(input, 'Beta');
    await advance(500);

    await waitFor(() => {
      expect(screen.getByTestId('shipping-first-name-dirty')).toHaveTextContent(
        'true'
      );
      expect(screen.getByTestId('shipping-first-name-value')).toHaveTextContent(
        'Beta'
      );
    });
  });
});
