import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile, type UserProfile } from '@/utils/supabaseAuth'
import { getAuthHeaders } from '@/utils/authHeaders'
import type { EventAccessMode } from '@/constants/siteEventConfigs'
import { AppleButton } from '@/components/ui/AppleButton'

type Props = {
  eventSlug: string
  eventTitle: string
  accessMode: EventAccessMode
  allowedRoles?: string[]
}

type AttendanceStatus = 'going' | 'not-going' | null

function useReveal() {
  const ref = useRef<HTMLElement>(null)
  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setRevealed(true); io.disconnect() } },
      { threshold: 0.1 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return { ref, revealed }
}

function getOrCreateAnonId(eventSlug: string): string {
  const key = `fb_anon_id_${eventSlug}`
  try {
    const existing = localStorage.getItem(key)
    if (existing) return existing
    const id = `anon_${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`
    localStorage.setItem(key, id)
    return id
  } catch {
    return `anon_${Math.random().toString(36).slice(2)}`
  }
}

function getStoredVote(eventSlug: string): AttendanceStatus {
  try {
    const v = localStorage.getItem(`fb_vote_${eventSlug}`)
    if (v === 'going' || v === 'not-going') return v
  } catch {}
  return null
}

function storeVote(eventSlug: string, status: AttendanceStatus) {
  try {
    if (status) localStorage.setItem(`fb_vote_${eventSlug}`, status)
    else localStorage.removeItem(`fb_vote_${eventSlug}`)
  } catch {}
}

