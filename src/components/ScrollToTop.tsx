import { useContext, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { LenisContext } from '@/components/LenisRoot'

/** Remonte en haut à chaque navigation (Lenis si actif, sinon fallback natif). */
export function ScrollToTop() {
  const { pathname, search } = useLocation()
  const lenis = useContext(LenisContext)

  useEffect(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true })
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, search, lenis])

  return null
}
