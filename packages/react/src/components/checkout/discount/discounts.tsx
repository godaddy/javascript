"use client";

import { DiscountTag } from "@/components/checkout/discount/discount-tag";
import type { DiscountsProps } from "./types";

export function Discounts({
	discounts,
	onRemove,
	isRemovingDiscount,
}: DiscountsProps) {
	// const { data: orderData } = useOrder({ orderId: "test" });

	if (!discounts.length) return null;

	// remove duplicate discounts
	const uniqueDiscountsSet = new Set(discounts?.map((d) => d));
	const uniqueDiscounts = Array.from(uniqueDiscountsSet);

	return (
		<div className="flex flex-wrap gap-2">
			{uniqueDiscounts?.map?.((discount) => (
				<DiscountTag
					key={discount}
					discount={discount}
					isRemoving={isRemovingDiscount === discount}
					onRemove={() => onRemove(discount)}
				/>
			))}
		</div>
	);
}
