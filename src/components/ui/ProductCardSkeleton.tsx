import React from 'react'
import { Skeleton, SkeletonText } from './Skeleton'

export function ProductCardSkeleton() {
	return (
		<div className="group relative rounded-2xl overflow-hidden bg-white/5 border border-white/10">
			<Skeleton className="aspect-[4/5] w-full" />
			<div className="p-3 sm:p-4">
				<SkeletonText className="w-3/4 mb-2" />
				<SkeletonText className="w-1/2 mb-3" />
				<div className="flex items-center justify-between">
					<SkeletonText className="w-16" />
					<Skeleton className="h-8 w-20 rounded-full" />
				</div>
			</div>
		</div>
	)
}

