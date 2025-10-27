"use client";

import { checkIsValidPhone } from "@/components/checkout/address/utils/check-is-valid-phone";
import { mapAddressFieldsToInput } from "@/components/checkout/address/utils/map-address-fields-to-input";
import { useCheckoutContext } from "@/components/checkout/checkout";
import { useDraftOrder } from "@/components/checkout/order/use-draft-order";
import { useDraftOrderFieldSync } from "@/components/checkout/order/use-draft-order-sync";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGoDaddyContext } from "@/godaddy-provider";
import { cn } from "@/lib/utils";
import { eventIds } from "@/tracking/events";
import { TrackingEventType, track } from "@/tracking/track";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import React from "react";
import { useFormContext } from "react-hook-form";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";

function FlagComponent({ country, countryName }: RPNInput.FlagProps) {
	const Flag = flags[country];

	return (
		<span className="flex h-3 w-4 overflow-hidden rounded-xs bg-foreground/20 [&_svg]:size-full">
			{Flag && <Flag title={countryName} />}
		</span>
	);
}

const PhoneTextInput = React.memo(
	React.forwardRef<
		HTMLInputElement,
		React.ComponentProps<"input"> & { hasError?: boolean }
	>(({ className, hasError, ...props }, ref) => (
		<Input
			className={cn("rounded-e-md rounded-s-none border-l-0 pl-2", className)}
			hasError={hasError}
			{...props}
			ref={ref}
		/>
	)),
);

interface CountryEntry {
	label: string;
	value: RPNInput.Country | undefined;
}

interface CountrySelectProps {
	disabled?: boolean;
	value: RPNInput.Country;
	options: CountryEntry[];
	onChange: (country: RPNInput.Country) => void;
	hasError?: boolean;
}

