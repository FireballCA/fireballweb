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

    const updateParallax = () => {
      rafId = null
      const scrollY = window.scrollY
      const rect = element.getBoundingClientRect()
      const elementTop = rect.top + scrollY
      const windowHeight = window.innerHeight
      const elementHeight = rect.height

      const elementCenter = elementTop + elementHeight / 2
      const viewportCenter = scrollY + windowHeight / 2
      const distanceFromCenter = viewportCenter - elementCenter

      if (rect.bottom >= 0 && rect.top <= windowHeight) {
        const parallaxValue = distanceFromCenter * intensity * (direction === 'up' ? -1 : 1)
        const translateY = parallaxValue + offset
        element.style.transform = `translate3d(0, ${translateY}px, 0)`
        element.style.willChange = 'transform'
      }
    }

    const scheduleUpdate = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(updateParallax)
      }
    }

    const scrollRoot = document.getElementById('app-scroll-root') ?? window
    scrollRoot.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate, { passive: true })
    scheduleUpdate()

    return () => {
      scrollRoot.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      if (rafId !== null) cancelAnimationFrame(rafId)
      element.style.transform = ''
      element.style.willChange = ''
    }
  }, [intensity, direction, offset])

  return elementRef
}
