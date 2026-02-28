import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile } from '@/utils/supabaseAuth'

interface PartnerApplicationRow {
  id: string
  user_id: string
  company_name: string
  status: 'pending' | 'partner' | 'declined'
  submitted_at: string
  application_data?: {
    owner_primary_contact?: string
    business_address?: string
    [key: string]: unknown
  } | null
}

export function ManagePartners() {
  const [applications, setApplications] = useState<PartnerApplicationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      const profile = await getCurrentUserProfile()
      if (!mounted) return
      if ((profile?.role || '').toLowerCase() !== 'admin') {
        setLoading(false)
        return
      }
      setIsAdmin(true)
      await loadApplications()
    }
    run()
    return () => {
      mounted = false
    }
  }, [])

  const loadApplications = async () => {
    setError('')
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from('partner_companies')
      .select('id,user_id,company_name,status,submitted_at,application_data')
      .order('submitted_at', { ascending: false })

    if (loadError) {
      setError(loadError.message || 'Unable to load partner applications.')
      setLoading(false)
      return
    }

    setApplications((data || []) as PartnerApplicationRow[])
    setLoading(false)
  }

  const updateStatus = async (row: PartnerApplicationRow, nextStatus: 'partner' | 'declined') => {
    setProcessingId(row.id)
    setError('')
    const { data: userData } = await supabase.auth.getUser()
    const adminId = userData.user?.id ?? null

    const { error: statusError } = await supabase
      .from('partner_companies')
      .update({
        status: nextStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id)

    if (statusError) {
      setError(statusError.message || 'Unable to update partner status.')
      setProcessingId(null)
      return
    }

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', row.user_id)
      .maybeSingle()

    const existingRole = String(profileRow?.role || '').toLowerCase()
    const roleValue = existingRole === 'admin' ? 'admin' : nextStatus === 'partner' ? 'partner' : 'member'
    const partnerStatusValue = nextStatus === 'partner' ? 'partner' : 'declined'
    await supabase
      .from('profiles')
      .update({
        role: roleValue,
        partner_status: partnerStatusValue,
        company_name: row.company_name,
      })
      .eq('id', row.user_id)

    await loadApplications()
    setProcessingId(null)
  }

  const pendingRequests = useMemo(() => applications.filter((row) => row.status === 'pending'), [applications])
  const certifiedPartners = useMemo(() => applications.filter((row) => row.status === 'partner'), [applications])
  const declinedCount = useMemo(() => applications.filter((row) => row.status === 'declined').length, [applications])

  if (!loading && !isAdmin) {
    return (
      <section className="min-h-screen bg-[#141416] px-6 md:px-12 lg:px-16 py-24 text-white">
        <div className="max-w-[900px] mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Restricted Area</h1>
          <p className="mt-4 text-white/70">Only admin accounts can access the partner management console.</p>
          <Link
            to="/account/dashboard"
            className="mt-6 inline-flex items-center justify-center rounded-full border border-white/20 bg-white/[0.06] px-5 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/[0.12] transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen bg-[#141416] px-6 md:px-12 lg:px-16 py-24 text-white">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">Admin Console</p>
            <h1 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight">Manage Partners</h1>
          </div>
          <Link
            to="/account/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/[0.12] transition-colors"
          >
            Back to dashboard
          </Link>
        </div>

        <div id="global-statistics" className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 scroll-mt-24">
          <article className="rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-2xl px-5 py-5 shadow-[0_16px_36px_rgba(0,0,0,0.35)]">
            <p className="text-xs uppercase tracking-[0.14em] text-white/55">Pending approvals</p>
            <p className="mt-2 text-3xl font-bold">{loading ? '-' : pendingRequests.length}</p>
          </article>
          <article className="rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-2xl px-5 py-5 shadow-[0_16px_36px_rgba(0,0,0,0.35)]">
            <p className="text-xs uppercase tracking-[0.14em] text-white/55">Certified partners</p>
            <p className="mt-2 text-3xl font-bold">{loading ? '-' : certifiedPartners.length}</p>
          </article>
          <article className="rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-2xl px-5 py-5 shadow-[0_16px_36px_rgba(0,0,0,0.35)]">
            <p className="text-xs uppercase tracking-[0.14em] text-white/55">Declined this month</p>
            <p className="mt-2 text-3xl font-bold">{loading ? '-' : declinedCount}</p>
          </article>
        </div>
        {error && (
          <div className="mt-4 rounded-xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <article className="rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-2xl px-5 py-5 shadow-[0_16px_36px_rgba(0,0,0,0.35)]">
            <h2 className="text-sm uppercase tracking-[0.16em] text-white/60">Pending requests</h2>
            <div className="mt-4 flex flex-col gap-2.5">
              {pendingRequests.map((request) => (
                <div key={request.id} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-sm font-semibold">{request.company_name}</p>
                  <p className="mt-1 text-xs text-white/65">
                    {request.application_data?.owner_primary_contact || 'Unknown owner'} -{' '}
                    {new Date(request.submitted_at).toLocaleDateString('en-CA')}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => updateStatus(request, 'partner')}
                      disabled={processingId === request.id}
                      className="rounded-full bg-emerald-500/20 border border-emerald-300/35 px-3 py-1 text-[11px] text-emerald-200 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => updateStatus(request, 'declined')}
                      disabled={processingId === request.id}
                      className="rounded-full bg-rose-500/20 border border-rose-300/35 px-3 py-1 text-[11px] text-rose-200 hover:bg-rose-500/30 transition-colors disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
              {!loading && pendingRequests.length === 0 && (
                <p className="text-xs text-white/55">No pending partner applications.</p>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-2xl px-5 py-5 shadow-[0_16px_36px_rgba(0,0,0,0.35)]">
            <h2 className="text-sm uppercase tracking-[0.16em] text-white/60">Certified Fireball Partners</h2>
            <div className="mt-4 flex flex-col gap-2.5">
              {certifiedPartners.map((partner) => (
                <div key={partner.id} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-sm font-semibold">{partner.company_name}</p>
                  <p className="mt-1 text-xs text-white/65">{partner.application_data?.business_address || '-'}</p>
                  <p className="mt-2 inline-flex rounded-full border border-white/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-white/75">
                    Partner
                  </p>
                </div>
              ))}
              {!loading && certifiedPartners.length === 0 && (
                <p className="text-xs text-white/55">No certified partners yet.</p>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
