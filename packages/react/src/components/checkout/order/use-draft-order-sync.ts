import {
	type CheckoutFormData,
	useCheckoutContext,
} from "@/components/checkout/checkout";
import { useDraftOrder } from "@/components/checkout/order/use-draft-order";
import { useUpdateOrder } from "@/components/checkout/order/use-update-order";
import type { DraftOrder, UpdateDraftOrderInput } from "@/types";
import * as React from "react";
import { type UseFormReturn, useFormContext } from "react-hook-form";

// Helper function to check if an address object has required fields
function hasRequiredAddressFields(address: Record<string, unknown>): boolean {
	const requiredFields = [
		"addressLine1",
		"countryCode",
		"postalCode",
		"adminArea1",
	];
	return requiredFields.every(
		(field) => address[field] && address[field] !== "",
	);
}

// Helper function to filter out empty strings from an object
function filterEmptyStrings(
	obj: Record<string, unknown>,
): Record<string, unknown> {
	const filtered: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(obj)) {
		if (value !== "") {
			if (
				typeof value === "object" &&
				value !== null &&
				!Array.isArray(value)
			) {
				// Special handling for address objects
				if (key === "address") {
					const addressObj = value as Record<string, unknown>;
					if (hasRequiredAddressFields(addressObj)) {
						const filteredNested = filterEmptyStrings(addressObj);
						if (Object.keys(filteredNested).length > 0) {
							filtered[key] = filteredNested;
						}
					}
				} else {
					const filteredNested = filterEmptyStrings(
						value as Record<string, unknown>,
					);
					if (Object.keys(filteredNested).length > 0) {
						filtered[key] = filteredNested;
					}
				}
			} else {
				filtered[key] = value;
			}
		}
	}
	return filtered;
}

// Helper function to get current form data for both shipping and billing
function getCurrentFormData(form: UseFormReturn<CheckoutFormData>) {
	const shipping = filterEmptyStrings({
		firstName: form.getValues("shippingFirstName"),
		lastName: form.getValues("shippingLastName"),
		phone: form.getValues("shippingPhone"),
		email: form.getValues("contactEmail"),
		address: {
			addressLine1: form.getValues("shippingAddressLine1"),
			addressLine2: form.getValues("shippingAddressLine2"),
			addressLine3: form.getValues("shippingAddressLine3"),
			adminArea1: form.getValues("shippingAdminArea1"),
			adminArea2: form.getValues("shippingAdminArea2"),
			adminArea3: form.getValues("shippingAdminArea3"),
			adminArea4: form.getValues("shippingAdminArea4"),
			postalCode: form.getValues("shippingPostalCode"),
			countryCode: form.getValues("shippingCountryCode"),
		},
	});

	const billing = filterEmptyStrings({
		firstName: form.getValues("billingFirstName"),
		lastName: form.getValues("billingLastName"),
		phone: form.getValues("billingPhone"),
		email: form.getValues("contactEmail"),
		address: {
			addressLine1: form.getValues("billingAddressLine1"),
			addressLine2: form.getValues("billingAddressLine2"),
			addressLine3: form.getValues("billingAddressLine3"),
			adminArea1: form.getValues("billingAdminArea1"),
			adminArea2: form.getValues("billingAdminArea2"),
			adminArea3: form.getValues("billingAdminArea3"),
			adminArea4: form.getValues("billingAdminArea4"),
			postalCode: form.getValues("billingPostalCode"),
			countryCode: form.getValues("billingCountryCode"),
		},
	});

	return { shipping, billing };
}

// Helper function to get only changed contact fields
function getChangedContactFields(
	formData: {
		[key: string]: unknown;
		address?: { [key: string]: unknown } | null;
	},
	draftData:
		| { [key: string]: unknown; address?: { [key: string]: unknown } | null }
		| null
		| undefined,
) {
	if (!draftData) return formData;

	const changes: { [key: string]: unknown } = {};
	let hasChanges = false;

	// Compare contact fields
	const contactFields = ["firstName", "lastName", "phone", "email"];
	for (const field of contactFields) {
		const formValue = formData[field] || null;
		const draftValue = draftData[field] || null;
		if (formValue !== draftValue) {
			changes[field] = formData[field];
			hasChanges = true;
		}
	}

	// Compare address fields
	if (formData.address && draftData.address) {
		const addressFields = [
			"addressLine1",
			"addressLine2",
			"addressLine3",
			"adminArea1",
			"adminArea2",
			"adminArea3",
			"adminArea4",
			"postalCode",
			"countryCode",
		];

		const addressChanges: { [key: string]: unknown } = {};
		let hasAddressChanges = false;

		for (const field of addressFields) {
			const formValue = formData.address[field] || null;
			const draftValue = draftData.address[field] || null;
			if (formValue !== draftValue) {
				addressChanges[field] = formData.address[field];
				hasAddressChanges = true;
			}
		}

		if (hasAddressChanges) {
			changes.address = addressChanges;
			hasChanges = true;
		}
	} else if (formData.address && !draftData.address) {
		changes.address = formData.address;
		hasChanges = true;
	}

	return hasChanges ? changes : null;
}

