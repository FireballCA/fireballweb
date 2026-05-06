import { Skeleton, SkeletonText } from './Skeleton'

export function ProductDetailSkeleton() {
	return (
		<div className="bg-white min-h-screen">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
					<div className="space-y-4">
						<Skeleton className="w-full aspect-square rounded-2xl bg-silver" />
						<div className="grid grid-cols-4 gap-3">
							<Skeleton className="h-20 rounded-xl bg-silver" />
							<Skeleton className="h-20 rounded-xl bg-silver" />
							<Skeleton className="h-20 rounded-xl bg-silver" />
							<Skeleton className="h-20 rounded-xl bg-silver" />
						</div>
					</div>
					<div className="pt-2">
						<SkeletonText className="h-8 w-3/4 mb-3 bg-silver" />
						<SkeletonText className="h-6 w-24 mb-6 bg-silver" />
						<div className="space-y-3 mb-6">
							<SkeletonText className="w-full bg-silver" />
							<SkeletonText className="w-5/6 bg-silver" />
							<SkeletonText className="w-2/3 bg-silver" />
						</div>
						<div className="flex items-center gap-3">
							<Skeleton className="h-12 w-28 rounded-full bg-silver" />
							<Skeleton className="h-12 w-12 rounded-full bg-silver" />
							<Skeleton className="h-12 w-20 rounded-full bg-silver" />
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

