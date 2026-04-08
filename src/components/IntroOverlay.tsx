import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'

type IntroOverlayProps = {
	onDone: () => void
}

export function IntroOverlay({ onDone }: IntroOverlayProps) {
	const reduceMotion = useReducedMotion()
	const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
	const containerRef = useRef<HTMLDivElement | null>(null)
	const logoRef = useRef<HTMLImageElement | null>(null)

	useEffect(() => {
		// Mesurer la position du logo de la navbar
		const measure = () => {
			const target = document.getElementById('navbar-logo')
			if (!target) return
			setTargetRect(target.getBoundingClientRect())
		}
		measure()
		const ro = new ResizeObserver(measure)
		if (document.body) {
			ro.observe(document.body)
		}
		window.addEventListener('scroll', measure, { passive: true })
		window.addEventListener('resize', measure)
		return () => {
			ro.disconnect()
			window.removeEventListener('scroll', measure)
			window.removeEventListener('resize', measure)
		}
	}, [])

	const [stage, setStage] = useState<'intro' | 'out'>('intro')

	useEffect(() => {
		// Durée totale ~2.0s, tenue plus longue avant le mouvement
		const t1 = window.setTimeout(() => setStage('out'), reduceMotion ? 300 : 1200)
		const t2 = window.setTimeout(() => onDone(), reduceMotion ? 600 : 2000)
		return () => {
			window.clearTimeout(t1)
			window.clearTimeout(t2)
		}
	}, [onDone, reduceMotion])

	// Calcul de la transform pour ancrer au logo navbar
	const targetTransform = useMemo(() => {
		if (!targetRect || !containerRef.current || !logoRef.current) return { x: 0, y: 0, scale: 0.4 }
		const container = containerRef.current.getBoundingClientRect()
		const logo = logoRef.current.getBoundingClientRect()
		const targetCenterX = targetRect.left + targetRect.width / 2
		const targetCenterY = targetRect.top + targetRect.height / 2
		const logoCenterX = logo.left + logo.width / 2
		const logoCenterY = logo.top + logo.height / 2
		const x = targetCenterX - logoCenterX
		const y = targetCenterY - logoCenterY
		// Adapter l'échelle: navbar logo h-6 ≈ 24px de haut; notre logo démarre ~80px
		const scale = Math.max(0.25, Math.min(0.5, (targetRect.height || 24) / Math.max(logo.height, 1)))
		return { x, y, scale }
	}, [targetRect])

	return (
		<div
			ref={containerRef}
			className="fixed inset-0 z-[2000] bg-black"
			aria-hidden
		>
			<motion.div
				className="absolute inset-0"
				initial={{ opacity: 1 }}
				animate={{ opacity: stage === 'intro' ? 1 : 0 }}
				transition={{ duration: reduceMotion ? 0.25 : 0.6, ease: [0.22, 1, 0.36, 1] }}
			/>
			<div className="absolute inset-0 flex items-center justify-center">
				<div className="relative inline-flex items-center justify-center">
					{/* Anneau loader autour du logo */}
					<motion.div
						className="absolute inset-0 -m-4 h-28 w-28 text-white/80"
						initial={{ opacity: 0 }}
						animate={{ opacity: stage === 'intro' ? 1 : 0 }}
						transition={{ duration: reduceMotion ? 0.15 : 0.35, ease: [0.22, 1, 0.36, 1] }}
					>
						<svg viewBox="0 0 100 100" className="h-full w-full animate-spin-slow" aria-hidden>
							<circle
								cx="50"
								cy="50"
								r="44"
								fill="none"
								stroke="currentColor"
								strokeWidth="6"
								strokeLinecap="round"
								strokeDasharray="200 88"
								opacity="0.9"
							/>
						</svg>
					</motion.div>

					<motion.img
						ref={logoRef}
						src="/LogoFull.avif"
						alt=""
						className="h-20 w-auto object-contain drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)]"
						initial={{ x: 0, y: 0, opacity: 0, scale: 0.96 }}
						animate={
							stage === 'intro'
								? { opacity: 1, scale: 1.02 }
								: { x: targetTransform.x, y: targetTransform.y, scale: targetTransform.scale, opacity: 1 }
						}
						transition={
							stage === 'intro'
								? {
										duration: reduceMotion ? 0.2 : 0.45,
										ease: [0.22, 1, 0.36, 1],
								  }
								: {
										type: 'spring',
										stiffness: 220,
										damping: 30,
										mass: 0.9,
								  }
						}
					/>
				</div>
			</div>
		</div>
	)
}

