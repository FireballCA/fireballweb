import { useEffect, useRef, useState } from 'react'

interface ScrollRevealOptions {
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
}

/**
 * Hook pour révéler les éléments au scroll avec animation fluide
 */
export function useScrollReveal(options: ScrollRevealOptions = {}) {
  const {
    threshold = 100,
    delay = 0,
    duration = 800,
    direction = 'up',
    distance = 50,
  } = options

  const elementRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element || hasAnimated) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setIsVisible(true)
              setHasAnimated(true)
            }, delay)
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: `${threshold}px`,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold, delay, hasAnimated])

  // Calculer les styles de transformation selon la direction
  const getTransform = () => {
    if (!isVisible) {
      switch (direction) {
        case 'up':
          return `translateY(${distance}px)`
        case 'down':
          return `translateY(-${distance}px)`
        case 'left':
          return `translateX(${distance}px)`
        case 'right':
          return `translateX(-${distance}px)`
        case 'fade':
          return 'translateY(0)'
        default:
          return `translateY(${distance}px)`
      }
    }
    return 'translateY(0) translateX(0)'
  }

  const style = {
    opacity: isVisible ? 1 : 0,
    transform: getTransform(),
    transition: `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    willChange: isVisible ? 'auto' : 'transform, opacity',
  }

  return { ref: elementRef, style, isVisible }
}
