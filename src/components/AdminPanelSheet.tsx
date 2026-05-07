import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { AdminApplicationsHub } from '@/components/admin/AdminApplicationsHub'
import { lockScroll, unlockScroll } from '@/utils/scrollLock'
import {
  DEFAULT_SITE_EVENT_CONFIGS,
  resolveSiteEventConfigs,
  type SiteEventConfig,
  type EventAccessMode,
  type WhatToExpectRow,
} from '@/constants/siteEventConfigs'
import { fetchProductsFromShopify } from '@/utils/shopifyStorefront'
import { PRODUCTS, type Product as LocalProduct } from '@/data/products'

interface AnnouncementSettings {
  navbar_banner_text: string | null
  navbar_banner_link: string | null
  navbar_banner_enabled: boolean
  navbar_banner_deadline: string | null
  featured_collection_name: string | null
  featured_collection_description: string | null
  featured_collection_image: string | null
  /** Landing plein écran — séparé du mega menu Shop */
  home_collection_eyebrow?: string | null
  home_collection_headline?: string | null
  home_collection_description?: string | null
  home_collection_image?: string | null
  home_collection_href?: string | null
  home_collection_button1_label?: string | null
  home_collection_button1_href?: string | null
  home_collection_button2_label?: string | null
  home_collection_button2_href?: string | null
}

interface AdminPanelSheetProps {
  isOpen: boolean
  onClose: () => void
}

export type AdminSection = 'stats' | 'partners' | 'notifications' | 'announcements' | 'products' | 'events'

/** Contenu du panneau admin (stats, partners, notifications) réutilisable en page pleine. */
export function AdminPanelContent({ section }: { section?: AdminSection }) {
  const [activeSection, setActiveSection] = useState<AdminSection>(section ?? 'stats')
  const effectiveSection = section ?? activeSection
  const showTabs = section == null

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-5 pb-8 sm:px-6 md:px-8">
      <div
        className={`mx-auto flex w-full flex-col gap-6 lg:flex-row lg:gap-10 ${
          section === 'partners' ? 'max-w-[1400px]' : 'max-w-6xl'
        }`}
      >
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
                  <span>Applications</span>
                  <span className="text-[9px] uppercase tracking-[0.18em] text-white/50">Training · Partner</span>
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
                <button
                  type="button"
                  onClick={() => setActiveSection('products')}
                  className={`flex-1 inline-flex items-center justify-between rounded-2xl px-3 py-2 text-xs font-medium transition-colors ${
                    activeSection === 'products'
                      ? 'bg-white/15 text-white border border-white/50'
                      : 'bg-white/[0.02] text-white/70 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <span>Products</span>
                  <span className="text-[9px] uppercase tracking-[0.18em] text-white/50">Why + How to use</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('events')}
                  className={`flex-1 inline-flex items-center justify-between rounded-2xl px-3 py-2 text-xs font-medium transition-colors ${
                    activeSection === 'events'
                      ? 'bg-white/15 text-white border border-white/50'
                      : 'bg-white/[0.02] text-white/70 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <span>Events</span>
                  <span className="text-[9px] uppercase tracking-[0.18em] text-white/50">Manage · RSVP</span>
                </button>
              </div>
            </div>
          </aside>
        )}
        <main className="w-full lg:flex-1 flex flex-col gap-4">
          {effectiveSection === 'stats' && <AdminStatsSection />}
          {effectiveSection === 'partners' && <AdminApplicationsHub />}
          {effectiveSection === 'notifications' && <AdminNotificationsSection />}
          {effectiveSection === 'announcements' && <AdminAnnouncementsSection />}
          {effectiveSection === 'products' && <AdminProductsSection />}
          {effectiveSection === 'events' && <AdminEventsSection />}
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
      lockScroll()
      return () => {
        unlockScroll()
      }
    }

    if (!isOpen && rendered) {
      setIsExiting(true)
      const timeout = window.setTimeout(() => {
        setRendered(false)
        setIsExiting(false)
      }, 400)
      return () => {
        window.clearTimeout(timeout)
      }
    }

    return undefined
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