// Helper function to merge updates with existing form data, only including changed values
function mergeWithExistingFormData(
	updates: Omit<UpdateDraftOrderInput["input"], "context">,
	form: UseFormReturn<CheckoutFormData>,
	draftOrder: DraftOrder | null | undefined,
	preserveFormData = true,
): Omit<UpdateDraftOrderInput["input"], "context"> {
	if (!preserveFormData || !draftOrder) return updates;

	const currentData = getCurrentFormData(form);
	const useShippingAddress = form.getValues("paymentUseShippingAddress");
	const result = { ...updates };

	// If updating shipping, only include changed shipping data
	if (updates.shipping) {
		const shippingChanges = getChangedContactFields(
			currentData.shipping,
			draftOrder.shipping,
		);
		if (shippingChanges) {
			result.shipping = {
				...shippingChanges,
				...updates.shipping, // Override with any explicit updates
			};
		} else {
			// Only include explicit updates if no form changes
			result.shipping = updates.shipping;
		}

		// If paymentUseShippingAddress is true, also update billing with shipping data
		if (useShippingAddress && result.shipping) {
			result.billing = {
				...result.shipping,
			};
		}
	}

	// If updating billing, only include changed billing data
	if (updates.billing && !useShippingAddress) {
		const billingChanges = getChangedContactFields(
			currentData.billing,
			draftOrder.billing,
		);
		if (billingChanges) {
			result.billing = {
				...billingChanges,
				...updates.billing, // Override with any explicit updates
			};
		} else {
			// Only include explicit updates if no form changes
			result.billing = updates.billing;
		}
	}

	return result;
}

export function useDraftOrderFieldSync<T>({
	data,
	deps,
	enabled,
	mapToInput,
	key,
	fieldNames,
	preserveFormData = true,
}: {
	data: T;
	deps: React.DependencyList;
	enabled: boolean;
	mapToInput: (data: T) => Omit<UpdateDraftOrderInput["input"], "context">;
	key: string;
	fieldNames?: string[];
	preserveFormData?: boolean;
}) {
	const lastSubmittedRef = React.useRef<Record<string, string>>({});
	const updateDraftOrder = useUpdateOrder();
	const { session } = useCheckoutContext();
	const { data: draftOrderData } = useDraftOrder();
	const form = useFormContext<CheckoutFormData>();
	const pendingResetRef = React.useRef<string[]>([]);

	React.useEffect(() => {
		if (!enabled) return;

		const memoKey = key ?? "default";
		const currentSerialized = JSON.stringify(data);

		const hasChanged = lastSubmittedRef.current[memoKey] !== currentSerialized;

		if (!hasChanged) return;

		lastSubmittedRef.current[memoKey] = currentSerialized;

		if (!session) return;
		const { channelId, storeId, customerId } = session;
		if (!channelId || !storeId || !draftOrderData?.id) return;

		const rawInput = mapToInput(data);
		const input = mergeWithExistingFormData(
			rawInput,
			form,
			draftOrderData,
			preserveFormData,
		);

		// Don't sync if input is effectively empty (only contains context/customerId)
		const hasActualContent = Object.entries(input).some(
			([key, value]) =>
				key !== "context" && key !== "customerId" && value != null,
		);

		if (!hasActualContent) return;

		// Track that we're expecting a reset for these fields
		if (fieldNames) {
			pendingResetRef.current = [...fieldNames];
		}

		updateDraftOrder.mutate(
			{
				input: {
					...input,
					context: { channelId, storeId },
					...(customerId ? { customerId } : {}),
				},
			},
			{
				onSuccess: () => {
					// Only reset if this mutation was from this specific hook instance
					if (pendingResetRef.current.length > 0 && form) {
						for (const fieldName of pendingResetRef.current) {
							const currentValue = form.getValues(
								fieldName as keyof CheckoutFormData,
							);
							form.resetField(fieldName as keyof CheckoutFormData, {
								defaultValue: currentValue,
							});
						}
						pendingResetRef.current = [];
					}
				},
				onError: () => {
					// Clear pending reset on error
					pendingResetRef.current = [];
				},
			},
		);
	}, [
		enabled,
		data,
		mapToInput,
		key,
		updateDraftOrder,
		session,
		form,
		fieldNames,
		preserveFormData,
		draftOrderData,
		...deps,
	]);
}
