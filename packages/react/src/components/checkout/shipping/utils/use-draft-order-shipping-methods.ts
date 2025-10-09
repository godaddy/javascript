import { useCheckoutContext } from "@/components/checkout/checkout";
import { useDraftOrderShippingAddress } from "@/components/checkout/order/use-draft-order";
import { getDraftOrderShippingMethods } from "@/lib/godaddy/godaddy";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook to fetch available shipping methods for the draft order
 * @returns Query result with shipping rates data
 */
export function useDraftOrderShippingMethods() {
	const { session } = useCheckoutContext();
	const { data: shippingAddress } = useDraftOrderShippingAddress();

	const hasShippingAddress = !!shippingAddress;

	return useQuery({
		queryKey: [
			"draft-order-shipping-methods",
			{
				id: session?.id,
				address: shippingAddress?.addressLine1,
				postalCode: shippingAddress?.postalCode,
			},
		],
		queryFn: () => getDraftOrderShippingMethods(session),
		enabled: !!session?.id && hasShippingAddress,
		select: (data) =>
			data?.checkoutSession?.draftOrder?.calculatedShippingRates?.rates,
	});
}
