import {
	type CheckoutFormData,
	useCheckoutContext,
} from "@/components/checkout/checkout";
import { useApplyDeliveryMethod } from "@/components/checkout/delivery/utils/use-apply-delivery-method";
import { useRemoveShippingMethod } from "@/components/checkout/shipping/utils/use-remove-shipping-method";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useGoDaddyContext } from "@/godaddy-provider";
import { TrackingEventType, track } from "@/tracking/track";
import { Store, Truck } from "lucide-react";
import { useFormContext } from "react-hook-form";

export enum DeliveryMethods {
	NONE = "NONE",
	PICKUP = "PICKUP",
	SHIP = "SHIP",
	CURBSIDE = "CURBSIDE",
	DELIVERY = "DELIVERY",
	DRIVE_THRU = "DRIVE_THRU",
	FOR_HERE = "FOR_HERE",
	TO_GO = "TO_GO",
	DIGITAL = "DIGITAL",
	PURCHASE = "PURCHASE",
	GENERAL_CONTAINER = "GENERAL_CONTAINER",
	QUICK_STAY = "QUICK_STAY",
	REGULAR_STAY = "REGULAR_STAY",
	NON_LODGING_NRR = "NON_LODGING_NRR",
	NON_LODGING_SALE = "NON_LODGING_SALE",
	GIFT_CARD = "GIFT_CARD",
}

export interface DeliveryMethod {
	id: CheckoutFormData["deliveryMethod"];
	name: string;
	description: string;
	icon: React.ReactNode;
}

const DELIVERY_METHODS: DeliveryMethod[] = [
	{
		id: DeliveryMethods.SHIP,
		name: "Shipping", // This will be replaced with localized version in component
		description: "Ship to your address", // This will be replaced with localized version in component
		icon: <Truck className="h-4 w-4 opacity-50" />,
	},
	{
		id: DeliveryMethods.PICKUP,
		name: "Local Pickup", // This will be replaced with localized version in component
		description: "Pick up from store location", // This will be replaced with localized version in component
		icon: <Store className="h-4 w-4 opacity-50" />,
	},
];

export function DeliveryMethodForm() {
	const { t } = useGoDaddyContext();
	const form = useFormContext();
	const { session, isConfirmingCheckout } = useCheckoutContext();
	const removeShippingMethod = useRemoveShippingMethod();
	const applyDeliveryMethod = useApplyDeliveryMethod();
	const shippingMethod = form.watch("shippingMethod");

	const handleDeliveryMethodChange = (value: DeliveryMethods) => {
		form.setValue("deliveryMethod", value);
		if (value === DeliveryMethods.PICKUP) {
			if (shippingMethod) {
				removeShippingMethod.mutate(shippingMethod);
				form.setValue("shippingMethod", undefined);
			}
		} else {
			applyDeliveryMethod.mutate(value);
		}
		track({
			eventId: "change_delivery_method.click",
			type: TrackingEventType.CLICK,
			properties: {
				deliveryMethod: value,
			},
		});
	};

	const availableMethods = [
		DELIVERY_METHODS[0],
		...(session?.enableLocalPickup ? [DELIVERY_METHODS[1]] : []),
	];

	return (
		<div className="space-y-2">
			<div>
				<Label>{t.delivery.method}</Label>
			</div>
			{availableMethods.length === 1 ? (
				<Label htmlFor={availableMethods[0].id} className="font-medium">
					<div className="flex items-center justify-between space-x-2 bg-card border border-border p-2 px-4 rounded-md">
						<div className="flex items-center space-x-4">
							<div className="inline-flex flex-col">
								{availableMethods[0].id === DeliveryMethods.SHIP
									? t.delivery.shipping
									: t.delivery.localPickup}
								<p className="text-xs text-muted-foreground">
									{availableMethods[0].id === DeliveryMethods.SHIP
										? t.delivery.shipToAddress
										: t.delivery.pickupFromStore}
								</p>
							</div>
						</div>
						<div className="flex items-center">{availableMethods[0].icon}</div>
					</div>
				</Label>
			) : (
				<FormField
					control={form.control}
					name="deliveryMethod"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<RadioGroup
									defaultValue={field.value || DeliveryMethods.SHIP}
									onValueChange={handleDeliveryMethodChange}
									required
									disabled={isConfirmingCheckout}
								>
									{availableMethods.map((method, index) => (
										<Label
											key={method.id}
											htmlFor={method.id}
											className="font-medium"
										>
											<div
												className={`flex items-center justify-between space-x-2 bg-card border border-border p-2 px-4 hover:bg-muted 
											${index === 0 ? "rounded-t-md" : "border-t-0"} 
											${index === availableMethods.length - 1 ? "rounded-b-md" : ""} 
											${method.id === field.value ? "bg-muted" : ""}
											`}
											>
												<div className="flex items-center space-x-4">
													<FormControl>
														<RadioGroupItem value={method.id} id={method.id} />
													</FormControl>
													<div className="inline-flex flex-col">
														{method.id === DeliveryMethods.SHIP
															? t.delivery.shipping
															: t.delivery.localPickup}
														<p className="text-xs text-muted-foreground">
															{method.id === DeliveryMethods.SHIP
																? t.delivery.shipToAddress
																: t.delivery.pickupFromStore}
														</p>
													</div>
												</div>
												<div className="flex items-center">{method.icon}</div>
											</div>
										</Label>
									))}
								</RadioGroup>
							</FormControl>
						</FormItem>
					)}
				/>
			)}
		</div>
	);
}
