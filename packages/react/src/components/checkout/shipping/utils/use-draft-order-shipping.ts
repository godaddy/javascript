import { useCheckoutContext } from "@/components/checkout/checkout";
import { getDraftOrderShipping } from "@/lib/godaddy/godaddy";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook to fetch draft order shipping information
 * @returns Query result with shipping line data
 */
export function useDraftOrderShipping() {
	const { session } = useCheckoutContext();

	return useQuery({
		queryKey: ["draft-order-shipping", { id: session?.id }],
		queryFn: () => getDraftOrderShipping(session),
		enabled: !!session?.id,
		select: (data) => data.checkoutSession?.draftOrder?.shippingLines?.[0],
	});
}
