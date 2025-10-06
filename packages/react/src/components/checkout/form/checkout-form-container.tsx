import {
	type CheckoutProps,
	useCheckoutContext,
} from "@/components/checkout/checkout";
import { CheckoutSkeleton } from "@/components/checkout/checkout-skeleton";
import { CheckoutForm } from "@/components/checkout/form/checkout-form";
import {
	useDraftOrder,
	useDraftOrderLineItems,
} from "@/components/checkout/order/use-draft-order";
import { useDraftOrderProductsMap } from "@/components/checkout/order/use-draft-order-products";
import { useUpdateTaxes } from "@/components/checkout/order/use-update-taxes";
import {
	mapOrderToFormValues,
	mapSkusToItemsDisplay,
} from "@/components/checkout/utils/checkout-transformers";
import { useEffect, useMemo, useRef } from "react";
import type { z } from "zod";

interface CheckoutFormContainerProps extends Omit<CheckoutProps, "session"> {
	// biome-ignore lint/suspicious/noExplicitAny: TODO: Fix this
	schema: z.ZodObject<any> | z.ZodEffects<any>;
}

export function CheckoutFormContainer({
	schema,
	...props
}: CheckoutFormContainerProps) {
	const { session, isConfirmingCheckout } = useCheckoutContext();

	const draftOrderQuery = useDraftOrder();
	const draftOrderLineItemsQuery = useDraftOrderLineItems();
	const skusMap = useDraftOrderProductsMap();
	const updateTaxes = useUpdateTaxes();

	const { data: order } = draftOrderQuery;
	const { data: lineItems } = draftOrderLineItemsQuery;

	const items = useMemo(
		() => mapSkusToItemsDisplay(lineItems, skusMap),
		[lineItems, skusMap],
	);

	const formValues = useMemo(
		() => ({
			...mapOrderToFormValues(order, props.defaultValues),
		}),
		[order, props.defaultValues],
	);

	const hasCalledUpdateTaxes = useRef(false);

	useEffect(() => {
		if (
			!hasCalledUpdateTaxes.current &&
			order &&
			(order.billing?.address || order.shipping?.address) &&
			session?.enableTaxCollection
		) {
			updateTaxes.mutate(undefined);
			hasCalledUpdateTaxes.current = true;
		}
	}, [order, updateTaxes, session]);

	if (!isConfirmingCheckout && !draftOrderQuery.isLoading && !order) {
		const returnUrl = session?.returnUrl;
		if (returnUrl) {
			window.location.href = returnUrl;
			return null;
		}
	}

	if (draftOrderQuery.isLoading) {
		return <CheckoutSkeleton direction={props.direction} />;
	}

	return (
		<CheckoutForm
			{...props}
			schema={schema}
			items={items}
			defaultValues={formValues}
			direction={props.direction}
		/>
	);
}
