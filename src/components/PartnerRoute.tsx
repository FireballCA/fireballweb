import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Navigate, useLocation } from 'react-router-dom'
import { getCurrentUserProfile } from '@/utils/supabaseAuth'
import { FireballLoading } from '@/components/FireballLoading'
import { supabase } from '@/lib/supabase'

interface PartnerRouteProps {
  children: React.ReactNode
  /** Onboarding page: redirect to dashboard if already onboarded. Dashboard: redirect to onboarding if not onboarded. */
  requireOnboarded?: boolean
}

export function PartnerRoute({ children, requireOnboarded = true }: PartnerRouteProps) {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'denied' | 'onboarding' | 'dashboard' | 'show'>('denied')
  const location = useLocation()

  useEffect(() => {
    let mounted = true

    const runPartnerGate = async (session: Session | null) => {
      if (!mounted) return
      if (!session) {
        setStatus('denied')
        setLoading(false)
        return
      }
      const profile = await getCurrentUserProfile()
      if (!mounted || !profile) {
        setStatus('denied')
        setLoading(false)
        return
      }
      const role = (profile.role || '').toLowerCase()
      const partnerStatus = (profile.partner_status || '').toLowerCase()
      const isPartnerUser = role === 'partner' || partnerStatus === 'partner'
      if (!isPartnerUser) {
        setStatus('denied')
        setLoading(false)
        return
      }

      const { data: row } = await supabase
        .from('partner_companies')
        .select('id,company_address,company_name')
        .eq('user_id', profile.id)
        .eq('status', 'partner')
        .maybeSingle()

      if (!mounted) return
      const hasOnboarded = !!(row && (row.company_address != null && row.company_address !== ''))
      if (requireOnboarded && !hasOnboarded) {
        setStatus('onboarding')
      } else if (!requireOnboarded && hasOnboarded) {
        setStatus('dashboard')
      } else {
        setStatus('show')
      }
      setLoading(false)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') return
      void runPartnerGate(session)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [requireOnboarded])

  if (loading) return <FireballLoading />

  if (status === 'denied') {
    return <Navigate to="/account/dashboard" replace state={{ from: location.pathname }} />
  }
  if (status === 'onboarding') {
    return <Navigate to="/partner/onboarding" replace />
  }
  if (status === 'dashboard') {
    return <Navigate to="/partner/dashboard" replace />
  }

  return <>{children}</>
}
