import { useIsFetching, useIsMutating } from '@tanstack/react-query';

/**
 * Returns true while checkout-related React Query work may be in flight.
 *
 * TODO: Move checkout-critical queries/mutations to an explicit metadata
 * convention (for example, `meta: { checkoutCritical: true }`) and count only
 * those operations here. For now this intentionally mirrors the existing
 * payment-disable behavior and treats any active query/mutation as checkout
 * busy, which is conservative and future-proof for newly added operations.
 */
export function useIsCheckoutBusy(): boolean {
  const isMutating = useIsMutating();
  const isFetching = useIsFetching();

  return isMutating > 0 || isFetching > 0;
}
