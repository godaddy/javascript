import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useCheckoutApi } from '@/hooks/use-checkout-api';
import type {
  DraftOrder,
  DraftOrderSession,
  ShippingLines,
  Totals,
} from '@/types';

/**
 * Hook to fetch the entire draft order
 * @param select Optional selector function to extract specific data from the response
 * @param key Optional custom key to differentiate queries
 * @returns Query result with draft order data
 */
export function useDraftOrder<TData = DraftOrder>(
  select?: (data: DraftOrderSession) => TData,
  key = 'draft-order'
): UseQueryResult<TData> {
  const { session } = useCheckoutContext();
  const api = useCheckoutApi(session);

  return useQuery<DraftOrderSession, Error, TData>({
    queryKey: [key, { id: session?.id }],
    queryFn: () => api.getDraftOrder(),
    enabled: !!session?.id,
    select: select ?? (data => data.checkoutSession?.draftOrder as TData),
    retry: 3,
  });
}

export function useDraftOrderLineItems() {
  return useDraftOrder<DraftOrder['lineItems']>(
    data => data.checkoutSession?.draftOrder?.lineItems ?? null,
    'draft-order'
  );
}

export function useDraftOrderShippingAddress() {
  return useDraftOrder<NonNullable<DraftOrder['shipping']>['address']>(
    data => data.checkoutSession?.draftOrder?.shipping?.address ?? null,
    'draft-order'
  );
}

export function useDraftOrderTotals() {
  return useDraftOrder<Totals | null>(
    data => data.checkoutSession?.draftOrder?.totals ?? null,
    'draft-order'
  );
}

export function useDraftOrderShipping() {
  return useDraftOrder<ShippingLines | null>(
    data => data.checkoutSession?.draftOrder?.shippingLines?.[0] ?? null,
    'draft-order'
  );
}
