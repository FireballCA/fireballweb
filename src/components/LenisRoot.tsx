import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import Lenis from 'lenis'
import { lenisExoticsStyleOptions } from '@/constants/lenisPreset'

export const LenisContext = createContext<Lenis | null>(null)

export function LenisRoot({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    // Safari mobile est sensible aux boucles de smooth-scroll (risque de crash/reload).
    const ua = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua)
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua)
    if (isIOS && isSafari) {
      setLenis(null)
      return
    }

    const instance = new Lenis(lenisExoticsStyleOptions)
    setLenis(instance)
    return () => {
      instance.destroy()
      setLenis(null)
    }
  }, [])

  const value = useMemo(() => lenis, [lenis])

  return <LenisContext.Provider value={value}>{children}</LenisContext.Provider>
}
