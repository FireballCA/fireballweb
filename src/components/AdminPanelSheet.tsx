import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

interface AnnouncementSettings {
  navbar_banner_text: string | null
  navbar_banner_link: string | null
  navbar_banner_enabled: boolean
  featured_collection_name: string | null
  featured_collection_description: string | null
  featured_collection_image: string | null
}

interface AdminPanelSheetProps {
  isOpen: boolean
  onClose: () => void
}

export type AdminSection = 'stats' | 'partners' | 'notifications' | 'announcements'

/** Contenu du panneau admin (stats, partners, notifications) réutilisable en page pleine. */
export function AdminPanelContent({ section }: { section?: AdminSection }) {
  const [activeSection, setActiveSection] = useState<AdminSection>(section ?? 'stats')
  const effectiveSection = section ?? activeSection
  const showTabs = section == null

  return (
    <div className="flex-1 overflow-y-auto px-6 md:px-10 pt-5 pb-8">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-10">
        {showTabs && (
          <aside className="w-full lg:w-60 flex-shrink-0">
            <div className="rounded-3xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm px-4 py-4 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
              <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/50 mb-3">
                Sections
              </p>
              <div className="flex flex-row lg:flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSection('stats')}
                  className={`flex-1 inline-flex items-center justify-between rounded-2xl px-3 py-2 text-xs font-medium transition-colors ${
                    activeSection === 'stats'
                      ? 'bg-white/15 text-white border border-white/50'
                      : 'bg-white/[0.02] text-white/70 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <span>Stats</span>
                  <span className="text-[9px] uppercase tracking-[0.18em] text-white/50">Overview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('partners')}
                  className={`flex-1 inline-flex items-center justify-between rounded-2xl px-3 py-2 text-xs font-medium transition-colors ${
                    activeSection === 'partners'
                      ? 'bg-white/15 text-white border border-white/50'
                      : 'bg-white/[0.02] text-white/70 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <span>Partners</span>
                  <span className="text-[9px] uppercase tracking-[0.18em] text-white/50">Applications</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('notifications')}
                  className={`flex-1 inline-flex items-center justify-between rounded-2xl px-3 py-2 text-xs font-medium transition-colors ${
                    activeSection === 'notifications'
                      ? 'bg-white/15 text-white border border-white/50'
                      : 'bg-white/[0.02] text-white/70 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <span>Notifications</span>
                  <span className="text-[9px] uppercase tracking-[0.18em] text-white/50">Broadcast</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('announcements')}
                  className={`flex-1 inline-flex items-center justify-between rounded-2xl px-3 py-2 text-xs font-medium transition-colors ${
                    activeSection === 'announcements'
                      ? 'bg-white/15 text-white border border-white/50'
                      : 'bg-white/[0.02] text-white/70 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <span>Announcements</span>
                  <span className="text-[9px] uppercase tracking-[0.18em] text-white/50">Banner & Featured</span>
                </button>
              </div>
            </div>
          </aside>
        )}
        <main className="w-full lg:flex-1 flex flex-col gap-4">
          {effectiveSection === 'stats' && <AdminStatsSection />}
          {effectiveSection === 'partners' && <AdminPartnersSection />}
          {effectiveSection === 'notifications' && <AdminNotificationsSection />}
          {effectiveSection === 'announcements' && <AdminAnnouncementsSection />}
        </main>
      </div>
    </div>
  )
}

export function AdminPanelSheet({ isOpen, onClose }: AdminPanelSheetProps) {
  const [rendered, setRendered] = useState(isOpen)
  const [isExiting, setIsExiting] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [scrolledDown, setScrolledDown] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setRendered(true)
      setIsExiting(false)
      document.body.style.overflow = 'hidden'
      return
    }

    if (!isOpen && rendered) {
      setIsExiting(true)
      const timeout = window.setTimeout(() => {
        setRendered(false)
        setIsExiting(false)
        document.body.style.overflow = ''
      }, 400)
      return () => {
        window.clearTimeout(timeout)
        document.body.style.overflow = ''
      }
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, rendered])

  if (!rendered) return null

  return (
    <div className="fixed inset-0 z-[150] flex flex-col justify-end pointer-events-none">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity duration-300"
        onClick={onClose}
        aria-label="Close admin panel"
      />
      <div
        className="relative w-full h-[92vh] md:h-[88vh] overflow-hidden pointer-events-auto flex flex-col rounded-t-[28px] shadow-[0_-24px_60px_rgba(0,0,0,0.55)]"
        style={{
          backgroundColor: '#0a0a0a',
          animation: isExiting
            ? 'adminPanelSlideDown 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards'
            : 'adminPanelSlideUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        }}
      >
        {/* Header */}
        <div className="px-6 md:px-10 pt-6 pb-4 border-b border-white/[0.06] flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/45">
              Admin
            </p>
            <h2 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.02em] text-white">
              Admin panel
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-white/65 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
          onScroll={(event) => {
            const target = event.currentTarget
            setScrolledDown(target.scrollTop > 40)
          }}
        >
          <AdminPanelContent />
        </div>

        {/* Mobile close button (floating only, slide like example) */}
        <button
          type="button"
          onClick={onClose}
          className={`lg:hidden pointer-events-auto flex items-center justify-start rounded-full border border-white/[0.18] bg-white/[0.12] backdrop-blur-md text-white/85 hover:bg-white/[0.2] hover:text-white transition-all duration-300 ease-in-out overflow-hidden absolute right-5 bottom-5 z-20 shadow-[0_12px_35px_rgba(0,0,0,0.6)] ${
            scrolledDown ? 'w-11 h-11' : 'w-[130px] h-11'
          }`}
        >
          <div
            className={`flex items-center justify-center transition-all duration-300 ease-in-out ${
              scrolledDown ? 'w-full pl-0' : 'w-[32%] pl-3'
            }`}
          >
            <svg
              className="w-[17px] h-[17px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
            >
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div
            className={`text-white text-[13px] font-semibold transition-all duration-300 ease-in-out whitespace-nowrap ${
              scrolledDown ? 'opacity-0 w-0 pr-0' : 'opacity-100 w-[68%] pr-3'
            }`}
          >
            Close
          </div>
        </button>
      </div>
      <style>{`
        @keyframes adminPanelSlideUp {
          from {
            transform: translateY(100%);
            opacity: 0.98;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes adminPanelSlideDown {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(100%);
            opacity: 0.98;
          }
        }
      `}</style>
    </div>
  )
}

interface PartnerCompanyStatusRow {
  status: 'pending' | 'partner' | 'declined' | null
}

function AdminStatsSection() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [counts, setCounts] = useState({ total: 0, pending: 0, partner: 0, declined: 0 })

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setError('')
      setLoading(true)
      const { data, error: loadError } = await supabase
        .from('partner_companies')
        .select('status')

      if (!mounted) return

      if (loadError) {
        setError(loadError.message || 'Unable to load statistics.')
        setLoading(false)
        return
      }

      const rows = (data || []) as PartnerCompanyStatusRow[]
      const total = rows.length
      const pending = rows.filter((row) => row.status === 'pending').length
      const partner = rows.filter((row) => row.status === 'partner').length
      const declined = rows.filter((row) => row.status === 'declined').length

      setCounts({ total, pending, partner, declined })
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const totalForRatio = Math.max(counts.total, 1)
  const pendingPct = Math.round((counts.pending / totalForRatio) * 100)
  const approvedPct = Math.round((counts.partner / totalForRatio) * 100)
  const declinedPct = Math.round((counts.declined / totalForRatio) * 100)

  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-slate-500">
            Partner applications
          </p>
          <p className="text-sm text-slate-600 mt-1">
            Overview of installer applications by status.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 mb-1">Total applications</p>
          <p className="text-2xl font-semibold text-slate-900">{loading ? '—' : counts.total}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-amber-600 mb-1">Pending</p>
          <p className="text-2xl font-semibold text-amber-900">{loading ? '—' : counts.pending}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-600 mb-1">Approved</p>
          <p className="text-2xl font-semibold text-emerald-900">{loading ? '—' : counts.partner}</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-red-600 mb-1">Declined</p>
          <p className="text-2xl font-semibold text-red-900">{loading ? '—' : counts.declined}</p>
        </div>
      </div>

      {/* Simple ratio bar chart */}
      {!loading && counts.total > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
            Distribution
          </p>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
            <div
              className="h-full bg-amber-400"
              style={{ width: `${pendingPct}%` }}
              aria-label="Pending"
            />
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${approvedPct}%` }}
              aria-label="Approved"
            />
            <div
              className="h-full bg-red-500"
              style={{ width: `${declinedPct}%` }}
              aria-label="Declined"
            />
          </div>
          <div className="flex flex-wrap gap-4 text-[11px] text-slate-600 mt-1">
            <span>
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1" />
              Pending {pendingPct}%
            </span>
            <span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" />
              Approved {approvedPct}%
            </span>
            <span>
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />
              Declined {declinedPct}%
            </span>
          </div>
        </div>
      )}
    </section>
  )
}

interface PartnerApplicationSummaryRow {
  id: string
  company_name: string | null
  status: 'pending' | 'partner' | 'declined'
  submitted_at: string | null
}

function AdminPartnersSection() {
  const [rows, setRows] = useState<PartnerApplicationSummaryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const loadRows = async () => {
    setError('')
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from('partner_companies')
      .select('id, company_name, status, submitted_at')
      .order('submitted_at', { ascending: false })

    if (loadError) {
      setError(loadError.message || 'Unable to load partner applications.')
      setLoading(false)
      return
    }

    setRows((data || []) as PartnerApplicationSummaryRow[])
    setLoading(false)
  }

  useEffect(() => {
    loadRows()
  }, [])

  const updateStatus = async (row: PartnerApplicationSummaryRow, nextStatus: 'partner' | 'declined') => {
    setProcessingId(row.id)
    setError('')
    const { error: statusError } = await supabase
      .from('partner_companies')
      .update({
        status: nextStatus,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id)

    if (statusError) {
      setError(statusError.message || 'Unable to update this application.')
      setProcessingId(null)
      return
    }

    setRows((current) =>
      current.map((item) => (item.id === row.id ? { ...item, status: nextStatus } : item)),
    )
    setProcessingId(null)
  }

  const pending = rows.filter((row) => row.status === 'pending')
  const nonPending = rows.filter((row) => row.status !== 'pending')

  return (
    <section className="rounded-3xl border border-white/[0.09] bg-white/[0.02] px-5 py-5 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/55">
            Partner applications
          </p>
          <p className="text-[12px] text-white/60">
            Review and decide on incoming partner applications directly from this panel.
          </p>
        </div>
        <Link
          to="/account/manage-partners"
          className="hidden md:inline-flex items-center gap-2 rounded-full border border-white/[0.3] bg-white/[0.06] px-3 py-1.5 text-[11px] font-nav uppercase tracking-[0.16em] text-white/85 hover:bg-white/[0.14] hover:border-white/60 transition-colors"
        >
          <span>Open legacy page</span>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M7 17L17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      {error && (
        <div className="mb-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-white/60">Loading applications…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-white/60">No partner applications found.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {pending.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-amber-200/80 mb-2">Pending</p>
              <div className="flex flex-col gap-2.5">
                {pending.map((row) => (
                  <article
                    key={row.id}
                    className="rounded-2xl border border-white/[0.12] bg-white/[0.03] px-4 py-3 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {row.company_name || 'Unknown company'}
                        </p>
                        {row.submitted_at && (
                          <p className="text-[11px] text-white/55">
                            Submitted {new Date(row.submitted_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <span className="inline-flex items-center rounded-full border border-amber-400/60 bg-amber-400/15 px-2 py-0.5 text-[10px] font-nav uppercase tracking-[0.16em] text-amber-100">
                        Pending
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={processingId === row.id}
                        onClick={() => updateStatus(row, 'partner')}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-500 text-black px-3 py-1.5 text-[11px] font-semibold hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={processingId === row.id}
                        onClick={() => updateStatus(row, 'declined')}
                        className="inline-flex items-center gap-1 rounded-full border border-red-500/70 bg-red-500/10 px-3 py-1.5 text-[11px] font-semibold text-red-100 hover:bg-red-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Decline
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {nonPending.length > 0 && (
            <div>
              <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-white/45 mb-2">
                Recent decisions
              </p>
              <div className="flex flex-col gap-2">
                {nonPending.slice(0, 5).map((row) => (
                  <article
                    key={row.id}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.01] px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-white/75"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-white">
                        {row.company_name || 'Unknown company'}
                      </span>
                      {row.submitted_at && (
                        <span className="text-[11px] text-white/50">
                          Submitted {new Date(row.submitted_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-nav uppercase tracking-[0.16em] ${
                        row.status === 'partner'
                          ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-100'
                          : 'border-red-400/60 bg-red-500/10 text-red-100'
                      }`}
                    >
                      {row.status === 'partner' ? 'Approved' : 'Declined'}
                    </span>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

type NotificationAudience = 'all' | 'role' | 'users'

function AdminNotificationsSection() {
  const [audience, setAudience] = useState<NotificationAudience>('all')
  const [role, setRole] = useState('partner')
  const [emailsText, setEmailsText] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!message.trim()) {
      setError('Please enter a message.')
      return
    }

    if (audience === 'role' && !role.trim()) {
      setError('Please specify a role.')
      return
    }

    if (audience === 'users' && !emailsText.trim()) {
      setError('Please enter at least one email address.')
      return
    }

    setSubmitting(true)
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError('You must be logged in as admin to send notifications.')
        setSubmitting(false)
        return
      }

      const basePayload = {
        title: title.trim() || null,
        message: message.trim(),
        created_by: user.id,
      }

      if (audience === 'all') {
        const { error: insertError } = await supabase.from('user_notifications').insert({
          ...basePayload,
          target_type: 'all',
          target_role: null,
          target_user_id: null,
        })
        if (insertError) {
          setError(insertError.message || 'Unable to send notification.')
          setSubmitting(false)
          return
        }
      } else if (audience === 'role') {
        const { error: insertError } = await supabase.from('user_notifications').insert({
          ...basePayload,
          target_type: 'role',
          target_role: role.trim().toLowerCase(),
          target_user_id: null,
        })
        if (insertError) {
          setError(insertError.message || 'Unable to send notification.')
          setSubmitting(false)
          return
        }
      } else {
        const emails = emailsText
          .split(',')
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean)

        if (emails.length === 0) {
          setError('Please enter at least one valid email address.')
          setSubmitting(false)
          return
        }

        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id,email')
          .in('email', emails)

        if (profilesError) {
          setError(profilesError.message || 'Unable to resolve users from email addresses.')
          setSubmitting(false)
          return
        }

        const rows =
          (profiles || []).map((profile) => ({
            ...basePayload,
            target_type: 'user',
            target_role: null,
            target_user_id: profile.id,
          })) ?? []

        if (!rows.length) {
          setError('No matching users were found for the provided email addresses.')
          setSubmitting(false)
          return
        }

        const { error: insertError } = await supabase.from('user_notifications').insert(rows)
        if (insertError) {
          setError(insertError.message || 'Unable to send notifications to selected users.')
          setSubmitting(false)
          return
        }
      }

      setSuccess('Notification has been queued successfully.')
      setTitle('')
      setMessage('')
      setEmailsText('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-3xl border border-white/[0.09] bg-white/[0.02] px-5 py-5 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
      <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/55 mb-3">
        Notifications
      </p>
      <p className="text-[12px] text-white/60 mb-4">
        Send a broadcast notification to all members, specific roles, or specific users.
      </p>

      {error && (
        <div className="mb-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-100">
          {success}
        </div>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/55 mb-1.5">Audience</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAudience('all')}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-nav uppercase tracking-[0.16em] transition-colors ${
                  audience === 'all'
                    ? 'border-white bg-white text-black'
                    : 'border-white/[0.35] text-white/80 hover:bg-white/[0.12] hover:text-white'
                }`}
              >
                All members
              </button>
              <button
                type="button"
                onClick={() => setAudience('role')}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-nav uppercase tracking-[0.16em] transition-colors ${
                  audience === 'role'
                    ? 'border-white bg-white text-black'
                    : 'border-white/[0.35] text-white/80 hover:bg-white/[0.12] hover:text-white'
                }`}
              >
                By role
              </button>
              <button
                type="button"
                onClick={() => setAudience('users')}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-nav uppercase tracking-[0.16em] transition-colors ${
                  audience === 'users'
                    ? 'border-white bg-white text-black'
                    : 'border-white/[0.35] text-white/80 hover:bg-white/[0.12] hover:text-white'
                }`}
              >
                Specific users
              </button>
            </div>
          </div>

          {audience === 'role' && (
            <div className="w-full md:w-56">
              <label className="block text-[11px] uppercase tracking-[0.16em] text-white/55 mb-1.5">
                Target role
              </label>
              <input
                type="text"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="w-full rounded-xl border border-white/[0.18] bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/60"
                placeholder="e.g. partner, admin"
              />
            </div>
          )}

          {audience === 'users' && (
            <div className="w-full md:flex-1">
              <label className="block text-[11px] uppercase tracking-[0.16em] text-white/55 mb-1.5">
                Target users (emails)
              </label>
              <input
                type="text"
                value={emailsText}
                onChange={(event) => setEmailsText(event.target.value)}
                className="w-full rounded-xl border border-white/[0.18] bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/60"
                placeholder="email1@example.com, email2@example.com"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.16em] text-white/55 mb-1.5">
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-xl border border-white/[0.18] bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/60"
              placeholder="Maintenance window, new benefit, important update…"
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-[0.16em] text-white/55 mb-1.5">
              Message
            </label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="w-full min-h-[100px] rounded-xl border border-white/[0.18] bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/60 resize-vertical"
              placeholder="Write the notification your members will see in their dashboard."
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-[11px] text-white/45">
            Notifications are delivered inside the member dashboard. Email delivery can be added later.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2 text-[11px] font-nav uppercase tracking-[0.16em] hover:bg-silver disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Sending…' : 'Send notification'}
          </button>
        </div>
      </form>
    </section>
  )
}

function AdminAnnouncementsSection() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Navbar Banner
  const [bannerText, setBannerText] = useState('')
  const [bannerLink, setBannerLink] = useState('')
  const [bannerEnabled, setBannerEnabled] = useState(false)
  
  // Featured Collection
  const [featuredName, setFeaturedName] = useState('')
  const [featuredDescription, setFeaturedDescription] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('site_settings')
          .select('*')
          .eq('key', 'announcements')
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error loading settings:', fetchError)
          setError('Failed to load settings.')
          return
        }

        if (data?.value) {
          const settings = data.value as AnnouncementSettings
          setBannerText(settings.navbar_banner_text || '')
          setBannerLink(settings.navbar_banner_link || '')
          setBannerEnabled(settings.navbar_banner_enabled || false)
          setFeaturedName(settings.featured_collection_name || '')
          setFeaturedDescription(settings.featured_collection_description || '')
          setFeaturedImage(settings.featured_collection_image || '')
        }
      } catch (err) {
        console.error('Error loading settings:', err)
        setError('Failed to load settings.')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleSave = async () => {
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const settings: AnnouncementSettings = {
        navbar_banner_text: bannerText.trim() || null,
        navbar_banner_link: bannerLink.trim() || null,
        navbar_banner_enabled: bannerEnabled,
        featured_collection_name: featuredName.trim() || null,
        featured_collection_description: featuredDescription.trim() || null,
        featured_collection_image: featuredImage.trim() || null,
      }

      // First, check if the record exists
      const { data: existingData } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'announcements')
        .maybeSingle()

      let result
      if (existingData) {
        // Update existing record
        result = await supabase
          .from('site_settings')
          .update({
            value: settings,
            updated_at: new Date().toISOString(),
          })
          .eq('key', 'announcements')
      } else {
        // Insert new record
        result = await supabase
          .from('site_settings')
          .insert({
            key: 'announcements',
            value: settings,
            updated_at: new Date().toISOString(),
          })
      }

      if (result.error) {
        console.error('Error saving settings:', result.error)
        setError(result.error.message || 'Failed to save settings.')
        return
      }

      setSuccess('Settings saved successfully.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="rounded-3xl border border-white/[0.09] bg-white/[0.02] px-5 py-5 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
        <p className="text-white/60">Loading...</p>
      </section>
    )
  }

  return (
    <section className="rounded-3xl border border-white/[0.09] bg-white/[0.02] px-5 py-5 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
      <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/55 mb-3">
        Announcements
      </p>
      <p className="text-[12px] text-white/60 mb-6">
        Manage the navbar banner and featured collection displayed in the shop menu.
      </p>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-100">
          {success}
        </div>
      )}

      <div className="space-y-8">
        {/* Navbar Banner */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-4">Navbar Banner</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="banner-enabled"
                checked={bannerEnabled}
                onChange={(e) => setBannerEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-white/30 bg-black/40 text-white focus:ring-white/50"
              />
              <label htmlFor="banner-enabled" className="text-sm text-white/80">
                Enable banner
              </label>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-[0.16em] text-white/55 mb-1.5">
                Banner Text
              </label>
              <input
                type="text"
                value={bannerText}
                onChange={(e) => setBannerText(e.target.value)}
                className="w-full rounded-xl border border-white/[0.18] bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/60"
                placeholder="e.g. New collection available now!"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-[0.16em] text-white/55 mb-1.5">
                Banner Link (URL)
              </label>
              <input
                type="url"
                value={bannerLink}
                onChange={(e) => setBannerLink(e.target.value)}
                className="w-full rounded-xl border border-white/[0.18] bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/60"
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        {/* Featured Collection */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-4">Featured Collection</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.16em] text-white/55 mb-1.5">
                Collection Name
              </label>
              <input
                type="text"
                value={featuredName}
                onChange={(e) => setFeaturedName(e.target.value)}
                className="w-full rounded-xl border border-white/[0.18] bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/60"
                placeholder="Featured Collection"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-[0.16em] text-white/55 mb-1.5">
                Description
              </label>
              <textarea
                value={featuredDescription}
                onChange={(e) => setFeaturedDescription(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-white/[0.18] bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/60 resize-none"
                placeholder="Découvrez notre sélection premium de produits haut de gamme"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-[0.16em] text-white/55 mb-1.5">
                Image
              </label>
              <input
                type="url"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                className="w-full rounded-xl border border-white/[0.18] bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/60 mb-3"
                placeholder="https://example.com/image.jpg (optional if you upload below)"
              />
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 rounded-xl border border-white/[0.25] bg-black/40 px-3 py-2 text-[12px] text-white/80 cursor-pointer hover:bg-black/60 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return

                      setError('')
                      setSuccess('')
                      try {
                        const {
                          data: { user },
                          error: userError,
                        } = await supabase.auth.getUser()

                        if (userError || !user) {
                          throw new Error('Session expired. Please sign in again.')
                        }

                        const fileExt = file.name.split('.').pop()
                        const fileName = `featured-${user.id}-${Date.now()}.${fileExt}`
                        const filePath = `featured-collections/${fileName}`

                        const { error: uploadError } = await supabase.storage
                          .from('assets')
                          .upload(filePath, file, { upsert: true })

                        if (uploadError) throw uploadError

                        const { data } = supabase.storage.from('assets').getPublicUrl(filePath)
                        if (!data?.publicUrl) throw new Error('Unable to get public URL for image.')

                        setFeaturedImage(data.publicUrl)
                        setSuccess('Image uploaded successfully. Don’t forget to save settings.')
                      } catch (err) {
                        console.error('Error uploading featured image:', err)
                        setError(
                          err instanceof Error
                            ? err.message
                            : 'Unable to upload image. Please try again.',
                        )
                      } finally {
                        // allow re-selecting same file
                        e.target.value = ''
                      }
                    }}
                  />
                  <span>Upload image from your computer</span>
                </label>
                {featuredImage && (
                  <span className="text-[11px] text-white/60 truncate max-w-[140px]">Image selected</span>
                )}
              </div>
              {featuredImage && (
                <div className="mt-2">
                  <img
                    src={featuredImage}
                    alt="Featured collection preview"
                    className="w-32 h-auto object-cover rounded border border-white/20"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2 text-[11px] font-nav uppercase tracking-[0.16em] hover:bg-silver disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>
    </section>
  )
}
