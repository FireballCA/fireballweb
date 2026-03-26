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
  /**
   * Important: on applique le transform parallaxe sur un conteneur interne,
   * pas sur la <section> elle-même, sinon on peut créer des overlaps visuels
   * (la section reste dans le flux mais son contenu "glisse" au-dessus/au-dessous,
   * donnant l'impression que la hero est "pinned" au scroll).
   */
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return () => {
        // Cleanup toujours retourné pour éviter l'erreur React #310
      }
    }

    addParallaxElement(element, intensity, direction)

    return () => {
      if (element) {
        removeParallaxElement(element)
      }
    }
  }, [intensity, direction])

  return (
    <section className={className}>
      <div ref={ref} data-parallax>
        {children}
      </div>
    </section>
  )
}
