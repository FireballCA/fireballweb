import { useEffect, useRef } from 'react'

interface SmoothScrollOptions {
  /** Vitesse de scroll (0.1 = très lent, 1.0 = normal, 2.0 = rapide) */
  speed?: number
  /** Damping pour l'effet d'élasticité (0.1 = très élastique, 0.9 = rigide) */
  damping?: number
  /** Active l'effet de parallaxe */
  parallax?: boolean
}

/**
 * Hook pour créer un effet de scroll lent et professionnel
 * Similaire aux sites premium comme Apple
 */
export function useSmoothScroll(options: SmoothScrollOptions = {}) {
  const {
    speed = 0.7, // Scroll plus lent par défaut
    damping = 0.85,
  } = options

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const currentScrollRef = useRef(0)
  const targetScrollRef = useRef(0)
  const rafIdRef = useRef<number | null>(null)

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) {
      return () => {
        // Cleanup toujours retourné pour éviter l'erreur React #310
      }
    }

    let isScrolling = false

    const smoothScroll = () => {
      if (!container) return

      // Calculer la différence entre la position actuelle et la cible
      const diff = targetScrollRef.current - currentScrollRef.current

      // Appliquer le damping pour un effet fluide
      if (Math.abs(diff) > 0.1) {
        currentScrollRef.current += diff * (1 - damping)
        container.scrollTop = currentScrollRef.current
        rafIdRef.current = requestAnimationFrame(smoothScroll)
      } else {
        currentScrollRef.current = targetScrollRef.current
        container.scrollTop = currentScrollRef.current
        isScrolling = false
      }
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      // Calculer le delta avec la vitesse personnalisée
      const delta = e.deltaY * speed
      targetScrollRef.current += delta

      // Limiter le scroll aux limites du conteneur
      const maxScroll = container.scrollHeight - container.clientHeight
      targetScrollRef.current = Math.max(0, Math.min(targetScrollRef.current, maxScroll))

      if (!isScrolling) {
        isScrolling = true
        currentScrollRef.current = container.scrollTop
        smoothScroll()
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      container.removeEventListener('wheel', handleWheel)
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [speed, damping])

  return scrollContainerRef
}
