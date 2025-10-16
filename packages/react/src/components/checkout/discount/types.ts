export interface DiscountFormProps {
	initialDiscounts?: string[];
	onDiscountsChange?: (discounts: string[]) => void;
	onError?: (error: Error) => void;
}

export interface DiscountsProps {
	discounts: string[];
	onRemove: (id: string) => void;
	isRemovingDiscount?: string;
}