function CountrySelect({
	disabled,
	value: selectedCountry,
	options: countryList,
	onChange,
	hasError,
}: CountrySelectProps) {
	const { t } = useGoDaddyContext();
	const scrollAreaRef = React.useRef<HTMLDivElement>(null);
	const [searchValue, setSearchValue] = React.useState("");
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					className={cn(
						"flex gap-1 pl-2 pr-1 shadow-none h-12 rounded-e-none bg-input rounded-s-md border-r-0 focus:z-10 hover:bg-muted focus:bg-muted",
						hasError && "border-destructive focus-visible:ring-destructive",
					)}
					disabled={disabled}
				>
					<FlagComponent
						country={selectedCountry}
						countryName={selectedCountry}
					/>
					<ChevronsUpDown className="size-1 text-muted-foreground" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[300px] p-0 rounded-md">
				<Command>
					<CommandInput
						value={searchValue}
						onValueChange={(value) => {
							setSearchValue(value);
							setTimeout(() => {
								if (scrollAreaRef.current) {
									const viewportElement = scrollAreaRef.current.querySelector(
										"[data-radix-scroll-area-viewport]",
									);
									if (viewportElement) {
										viewportElement.scrollTop = 0;
									}
								}
							}, 0);
						}}
						placeholder={t.phone.searchCountry}
					/>
					<CommandList>
						<ScrollArea ref={scrollAreaRef} className="h-72">
							<CommandEmpty>{t.phone.noCountryFound}</CommandEmpty>
							<CommandGroup>
								{countryList.map(({ value, label }) =>
									value ? (
										<CountrySelectOption
											key={value}
											country={value}
											countryName={label}
											selectedCountry={selectedCountry}
											onChange={onChange}
										/>
									) : null,
								)}
							</CommandGroup>
						</ScrollArea>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

interface CountrySelectOptionProps extends RPNInput.FlagProps {
	selectedCountry: RPNInput.Country;
	onChange: (country: RPNInput.Country) => void;
}

const CountrySelectOption = ({
	country,
	countryName,
	selectedCountry,
	onChange,
}: CountrySelectOptionProps) => {
	return (
		<CommandItem
			className="gap-2 hover:bg-muted"
			onSelect={() => {
				onChange(country);

				// Track phone country selection
				track({
					eventId: eventIds.changePhoneCountry,
					type: TrackingEventType.CLICK,
					properties: {
						country,
						countryName,
						countryCode: `+${RPNInput.getCountryCallingCode(country)}`,
					},
				});
			}}
		>
			<FlagComponent country={country} countryName={countryName} />
			<span className="flex-1 text-sm">{countryName}</span>
			<span className="text-sm text-foreground/50">{`+${RPNInput.getCountryCallingCode(country)}`}</span>
			<CheckIcon
				className={`ml-auto size-2 ${country === selectedCountry ? "opacity-100" : "opacity-0"}`}
			/>
		</CommandItem>
	);
};

export function PhoneInput({
	sectionKey,
	disabled,
}: { sectionKey: string; disabled?: boolean }) {
	const form = useFormContext();
	const { t } = useGoDaddyContext();
	const { session, requiredFields } = useCheckoutContext();
	const { data: draftOrder } = useDraftOrder();

	const phoneValue = form.watch(`${sectionKey}Phone`);
	const useShippingAddress = form.watch("paymentUseShippingAddress");

	const [phone] = useDebouncedValue(phoneValue, {
		wait: 1000,
	});

	const isValidPhone = React.useMemo(() => checkIsValidPhone(phone), [phone]);

	// Check if phone value differs from order value
	const phoneHasChanged = React.useMemo(() => {
		if (!draftOrder) return true; // If no order, allow sync
		const section =
			sectionKey === "shipping" ? draftOrder.shipping : draftOrder.billing;
		return (section?.phone || "") !== (phone || "");
	}, [draftOrder, sectionKey, phone]);

	useDraftOrderFieldSync({
		key: "phone",
		data: phone,
		deps: [phone, isValidPhone],
		enabled:
			phoneHasChanged && // Only sync if values differ from order
			phone === phoneValue &&
			(phone
				? isValidPhone && phone?.trim() !== ""
				: !phone && phoneValue === ""),
		fieldNames: [`${sectionKey}Phone`],
		mapToInput: (data) =>
			mapAddressFieldsToInput(
				{ phone: data },
				sectionKey as "shipping" | "billing",
				useShippingAddress,
			),
	});

	return session?.enablePhoneCollection ? (
		<FormField
			control={form.control}
			name={`${sectionKey}Phone`}
			render={({ field, fieldState }) => (
				<FormItem>
					<FormLabel className="sr-only">{t.shipping.phone}</FormLabel>
					<FormControl>
						<RPNInput.default
							defaultCountry="US"
							placeholder={t.phone.placeholder}
							value={field.value}
							onChange={(value) => {
								// Allow truly empty values
								const newValue = value ?? "";
								field.onChange(newValue);

								// Track phone number change
								if (newValue) {
									track({
										eventId: eventIds.changePhoneNumber,
										type: TrackingEventType.CLICK,
										properties: {
											sectionKey,
											hasValue: !!newValue,
											isValid: checkIsValidPhone(newValue),
										},
									});
								}
							}}
							onBlur={field.onBlur}
							disabled={disabled}
							smartCaret={false}
							addInternationalOption={false}
							international={false}
							flagComponent={FlagComponent}
							inputComponent={React.useCallback(
								(props: React.ComponentProps<"input">) => (
									<PhoneTextInput
										hasError={!!fieldState.error}
										aria-required={requiredFields?.[`${sectionKey}Phone`]}
										{...props}
									/>
								),
								[fieldState.error, sectionKey],
							)}
							countrySelectComponent={React.useCallback(
								(props: CountrySelectProps) => (
									<CountrySelect hasError={!!fieldState.error} {...props} />
								),
								[fieldState.error],
							)}
							className="flex rounded-md"
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	) : null;
}