function BannerDeadlineCountdown({ deadline }: { deadline: string }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const diff = Math.max(0, new Date(deadline).getTime() - Date.now())
  if (diff === 0) {
    return <p className="mt-1.5 text-[11px] text-red-400">Expired — banner hidden from public.</p>
  }
  const s = Math.floor(diff / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  const parts = d > 0
    ? `${d}d ${pad(h)}h ${pad(m)}m`
    : `${pad(h)}h ${pad(m)}m ${pad(sec)}s`
  return (
    <p className="mt-1.5 text-[11px] text-amber-400/80">
      ⏱ Expires in <span className="font-mono font-semibold text-amber-300">{parts}</span>
    </p>
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
  const [bannerDeadline, setBannerDeadline] = useState('')
  
  // Featured Collection
  const [featuredName, setFeaturedName] = useState('')
  const [featuredDescription, setFeaturedDescription] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')
  const [homeEyebrow, setHomeEyebrow] = useState('')
  const [homeHeadline, setHomeHeadline] = useState('')
  const [homeDescription, setHomeDescription] = useState('')
  const [homeImage, setHomeImage] = useState('')
  const [homeHref, setHomeHref] = useState('')
  const [homeBtn1Label, setHomeBtn1Label] = useState('')
  const [homeBtn1Href, setHomeBtn1Href] = useState('')
  const [homeBtn2Label, setHomeBtn2Label] = useState('')
  const [homeBtn2Href, setHomeBtn2Href] = useState('')

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
          setBannerDeadline(settings.navbar_banner_deadline || '')
          setFeaturedName(settings.featured_collection_name || '')
          setFeaturedDescription(settings.featured_collection_description || '')
          setFeaturedImage(settings.featured_collection_image || '')
          setHomeEyebrow(settings.home_collection_eyebrow || '')
          setHomeHeadline(settings.home_collection_headline || '')
          setHomeDescription(settings.home_collection_description || '')
          setHomeImage(settings.home_collection_image || '')
          setHomeHref(settings.home_collection_href || '')
          setHomeBtn1Label(settings.home_collection_button1_label || '')
          setHomeBtn1Href(settings.home_collection_button1_href || '')
          setHomeBtn2Label(settings.home_collection_button2_label || '')
          setHomeBtn2Href(settings.home_collection_button2_href || '')
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
        navbar_banner_deadline: bannerDeadline.trim() || null,
        featured_collection_name: featuredName.trim() || null,
        featured_collection_description: featuredDescription.trim() || null,
        featured_collection_image: featuredImage.trim() || null,
        home_collection_eyebrow: homeEyebrow.trim() || null,
        home_collection_headline: homeHeadline.trim() || null,
        home_collection_description: homeDescription.trim() || null,
        home_collection_image: homeImage.trim() || null,
        home_collection_href: homeHref.trim() || null,
        home_collection_button1_label: homeBtn1Label.trim() || null,
        home_collection_button1_href: homeBtn1Href.trim() || null,
        home_collection_button2_label: homeBtn2Label.trim() || null,
        home_collection_button2_href: homeBtn2Href.trim() || null,
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
        Navbar banner, bloc « Featured » du menu Shop, et bannière plein écran d’accueil (réglages séparés).
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
            <div>
              <label className="block text-[11px] uppercase tracking-[0.16em] text-white/55 mb-1.5">
                Deadline (auto-hide after)
              </label>
              <input
                type="datetime-local"
                value={bannerDeadline}
                onChange={(e) => setBannerDeadline(e.target.value)}
                className="w-full rounded-xl border border-white/[0.18] bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/60 [color-scheme:dark]"
              />
              {bannerDeadline && <BannerDeadlineCountdown deadline={bannerDeadline} />}
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

            <div className="pt-4 border-t border-white/[0.08]">
              <p className="text-[11px] font-nav font-bold uppercase tracking-[0.14em] text-white/45 mb-1">
                Home — bannière plein écran
              </p>
              <p className="text-[11px] text-white/45 mb-3">
                Indépendant du bloc « Featured » ci-dessus (menu Shop). Texte et boutons en bas à gauche sur la page
                d’accueil.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.16em] text-white/55 mb-1.5">
                    Image URL (bannière)
                  </label>
                  <input
                    type="text"
                    value={homeImage}
                    onChange={(e) => setHomeImage(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.18] bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/60"
                    placeholder="/Assets/Coatings/Coatings%20Banner.png"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.16em] text-white/55 mb-1.5">
                    Eyebrow (ligne 1, bas gauche)
                  </label>
                  <input
                    type="text"
                    value={homeEyebrow}
                    onChange={(e) => setHomeEyebrow(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.18] bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/60"
                    placeholder="Surface Technology"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.16em] text-white/55 mb-1.5">
                    Headline (ligne 2, légèrement plus grand)
                  </label>
                  <input
                    type="text"
                    value={homeHeadline}
                    onChange={(e) => setHomeHeadline(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.18] bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/60"
                    placeholder="Coatings"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.16em] text-white/55 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={homeDescription}
                    onChange={(e) => setHomeDescription(e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-white/[0.18] bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/60 resize-none"
                    placeholder="Excellence in every detail"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.16em] text-white/55 mb-1.5">
                    Clic sur toute l’image (route ou URL)
                  </label>
                  <input
                    type="text"
                    value={homeHref}
                    onChange={(e) => setHomeHref(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.18] bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/60"
                    placeholder="/coatings"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.16em] text-white/55 mb-1.5">
                      Button 1 label
                    </label>
                    <input
                      type="text"
                      value={homeBtn1Label}
                      onChange={(e) => setHomeBtn1Label(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.18] bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/60"
                      placeholder="Shop coatings"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.16em] text-white/55 mb-1.5">
                      Button 1 URL
                    </label>
                    <input
                      type="text"
                      value={homeBtn1Href}
                      onChange={(e) => setHomeBtn1Href(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.18] bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/60"
                      placeholder="/coatings"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.16em] text-white/55 mb-1.5">
                      Button 2 label
                    </label>
                    <input
                      type="text"
                      value={homeBtn2Label}
                      onChange={(e) => setHomeBtn2Label(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.18] bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/60"
                      placeholder="Learn more"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.16em] text-white/55 mb-1.5">
                      Button 2 URL
                    </label>
                    <input
                      type="text"
                      value={homeBtn2Href}
                      onChange={(e) => setHomeBtn2Href(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.18] bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/60"
                      placeholder="/all-coatings"
                    />
                  </div>
                </div>
              </div>
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

type ProductPageContent = {
  why: string | null
  how_to_use_steps: string[] | null
}

type ProductPagesSettings = Record<string, ProductPageContent | undefined>

function normalizeStepsFromTextarea(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function stepsToTextarea(steps: string[] | null | undefined): string {
  return Array.isArray(steps) ? steps.join('\n') : ''
}

function AdminProductsSection() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [products, setProducts] = useState<LocalProduct[]>(PRODUCTS)
  const [selectedSlug, setSelectedSlug] = useState<string>(PRODUCTS[0]?.slug ?? '')

  const [settings, setSettings] = useState<ProductPagesSettings>({})
  const current = settings[selectedSlug] ?? { why: null, how_to_use_steps: null }

  const [whyText, setWhyText] = useState('')
  const [stepsText, setStepsText] = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setError('')
      setSuccess('')
      setLoading(true)
      try {
        const [productsRes, settingsRes] = await Promise.allSettled([
          fetchProductsFromShopify(),
          supabase.from('site_settings').select('value').eq('key', 'product_pages').maybeSingle(),
        ])

        if (mounted) {
          if (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value) && productsRes.value.length > 0) {
            setProducts(productsRes.value)
            setSelectedSlug((prev) => prev || productsRes.value[0]?.slug || '')
          } else {
            setProducts(PRODUCTS)
            setSelectedSlug((prev) => prev || PRODUCTS[0]?.slug || '')
          }

          if (settingsRes.status === 'fulfilled') {
            const row = settingsRes.value
            const raw = (row.data?.value ?? {}) as unknown
            const next = (raw && typeof raw === 'object' ? (raw as ProductPagesSettings) : {}) as ProductPagesSettings
            setSettings(next)
          }
        }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to load product settings.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    setWhyText(current.why ?? '')
    setStepsText(stepsToTextarea(current.how_to_use_steps))
  }, [selectedSlug]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!selectedSlug) return
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      const nextEntry: ProductPageContent = {
        why: whyText.trim() ? whyText.trim() : null,
        how_to_use_steps: normalizeStepsFromTextarea(stepsText).length
          ? normalizeStepsFromTextarea(stepsText)
          : null,
      }
      const nextSettings: ProductPagesSettings = {
        ...settings,
        [selectedSlug]: nextEntry,
      }

      const { data: existing, error: existingError } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'product_pages')
        .maybeSingle()

      if (existingError) throw existingError

      const write = existing
        ? supabase
            .from('site_settings')
            .update({ value: nextSettings, updated_at: new Date().toISOString() })
            .eq('key', 'product_pages')
        : supabase
            .from('site_settings')
            .insert({ key: 'product_pages', value: nextSettings, updated_at: new Date().toISOString() })

      const res = await write
      if (res.error) throw res.error

      setSettings(nextSettings)
      setSuccess('Saved.')
      setTimeout(() => setSuccess(''), 2200)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save product settings.')
    } finally {
      setSaving(false)
    }
  }

  const selectedProduct = products.find((p) => p.slug === selectedSlug) ?? null

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
        Products
      </p>
      <p className="text-[12px] text-white/60 mb-6">
        Configure “Why [PRODUCT]?” and “How to use” sections shown on product pages.
      </p>

      {(error || success) && (
        <div
          className={`mb-4 rounded-xl border px-3 py-2 text-[12px] ${
            error
              ? 'border-red-500/40 bg-red-500/10 text-red-200'
              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
          }`}
        >
          {error || success}
        </div>
      )}

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.16em] text-white/55 mb-1.5">
              Product
            </label>
            <select
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="w-full rounded-xl border border-white/[0.18] bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/60"
            >
              {products.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-xl border border-white/[0.12] bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/55 mb-1">Preview title</p>
            <p className="text-sm font-semibold text-white">
              Why {selectedProduct?.name ?? selectedSlug}?
            </p>
          </div>
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-[0.16em] text-white/55 mb-1.5">
            Why (text)
          </label>
          <textarea
            value={whyText}
            onChange={(e) => setWhyText(e.target.value)}
            className="w-full min-h-[120px] rounded-xl border border-white/[0.18] bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/60 resize-vertical"
            placeholder={`Example:\nWhy ${selectedProduct?.name ?? '[PRODUCT]'}?\nWater spots are caused by mineral deposits...`}
          />
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-[0.16em] text-white/55 mb-1.5">
            How to use (1 step per line)
          </label>
          <textarea
            value={stepsText}
            onChange={(e) => setStepsText(e.target.value)}
            className="w-full min-h-[140px] rounded-xl border border-white/[0.18] bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/60 resize-vertical"
            placeholder={'Step 1...\nStep 2...\nStep 3...'}
          />
          <p className="mt-2 text-[11px] text-white/45">
            Tip: empty lines are ignored.
          </p>
        </div>

        <div className="pt-1 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !selectedSlug}
            className="inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2 text-[11px] font-nav uppercase tracking-[0.16em] hover:bg-silver disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </section>
  )
}

