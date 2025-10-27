import { AnimatedCardIcon } from "@/components/checkout/payment/card-icon";
import { getCardType } from "@/components/checkout/payment/card-info";
import { ExpirationDate } from "@/components/checkout/payment/expiration-date";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";

export function GoDaddyCreditCardForm() {
	const form = useFormContext();
	const cardType = form.watch("cardType");

	return (
		<>
			<div className="space-y-2">
				<FormField
					control={form.control}
					name="paymentCardNumberDisplay"
					render={({ field }) => (
						<FormItem className="space-y-1">
							<FormLabel className="sr-only">Card number</FormLabel>
							<div className="relative">
								<FormControl>
									<Input
										{...field}
										type="tel"
										inputMode="numeric"
										className="pr-32"
										autoComplete="cc-number"
										placeholder="1234 1234 1234 1234"
										maxLength={19} // 16 digits + 3 spaces
										onChange={(e) => {
											// Get the input value and remove all non-digit characters
											const value = e.target.value;
											const cardNumber = value.replace(/\D/g, "");

											// Format the card number with spaces after every 4 digits
											const formattedNumber = cardNumber
												.replace(/(\d{4})(?=\d)/g, "$1 ")
												.trim();

											// Determine card type
											const rawCardNumber = cardNumber.replace(/\s/g, "");
											const cardType = getCardType({
												cardNumber: rawCardNumber,
												eager: true,
											});

											// Update form values
											form.setValue("cardType", cardType);
											form.setValue("paymentCardNumber", rawCardNumber);
											field.onChange(formattedNumber);

											form.formState.errors?.paymentCardNumberDisplay &&
												form.clearErrors("paymentCardNumberDisplay");
										}}
									/>
								</FormControl>
								<div className="absolute inset-y-0 right-3 flex items-center">
									<AnimatedCardIcon cardType={cardType} />
								</div>
							</div>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="grid grid-cols-2 gap-1">
					<FormField
						control={form.control}
						name="paymentExpiryDate"
						render={({ field }) => (
							<FormItem className="space-y-1">
								<FormLabel className="sr-only">
									Expiration date (MM / YY)
								</FormLabel>
								<FormControl>
									<ExpirationDate
										{...field}
										setValue={form.setValue}
										clearErrors={form.clearErrors}
										monthFieldName="paymentMonth"
										yearFieldName="paymentYear"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="paymentSecurityCode"
						render={({ field }) => (
							<FormItem className="space-y-1">
								<FormLabel className="sr-only">Security code</FormLabel>
								<FormControl>
									<Input type="number" placeholder="CVV" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="paymentNameOnCard"
					render={({ field }) => (
						<FormItem className="space-y-1">
							<FormLabel className="sr-only">Name on card</FormLabel>
							<FormControl>
								<Input placeholder="Name on card" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</>
	);
}
