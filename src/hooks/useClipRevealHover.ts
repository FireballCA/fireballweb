import { useState, useMemo, useCallback, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'

/** Bouton noir + bordure légère — calque clip blanc au survol (Add to cart, checkout, etc.). */
export const CLIP_REVEAL_BUTTON_BASE_CLASS =
  'border-white/[0.12] bg-black text-white hover:border-white/25'

export function setClipRevealVars(el: HTMLElement, clientX: number, clientY: number) {
  const rect = el.getBoundingClientRect()
  const w = rect.width || 1
  const h = rect.height || 1
  const localX = clientX - rect.left
  const localY = clientY - rect.top
  const x = (localX / w) * 100
  const y = (localY / h) * 100
  const d1 = Math.hypot(localX, localY)
  const d2 = Math.hypot(w - localX, localY)
  const d3 = Math.hypot(localX, h - localY)
  const d4 = Math.hypot(w - localX, h - localY)
  const r = Math.max(d1, d2, d3, d4)
  el.style.setProperty('--clip-x', `${x}%`)
  el.style.setProperty('--clip-y', `${y}%`)
  el.style.setProperty('--clip-r', `${r}px`)
}

const clipRevealCssVars = {
  '--clip-x': '50%',
  '--clip-y': '50%',
  '--clip-r': '0px',
} as CSSProperties

export function useClipRevealHover() {
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  const active = hover || focus
  const cssVars = useMemo(() => clipRevealCssVars, [])
  const onPointerEnter = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    setClipRevealVars(e.currentTarget, e.clientX, e.clientY)
    setHover(true)
  }, [])
  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    setClipRevealVars(e.currentTarget, e.clientX, e.clientY)
  }, [])
  const onPointerLeave = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    setClipRevealVars(e.currentTarget, e.clientX, e.clientY)
    setHover(false)
  }, [])
  /** À appeler après une animation qui désactive temporairement les pointer handlers (sinon hover reste « collé »). */
  const reset = useCallback(() => {
    setHover(false)
    setFocus(false)
  }, [])
  return {
    active,
    hover,
    cssVars,
    onPointerEnter,
    onPointerMove,
    onPointerLeave,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    reset,
  }
}
