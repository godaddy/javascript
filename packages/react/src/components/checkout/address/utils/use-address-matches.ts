import { useQuery } from '@tanstack/react-query';
import { useCheckoutContext } from '@/components/checkout/checkout';
import { useCheckoutApi } from '@/hooks/use-checkout-api';

/**
 * Hook to fetch address matches for address autocomplete
 * @param debouncedAddressValue The debounced address value to search for
 * @param options Additional options for the query
 * @param options.enabled Whether the query should be enabled
 * @returns Query result with address matches data
 */
export function useAddressMatches(
  debouncedAddressValue: string,
  options: {
    enabled: boolean;
  } = { enabled: true }
) {
  const { session } = useCheckoutContext();
  const api = useCheckoutApi(session);

  return useQuery({
    queryKey: ['addressMatchesQuery', debouncedAddressValue],
    queryFn: () => api.getAddressMatches({ query: debouncedAddressValue }),
    enabled: !!debouncedAddressValue && !!session?.id && options.enabled,
    placeholderData: prev => prev,
    select: data => data.checkoutSession?.addresses,
  });
}
