import { CheckoutSection } from "@/components/checkout/checkout-section";
import { Skeleton } from "@/components/ui/skeleton";

export function ShippingMethodSkeleton() {
	return (
		<div>
			<div className="mb-4">
				<Skeleton className="h-4 w-48" />
			</div>
			<div className="space-y-0">
				{[1, 2, 3].map((i, index) => (
					<div
						key={i}
						className={`flex items-center justify-between space-x-2 bg-card border border-muted p-2 px-4 ${
							index === 0 ? "rounded-t-md" : ""
						} ${
							index === 1 ? "rounded-b-md" : ""
						} ${index !== 0 ? "border-t-0" : ""}`}
					>
						<div className="flex items-center space-x-4">
							<Skeleton className="h-4 w-4 rounded-full" />
							<div className="inline-flex flex-col">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-3 w-32 mt-1" />
							</div>
						</div>
						<div className="flex items-center">
							<Skeleton className="h-4 w-10" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
