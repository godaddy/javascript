"use client";

import { useCheckoutContext } from "@/components/checkout/checkout";
import { useGoDaddyContext } from "@/godaddy-provider";
import { cn } from "@/lib/utils";

export type Target =
	| "checkout.before"
	| "checkout.after"
	| "checkout.form.before"
	| "checkout.form.after"
	| "checkout.form.contact.before"
	| "checkout.form.contact.after"
	| "checkout.form.express-checkout.before"
	| "checkout.form.express-checkout.after"
	| "checkout.form.pickup.before"
	| "checkout.form.pickup.after"
	| "checkout.form.pickup.form.before"
	| "checkout.form.delivery.before"
	| "checkout.form.delivery.after"
	| "checkout.form.tips.before"
	| "checkout.form.tips.after"
	| "checkout.form.shipping.before"
	| "checkout.form.shipping.after"
	| "checkout.form.payment.before"
	| "checkout.form.payment.after"
	| "checkout.form.submit.before"
	| "checkout.form.submit.after"
	| "checkout.summary.before"
	| "checkout.summary.after";

export function Target({ id }: { id: Target }) {
	const { debug } = useGoDaddyContext();
	const { targets } = useCheckoutContext();

	const target = targets?.[id];

	return (
		<div
			id={id}
			className={cn(
				debug && "border border-dashed border-blue-300 p-3 rounded-md",
				"m-0",
			)}
		>
			{target ? (
				target?.()
			) : debug ? (
				<span className="text-xs text-blue-500">{id}</span>
			) : null}
		</div>
	);
}