type EventRsvpRow = { event_slug: string; status: string }

const ADMIN_INPUT = 'w-full rounded-xl bg-white/[0.07] border border-white/[0.08] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors'
const ADMIN_LABEL = 'block text-[10px] font-bold uppercase tracking-[0.14em] text-white/50 mb-1.5'

type EventDraft = {
  id: string; slug: string; title: string; day: string; monthFull: string
  description: string; cityRegion: string; imageSrc: string
  accessMode: EventAccessMode; allowedRoles: string
  ctaLabel: string; ctaHref: string
  heroTitle: string; navTitle: string
  dateLine: string; locationLine: string
  startAt: string; endAt: string
  whatToExpectRows: WhatToExpectRow[]
}

function toEventDraft(ev: SiteEventConfig): EventDraft {
  return {
    id: ev.id, slug: ev.slug, title: ev.title, day: ev.day, monthFull: ev.monthFull,
    description: ev.description, cityRegion: ev.cityRegion, imageSrc: ev.imageSrc,
    accessMode: ev.accessMode ?? 'public',
    allowedRoles: (ev.allowedRoles ?? []).join(', '),
    ctaLabel: ev.ctaLabel, ctaHref: ev.ctaHref,
    heroTitle: ev.heroTitle ?? ev.title, navTitle: ev.navTitle ?? ev.title,
    dateLine: ev.dateLine ?? '', locationLine: ev.locationLine ?? ev.cityRegion,
    startAt: ev.startAt ?? '', endAt: ev.endAt ?? '',
    whatToExpectRows: ev.whatToExpect ?? [],
  }
}

