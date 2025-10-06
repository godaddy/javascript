import { Skeleton } from "@/components/ui/skeleton";

export function LineItemSkeleton() {
	return (
		<div className="space-y-4 mb-4">
			{Array.from({ length: 3 }).map((_, index) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: For Skeleton
				<div key={index} className="flex items-start space-x-4">
					<div className="relative">
						<Skeleton className="h-12 w-12" />
					</div>
					<div className="flex-1 space-y-1">
						<div className="flex items-start justify-between">
							<div className="flex flex-col gap-0.5">
								<span>
									<Skeleton className="h-3 w-40" />
								</span>
								<span>
									<Skeleton className="h-2 w-28" />
								</span>
							</div>
							<div className="text-right">
								<div>
									<Skeleton className="w-12" />
								</div>
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
