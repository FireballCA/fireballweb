/**
 * Si `true`, le site ignore `prefers-reduced-motion` pour les animations (landing, Voyager, Framer, etc.).
 * Les navigateurs / OS peuvent tout de même limiter certaines optimisations en mode économie d’énergie.
 */
export const FORCE_FULL_SITE_MOTION = true

export function prefersReducedMotionEffective(): boolean {
  if (FORCE_FULL_SITE_MOTION) return false
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
}
