import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Remonte en haut à chaque navigation, avec défilement fluide (voir scroll-behavior sur html). */
export function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [pathname, search])

  return null
}
