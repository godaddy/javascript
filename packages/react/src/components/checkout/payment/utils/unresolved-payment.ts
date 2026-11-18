import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';

export type PaymentFlow = 'card' | 'express';

/**
 * A provider payment that may already have moved money but isn't confirmed on
 * the order yet (today: a Stripe intent after a 3-D Secure challenge).
 *
 * Only the flow that created it resumes it, because card and express checkouts
 * send different taxes, shipping and totals. Every other confirmation for the
 * session is blocked until it resolves, whatever the payment provider, so a
 * second payment can't be taken while the first one may have succeeded.
 */
export type UnresolvedPayment = {
  flow: PaymentFlow;
  paymentReference: string;
  paymentType?: string;
};

export const PAYMENT_STILL_CONFIRMING = 'PAYMENT_STILL_CONFIRMING';

/**
 * A GraphQLErrorWithCodes, so every payment button's existing error handling
 * shows the code without knowing about it. Nothing was sent to the server.
 */
export class UnresolvedPaymentError extends GraphQLErrorWithCodes {
  constructor() {
    super([
      {
        code: PAYMENT_STILL_CONFIRMING,
        message:
          'A previous payment for this checkout is still being confirmed',
      },
    ]);
    this.name = 'UnresolvedPaymentError';
  }
}

export function isUnresolvedPaymentError(
  error: unknown
): error is UnresolvedPaymentError {
  return error instanceof UnresolvedPaymentError;
}

export function getUnresolvedPayment(
  queryClient: QueryClient,
  sessionId: string | undefined | null
): UnresolvedPayment | undefined {
  if (!sessionId) return undefined;
  return (
    queryClient.getQueryData<UnresolvedPayment | null>(
      checkoutQueryKeys.unresolvedPayment(sessionId)
    ) ?? undefined
  );
}

/**
 * Throws unless the confirmation is the owning flow resuming its own payment.
 * Called at the start of every confirmation, before any request is sent.
 */
export function assertNoUnresolvedPayment(
  queryClient: QueryClient,
  sessionId: string | undefined | null,
  attempt: { flow: PaymentFlow | 'authorize'; paymentToken?: string | null }
) {
  const unresolved = getUnresolvedPayment(queryClient, sessionId);
  if (!unresolved) return;
  if (
    unresolved.flow === attempt.flow &&
    unresolved.paymentReference === attempt.paymentToken
  ) {
    return;
  }
  throw new UnresolvedPaymentError();
}

/** Session-scoped access shared by every payment flow under one QueryClient. */
export function useUnresolvedPayment() {
  const queryClient = useQueryClient();
  const { session } = useCheckoutContext();
  const sessionId = session?.id;

  const get = useCallback(
    () => getUnresolvedPayment(queryClient, sessionId),
    [queryClient, sessionId]
  );

  const set = useCallback(
    (payment: UnresolvedPayment) => {
      if (!sessionId) return;
      const queryKey = checkoutQueryKeys.unresolvedPayment(sessionId);
      // Not fetched, only written: keep it until it's cleared, even with no observer.
      queryClient.setQueryDefaults(queryKey, {
        gcTime: Number.POSITIVE_INFINITY,
        staleTime: Number.POSITIVE_INFINITY,
      });
      queryClient.setQueryData(queryKey, payment);
    },
    [queryClient, sessionId]
  );

  const clear = useCallback(
    (flow: PaymentFlow) => {
      if (!sessionId) return;
      const queryKey = checkoutQueryKeys.unresolvedPayment(sessionId);
      if (
        queryClient.getQueryData<UnresolvedPayment>(queryKey)?.flow !== flow
      ) {
        return;
      }
      queryClient.setQueryData(queryKey, null);
    },
    [queryClient, sessionId]
  );

  return { get, set, clear };
}
