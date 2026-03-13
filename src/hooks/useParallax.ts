import { useEffect, useRef } from 'react'

interface ParallaxOptions {
  /** Intensité de l'effet parallaxe (0.1 = subtil, 0.5 = fort) */
  intensity?: number
  /** Direction du parallaxe ('up' | 'down') */
  direction?: 'up' | 'down'
  /** Offset initial */
  offset?: number
}

/**
 * Hook pour créer un effet de parallaxe professionnel
 */
export function useParallax(options: ParallaxOptions = {}) {
  const {
    intensity = 0.3,
    direction = 'up',
    offset = 0,
  } = options

  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    let rafId: number | null = null
    let lastScrollY = window.scrollY

    const updateParallax = () => {
      const scrollY = window.scrollY
      const rect = element.getBoundingClientRect()
      const elementTop = rect.top + scrollY
      const windowHeight = window.innerHeight
      const elementHeight = rect.height

      // Calculer la position relative de l'élément dans le viewport
      const elementCenter = elementTop + elementHeight / 2
      const viewportCenter = scrollY + windowHeight / 2
      const distanceFromCenter = viewportCenter - elementCenter

      // Appliquer le parallaxe seulement quand l'élément est visible
      if (rect.bottom >= 0 && rect.top <= windowHeight) {
        const parallaxValue = distanceFromCenter * intensity * (direction === 'up' ? -1 : 1)
        const translateY = parallaxValue + offset

        element.style.transform = `translate3d(0, ${translateY}px, 0)`
        element.style.willChange = 'transform'
      }

      lastScrollY = scrollY
      rafId = requestAnimationFrame(updateParallax)
    }

    updateParallax()

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      if (element) {
        element.style.transform = ''
        element.style.willChange = ''
      }
    }
  }, [intensity, direction, offset])

  return elementRef
}
