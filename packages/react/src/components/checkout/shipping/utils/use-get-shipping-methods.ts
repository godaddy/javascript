import { useMutation } from "@tanstack/react-query";
import { useCheckoutContext } from "@/components/checkout/checkout";
import { useGoDaddyContext } from "@/godaddy-provider";
import { getDraftOrderShippingMethods } from "@/lib/godaddy/godaddy";
import type { GetCheckoutSessionShippingRatesInput } from "@/types";

export function useGetShippingMethodByAddress() {
	const { session, jwt } = useCheckoutContext();
	const { apiHost } = useGoDaddyContext();

	return useMutation({
		mutationKey: session?.id
			? ["get-shipping-method-by-address", session.id]
			: ["get-shipping-method-by-address"],
		mutationFn: async (
			destination: GetCheckoutSessionShippingRatesInput["destination"],
		) => {
			if (!session) return;

			const data = await getDraftOrderShippingMethods(
				{ accessToken: jwt },
				destination,
				apiHost,
			);

			return (
				data.checkoutSession?.draftOrder?.calculatedShippingRates?.rates || []
			);
		},
	});
}