function blankDraft(): EventDraft {
  return {
    id: '', slug: '', title: '', day: '', monthFull: '', description: '',
    cityRegion: '', imageSrc: '', accessMode: 'public', allowedRoles: '',
    ctaLabel: 'RSVP NOW', ctaHref: '', heroTitle: '', navTitle: '',
    dateLine: '', locationLine: '', startAt: '', endAt: '',
    whatToExpectRows: [],
  }
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
      {label}
    </p>
  )
}

const ACCESS_MODES: { mode: EventAccessMode; label: string; sub: string }[] = [
  { mode: 'public',       label: 'Public',       sub: 'Visible to everyone, no login needed' },
  { mode: 'private',      label: 'Private',       sub: 'Requires login + invitation' },
  { mode: 'partner-only', label: 'Partners only', sub: 'Restricted to specific roles' },
]

// ─── main component ────────────────────────────────────────────────────────────

function AdminEventsSection() {
  const [events, setEvents] = useState<SiteEventConfig[]>([])
  const [rsvpRows, setRsvpRows] = useState<EventRsvpRow[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'edit'>('list')
  const [draft, setDraft] = useState<EventDraft>(blankDraft())
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const isNew = !events.find((e) => e.slug === draft.slug)

  const loadAll = useCallback(async () => {
    const [settingsRes, rsvpRes] = await Promise.all([
      supabase.from('site_settings').select('value').eq('key', 'events').maybeSingle(),
      supabase.from('event_rsvps').select('event_slug, status'),
    ])
    const fromDB = resolveSiteEventConfigs(settingsRes.data?.value)
    const allSlugs = new Set(fromDB.map((e) => e.slug))
    const merged = [...fromDB, ...DEFAULT_SITE_EVENT_CONFIGS.filter((d) => !allSlugs.has(d.slug))]
    setEvents(merged)
    setRsvpRows((rsvpRes.data as EventRsvpRow[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadAll()
    const channel = supabase
      .channel('admin_event_rsvps')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_rsvps' }, () => void loadAll())
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [loadAll])

  const openNew = () => { setDraft(blankDraft()); setSaveError(null); setView('edit') }
  const openEdit = (ev: SiteEventConfig) => { setDraft(toEventDraft(ev)); setSaveError(null); setView('edit') }
  const set = (k: keyof EventDraft, v: string) => setDraft((d) => ({ ...d, [k]: v }))

  const updateRow = (idx: number, patch: Partial<WhatToExpectRow>) =>
    setDraft((d) => {
      const rows = [...d.whatToExpectRows]
      rows[idx] = { ...rows[idx], ...patch }
      return { ...d, whatToExpectRows: rows }
    })

  const addRow = () =>
    setDraft((d) => ({
      ...d,
      whatToExpectRows: [
        ...d.whatToExpectRows,
        { num: String(d.whatToExpectRows.length + 1).padStart(2, '0'), title: '', body: '' },
      ],
    }))

  const removeRow = (idx: number) =>
    setDraft((d) => ({ ...d, whatToExpectRows: d.whatToExpectRows.filter((_, i) => i !== idx) }))

  const handleSave = async () => {
    if (!draft.title.trim() || !draft.slug.trim()) { setSaveError('Title and slug are required.'); return }
    setSaving(true); setSaveError(null)
    try {
      const updated: SiteEventConfig = {
        id: draft.id || `${draft.slug}-${Date.now()}`,
        slug: draft.slug,
        title: draft.title,
        day: draft.day,
        monthFull: draft.monthFull.toUpperCase(),
        description: draft.description,
        cityRegion: draft.cityRegion,
        imageSrc: draft.imageSrc,
        isPrivate: draft.accessMode !== 'public',
        accessMode: draft.accessMode,
        allowedRoles: draft.allowedRoles.split(',').map((r) => r.trim()).filter(Boolean),
        ctaLabel: draft.ctaLabel,
        ctaHref: draft.ctaHref,
        heroTitle: draft.heroTitle || draft.title,
        navTitle: draft.navTitle || draft.title,
        dateLine: draft.dateLine,
        locationLine: draft.locationLine,
        startAt: draft.startAt,
        endAt: draft.endAt,
        whatToExpect: draft.whatToExpectRows.filter((r) => r.title.trim()),
      }
      const nextEvents = isNew
        ? [...events, updated]
        : events.map((e) => (e.slug === draft.slug ? updated : e))
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'events', value: nextEvents }, { onConflict: 'key' })
      if (error) throw error
      setEvents(nextEvents)
      setView('list')
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (slug: string) => {
    const nextEvents = events.filter((e) => e.slug !== slug)
    await supabase.from('site_settings').upsert({ key: 'events', value: nextEvents }, { onConflict: 'key' })
    setEvents(nextEvents)
  }

  // ── RSVP counts by slug ──────────────────────────────────────────────────────
  const bySlug: Record<string, { going: number; notGoing: number }> = {}
  for (const r of rsvpRows) {
    if (!bySlug[r.event_slug]) bySlug[r.event_slug] = { going: 0, notGoing: 0 }
    if (r.status === 'going') bySlug[r.event_slug].going++
    else if (r.status === 'not-going') bySlug[r.event_slug].notGoing++
  }

  // ── EDIT VIEW ────────────────────────────────────────────────────────────────
  if (view === 'edit') {
    return (
      <div className="space-y-3">
        {/* Header bar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setView('list')}
            className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-[13px]"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Events
          </button>
          <span className="text-white/20">/</span>
          <p className="text-[13px] font-semibold text-white">{isNew ? 'New event' : draft.title || 'Edit event'}</p>
        </div>

        {/* ── SECTION: General ────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-4 space-y-3">
          <SectionHeader label="General" />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={ADMIN_LABEL}>Event name</label>
              <input
                value={draft.title}
                onChange={(e) => {
                  set('title', e.target.value)
                  if (isNew) set('slug', slugify(e.target.value))
                }}
                placeholder="Fireball After Party"
                className={ADMIN_INPUT}
              />
            </div>
            <div>
              <label className={ADMIN_LABEL}>URL slug</label>
              <div className="flex items-center rounded-xl bg-white/[0.07] border border-white/[0.08] px-3 focus-within:border-white/20 transition-colors overflow-hidden">
                <span className="text-[12px] text-white/30 shrink-0">/event/</span>
                <input
                  value={draft.slug}
                  onChange={(e) => set('slug', slugify(e.target.value))}
                  placeholder="fireball-after-party"
                  className="flex-1 bg-transparent py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className={ADMIN_LABEL}>Description</label>
            <textarea
              value={draft.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              placeholder="Short description shown on the event hero…"
              className={ADMIN_INPUT}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={ADMIN_LABEL}>Date line — shown in header</label>
              <input
                value={draft.dateLine}
                onChange={(e) => set('dateLine', e.target.value)}
                placeholder="May 16, 2026 · 7 PM – 11 PM"
                className={ADMIN_INPUT}
              />
            </div>
            <div>
              <label className={ADMIN_LABEL}>Location</label>
              <input
                value={draft.locationLine}
                onChange={(e) => { set('locationLine', e.target.value); set('cityRegion', e.target.value) }}
                placeholder="Saint-Hyacinthe, QC"
                className={ADMIN_INPUT}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={ADMIN_LABEL}>Start — ISO date (for countdown)</label>
              <input
                value={draft.startAt}
                onChange={(e) => set('startAt', e.target.value)}
                placeholder="2026-05-16T19:00:00-04:00"
                className={ADMIN_INPUT}
              />
            </div>
            <div>
              <label className={ADMIN_LABEL}>End — ISO date</label>
              <input
                value={draft.endAt}
                onChange={(e) => set('endAt', e.target.value)}
                placeholder="2026-05-16T23:00:00-04:00"
                className={ADMIN_INPUT}
              />
            </div>
          </div>
        </section>

        {/* ── SECTION: Visibility ──────────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-4">
          <SectionHeader label="Visibility" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {ACCESS_MODES.map(({ mode, label, sub }) => {
              const active = draft.accessMode === mode
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, accessMode: mode }))}
                  className={`flex flex-col items-start gap-1.5 rounded-xl border px-4 py-3.5 text-left transition-all ${
                    active
                      ? 'border-[#0485F7] bg-[#0485F7]/10'
                      : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className={`text-[13px] font-semibold ${active ? 'text-white' : 'text-white/70'}`}>
                      {label}
                    </span>
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
                        active ? 'border-[#0485F7] bg-[#0485F7]' : 'border-white/25'
                      }`}
                    >
                      {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                  <span className="text-[11px] leading-snug text-white/35">{sub}</span>
                </button>
              )
            })}
          </div>

          {draft.accessMode === 'partner-only' && (
            <div className="mt-3">
              <label className={ADMIN_LABEL}>Allowed roles (comma-separated)</label>
              <input
                value={draft.allowedRoles}
                onChange={(e) => set('allowedRoles', e.target.value)}
                placeholder="partner, admin, installer"
                className={ADMIN_INPUT}
              />
              <p className="mt-1.5 text-[11px] text-white/30">Leave empty to allow all logged-in users with partner status.</p>
            </div>
          )}
        </section>

        {/* ── SECTION: What to Expect ──────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <SectionHeader label="What to expect" />
              <p className="text-[11px] text-white/30 -mt-2 mb-0">
                {draft.whatToExpectRows.length === 0
                  ? 'Empty — the default 3 rows will be shown on the event page.'
                  : `${draft.whatToExpectRows.length} row${draft.whatToExpectRows.length > 1 ? 's' : ''} — shown on the event page.`}
              </p>
            </div>
            <button
              type="button"
              onClick={addRow}
              className="shrink-0 flex items-center gap-1.5 rounded-xl border border-white/[0.12] bg-white/[0.05] px-3 py-2 text-[12px] font-medium text-white/70 hover:bg-white/[0.1] hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Add row
            </button>
          </div>

          {draft.whatToExpectRows.length > 0 && (
            <div className="flex flex-col gap-2">
              {draft.whatToExpectRows.map((row, idx) => (
                <div key={idx} className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
                  <div className="flex items-start gap-3">
                    {/* Number badge */}
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[11px] font-bold text-white/50">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1 space-y-2 min-w-0">
                      <input
                        value={row.title}
                        onChange={(e) => updateRow(idx, { title: e.target.value })}
                        placeholder="Title (e.g. The Community)"
                        className={ADMIN_INPUT}
                      />
                      <textarea
                        value={row.body}
                        onChange={(e) => updateRow(idx, { body: e.target.value })}
                        placeholder="Short description of this row…"
                        rows={2}
                        className={ADMIN_INPUT}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="mt-0.5 shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:bg-red-500/15 hover:text-red-400 transition-colors"
                      aria-label="Remove row"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── SECTION: Display ─────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-4 space-y-3">
          <SectionHeader label="Display" />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={ADMIN_LABEL}>Hero image URL</label>
              <input
                value={draft.imageSrc}
                onChange={(e) => set('imageSrc', e.target.value)}
                placeholder="/Assets/FireballAfterParty.png"
                className={ADMIN_INPUT}
              />
            </div>
            <div>
              <label className={ADMIN_LABEL}>Hero title (leave blank = event name)</label>
              <input
                value={draft.heroTitle}
                onChange={(e) => { set('heroTitle', e.target.value); set('navTitle', e.target.value) }}
                placeholder={draft.title || 'Same as event name'}
                className={ADMIN_INPUT}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={ADMIN_LABEL}>Day number</label>
              <input value={draft.day} onChange={(e) => set('day', e.target.value)} placeholder="16" className={ADMIN_INPUT} />
            </div>
            <div>
              <label className={ADMIN_LABEL}>Month</label>
              <input value={draft.monthFull} onChange={(e) => set('monthFull', e.target.value)} placeholder="MAY" className={ADMIN_INPUT} />
            </div>
            <div>
              <label className={ADMIN_LABEL}>CTA button label</label>
              <input value={draft.ctaLabel} onChange={(e) => set('ctaLabel', e.target.value)} placeholder="RSVP NOW" className={ADMIN_INPUT} />
            </div>
          </div>

          <div>
            <label className={ADMIN_LABEL}>CTA button URL</label>
            <input value={draft.ctaHref} onChange={(e) => set('ctaHref', e.target.value)} placeholder="/event/fireball-after-party" className={ADMIN_INPUT} />
          </div>
        </section>

        {/* Error + actions */}
        {saveError && (
          <p className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-400">
            {saveError}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setView('list')}
            className="flex-1 rounded-xl border border-white/[0.1] bg-white/[0.03] py-2.5 text-sm text-white/60 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex-1 rounded-xl bg-[#0485F7] py-2.5 text-sm font-semibold text-white hover:bg-[#3592F9] transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : isNew ? 'Create event' : 'Save changes'}
          </button>
        </div>
      </div>
    )
  }

  // ── LIST VIEW ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <section className="rounded-3xl border border-white/[0.09] bg-white/[0.02] px-5 py-5 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/55">Events</p>
          <button
            type="button"
            onClick={openNew}
            className="flex items-center gap-1.5 rounded-xl bg-[#0485F7] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#3592F9] transition-colors"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            New event
          </button>
        </div>

        {loading ? (
          <p className="text-white/40 text-sm py-2">Loading…</p>
        ) : (
          <div className="flex flex-col gap-2">
            {events.map((ev) => {
              const rsvp = bySlug[ev.slug]
              const going = rsvp?.going ?? 0
              const notGoing = rsvp?.notGoing ?? 0
              const total = going + notGoing
              const accessColor =
                ev.accessMode === 'public' ? 'bg-emerald-500/15 text-emerald-300'
                : ev.accessMode === 'partner-only' ? 'bg-blue-500/15 text-blue-300'
                : 'bg-amber-500/15 text-amber-300'
              return (
                <div key={ev.slug} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{ev.title}</p>
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${accessColor}`}>
                          {ev.accessMode === 'partner-only' ? 'Partners only' : ev.accessMode ?? 'public'}
                        </span>
                        {ev.dateLine && (
                          <span className="text-[11px] text-white/35">{ev.dateLine}</span>
                        )}
                        {total > 0 && (
                          <span className="text-[11px] text-white/30">
                            · {going} attending, {notGoing} not going
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(ev)}
                        className="rounded-lg border border-white/[0.1] bg-white/[0.06] px-3 py-1.5 text-[12px] font-medium text-white/70 hover:text-white hover:bg-white/[0.1] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(ev.slug)}
                        className="rounded-lg bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-400/70 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* RSVP live counts */}
      {Object.keys(bySlug).length > 0 && (
        <section className="rounded-3xl border border-white/[0.09] bg-white/[0.02] px-5 py-5 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
          <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/55 mb-4">RSVP — Live</p>
          <div className="flex flex-col gap-3">
            {Object.entries(bySlug).sort().map(([slug, { going, notGoing }]) => {
              const total = going + notGoing
              const goingPct = total > 0 ? Math.round((going / total) * 100) : 0
              return (
                <div key={slug} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-4">
                  <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/50 mb-3">{slug}</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 text-center">
                      <p className="text-2xl font-bold text-emerald-300">{going}</p>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-400/70 mt-0.5">Attending</p>
                    </div>
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-center">
                      <p className="text-2xl font-bold text-red-300">{notGoing}</p>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-red-400/70 mt-0.5">Not going</p>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden flex">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${goingPct}%` }} />
                    <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${100 - goingPct}%` }} />
                  </div>
                  <p className="text-[10px] text-white/25 mt-2 text-right">{total} total responses</p>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
