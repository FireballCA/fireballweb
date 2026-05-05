import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import Lenis from 'lenis'
import { lenisExoticsStyleOptions } from '@/constants/lenisPreset'
import { useLocation } from 'react-router-dom'

export const LenisContext = createContext<Lenis | null>(null)

function stripLenisClassesFromScrollRoot() {
  const root = document.getElementById('app-scroll-root')
  if (!root) return
  root.className = root.className.replace(/lenis(-\w+)?/g, '').replace(/\s+/g, ' ').trim()
}

export function LenisRoot({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null)
  const location = useLocation()
  const [viewportDesktop, setViewportDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => setViewportDesktop(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    let instance: Lenis | null = null
    let cancelled = false
    let retryTimer: number | null = null

    const isMobileViewport = !viewportDesktop

    // Toutes les pages compte : scroll natif sur `#app-scroll-root` (login, register, dashboard…).
    const path = location.pathname
    const isAccountNativeScrollRoute = path === '/account' || path.startsWith('/account/')

    // Safari iOS reste explicitement exclu.
    const ua = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua)
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua)

    const shouldDisableLenis = isMobileViewport || (isIOS && isSafari) || isAccountNativeScrollRoute

    if (shouldDisableLenis) {
      setLenis(null)
      requestAnimationFrame(() => stripLenisClassesFromScrollRoot())
      return () => {
        cancelled = true
        if (retryTimer != null) window.clearTimeout(retryTimer)
        stripLenisClassesFromScrollRoot()
      }
    }

    const initLenis = () => {
      if (cancelled || instance) return
      const wrapper = document.getElementById('app-scroll-root')
      const content = document.getElementById('app-scroll-content')
      if (!wrapper || !content) {
        retryTimer = window.setTimeout(initLenis, 50)
        return
      }
      instance = new Lenis({
        ...lenisExoticsStyleOptions,
        wrapper,
        content,
      })
      setLenis(instance)
    }

    initLenis()
    return () => {
      cancelled = true
      if (retryTimer != null) window.clearTimeout(retryTimer)
      if (instance) instance.destroy()
      setLenis(null)
      stripLenisClassesFromScrollRoot()
    }
  }, [location.pathname, viewportDesktop])

  useEffect(() => {
    if (!lenis) return
    const t0 = window.setTimeout(() => lenis.resize(), 0)
    const t1 = window.setTimeout(() => lenis.resize(), 250)
    return () => {
      window.clearTimeout(t0)
      window.clearTimeout(t1)
    }
  }, [lenis, location.pathname])

  const value = useMemo(() => lenis, [lenis])

  return <LenisContext.Provider value={value}>{children}</LenisContext.Provider>
}
