import { useEffect } from 'react'

/**
 * Mesure `#site-nav-chrome` (navbar seule, sans mega-menu) pour le spacer Layout.
 */
export function useSiteHeaderHeight(chromeId = 'site-nav-chrome') {
  useEffect(() => {
    const el = document.getElementById(chromeId)
    if (!el) return

    const update = () => {
      const height = `${el.getBoundingClientRect().height}px`
      document.documentElement.style.setProperty('--nav-chrome-h', height)
      document.documentElement.style.setProperty('--mobile-header-h', height)
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update, { passive: true })
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [chromeId])
}
