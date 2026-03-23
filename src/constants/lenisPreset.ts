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
}
