import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { checkoutQueryKeys } from '@/components/checkout/utils/query-keys';
import { useGoDaddyContext } from '@/godaddy-provider';
import { getProductsFromOrderSkus } from '@/lib/godaddy/godaddy';
import type { DraftOrder, SKUProduct } from '@/types';

/**
 * Hook to fetch products from SKUs in the draft order
 * @returns Query result with SKU product data
 */
export function useDraftOrderProducts() {
  const { session, jwt } = useCheckoutContext();
  const { apiHost } = useGoDaddyContext();

  return useQuery({
    queryKey: checkoutQueryKeys.draftOrderProducts(session?.id),
    queryFn: () =>
      jwt
        ? getProductsFromOrderSkus({ accessToken: jwt }, apiHost)
        : getProductsFromOrderSkus(session, apiHost),
    enabled: !!session?.id,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnMount: false,
    refetchOnWindowFocus: 'always',
    select: data => data.checkoutSession?.skus?.edges,
  });
}

function getLineItemProductIdentity(
  lineItems: DraftOrder['lineItems'] | null | undefined
) {
  if (!lineItems) return null;

  const identities = lineItems.map(lineItem => {
    if (lineItem.details?.sku) return `sku:${lineItem.details.sku}`;
    if (lineItem.productId) return `product:${lineItem.productId}`;
    return `line:${lineItem.id}`;
  });

  return JSON.stringify([...new Set(identities)].sort());
}

export function useRefreshProductsWhenLineItemsChange(
  lineItems: DraftOrder['lineItems'] | null | undefined
) {
  const { session } = useCheckoutContext();
  const queryClient = useQueryClient();
  const identity = getLineItemProductIdentity(lineItems);
  const previousRef = useRef<
    | {
        sessionId: string;
        identity: string;
      }
    | undefined
  >(undefined);

  useEffect(() => {
    if (!session?.id || identity === null) return;

    const previous = previousRef.current;
    previousRef.current = { sessionId: session.id, identity };

    if (previous?.sessionId === session.id && previous.identity !== identity) {
      void queryClient.invalidateQueries({
        queryKey: checkoutQueryKeys.draftOrderProducts(session.id),
      });
    }
  }, [identity, queryClient, session?.id]);
}

/**
 * Hook to get products from SKUs in the draft order as a map for easy lookup
 * @returns Map of SKU ID to SKU product data
 */
export function useDraftOrderProductsMap() {
  const { data: skus } = useDraftOrderProducts();

  return useMemo(() => {
    if (!skus) return {};

    const result: Record<string, SKUProduct> = {};

    for (const edge of skus) {
      if (edge?.node?.code) {
        result[edge.node.code] = edge.node;
      }
    }

    return result;
  }, [skus]);
}
