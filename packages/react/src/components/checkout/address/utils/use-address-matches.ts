import { useCheckoutContext } from "@/components/checkout/checkout";
import { getAddressMatches } from "@/lib/godaddy/godaddy";
import { useQuery } from "@tanstack/react-query";

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
	} = { enabled: true },
) {
	const { session } = useCheckoutContext();

	return useQuery({
		queryKey: ["addressMatchesQuery", debouncedAddressValue],
		queryFn: () => getAddressMatches({ query: debouncedAddressValue }, session),
		enabled: !!debouncedAddressValue && !!session?.id && options.enabled,
		placeholderData: (prev) => prev,
		select: (data) => data.checkoutSession?.addresses,
	});
}
