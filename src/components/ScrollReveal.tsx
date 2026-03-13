import { ReactNode } from 'react'
import { useScrollReveal } from '@/hooks/useScrollReveal'

interface ScrollRevealProps {
  children: ReactNode
  /** Distance de déclenchement avant l'élément (en pixels) */
  threshold?: number
  /** Délai avant l'animation (en ms) */
  delay?: number
  /** Durée de l'animation (en ms) */
  duration?: number
  /** Direction de l'animation */
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
  /** Distance de translation initiale */
  distance?: number
  className?: string
}

/**
 * Composant pour révéler les éléments au scroll avec animation fluide
 */
export function ScrollReveal({
  children,
  threshold = 100,
  delay = 0,
  duration = 800,
  direction = 'up',
  distance = 50,
  className = '',
}: ScrollRevealProps) {
  const { ref, style } = useScrollReveal({
    threshold,
    delay,
    duration,
    direction,
    distance,
  })

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} style={style} data-scroll-reveal className={className}>
      {children}
    </div>
  )
}
