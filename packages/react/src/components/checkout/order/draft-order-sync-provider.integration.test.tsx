import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
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
  setApiErrorOnce,
  waitForOperation,
} from '../__tests__/checkout-test-env';
import { getLastUpdateInput } from '../__tests__/checkout-test-fixtures';

function SyncConsumer() {
  const { enqueueDraftOrderPatch, flushDraftOrderSync } =
    useDraftOrderSyncQueue();
  const form = useFormContext<CheckoutFormData>();

  return (
    <div>
      <input aria-label='first name' {...form.register('shippingFirstName')} />
      <span data-testid='shipping-first-name-dirty'>
        {String(!!form.formState.dirtyFields.shippingFirstName)}
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
    await user.type(input, 'Typed Value');
    expect(input).toHaveValue('Typed Value');
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
    expect(input).toHaveValue('Typed Value');
    expect(getOperations('UpdateCheckoutSessionDraftOrder')).toHaveLength(1);
  });
});
