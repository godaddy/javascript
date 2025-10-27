"use client";

import {
	countries,
	getRegions,
	hasRegionData,
} from "@/components/checkout/address/get-country-region";
// TEMPORARY: Comment out autocomplete/verification imports - will be restored later
// import { checkIsValidAddress } from "@/components/checkout/address/utils/check-is-valid-address";
// import { formatSingleLineAddress } from "@/components/checkout/address/utils/format-address";
// import { isAddressComplete } from "@/components/checkout/address/utils/is-address-complete";
import { mapAddressFieldsToInput } from "@/components/checkout/address/utils/map-address-fields-to-input";
// import { useAddressMatches } from "@/components/checkout/address/utils/use-address-matches";
// import { useAddressVerification } from "@/components/checkout/address/utils/use-address-verification";
import { useCheckoutContext } from "@/components/checkout/checkout";
import { PhoneInput } from "@/components/checkout/contact/phone-input";
import { useDraftOrder } from "@/components/checkout/order/use-draft-order";
import { useDraftOrderFieldSync } from "@/components/checkout/order/use-draft-order-sync";
// import { AutoComplete } from "@/components/ui/autocomplete";
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
// import type { Address } from "@/types";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { useFormContext } from "react-hook-form";

export function AddressForm({ sectionKey }: { sectionKey: string }) {
	const form = useFormContext();
	const { t } = useGoDaddyContext();
	const { isConfirmingCheckout, requiredFields } = useCheckoutContext();

	const { data: draftOrder } = useDraftOrder();
	const countryTriggerRef = React.useRef<HTMLButtonElement>(null);
	const [triggerWidth, setTriggerWidth] = React.useState<number | null>(null);
	// TEMPORARY: Comment out suggested address state - will be restored later
	// const [showSuggestedAddress, setShowSuggestedAddress] = React.useState(false);
	const [isCountrySelectOpen, setCountrySelectOpen] =
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

	// TEMPORARY: Comment out address value watching for autocomplete - will be restored later
	// const addressValue = form.watch(`${sectionKey}AddressLine1`);
	const countryValue = form.watch(`${sectionKey}CountryCode`);

	// Reset AdminArea1 if current value is not valid for the selected country
	React.useEffect(() => {
		if (countryValue) {
			const currentAdminArea1 = form.getValues(`${sectionKey}AdminArea1`);
			if (hasRegionData(countryValue) && currentAdminArea1) {
				const regions = getRegions(countryValue);
				const isValidRegion = regions.some(
					(region) => region.code === currentAdminArea1,
				);
				if (!isValidRegion) {
					form.setValue(`${sectionKey}AdminArea1`, "", {
						shouldValidate: true,
						shouldDirty: true,
						shouldTouch: true,
					});
					// Force validation for this specific field
					form.trigger(`${sectionKey}AdminArea1`);
				}
			}
		}
	}, [countryValue, form, sectionKey]);

	const useShippingAddress = form.watch("paymentUseShippingAddress");

	// const [debouncedAddressValue] = useDebouncedValue(addressValue, {
	// 	wait: 200,
	// });

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

	// const addressMatchesQuery = useAddressMatches(debouncedAddressValue, {
	// 	enabled:
	// 		!!line1AddressIsDirty &&
	// 		!!debouncedAddressValue &&
	// 		countryValue === "US" &&
	// 		debouncedFullAddress === Object.values(address).join(""),
	// });

	// const shouldVerifyAddress =
	// 	!!debouncedFullAddress &&
	// 	debouncedFullAddress !== "US" &&
	// 	addressLine1 !== "" &&
	// 	postalCode !== "" &&
	// 	countryCode !== "" &&
	// 	addressIsDirty &&
	// 	debouncedFullAddress === Object.values(address).join("");

	// const verifyAddressQuery = useAddressVerification(address, {
	// 	enabled: shouldVerifyAddress,
	// });

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

	// TEMPORARY: Comment out address validation logic - will be restored later
	// const isAddressValid = React.useMemo(() => {
	// 	if (
	// 		verifyAddressQuery.status === "success" &&
	// 		!verifyAddressQuery.isLoading &&
	// 		verifyAddressQuery.data?.[0] &&
	// 		address &&
	// 		addressIsDirty &&
	// 		debouncedFullAddress === Object.values(address).join("")
	// 	) {
	// 		return checkIsValidAddress(address, verifyAddressQuery.data[0]);
	// 	}
	// 	return false;
	// }, [
	// 	verifyAddressQuery.status,
	// 	verifyAddressQuery.isLoading,
	// 	verifyAddressQuery.data,
	// 	address,
	// 	debouncedFullAddress,
	// 	addressIsDirty,
	// ]);

	// TEMPORARY: Comment out suggested address effect - will be restored later
	// React.useEffect(() => {
	// 	if (
	// 		verifyAddressQuery.status === "success" &&
	// 		!verifyAddressQuery.isFetching &&
	// 		!isAddressValid &&
	// 		!!addressIsDirty
	// 	) {
	// 		setShowSuggestedAddress(true);
	// 		form.setValue(`${sectionKey}Valid`, false, { shouldValidate: true });
	// 	} else {
	// 		setShowSuggestedAddress(false);
	// 		form.setValue(`${sectionKey}Valid`, true, { shouldValidate: true });
	// 	}
	// }, [
	// 	isAddressValid,
	// 	verifyAddressQuery.status,
	// 	verifyAddressQuery.isFetching,
	// 	form.setValue,
	// 	sectionKey,
	// 	addressIsDirty,
	// ]);

	// TEMPORARY: Simplified draft order sync without validation dependencies
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

	const shouldUpdateAddress = Boolean(
		addressHasChanged && // Only sync if values differ from order
			!!debouncedFullAddress &&
			addressLine1?.trim() !== "" &&
			postalCode?.trim() !== "" &&
			countryCode?.trim() !== "" &&
			debouncedFullAddress === Object.values(address).join("") &&
			debouncedFullAddress.trim() !== "",
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

	// TEMPORARY: Comment out address update handler - will be restored later
	// function handleUpdateAddress(address?: Address) {
	// 	if (!address) return;

	// 	const fieldMap: Record<string, string | null> = {
	// 		AddressLine1: address.addressLine1,
	// 		AddressLine2: address.addressLine2,
	// 		AdminArea3: address.adminArea3,
	// 		AdminArea1: address.adminArea1,
	// 		PostalCode: address.postalCode,
	// 	};

	// 	for (const [key, value] of Object.entries(fieldMap)) {
	// 		if (value) {
	// 			form.setValue(`${sectionKey}${key}`, value, { shouldValidate: true });
	// 		}
	// 	}
	// }

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
														const isChangingCountryType =
															(hasRegionData(previousCountry) &&
																!hasRegionData(country.value)) ||
															(!hasRegionData(previousCountry) &&
																hasRegionData(country.value));

														// Set the new country value
														form.setValue(
															`${sectionKey}CountryCode`,
															country.value,
															{
																shouldValidate: true,
															},
														);

														// Reset AdminArea1 field when changing country types or when current value is invalid
														const currentAdminArea1 = form.getValues(
															`${sectionKey}AdminArea1`,
														);
														const newCountryRegions = getRegions(country.value);
														const isCurrentValueValid = newCountryRegions.some(
															(region) => region.code === currentAdminArea1,
														);

														if (
															isChangingCountryType ||
															(hasRegionData(country.value) &&
																!isCurrentValueValid)
														) {
															form.setValue(`${sectionKey}AdminArea1`, "", {
																shouldDirty: true,
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
							{/* TEMPORARY: Comment out autocomplete for US addresses - will be restored later */}
							{/* {countryValue === "US" ? (
								<AutoComplete
									data={addressMatchesQuery.data || []}
									value={field.value}
									onChange={field.onChange}
									onSelect={(address) =>
										handleUpdateAddress(address as Address)
									}
									isLoading={
										addressMatchesQuery?.isLoading ||
										addressMatchesQuery?.isFetching
									}
									hasError={!!fieldState.error}
								/>
							) : ( */}
							<Input
								placeholder={t.shipping.address1}
								hasError={!!fieldState.error}
								aria-required={requiredFields?.[`${sectionKey}AddressLine1`]}
								{...field}
								disabled={isConfirmingCheckout}
								autoComplete="off"
							/>
							{/* )} */}
						</FormControl>
						<FormMessage />
						{/* TEMPORARY: Comment out validation error display - will be restored later */}
						{/* {form?.formState?.errors?.[`${sectionKey}Valid`]?.message ? (
							<p className="text-[0.8rem] font-medium text-destructive">
								{String(form.formState.errors[`${sectionKey}Valid`]?.message)}
							</p>
						) : null} */}
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
			{/* TEMPORARY: Comment out suggested address display - will be restored later */}
			{/* {showSuggestedAddress ? (
				<div className="text-sm">
					{t.shipping.addressSuggestion}{" "}
					<button
						type="button"
						onClick={() => {
							handleUpdateAddress(verifyAddressQuery?.data?.[0]);
							setShowSuggestedAddress(false);
							form.setValue(`${sectionKey}Valid`, true, {
								shouldValidate: true,
							});
						}}
						className="text-primary font-bold underline hover:underline focus:outline-none cursor-pointer"
						disabled={isConfirmingCheckout}
					>
						{formatSingleLineAddress(verifyAddressQuery?.data?.[0])}
					</button>
					{t.shipping.addressSuggestionEnd}
				</div>
			) : null} */}

			<PhoneInput sectionKey={sectionKey} disabled={isConfirmingCheckout} />
		</fieldset>
	);
}
