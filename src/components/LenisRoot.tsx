import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import Lenis from 'lenis'
import { lenisExoticsStyleOptions } from '@/constants/lenisPreset'

export const LenisContext = createContext<Lenis | null>(null)

export function LenisRoot({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
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
