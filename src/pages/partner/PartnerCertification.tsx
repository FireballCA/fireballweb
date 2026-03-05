import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile } from '@/utils/supabaseAuth'

export function PartnerCertification() {
  const [level, setLevel] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const profile = await getCurrentUserProfile()
      if (!profile?.id) {
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('partner_companies')
        .select('certification_level')
        .eq('user_id', profile.id)
        .eq('status', 'partner')
        .maybeSingle()
      if (mounted && data) setLevel(String((data as { certification_level?: string }).certification_level ?? ''))
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse rounded-2xl bg-white/5 h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <h1 className="text-2xl font-semibold text-white mb-2">Certification</h1>
      <p className="text-sm text-white/60 mb-6">
        Your certification status and level are managed by Fireball Canada.
      </p>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
        <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-white/50 mb-1">Current level</p>
        <p className="text-lg font-semibold text-white capitalize">{level || 'Standard'}</p>
      </div>
    </div>
  )
}
