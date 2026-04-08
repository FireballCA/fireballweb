import React from 'react'

type SkeletonProps = {
	className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
	return (
		<div
			className={[
				'animate-pulse rounded-md bg-white/10',
				className,
			].filter(Boolean).join(' ')}
			aria-hidden
		/>
	)
}

export function SkeletonText({ className = '' }: SkeletonProps) {
	return <Skeleton className={['h-4', className].filter(Boolean).join(' ')} />
}

export function SkeletonCircle({ className = '' }: SkeletonProps) {
	return (
		<div
			className={[
				'animate-pulse rounded-full bg-white/10',
				className,
			].filter(Boolean).join(' ')}
			aria-hidden
		/>
	)
}

