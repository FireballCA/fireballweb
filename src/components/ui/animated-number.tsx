import { useEffect, useMemo, useRef, useState } from 'react'

type Props = {
  value: number
  className?: string
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

/**
 * AnimatedNumber — petit composant "slot machine" pour chiffres.
 * - Attend un number (ex: 123.45)
 * - Rendu monospaced + tabular-nums conseillé côté caller
 */
export function AnimatedNumber({ value, className = '' }: Props) {
  const target = useMemo(() => {
    const n = Number.isFinite(value) ? value : 0
    return n.toFixed(2)
  }, [value])

  const [prev, setPrev] = useState(target)
  const [phase, setPhase] = useState<'idle' | 'slide'>('idle')
  const rafRef = useRef<number | null>(null)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (target === prev) return
    setPhase('slide')

    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current)

    rafRef.current = requestAnimationFrame(() => {
      timeoutRef.current = window.setTimeout(() => {
        setPrev(target)
        setPhase('idle')
      }, 260)
    })

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current)
    }
  }, [target, prev])

  const prevChars = prev.split('')
  const nextChars = target.split('')

  const len = Math.max(prevChars.length, nextChars.length)
  const paddedPrev = [...Array(len)].map((_, i) => prevChars[i] ?? ' ')
  const paddedNext = [...Array(len)].map((_, i) => nextChars[i] ?? ' ')

  return (
    <span className={className} aria-label={target}>
      {paddedNext.map((nextCh, i) => {
        const prevCh = paddedPrev[i]
        const isDigit = nextCh >= '0' && nextCh <= '9'
        const shouldAnimate = phase === 'slide' && isDigit && prevCh !== nextCh

        // Small per-digit stagger to feel "slotty"
        const delayMs = clamp(i * 12, 0, 120)

        return (
          <span key={i} className="relative inline-block h-[1.2em] w-[0.62em] overflow-hidden align-baseline tabular-nums">
            <span
              className="block"
              style={{
                transform: shouldAnimate ? 'translateY(-50%)' : 'translateY(0%)',
                transitionProperty: 'transform',
                transitionDuration: '320ms',
                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                transitionDelay: `${shouldAnimate ? delayMs : 0}ms`,
              }}
            >
              <span className="block leading-[1.2em]">{prevCh}</span>
              <span className="block leading-[1.2em]">{nextCh}</span>
            </span>
          </span>
        )
      })}
    </span>
  )
}

