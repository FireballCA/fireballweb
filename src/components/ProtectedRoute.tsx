import { useEffect, useState, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { FireballLoading } from '@/components/FireballLoading'

/** Duree minimale pour eviter un flash de page vide (on masque le temps de chargement reel) */
const MIN_LOADING_MS = 400

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [canShowContent, setCanShowContent] = useState(false)
  const mountedAt = useRef(Date.now())

  useEffect(() => {
    let cancelled = false
    // Ne pas s’appuyer uniquement sur getSession() au montage : avant l’hydratation
    // la session peut être null alors que INITIAL_SESSION arrive juste après — boucle
    // /account/dashboard ↔ /account avec l’écran Account qui voit déjà la session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      setAuthenticated(!!session)
      setLoading(false)
    })
    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  // Garder le loading au moins MIN_LOADING_MS, puis afficher le contenu si connecté
  useEffect(() => {
    if (loading) return
    const elapsed = Date.now() - mountedAt.current
    const remaining = Math.max(0, MIN_LOADING_MS - elapsed)
    const t = window.setTimeout(() => setCanShowContent(true), remaining)
    return () => window.clearTimeout(t)
  }, [loading])

  if (loading || !canShowContent) {
    return <FireballLoading />
  }

  if (!authenticated) {
    return <Navigate to="/account" replace />
  }

  return <>{children}</>
}
