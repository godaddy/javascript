import { Input } from "@/components/ui/input";
import { useGoDaddyContext } from "@/godaddy-provider";
import type { ChangeEvent, ComponentProps } from "react";
import { forwardRef } from "react";

type DiscountInputProps = Omit<ComponentProps<typeof Input>, "onChange"> & {
	hasError?: boolean;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

export const DiscountInput = forwardRef<HTMLInputElement, DiscountInputProps>(
	({ hasError, onChange, onKeyDown, ...props }, ref) => {
		const { t } = useGoDaddyContext();
		// Handle input change to automatically remove spaces
		const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
			// Keep original event but modify the value to trim spaces
			const originalValue = e.target.value;
			e.target.value = originalValue.replace(/\s+/g, "");

			// Call the original onChange if provided
			if (onChange) {
				onChange(e);
			}
		};

		return (
			<div className="space-y-2">
				<Input
					type="text"
					placeholder={t.discounts.enterCode}
					{...props}
					ref={ref}
					onChange={handleChange}
					onKeyDown={onKeyDown}
					className={hasError ? "border-destructive" : ""}
				/>
			</div>
		);
	},
);
