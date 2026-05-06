import type { LenisOptions } from 'lenis'

/**
 * Réglages calibrés sur le ressenti des sites Webflow premium type
 * [The Exotics Network](https://www.theexoticsnetwork.com) : inertie un peu plus lourde
 * (lerp bas), molette amortie (wheelMultiplier sous 1), easing exponentiel Lenis par défaut.
 */
export const lenisExoticsStyleOptions: LenisOptions = {
  autoRaf: true,
  lerp: 0.08,
  duration: 1.25,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  gestureOrientation: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 0.72,
  touchMultiplier: 1.5,
  infinite: false,
  prevent: (node) => {
    if (!(node instanceof HTMLElement)) return false

    // Explicitement marqué comme à ignorer
    if (
      node.closest('[data-lenis-prevent]') ||
      node.closest('.business-scroll') ||
      node.closest('.business-layout')
    ) return true

    // Tout élément scrollable en Y qui a du contenu à scroller
    // (modals, sheets, dropdowns, rails, etc.) — remonter l'arbre DOM
    let el: HTMLElement | null = node
    while (el && el.id !== 'app-scroll-root') {
      const style = window.getComputedStyle(el)
      const overflowY = style.overflowY
      if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 2) {
        return true
      }
      el = el.parentElement
    }
    return false
  },
}
