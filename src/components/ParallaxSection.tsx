import { useEffect, useRef, ReactNode } from 'react'
import { addParallaxElement, removeParallaxElement } from '@/utils/professionalScroll'

interface ParallaxSectionProps {
  children: ReactNode
  /** Intensité de l'effet parallaxe (0.1 = subtil, 0.5 = fort) */
  intensity?: number
  /** Direction du parallaxe */
  direction?: 'up' | 'down'
  className?: string
}

/**
 * Composant pour créer une section avec effet parallaxe professionnel
 */
export function ParallaxSection({
  children,
  intensity = 0.3,
  direction = 'up',
  className = '',
}: ParallaxSectionProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    addParallaxElement(element, intensity, direction)

    return () => {
      if (element) {
        removeParallaxElement(element)
      }
    }
  }, [intensity, direction])

  return (
    <section ref={ref} data-parallax className={className}>
      {children}
    </section>
  )
}
