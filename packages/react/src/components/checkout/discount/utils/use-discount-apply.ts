import { useCheckoutContext } from "@/components/checkout/checkout";
import { DeliveryMethods } from "@/components/checkout/delivery/delivery-method";
import { useDraftOrder } from "@/components/checkout/order/use-draft-order";
import { useUpdateTaxes } from "@/components/checkout/order/use-update-taxes";
import { applyDiscount } from "@/lib/godaddy/godaddy";
import type { DraftOrderQuery } from "@/lib/godaddy/queries";
import type { ApplyCheckoutSessionDiscountInput } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ResultOf } from "gql.tada";
import { useFormContext } from "react-hook-form";

export function useDiscountApply() {
	const { session } = useCheckoutContext();
	const form = useFormContext();
	const queryClient = useQueryClient();
	const updateTaxes = useUpdateTaxes();
	const { data: draftOrder } = useDraftOrder();

	return useMutation({
		mutationKey: ["apply-discount", { sessionId: session?.id }],
		mutationFn: async ({
			discountCodes,
		}: {
			discountCodes: ApplyCheckoutSessionDiscountInput["input"]["discountCodes"];
		}) => {
			if (!session) return;
			return await applyDiscount(discountCodes, session);
		},
		onSuccess: (data, { discountCodes }) => {
			if (!session) return;

			const discountTotal =
				data?.applyCheckoutSessionDiscount?.totals?.discountTotal;
			const responseData = data?.applyCheckoutSessionDiscount;
			// Update the cached draft-order query (includes totals)

			if (discountTotal) {
				queryClient.setQueryData(
					["draft-order", { id: session.id }],
					(old: ResultOf<typeof DraftOrderQuery> | undefined) => {
						if (!old) return old;
						return {
							...old,
							checkoutSession: {
								...old.checkoutSession,
								draftOrder: {
									...old?.checkoutSession?.draftOrder,
									totals: {
										...old?.checkoutSession?.draftOrder?.totals,
										discountTotal,
										total:
											responseData?.totals?.total ||
											old?.checkoutSession?.draftOrder?.totals?.total,
									},
									// Update order-level discounts
									discounts:
										responseData?.discounts ||
										old?.checkoutSession?.draftOrder?.discounts ||
										[],
									// Update lineItem discounts
									lineItems:
										responseData?.lineItems
											?.map((responseLineItem) => {
												const existingLineItem =
													old?.checkoutSession?.draftOrder?.lineItems?.find(
														(li) => li.id === responseLineItem.id,
													);
												return existingLineItem
													? {
															...existingLineItem,
															discounts: responseLineItem.discounts || [],
														}
													: existingLineItem;
											})
											.filter(Boolean) ||
										old?.checkoutSession?.draftOrder?.lineItems,
									// Update shippingLine discounts
									shippingLines:
										responseData?.shippingLines
											?.map((responseShippingLine, index) => {
												const existingShippingLine =
													old?.checkoutSession?.draftOrder?.shippingLines?.[
														index
													];
												return existingShippingLine
													? {
															...existingShippingLine,
															discounts: responseShippingLine.discounts || [],
														}
													: existingShippingLine;
											})
											.filter(Boolean) ||
										old?.checkoutSession?.draftOrder?.shippingLines,
								},
							},
						};
					},
				);
			}

			if (!discountCodes?.length) {
				// If no discount codes, we need to remove any existing discounts from the cache
				queryClient.setQueryData(
					["draft-order", { id: session.id }],
					(old: ResultOf<typeof DraftOrderQuery> | undefined) => {
						if (!old) return old;
						return {
							...old,
							checkoutSession: {
								...old.checkoutSession,
								draftOrder: {
									...old?.checkoutSession?.draftOrder,
									discounts: [],
									lineItems: old?.checkoutSession?.draftOrder?.lineItems?.map(
										(li) => ({
											...li,
											discounts: [],
										}),
									),
									shippingLines:
										old?.checkoutSession?.draftOrder?.shippingLines?.map(
											(sl) => ({
												...sl,
												discounts: [],
											}),
										) || null,
								},
							},
						};
					},
				);
			}

			if (session?.enableTaxCollection) {
				// If the delivery method is pickup, we need to update taxes based on the pickup location
				// Otherwise, we can just update taxes without a specific address
				// TODO: Move this to API layer
				const deliveryMethod = form.getValues("deliveryMethod");
				const isPickup = deliveryMethod === DeliveryMethods.PICKUP;

				if (isPickup) {
					const pickupLocationId = form.getValues("pickupLocationId");
					const locationAddress = session?.locations?.find(
						(loc) => loc.id === pickupLocationId,
					)?.address;

					if (locationAddress) {
						updateTaxes.mutate(locationAddress);
					}
				} else {
					// Only update taxes if we have the required location data
					const hasRequiredLocationData =
						draftOrder?.shipping?.address?.postalCode &&
						draftOrder?.shipping?.address?.countryCode;

					if (hasRequiredLocationData) {
						updateTaxes.mutate(undefined);
					}
				}
			} else {
				queryClient.invalidateQueries({
					queryKey: ["draft-order", { id: session?.id }],
				});
			}
		},
	});
}
