import React from 'react'
import { Skeleton, SkeletonText } from './Skeleton'

export function AccountDashboardSkeleton() {
	return (
		<div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Skeleton className="h-28 rounded-2xl bg-white/10" />
				<Skeleton className="h-28 rounded-2xl bg-white/10" />
				<Skeleton className="h-28 rounded-2xl bg-white/10" />
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2 space-y-4">
					<SkeletonText className="w-1/3" />
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<Skeleton className="h-40 rounded-xl bg-white/10" />
						<Skeleton className="h-40 rounded-xl bg-white/10" />
					</div>
				</div>
				<div className="space-y-4">
					<SkeletonText className="w-1/2" />
					<Skeleton className="h-40 rounded-xl bg-white/10" />
				</div>
			</div>
		</div>
	)
}

