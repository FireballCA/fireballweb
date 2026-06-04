import { useEffect, useState } from 'react'
import { RouteSkeleton } from '@/components/RouteSkeleton'

const SKELETON_DELAY_MS = 120

/**
 * N’affiche le skeleton que si le lazy-load dépasse SKELETON_DELAY_MS.
 * Navigation instantanée (chunk déjà en cache) → pas de flash skeleton.
 */
export function DeferredRouteSkeleton() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), SKELETON_DELAY_MS)
    return () => window.clearTimeout(t)
  }, [])

  if (!show) return null
  return <RouteSkeleton />
}
