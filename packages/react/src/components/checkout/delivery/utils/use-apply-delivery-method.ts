import { useMutation } from "@tanstack/react-query";
import { useCheckoutContext } from "@/components/checkout/checkout";
import { useGoDaddyContext } from "@/godaddy-provider";
import { applyDeliveryMethod } from "@/lib/godaddy/godaddy";
import type { ApplyCheckoutSessionDeliveryMethodInput } from "@/types";

export function useApplyDeliveryMethod() {
	const { session, jwt } = useCheckoutContext();
	const { apiHost } = useGoDaddyContext();

	return useMutation({
		mutationKey: session?.id
			? ["apply-delivery-method", session.id]
			: ["apply-delivery-method"],
		mutationFn: async (
			mode: ApplyCheckoutSessionDeliveryMethodInput["input"]["mode"],
		) => {
			if (!session) return;
			return await applyDeliveryMethod({ mode }, { accessToken: jwt }, apiHost);
		},
	});
}
