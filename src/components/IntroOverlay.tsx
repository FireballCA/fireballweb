import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion'

type IntroOverlayProps = {
	onDone: () => void
}

export function IntroOverlay({ onDone }: IntroOverlayProps) {
	const reduceMotion = useEffectiveReducedMotion()
	const [startSwipe, setStartSwipe] = useState(false)

	useEffect(() => {
		const t1 = window.setTimeout(() => setStartSwipe(true), reduceMotion ? 100 : 800)
		const t2 = window.setTimeout(() => onDone(), reduceMotion ? 350 : 1400)
		return () => {
			window.clearTimeout(t1)
			window.clearTimeout(t2)
		}
	}, [onDone, reduceMotion])

	return (
		<div
			className="fixed inset-0 z-[2000] bg-black"
			aria-hidden
		>
			<motion.div
				className="absolute inset-0 flex items-center justify-center"
				initial={{ y: 0 }}
				animate={{ y: startSwipe ? '-100%' : 0 }}
				transition={{ duration: reduceMotion ? 0.25 : 0.6, ease: [0.22, 1, 0.36, 1] }}
			>
				<img
					src="/LogoFull.avif"
					alt=""
					className="h-20 w-auto object-contain drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)]"
					draggable={false}
				/>
			</motion.div>
		</div>
	)
}

