import { useMemo } from "react";
import type { z } from "zod";
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
import {
	mapOrderToFormValues,
	mapSkusToItemsDisplay,
} from "@/components/checkout/utils/checkout-transformers";

interface CheckoutFormContainerProps extends Omit<CheckoutProps, "session"> {
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

	const { data: order } = draftOrderQuery;
	const { data: lineItems } = draftOrderLineItemsQuery;

	console.log(order);

	const items = useMemo(
		() => mapSkusToItemsDisplay(lineItems, skusMap),
		[lineItems, skusMap],
	);

	const formValues = useMemo(
		() => ({
			...mapOrderToFormValues({
				order,
				defaultValues: props.defaultValues,
				defaultCountryCode: session?.shipping?.originAddress?.countryCode,
			}),
		}),
		[order, props.defaultValues, session?.shipping?.originAddress?.countryCode],
	);

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
