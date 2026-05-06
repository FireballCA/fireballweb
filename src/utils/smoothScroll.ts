/**
 * Utilitaire pour améliorer le smooth scroll sur tout le site
 * Gère les ancres de navigation et améliore le comportement par défaut
 */

export function smoothScrollTo(element: HTMLElement | null, offset: number = 0) {
  if (!element) return

  const elementPosition = element.getBoundingClientRect().top
  const offsetPosition = elementPosition + window.pageYOffset - offset

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth',
  })
}

export function smoothScrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

export function smoothScrollToId(id: string, offset: number = 0) {
  const element = document.getElementById(id)
  smoothScrollTo(element, offset)
}

/**
 * Initialise le smooth scroll pour les liens d'ancrage
 */
export function initSmoothScroll() {
  // Gérer les clics sur les liens avec hash
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    const link = target.closest('a[href^="#"]') as HTMLAnchorElement | null

    if (link && link.hash) {
      e.preventDefault()
      const targetId = link.hash.substring(1)
      const targetElement = document.getElementById(targetId)

      if (targetElement) {
        // Offset pour tenir compte du header fixe si nécessaire
        const headerOffset = 80
        smoothScrollTo(targetElement, headerOffset)
      }
    }
  })

  // Améliorer le scroll par défaut avec polyfill pour les navigateurs plus anciens
  if (!('scrollBehavior' in document.documentElement.style)) {
    // Polyfill simple pour les navigateurs qui ne supportent pas scroll-behavior
    let rafId: number | null = null
    let isScrolling = false

    const smoothScrollPolyfill = (targetY: number) => {
      if (isScrolling) return
      isScrolling = true

      const startY = window.pageYOffset
      const distance = targetY - startY
      const duration = Math.min(Math.abs(distance) * 0.5, 1000) // Max 1 seconde
      const startTime = performance.now()

      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Easing function (ease-in-out)
        const ease = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2

        window.scrollTo(0, startY + distance * ease)

        if (progress < 1) {
          rafId = requestAnimationFrame(animateScroll)
        } else {
          isScrolling = false
          if (rafId !== null) {
            cancelAnimationFrame(rafId)
          }
        }
      }

      rafId = requestAnimationFrame(animateScroll)
    }

    // Intercepter les appels à window.scrollTo avec behavior: 'smooth'
    const originalScrollTo = window.scrollTo
    window.scrollTo = function (options?: ScrollToOptions | number, y?: number) {
      if (typeof options === 'object' && options.behavior === 'smooth') {
        const targetY = typeof options.top === 'number' ? options.top : window.pageYOffset
        smoothScrollPolyfill(targetY)
      } else {
        ;(originalScrollTo as (x: number, y: number) => void).call(window, options as unknown as number, y as number)
      }
    }
  }
}
