import { useReducedMotion } from 'motion/react'
import { FORCE_FULL_SITE_MOTION } from '@/constants/motion'

/** Équivalent à `useReducedMotion()`, sauf si `FORCE_FULL_SITE_MOTION` est activé (toujours « pas réduit »). */
export function useEffectiveReducedMotion(): boolean {
  const system = useReducedMotion()
  if (FORCE_FULL_SITE_MOTION) return false
  return Boolean(system)
}
