import type { CSSProperties } from 'react'

export const clipRevealCssVars = {
  '--clip-x': '50%',
  '--clip-y': '50%',
  '--clip-r': '0px',
} as CSSProperties

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
