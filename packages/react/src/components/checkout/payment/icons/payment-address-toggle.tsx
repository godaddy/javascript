import { useCheckoutContext } from "@/components/checkout/checkout";
import { useTryUpdateDraftOrder } from "@/components/checkout/order/use-try-update-draft-order";
import { Checkbox } from "@/components/ui/checkbox";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import { useGoDaddyContext } from "@/godaddy-provider";
import { eventIds } from "@/tracking/events";
import { TrackingEventType, track } from "@/tracking/track";
import React from "react";
import { useFormContext } from "react-hook-form";

export function PaymentAddressToggle({ className }: { className?: string }) {
	const { t } = useGoDaddyContext();
	const { isConfirmingCheckout } = useCheckoutContext();
	const form = useFormContext();
	const tryUpdateDraftOrder = useTryUpdateDraftOrder();

	function syncBillingAddressWithShippingAddress() {
		tryUpdateDraftOrder({
			billing: {
				firstName: form.getValues("shippingFirstName"),
				lastName: form.getValues("shippingLastName"),
				phone: form.getValues("shippingPhone"),
				address: {
					// Use the shipping address fields for billing address
					// This assumes that the form has these fields defined
					// and they are correctly populated with shipping address data
					addressLine1: form.getValues("shippingAddressLine1"),
					addressLine2: form.getValues("shippingAddressLine2"),
					addressLine3: form.getValues("shippingAddressLine3"),
					adminArea4: form.getValues("shippingAdminArea4"),
					adminArea3: form.getValues("shippingAdminArea3"),
					adminArea2: form.getValues("shippingAdminArea2"),
					adminArea1: form.getValues("shippingAdminArea1"),
					postalCode: form.getValues("shippingPostalCode"),
					countryCode: form.getValues("shippingCountryCode"),
				},
			},
		});
		form.setValue("billingFirstName", form.getValues("shippingFirstName"), {
			shouldValidate: true,
		});
		form.setValue("billingLastName", form.getValues("shippingLastName"), {
			shouldValidate: true,
		});
		form.setValue("billingPhone", form.getValues("shippingPhone"), {
			shouldValidate: true,
		});
		form.setValue(
			"billingAddressLine1",
			form.getValues("shippingAddressLine1"),
			{
				shouldValidate: true,
			},
		);
		form.setValue(
			"billingAddressLine2",
			form.getValues("shippingAddressLine2"),
			{
				shouldValidate: true,
			},
		);
		form.setValue(
			"billingAddressLine3",
			form.getValues("shippingAddressLine3"),
			{
				shouldValidate: true,
			},
		);
		form.setValue("billingAdminArea4", form.getValues("shippingAdminArea4"), {
			shouldValidate: true,
		});
		form.setValue("billingAdminArea3", form.getValues("shippingAdminArea3"), {
			shouldValidate: true,
		});
		form.setValue("billingAdminArea2", form.getValues("shippingAdminArea2"), {
			shouldValidate: true,
		});
		form.setValue("billingAdminArea1", form.getValues("shippingAdminArea1"), {
			shouldValidate: true,
		});
		form.setValue("billingPostalCode", form.getValues("shippingPostalCode"), {
			shouldValidate: true,
		});
		form.setValue("billingCountryCode", form.getValues("shippingCountryCode"), {
			shouldValidate: true,
		});
	}

	return (
		<div className={className}>
			<FormField
				control={form.control}
				name="paymentUseShippingAddress"
				render={({ field }) => (
					<FormItem className="flex items-center space-x-2">
						<FormControl>
							<Checkbox
								disabled={isConfirmingCheckout}
								checked={field.value}
								onCheckedChange={(value) => {
									form.setValue("paymentUseShippingAddress", value, {
										shouldDirty: false,
									});

									// Track billing address toggle
									track({
										eventId: eventIds.toggleSameAsBillingAddress,
										type: TrackingEventType.CLICK,
										properties: {
											useShippingAddress: !!value,
										},
									});

									if (value) {
										syncBillingAddressWithShippingAddress();
									} else {
										form.setValue("billingAddressLine1", "");
										form.setValue("billingAddressLine2", "");
										form.setValue("billingAddressLine3", "");
										form.setValue("billingAdminArea4", "");
										form.setValue("billingAdminArea3", "");
										form.setValue("billingAdminArea2", "");
										form.setValue("billingAdminArea1", "");
										form.setValue("billingPostalCode", "");
										form.setValue("billingCountryCode", "");
										form.setValue("billingFirstName", "");
										form.setValue("billingLastName", "");
										form.setValue("billingPhone", "");
									}
								}}
							/>
						</FormControl>
						<FormLabel className="text-sm font-normal">
							{t.payment.billingAddress.useShippingAddress}
						</FormLabel>
					</FormItem>
				)}
			/>
		</div>
	);
}