async function submitEventRsvp(params: {
  eventSlug: string
  eventTitle: string
  userId: string
  userName: string
  userEmail: string
  userRole: string | null
  companyName: string | null
  status: 'request' | 'going' | 'not-going'
  message?: string
}) {
  await supabase.from('event_rsvps').upsert(
    {
      event_slug: params.eventSlug,
      user_id: params.userId,
      user_name: params.userName,
      user_email: params.userEmail,
      user_role: params.userRole,
      company_name: params.companyName,
      status: params.status,
      message: params.message || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'event_slug,user_id' },
  )

  await fetch('/api/send-partner-approval-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: JSON.stringify({
      to: 'info@fireballcanada.com',
      subject: `Event RSVP — ${params.eventTitle} — ${params.userName}`,
      message: `${params.userName} (${params.userEmail}) — Role: ${params.userRole || 'N/A'} — Company: ${params.companyName || 'N/A'} — Status: ${params.status}${params.message ? `\n\nMessage: ${params.message}` : ''}`,
      html: `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:#0f1218;padding:24px 28px;">
          <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#9ca3af;font-weight:700;">Fireball Events</div>
          <h1 style="margin:8px 0 0 0;font-size:20px;color:#fff;font-weight:700;">New RSVP — ${params.eventTitle}</h1>
        </div>
        <div style="padding:24px 28px;font-size:14px;color:#1f2937;line-height:1.7;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">Name</td><td style="padding:6px 0;font-weight:600;">${params.userName}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">Email</td><td style="padding:6px 0;">${params.userEmail}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">Role</td><td style="padding:6px 0;">${params.userRole || '—'}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">Company</td><td style="padding:6px 0;">${params.companyName || '—'}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">Status</td><td style="padding:6px 0;font-weight:700;color:${params.status === 'going' || params.status === 'request' ? '#059669' : '#dc2626'};">${params.status === 'request' ? 'Spot requested' : params.status === 'going' ? 'Going' : 'Not going'}</td></tr>
            ${params.message ? `<tr><td colspan="2" style="padding:12px 0 0 0;border-top:1px solid #e5e7eb;"><div style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">Message</div><div>${params.message}</div></td></tr>` : ''}
          </table>
        </div>
        <div style="padding:16px 28px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;">Fireball Canada — Events</div>
      </div>`,
      flowTag: `event_rsvp_${params.eventSlug}`,
      companyName: 'Fireball Events',
    }),
  }).catch(() => null)
}

/** Oui / Non sans connexion — vote anonyme via localStorage + Supabase */
function PublicAttendanceAnon({ eventSlug }: { eventSlug: string }) {
  const [status, setStatus] = useState<AttendanceStatus>(() => getStoredVote(eventSlug))
  const [loading, setLoading] = useState(false)

  const handle = async (s: 'going' | 'not-going') => {
    if (loading) return
    setLoading(true)
    const anonId = getOrCreateAnonId(eventSlug)
    const next: AttendanceStatus = status === s ? null : s
    try {
      if (next) {
        await supabase.from('event_rsvps').upsert(
          {
            event_slug: eventSlug,
            user_id: anonId,
            user_name: 'Anonymous',
            user_email: '',
            user_role: null,
            company_name: null,
            status: next,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'event_slug,user_id' },
        )
      } else {
        await supabase.from('event_rsvps').delete()
          .eq('event_slug', eventSlug).eq('user_id', anonId)
      }
      storeVote(eventSlug, next)
      setStatus(next)
    } catch {}
    setLoading(false)
  }

  if (status === 'going') {
    return (
      <div className="mt-10 flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0485F7]">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-nav text-sm font-bold text-carbon-900">See you there.</p>
        <button
          onClick={() => handle('going')}
          className="mt-1 text-xs text-carbon-400 underline-offset-2 hover:underline"
        >
          Can't make it after all
        </button>
      </div>
    )
  }

  return (
    <div className="mt-10 flex items-center justify-center gap-3">
      <AppleButton
        onClick={() => void handle('going')}
        disabled={loading}
        className="gap-2 !px-7 !py-2.5 !text-sm"
      >
        {loading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
        Yes, I'll be there
      </AppleButton>
      <AppleButton
        onClick={() => void handle('not-going')}
        disabled={loading}
        className={`gap-2 !px-7 !py-2.5 !text-sm ${
          status === 'not-going'
            ? ''
            : '!border-carbon-200 !bg-white !text-carbon-700 hover:!border-carbon-400 hover:!bg-white'
        }`}
      >
        Can't make it
      </AppleButton>
    </div>
  )
}

function PrivateRequest({ eventSlug, eventTitle, profile, isPartner }: { eventSlug: string; eventTitle: string; profile: UserProfile; isPartner: boolean }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('event_rsvps')
      .select('status')
      .eq('event_slug', eventSlug)
      .eq('user_id', profile.id)
      .maybeSingle()
      .then(({ data }) => { if (data?.status === 'request') setSubmitted(true) })
  }, [eventSlug, profile.id])

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      await submitEventRsvp({
        eventSlug,
        eventTitle,
        userId: profile.id,
        userName: `${profile.first_name} ${profile.last_name}`.trim(),
        userEmail: profile.email,
        userRole: profile.role || null,
        companyName: profile.company_name || null,
        status: 'request',
        message: isPartner ? undefined : message.trim() || undefined,
      })
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="mt-10 flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-carbon-900">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-nav text-sm font-bold text-carbon-900">Request received — we'll confirm with you.</p>
        <p className="text-xs text-carbon-400">{profile.email}</p>
      </div>
    )
  }

  return (
    <div className="mt-10 flex w-full max-w-md flex-col gap-4 text-left">
      <div className="rounded-xl border border-carbon-100 bg-carbon-50 px-4 py-3.5">
        <p className="text-xs font-semibold text-carbon-400 uppercase tracking-widest mb-1">Your details</p>
        <p className="text-sm font-semibold text-carbon-900">{profile.first_name} {profile.last_name}</p>
        <p className="text-sm text-carbon-500">{profile.email}</p>
        {profile.company_name && <p className="text-sm text-carbon-500">{profile.company_name}</p>}
        {profile.role && <p className="mt-1 inline-block rounded-full bg-carbon-900 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">{profile.role}</p>}
      </div>

      {!isPartner && (
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Anything you'd like us to know? (optional)"
          rows={3}
          className="w-full resize-none rounded-xl border border-carbon-200 bg-white px-4 py-3 text-sm text-carbon-900 placeholder:text-carbon-400 focus:border-carbon-900 focus:outline-none transition-colors"
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={submit}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-carbon-900 px-8 py-3.5 font-nav text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
        {isPartner ? 'I want to attend' : 'Request my spot'}
      </button>
    </div>
  )
}

export function ReserveYourSpot({ eventSlug, eventTitle, accessMode, allowedRoles }: Props) {
  const { ref, revealed } = useReveal()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    getCurrentUserProfile().then((p) => {
      setProfile(p)
      setAuthChecked(true)
    })
  }, [])

  const isPublic = accessMode === 'public'
  const isPartnerMode = accessMode === 'partner-only'

  const userRole = profile?.role || profile?.partner_status || null
  const userIsPartner =
    userRole === 'partner' ||
    userRole === 'admin' ||
    (allowedRoles && allowedRoles.length > 0 && allowedRoles.some((r) => r === userRole))

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="w-full border-t border-carbon-100 bg-white px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24"
      aria-labelledby="reserve-heading"
    >
      <div
        className={`mx-auto max-w-3xl text-center transition-all duration-700 ease-out ${
          revealed ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
        }`}
      >
        <p className="font-nav text-[11px] font-bold uppercase tracking-[0.28em] text-carbon-400">
          {isPublic ? 'Attendance' : isPartnerMode ? 'Partner Access' : 'Invitations'}
        </p>

        <h2 id="reserve-heading" className="mt-4 font-nav text-3xl font-bold tracking-tight text-carbon-950 sm:text-4xl">
          {isPublic
            ? 'Will you be there?'
            : isPartnerMode
            ? 'Partner attendance'
            : 'Reserve your spot'}
        </h2>

        <p className="mt-5 text-sm leading-relaxed text-carbon-500 sm:text-base">
          {isPublic
            ? "Let us know if you're coming — no account needed."
            : isPartnerMode
            ? 'This event is open to Fireball partners. Sign in to confirm your attendance in one click.'
            : "This evening is private and capacity is limited. Sign in to request your spot — we'll confirm with you directly."}
        </p>

        {isPublic ? (
          /* Public event — anyone can vote, no login required */
          <PublicAttendanceAnon eventSlug={eventSlug} />
        ) : !authChecked ? null : profile ? (
          isPartnerMode && !userIsPartner ? (
            <div className="mt-10 flex flex-col items-center gap-3">
              <p className="text-sm text-carbon-500">
                This event is reserved for Fireball partners.{' '}
                <Link to="/contact" className="font-semibold text-carbon-900 underline-offset-2 hover:underline">
                  Contact us
                </Link>{' '}
                to learn more.
              </p>
            </div>
          ) : (
            <PrivateRequest
              eventSlug={eventSlug}
              eventTitle={eventTitle}
              profile={profile}
              isPartner={isPartnerMode || Boolean(userIsPartner)}
            />
          )
        ) : (
          <div className="mt-10 flex flex-col items-center gap-4">
            <p className="text-sm text-carbon-500">Sign in to request your invitation.</p>
            <div className="flex items-center gap-3">
              <Link
                to="/account"
                className="inline-flex items-center justify-center rounded-lg bg-carbon-900 px-8 py-3.5 font-nav text-sm font-bold text-white transition-opacity hover:opacity-80"
              >
                Sign in
              </Link>
              <Link
                to="/account/register"
                className="inline-flex items-center justify-center rounded-lg border border-carbon-200 px-8 py-3.5 font-nav text-sm font-bold text-carbon-700 transition-colors hover:border-carbon-400"
              >
                Create account
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
