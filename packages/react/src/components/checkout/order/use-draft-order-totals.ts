import { useCheckoutContext } from "@/components/checkout/checkout";
import { getDraftOrderTotals } from "@/lib/godaddy/godaddy";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook to fetch draft order totals
 * @returns Query result with draft order totals data
 */
export function useDraftOrderTotals() {
	const { session } = useCheckoutContext();

	return useQuery({
		queryKey: ["draft-order-totals", { id: session?.id }],
		queryFn: () => getDraftOrderTotals(session),
		enabled: !!session?.id,
		select: (data) => data.checkoutSession?.draftOrder?.totals,
	});
}
