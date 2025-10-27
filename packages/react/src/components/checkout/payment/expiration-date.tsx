import { Input } from "@/components/ui/input";
import { useGoDaddyContext } from "@/godaddy-provider";
import * as React from "react";
import type { UseFormClearErrors, UseFormSetValue } from "react-hook-form";
import { monthYearMask } from "./month-year-mask";

interface ExpirationDateProps
	extends React.ComponentPropsWithoutRef<typeof Input> {
	setValue: UseFormSetValue<Record<string, unknown>>;
	clearErrors?: UseFormClearErrors<Record<string, unknown>>;
	monthFieldName?: string;
	yearFieldName?: string;
}

const ExpirationDate = React.forwardRef<HTMLInputElement, ExpirationDateProps>(
	(
		{
			setValue,
			clearErrors,
			monthFieldName = "month",
			yearFieldName = "year",
			name,
			...props
		},
		ref,
	) => {
		const { t } = useGoDaddyContext();
		const [maskedValue, setMaskedValue] = React.useState("");

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			const newValue = monthYearMask({ value });
			setMaskedValue(newValue);

			const [month, year] = newValue.split(" / ");
			setValue(monthFieldName, month || "");
			setValue(yearFieldName, year || "");

			props.onChange?.(e);
			clearErrors?.(name);
		};

		return (
			<Input
				{...props}
				ref={ref}
				autoComplete="cc-exp"
				type="text"
				inputMode="numeric"
				placeholder={t.payment.expirationDatePlaceholder}
				value={maskedValue}
				onChange={handleChange}
			/>
		);
	},
);

ExpirationDate.displayName = "ExpirationDate";

export { ExpirationDate };
