import { cn } from "@/lib/utils";

export function CheckoutSection({
	children,
	className,
	style,
}: React.PropsWithChildren<{
	className?: string;
	style?: React.CSSProperties;
}>) {
	return (
		<div className={cn("space-y-2", className)} style={style}>
			{children}
		</div>
	);
}
