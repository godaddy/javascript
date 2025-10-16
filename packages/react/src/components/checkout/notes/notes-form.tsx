"use client";

import { useCheckoutContext } from "@/components/checkout/checkout";
import { useDraftOrder } from "@/components/checkout/order/use-draft-order";
import { useDraftOrderFieldSync } from "@/components/checkout/order/use-draft-order-sync";
import {
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useGoDaddyContext } from "@/godaddy-provider";
import { eventIds } from "@/tracking/events";
import { TrackingEventType, track } from "@/tracking/track";
import { useDebouncedValue } from "@tanstack/react-pacer";
import React from "react";
import { useFormContext } from "react-hook-form";

export function NotesForm() {
	const form = useFormContext();
	const { t } = useGoDaddyContext();
	const { isConfirmingCheckout, requiredFields } = useCheckoutContext();
	const { data: draftOrder } = useDraftOrder();

	const notesField = form.watch("notes");

	const [notes] = useDebouncedValue(notesField, {
		wait: 1000,
	});

	// Track when notes are added (debounced)
	React.useEffect(() => {
		if (notes && notes.trim() !== "") {
			track({
				eventId: eventIds.addOrderNote,
				type: TrackingEventType.CLICK,
				properties: {
					hasNotes: true,
					noteLength: notes.length,
				},
			});
		}
	}, [notes]);

	// Check if notes value differs from order value
	const notesHasChanged = React.useMemo(() => {
		if (!draftOrder) return true; // If no order, allow sync
		const orderNotes =
			draftOrder.notes?.find((note) => note.authorType === "CUSTOMER")
				?.content || "";
		return orderNotes !== (notes || "");
	}, [draftOrder, notes]);

	useDraftOrderFieldSync({
		key: "notes",
		data: notes,
		deps: [notes, notesHasChanged],
		enabled: notesHasChanged && (notes?.trim() || "") !== "",
		fieldNames: ["notes"],
		preserveFormData: false,
		mapToInput: (notes) => ({
			notes: notes?.trim()
				? [
						{
							authorType: "CUSTOMER",
							content: notes.trim(),
						},
					]
				: null,
		}),
	});

	return (
		<div>
			<FormField
				control={form.control}
				name="notes"
				render={({ field, fieldState }) => (
					<FormItem>
						<FormLabel className="sr-only">{t.general.notes}</FormLabel>
						<Textarea
							placeholder={t.shipping.notesPlaceholder}
							{...field}
							hasError={!!fieldState.error}
							aria-required={requiredFields?.notes}
							disabled={isConfirmingCheckout}
						/>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}
