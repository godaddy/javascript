import { cn } from "@/lib/utils";

function Skeleton({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"flex animate-pulse rounded-md bg-primary/10 h-3",
				className,
			)}
			{...props}
		/>
	);
}

export { Skeleton };
