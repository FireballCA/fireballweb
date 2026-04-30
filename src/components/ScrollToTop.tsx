import { useContext, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import { LenisContext } from '@/components/LenisRoot'

/** Remonte en haut à chaque navigation (Lenis si actif + fallback natif html/body/window). */
function scrollWindowAndDocumentToTop(lenis: Lenis | null) {
  if (lenis) {
    lenis.scrollTo(0, { immediate: true })
  }
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
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      run()
      raf2 = requestAnimationFrame(run)
    })

    return () => {
      clearTimeout(t0)
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [location.pathname, location.search, location.hash, location.key])

  return null
}
