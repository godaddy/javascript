import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import {
  type CheckoutFormData,
  checkoutContext,
} from '@/components/checkout/checkout';
import { DraftOrderSyncProvider } from '@/components/checkout/order/draft-order-sync-provider';
import { useFlushCheckoutSync } from '@/components/checkout/payment/utils/use-flush-checkout-sync';
import {
  checkoutMutationKeys,
  checkoutQueryKeys,
} from '@/components/checkout/utils/query-keys';
import { GoDaddyProvider } from '@/godaddy-provider';
import {
  buildCheckoutSession,
  createTestQueryClient,
  flushPromises,
} from '../../__tests__/checkout-test-env';

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

interface HostProps {
  enableShipping?: boolean;
  enableTaxCollection?: boolean;
  includeFetches?: boolean;
  timeoutMs?: number;
  onCheckoutErrors?: (errors?: string[]) => void;
}

function InnerFlushButton({ includeFetches, timeoutMs = 200 }: HostProps) {
  const flushCheckoutSync = useFlushCheckoutSync();
  const [result, setResult] = React.useState('idle');

  return (
    <>
      <button
        type='button'
        onClick={() => {
          void flushCheckoutSync({ includeFetches, timeoutMs })
            .then(() => setResult('resolved'))
            .catch(() => setResult('rejected'));
        }}
      >
        Flush
      </button>
      <div data-testid='result'>{result}</div>
    </>
  );
}

function FlushButton({
  enableShipping = true,
  enableTaxCollection = true,
  includeFetches,
  timeoutMs = 200,
  onCheckoutErrors,
}: HostProps) {
  const session = React.useMemo(
    () =>
      buildCheckoutSession({
        enableShipping,
        enableTaxCollection,
      }),
    [enableShipping, enableTaxCollection]
  );
  const methods = useForm<CheckoutFormData>({ defaultValues: {} });
  const [checkoutErrors, setCheckoutErrorsState] = React.useState<
    string[] | undefined
  >();

  const setCheckoutErrors = React.useCallback(
    (errors?: string[]) => {
      setCheckoutErrorsState(errors);
      onCheckoutErrors?.(errors);
    },
    [onCheckoutErrors]
  );

  return (
    <checkoutContext.Provider
      value={{
        session,
        isConfirmingCheckout: false,
        setIsConfirmingCheckout: () => undefined,
        checkoutErrors,
        setCheckoutErrors,
      }}
    >
      <FormProvider {...methods}>
        <DraftOrderSyncProvider>
          <InnerFlushButton
            includeFetches={includeFetches}
            timeoutMs={timeoutMs}
          />
        </DraftOrderSyncProvider>
      </FormProvider>
    </checkoutContext.Provider>
  );
}
function renderHookHost(
  props: HostProps & {
    mutationKey?: readonly unknown[];
    queryKey?: readonly unknown[];
  } = {}
) {
  const queryClient = createTestQueryClient();
  const pendingMutation = props.mutationKey ? deferred() : undefined;
  const pendingFetch = props.queryKey ? deferred<unknown>() : undefined;

  if (props.mutationKey && pendingMutation) {
    const mutation = queryClient.getMutationCache().build(queryClient, {
      mutationKey: props.mutationKey,
      mutationFn: () => pendingMutation.promise,
    });
    void mutation.execute(undefined);
  }

  if (props.queryKey && pendingFetch) {
    void queryClient.fetchQuery({
      queryKey: props.queryKey,
      queryFn: () => pendingFetch.promise,
    });
  }

  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(
    <GoDaddyProvider queryClient={queryClient}>
      <FlushButton {...props} />
    </GoDaddyProvider>
  );
  return { queryClient, user, pendingMutation, pendingFetch };
}

async function clickFlush(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Flush' })).toBeEnabled()
  );
  await user.click(screen.getByRole('button', { name: 'Flush' }));
  await flushPromises();
}

describe('useFlushCheckoutSync', () => {
  it('excludes tax mutation waits when tax collection is disabled', async () => {
    const { user } = renderHookHost({
      enableTaxCollection: false,
      mutationKey:
        checkoutMutationKeys.updateDraftOrderTaxes('checkout-session-1'),
    });

    await clickFlush(user);

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('resolved');
    });
  });

  it('excludes shipping mutation waits when shipping is disabled', async () => {
    const { user } = renderHookHost({
      enableShipping: false,
      mutationKey:
        checkoutMutationKeys.applyShippingMethod('checkout-session-1'),
    });

    await clickFlush(user);

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('resolved');
    });
  });

  it('waits for included critical mutations and rejects on timeout', async () => {
    const onCheckoutErrors = vi.fn();
    const { user, pendingMutation } = renderHookHost({
      onCheckoutErrors,
      timeoutMs: 100,
      mutationKey: checkoutMutationKeys.updateDraftOrder('checkout-session-1'),
    });

    await clickFlush(user);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(151);
    });

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('rejected');
    });
    expect(onCheckoutErrors).toHaveBeenCalledWith([
      'DRAFT_ORDER_UPDATE_FAILED',
    ]);
    await act(async () => {
      pendingMutation?.resolve();
      await flushPromises();
    });
  });

  it('short-circuits fetch waits when includeFetches is false', async () => {
    const { user, pendingFetch } = renderHookHost({
      includeFetches: false,
      queryKey: checkoutQueryKeys.draftOrder('checkout-session-1'),
    });

    await clickFlush(user);

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('resolved');
    });
    await act(async () => {
      pendingFetch?.resolve({});
      await flushPromises();
    });
  });

  it('waits for included critical fetches and rejects on timeout', async () => {
    const onCheckoutErrors = vi.fn();
    const { user, pendingFetch } = renderHookHost({
      onCheckoutErrors,
      timeoutMs: 100,
      queryKey: checkoutQueryKeys.draftOrder('checkout-session-1'),
    });

    await clickFlush(user);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(151);
    });

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('rejected');
    });
    expect(onCheckoutErrors).toHaveBeenCalledWith([
      'DRAFT_ORDER_UPDATE_FAILED',
    ]);
    await act(async () => {
      pendingFetch?.resolve({});
      await flushPromises();
    });
  });
});
