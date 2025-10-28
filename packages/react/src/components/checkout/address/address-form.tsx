"use client";

import {
	countries,
	getRegions,
	hasRegionData,
} from "@/components/checkout/address/get-country-region";
import { isAddressComplete } from "@/components/checkout/address/utils/is-address-complete";
import { mapAddressFieldsToInput } from "@/components/checkout/address/utils/map-address-fields-to-input";
import { useAddressMatches } from "@/components/checkout/address/utils/use-address-matches";
import { useCheckoutContext } from "@/components/checkout/checkout";
import { PhoneInput } from "@/components/checkout/contact/phone-input";
import { useDraftOrder } from "@/components/checkout/order/use-draft-order";
import { useDraftOrderFieldSync } from "@/components/checkout/order/use-draft-order-sync";
import { AutoComplete } from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useGoDaddyContext } from "@/godaddy-provider";
import { cn } from "@/lib/utils";
import { eventIds } from "@/tracking/events";
import { TrackingEventType, track } from "@/tracking/track";
import type { Address } from "@/types";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { useFormContext } from "react-hook-form";

export function AddressForm({ sectionKey }: { sectionKey: string }) {
	const form = useFormContext();
	const { session } = useCheckoutContext();
	const { t } = useGoDaddyContext();
	const { isConfirmingCheckout, requiredFields } = useCheckoutContext();

	const { data: draftOrder } = useDraftOrder();
	const countryTriggerRef = React.useRef<HTMLButtonElement>(null);
	const [triggerWidth, setTriggerWidth] = React.useState<number | null>(null);
	const [isCountrySelectOpen, setCountrySelectOpen] =
		React.useState<boolean>(false);
	const [isAutocompleteOpen, setIsAutocompleteOpen] =
		React.useState<boolean>(false);

	React.useEffect(() => {
		function updateWidth() {
			if (countryTriggerRef.current) {
				setTriggerWidth(countryTriggerRef.current.clientWidth);
			}
		}
		updateWidth();
		window.addEventListener("resize", updateWidth);
		return () => window.removeEventListener("resize", updateWidth);
	}, []);

	const addressValue = form.watch(`${sectionKey}AddressLine1`);
	const countryValue = form.watch(`${sectionKey}CountryCode`);
	const useShippingAddress = form.watch("paymentUseShippingAddress");

	const [
		firstName,
		lastName,
		addressLine1,
		addressLine2,
		addressLine3,
		adminArea1,
		adminArea2,
		adminArea3,
		adminArea4,
		postalCode,
		countryCode,
	] = form.watch([
		`${sectionKey}FirstName`,
		`${sectionKey}LastName`,
		`${sectionKey}AddressLine1`,
		`${sectionKey}AddressLine2`,
		`${sectionKey}AddressLine3`,
		`${sectionKey}AdminArea1`,
		`${sectionKey}AdminArea2`,
		`${sectionKey}AdminArea3`,
		`${sectionKey}AdminArea4`,
		`${sectionKey}PostalCode`,
		`${sectionKey}CountryCode`,
	]);

	const contact = React.useMemo(
		() => ({ firstName, lastName }),
		[firstName, lastName],
	);

	const [debouncedFullName] = useDebouncedValue(
		Object.values(contact).join(""),
		{
			wait: 1000,
		},
	);

	const [debouncedAddressValue] = useDebouncedValue(addressValue, {
		wait: 200,
	});

	// Check if name values differ from order values
	const nameHasChanged = React.useMemo(() => {
		if (!draftOrder) return true; // If no order, allow sync
		const section =
			sectionKey === "shipping" ? draftOrder.shipping : draftOrder.billing;

		return (
			(section?.firstName || "") !== (firstName || "") ||
			(section?.lastName || "") !== (lastName || "")
		);
	}, [draftOrder, sectionKey, firstName, lastName]);

	const shouldVerifyName =
		nameHasChanged && // Only sync if values differ from order
		debouncedFullName !== "" &&
		debouncedFullName === Object.values(contact).join("");

	useDraftOrderFieldSync({
		key: "name",
		data: contact,
		deps: [contact],
		enabled: shouldVerifyName,
		fieldNames: [`${sectionKey}FirstName`, `${sectionKey}LastName`],
		mapToInput: (data) => {
			return mapAddressFieldsToInput(
				{
					firstName: data.firstName.trim(),
					lastName: data.lastName.trim(),
				},
				sectionKey as "shipping" | "billing",
				useShippingAddress,
			);
		},
	});

	const address = React.useMemo(
		() => ({
			addressLine1,
			addressLine2,
			addressLine3,
			adminArea1,
			adminArea2,
			adminArea3,
			adminArea4,
			postalCode,
			countryCode,
		}),
		[
			addressLine1,
			addressLine2,
			addressLine3,
			adminArea1,
			adminArea2,
			adminArea3,
			adminArea4,
			postalCode,
			countryCode,
		],
	);

	const [debouncedFullAddress] = useDebouncedValue(
		Object.values(address).join(""),
		{ wait: 1000 },
	);

	// Get existing order address data for comparison
	const orderAddress = React.useMemo(() => {
		if (!draftOrder) return null;
		const section =
			sectionKey === "shipping" ? draftOrder.shipping : draftOrder.billing;
		return section
			? {
					addressLine1: section?.address?.addressLine1 || "",
					addressLine2: section?.address?.addressLine2 || "",
					addressLine3: section?.address?.addressLine3 || "",
					adminArea1: section?.address?.adminArea1 || "",
					adminArea2: section?.address?.adminArea2 || "",
					adminArea3: section?.address?.adminArea3 || "",
					adminArea4: section?.address?.adminArea4 || "",
					postalCode: section?.address?.postalCode || "",
					countryCode: section?.address?.countryCode || "",
				}
			: null;
	}, [draftOrder, sectionKey]);

	// Check if current form values differ from order values
	const addressHasChanged = React.useMemo(() => {
		if (!orderAddress) return true; // If no order address, allow sync

		return (
			orderAddress.addressLine1 !== (addressLine1 || "") ||
			orderAddress.addressLine2 !== (addressLine2 || "") ||
			orderAddress.addressLine3 !== (addressLine3 || "") ||
			orderAddress.adminArea1 !== (adminArea1 || "") ||
			orderAddress.adminArea2 !== (adminArea2 || "") ||
			orderAddress.adminArea3 !== (adminArea3 || "") ||
			orderAddress.adminArea4 !== (adminArea4 || "") ||
			orderAddress.postalCode !== (postalCode || "") ||
			orderAddress.countryCode !== (countryCode || "")
		);
	}, [
		orderAddress,
		addressLine1,
		addressLine2,
		addressLine3,
		adminArea1,
		adminArea2,
		adminArea3,
		adminArea4,
		postalCode,
		countryCode,
	]);

	const addressLine1HasChanged = React.useMemo(() => {
		if (!orderAddress) return true;

		return orderAddress.addressLine1 !== (addressLine1 || "");
	}, [orderAddress, addressLine1]);

	const addressMatchesQuery = useAddressMatches(debouncedAddressValue, {
		enabled:
			!!session?.enableAddressAutocomplete &&
			!!debouncedAddressValue &&
			countryValue === "US" &&
			addressLine1HasChanged,
	});

	function handleUpdateAddress(address?: Address) {
		if (!address) return;

		const fieldMap: Record<string, string | null> = {
			AddressLine1: address.addressLine1,
			AddressLine2: address.addressLine2,
			AdminArea2: address.adminArea3,
			AdminArea1: address.adminArea1,
			PostalCode: address.postalCode,
		};

		for (const [key, value] of Object.entries(fieldMap)) {
			if (value) {
				form.setValue(`${sectionKey}${key}`, value, { shouldValidate: true });
			}
		}
	}

	const shouldUpdateAddress = Boolean(
		addressHasChanged && // Only sync if values differ from order
			!!debouncedFullAddress &&
			isAddressComplete(address) &&
			debouncedFullAddress === Object.values(address).join("") &&
			debouncedFullAddress.trim() !== "" &&
			!isAutocompleteOpen,
	);

	useDraftOrderFieldSync({
		key: "address",
		data: address,
		deps: [address, shouldUpdateAddress],
		enabled: shouldUpdateAddress,
		fieldNames: [
			`${sectionKey}AddressLine1`,
			`${sectionKey}AddressLine2`,
			`${sectionKey}City`,
			`${sectionKey}AdminArea1`,
			`${sectionKey}PostalCode`,
			`${sectionKey}CountryCode`,
		],
		mapToInput: (data) => {
			return mapAddressFieldsToInput(
				{
					address: data,
				},
				sectionKey as "shipping" | "billing",
				useShippingAddress,
			);
		},
	});

	return (
		<fieldset className="space-y-2" disabled={isConfirmingCheckout}>
			<FormField
				control={form.control}
				name={`${sectionKey}CountryCode`}
				render={({ field, fieldState }) => (
					<FormItem className="flex flex-col">
						<FormLabel className="sr-only">{t.shipping.country}</FormLabel>
						<Popover
							open={isCountrySelectOpen}
							onOpenChange={setCountrySelectOpen}
						>
							<PopoverTrigger asChild>
								<FormControl>
									<Button
										ref={countryTriggerRef}
										variant="outline"
										className={cn(
											"rounded-md shadow-none justify-between px-3 font-normal hover:bg-muted bg-card active:ring h-12",
											!field.value && "text-muted-foreground",
										)}
										hasError={!!fieldState.error}
										disabled={isConfirmingCheckout}
										aria-required={requiredFields?.[`${sectionKey}CountryCode`]}
										tabIndex={0}
									>
										{field.value
											? countries.find(
													(country) => country.value === field.value,
												)?.label
											: t.shipping.selectCountry}
										<ChevronsUpDown className="opacity-50" />
									</Button>
								</FormControl>
							</PopoverTrigger>
							<PopoverContent
								className="p-0 rounded-md"
								style={{
									width: triggerWidth ? `${triggerWidth + 2}px` : "100%",
								}}
							>
								<Command>
									<CommandInput
										placeholder={t.shipping.searchCountry}
										className="h-12"
										disabled={isConfirmingCheckout}
									/>
									<CommandList>
										<CommandEmpty>{t.shipping.noCountryFound}</CommandEmpty>
										<CommandGroup>
											{countries.map((country) => (
												<CommandItem
													value={country.label}
													key={country.value}
													onSelect={() => {
														// Get current country before setting the new one
														const previousCountry = form.getValues(
															`${sectionKey}CountryCode`,
														);

														// Set the new country value
														form.setValue(
															`${sectionKey}CountryCode`,
															country.value,
															{
																shouldValidate: true,
															},
														);

														if (previousCountry !== country.value) {
															form.setValue(`${sectionKey}AddressLine1`, "", {
																shouldDirty: true,
																shouldValidate: false,
															});
															form.setValue(`${sectionKey}AdminArea1`, "", {
																shouldDirty: true,
																shouldValidate: false,
															});
															form.setValue(`${sectionKey}AdminArea2`, "", {
																shouldDirty: true,
																shouldValidate: false,
															});
															form.setValue(`${sectionKey}PostalCode`, "", {
																shouldDirty: true,
																shouldValidate: false,
															});
														}

														// Track country selection event
														track({
															eventId: eventIds.changeCountry,
															type: TrackingEventType.CLICK,
															properties: {
																sectionKey,
																countryCode: country.value,
																countryName: country.label,
															},
														});

														setCountrySelectOpen(false);
													}}
													disabled={isConfirmingCheckout}
												>
													{country.label}
													<Check
														className={cn(
															"ml-auto",
															country.value === field.value
																? "opacity-100"
																: "opacity-0",
														)}
													/>
												</CommandItem>
											))}
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>
						<FormMessage />
					</FormItem>
				)}
			/>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
				<FormField
					control={form.control}
					name={`${sectionKey}FirstName`}
					render={({ field, fieldState }) => (
						<FormItem className="space-y-1">
							<FormLabel className="sr-only">
								{t.shipping.firstName} ({t.general.optional})
							</FormLabel>
							<FormControl>
								<Input
									placeholder={t.shipping.firstName}
									hasError={!!fieldState.error}
									aria-required={requiredFields?.[`${sectionKey}FirstName`]}
									{...field}
									disabled={isConfirmingCheckout}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name={`${sectionKey}LastName`}
					render={({ field, fieldState }) => (
						<FormItem className="space-y-1">
							<FormLabel className="sr-only">{t.shipping.lastName}</FormLabel>
							<FormControl>
								<Input
									placeholder={t.shipping.lastName}
									hasError={!!fieldState.error}
									aria-required={requiredFields?.[`${sectionKey}LastName`]}
									{...field}
									disabled={isConfirmingCheckout}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<FormField
				control={form.control}
				name={`${sectionKey}AddressLine1`}
				render={({ field, fieldState }) => (
					<FormItem>
						<FormLabel className="sr-only">{t.shipping.address1}</FormLabel>
						<FormControl>
							{countryValue === "US" && session?.enableAddressAutocomplete ? (
								<AutoComplete
									data={addressMatchesQuery.data || []}
									value={field.value}
									onChange={field.onChange}
									onSelect={(address) => {
										handleUpdateAddress(address as Address);
									}}
									onOpenChange={setIsAutocompleteOpen}
									isLoading={
										addressMatchesQuery?.isLoading ||
										addressMatchesQuery?.isFetching
									}
									hasError={!!fieldState.error}
									aria-required={requiredFields?.[`${sectionKey}AddressLine1`]}
									disabled={isConfirmingCheckout}
								/>
							) : (
								<Input
									placeholder={t.shipping.address1}
									hasError={!!fieldState.error}
									aria-required={requiredFields?.[`${sectionKey}AddressLine1`]}
									{...field}
									disabled={isConfirmingCheckout}
									autoComplete="off"
								/>
							)}
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name={`${sectionKey}AddressLine2`}
				render={({ field, fieldState }) => (
					<FormItem className="space-y-1">
						<FormLabel className="sr-only">{t.shipping.address2}</FormLabel>
						<FormControl>
							<Input
								placeholder={t.shipping.address2}
								hasError={!!fieldState.error}
								aria-required={requiredFields?.[`${sectionKey}AddressLine2`]}
								{...field}
								disabled={isConfirmingCheckout}
								autoComplete="off"
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
				<FormField
					control={form.control}
					name={`${sectionKey}AdminArea2`}
					render={({ field, fieldState }) => (
						<FormItem className="space-y-1">
							<FormLabel className="sr-only">{t.shipping.city}</FormLabel>
							<FormControl>
								<Input
									placeholder={t.shipping.city}
									hasError={!!fieldState.error}
									aria-required={requiredFields?.[`${sectionKey}AdminArea2`]}
									{...field}
									disabled={isConfirmingCheckout}
									autoComplete="off"
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name={`${sectionKey}AdminArea1`}
					render={({ field, fieldState }) => (
						<FormItem className="space-y-1">
							<FormLabel className="sr-only">{t.shipping.region}</FormLabel>
							<FormControl>
								{hasRegionData(countryValue) ? (
									<Select
										value={field.value}
										onValueChange={(value) => {
											field.onChange(value);
											form.setValue(`${sectionKey}AdminArea1`, value, {
												shouldValidate: true,
											});

											form.setValue(`${sectionKey}PostalCode`, "", {
												shouldDirty: true,
												shouldValidate: false,
											});

											// Track region selection event
											track({
												eventId: eventIds.changeRegion,
												type: TrackingEventType.CLICK,
												properties: {
													sectionKey,
													countryCode: countryValue,
													regionCode: value,
													regionName: getRegions(countryValue)?.find(
														(r) => r.code === value,
													)?.label,
												},
											});
										}}
										disabled={isConfirmingCheckout}
									>
										<FormControl>
											<SelectTrigger
												hasError={!!fieldState.error}
												disabled={isConfirmingCheckout}
												aria-required={
													requiredFields?.[`${sectionKey}AdminArea1`]
												}
												tabIndex={0}
											>
												<SelectValue placeholder={t.shipping.region} />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{getRegions(countryValue)?.map((region) => (
												<SelectItem
													key={region.code}
													value={region.code}
													disabled={isConfirmingCheckout}
												>
													{region.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								) : (
									<Input
										placeholder={t.shipping.region}
										{...field}
										hasError={!!fieldState.error}
										aria-required={requiredFields?.[`${sectionKey}AdminArea1`]}
										disabled={isConfirmingCheckout}
										autoComplete="off"
									/>
								)}
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name={`${sectionKey}PostalCode`}
					render={({ field, fieldState }) => (
						<FormItem className="space-y-1">
							<FormLabel className="sr-only">{t.shipping.postalCode}</FormLabel>
							<FormControl>
								<Input
									placeholder={t.shipping.postalCode}
									hasError={!!fieldState.error}
									aria-required={requiredFields?.[`${sectionKey}PostalCode`]}
									{...field}
									disabled={isConfirmingCheckout}
									autoComplete="off"
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			<PhoneInput sectionKey={sectionKey} disabled={isConfirmingCheckout} />
		</fieldset>
	);
}
