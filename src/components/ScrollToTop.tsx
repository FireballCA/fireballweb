import { useContext, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import { LenisContext } from '@/components/LenisRoot'

/** Remonte en haut à chaque navigation (Lenis si actif + `#app-scroll-root` + fallback window/html/body). */
function scrollWindowAndDocumentToTop(lenis: Lenis | null) {
  if (lenis) {
    lenis.scrollTo(0, { immediate: true })
  }
  const root = document.getElementById('app-scroll-root')
  if (root) root.scrollTop = 0
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

export function ScrollToTop() {
  const location = useLocation()
  const lenis = useContext(LenisContext)
  const lenisRef = useRef(lenis)

  useEffect(() => {
    lenisRef.current = lenis
  }, [lenis])

  useEffect(() => {
    const run = () => scrollWindowAndDocumentToTop(lenisRef.current)

    run()
    const t0 = window.setTimeout(run, 0)
    const t1 = window.setTimeout(run, 120)

    return () => {
      clearTimeout(t0)
      clearTimeout(t1)
    }
  }, [location.pathname, location.search, location.hash, location.key])

  return null
}
