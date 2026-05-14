import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile } from '@/utils/supabaseAuth'
import { adminAdjustXpByIdentifier } from '@/utils/supabaseXp'
import { getAuthHeaders } from '@/utils/authHeaders'
import { usePageTitle } from '@/hooks/usePageTitle'

type CertificationLevel = 'standard' | 'advanced' | 'elite'
type PartnerActivityStatus = 'active' | 'suspended'
type PartnerDecision = 'partner' | 'declined'

interface PartnerApplicationRow {
  id: string
  user_id: string
  company_name: string
  status: 'pending' | 'partner' | 'declined'
  submitted_at: string
  reviewed_at?: string | null
  notes?: string | null
  certification_level?: CertificationLevel | null
  total_installations?: number | null
  total_clients?: number | null
  warranty_registrations?: number | null
  partner_activity_status?: PartnerActivityStatus | null
  application_data?: {
    business_email?: string
    owner_primary_contact?: string
    business_address?: string
    [key: string]: unknown
  } | null
}

type AdminTab = 'applications' | 'activePartners'

interface DecisionComposerState {
  open: boolean
  row: PartnerApplicationRow | null
  decision: PartnerDecision
  from: string
  to: string
  subject: string
  message: string
  bannerUrl: string
}

const certificationCycle: CertificationLevel[] = ['standard', 'advanced', 'elite']

function titleCase(value: string): string {
  if (!value) return '-'
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

function formatFieldLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-'
  if (Array.isArray(value)) return value.map((item) => String(item)).join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function getPartnerPortalUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/account/dashboard`
  }
  return 'https://fireball-canada.com/account/dashboard'
}

function buildApprovalEmail(row: PartnerApplicationRow): { to: string; subject: string; message: string; bannerUrl: string } {
  const to = String(row.application_data?.business_email || '')
  const subject = 'Your Fireball Partner Application Has Been Approved'
  const message = `Hello,

We are pleased to inform you that your application to the Fireball Partner Program has been approved.

Your Partner Account is now active and provides you with access to benefits reserved for authorized Fireball professionals.

You can now access your Partner Dashboard to:
- View professional pricing
- Order Fireball products
- Access technical resources
- Manage your partner account information

You may log in to your Partner Portal using the link below:

Access My Partner Dashboard: [BUTTON]

If you have any questions regarding your account or Fireball products, our team remains available to assist you.

Best regards,
Fireball Canada team`

  return { to, subject, message, bannerUrl: '' }
}

function buildDeclineEmail(row: PartnerApplicationRow): { to: string; subject: string; message: string; bannerUrl: string } {
  const to = String(row.application_data?.business_email || '')
  const subject = 'Update Regarding Your Fireball Partner Application'
  const message = `Hello,

Thank you for your interest in the Fireball Partner Program.

After careful review, we regret to inform you that your application has not been approved at this time.

The Fireball Partner Program is limited to professionals who meet specific criteria aligned with the development of our authorized network.

You are welcome to submit a new application in the future should your business qualifications evolve.

We appreciate your interest in Fireball.

Best regards,
Fireball Canada team`

  return { to, subject, message, bannerUrl: '' }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function buildEmailHtml(params: {
  companyName: string
  decision: PartnerDecision
  subject: string
  message: string
  bannerUrl: string
  ctaUrl?: string
  ctaLabel?: string
}): string {
  const safeSubject = escapeHtml(params.subject)
  const buttonHtml =
    params.ctaUrl && params.ctaLabel
      ? `<div style="margin-top:18px;">
           <a href="${escapeHtml(params.ctaUrl)}" style="display:inline-block;padding:11px 16px;border-radius:999px;background:#111827;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;">
             ${escapeHtml(params.ctaLabel)}
           </a>
         </div>`
      : ''
  const messageSections = params.message.split('[BUTTON]')
  const finalMessage = messageSections
    .map((section, idx) => `${escapeHtml(section).replace(/\n/g, '<br/>')}${idx < messageSections.length - 1 ? buttonHtml : ''}`)
    .join('')
  const safeCompany = escapeHtml(params.companyName || 'Partner')
  const safeBanner = params.bannerUrl.trim()
  const accent = params.decision === 'partner' ? '#10b981' : '#f97316'
  const statusLabel = params.decision === 'partner' ? 'Application Approved' : 'Application Update'

  return `
  <div style="margin:0;padding:24px;background:#0f1218;font-family:Inter,Arial,sans-serif;color:#0b1220;">
    <table role="presentation" style="max-width:680px;width:100%;margin:0 auto;border-collapse:collapse;background:#ffffff;border-radius:18px;overflow:hidden;">
      ${safeBanner ? `<tr><td><img src="${escapeHtml(safeBanner)}" alt="Fireball Canada banner" style="display:block;width:100%;height:auto;max-height:240px;object-fit:cover;"/></td></tr>` : ''}
      <tr>
        <td style="padding:28px 28px 14px 28px;">
          <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${accent};font-weight:700;">Fireball Canada</div>
          <h1 style="margin:8px 0 0 0;font-size:24px;line-height:1.25;color:#101827;">${safeSubject}</h1>
          <div style="margin-top:10px;display:inline-block;padding:6px 10px;border-radius:999px;background:${accent}22;color:${accent};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">${statusLabel}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 28px 22px 28px;font-size:15px;line-height:1.7;color:#1f2937;">${finalMessage}</td>
      </tr>
      <tr>
        <td style="padding:16px 28px 28px 28px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
          Company: <strong style="color:#111827;">${safeCompany}</strong><br/>
          Sent by Fireball Canada official partner team.
        </td>
      </tr>
    </table>
  </div>`
}

export function ManagePartners() {
  const [applications, setApplications] = useState<PartnerApplicationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<AdminTab>('applications')
  const [selectedApplication, setSelectedApplication] = useState<PartnerApplicationRow | null>(null)
  const [decisionComposer, setDecisionComposer] = useState<DecisionComposerState>({
    open: false,
    row: null,
    decision: 'partner',
    from: 'Configured on server: FIREBALL_FROM_EMAIL',
    to: '',
    subject: '',
    message: '',
    bannerUrl: '',
  })

  usePageTitle('Partners - Fireball Canada')

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
      .select('*')
      .order('submitted_at', { ascending: false })

    if (loadError) {
      setError(loadError.message || 'Unable to load partner applications.')
      setLoading(false)
      return
    }

    setApplications((data || []) as PartnerApplicationRow[])
    setLoading(false)
  }

  const updatePartnerRow = async (id: string, patch: Record<string, unknown>): Promise<boolean> => {
    const { error: updateError } = await supabase.from('partner_companies').update(patch).eq('id', id)
    if (updateError) {
      setError(updateError.message || 'Unable to update this partner row.')
      return false
    }
    return true
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
    await supabase
      .from('profiles')
      .update({
        role: roleValue,
      })
      .eq('id', row.user_id)

    await loadApplications()
    setProcessingId(null)
  }

  const openDecisionComposer = (row: PartnerApplicationRow, decision: PartnerDecision) => {
    const draft = decision === 'partner' ? buildApprovalEmail(row) : buildDeclineEmail(row)
    setDecisionComposer({
      open: true,
      row,
      decision,
      from: 'Configured on server: FIREBALL_FROM_EMAIL',
      to: draft.to,
      subject: draft.subject,
      message: draft.message,
      bannerUrl: draft.bannerUrl,
    })
  }

  const closeDecisionComposer = () => {
    setDecisionComposer({
      open: false,
      row: null,
      decision: 'partner',
      from: 'Configured on server: FIREBALL_FROM_EMAIL',
      to: '',
      subject: '',
      message: '',
      bannerUrl: '',
    })
  }

  // Admin XP quick actions (global stats)
  const [xpIdentifier, setXpIdentifier] = useState('')
  const [xpAmount, setXpAmount] = useState('100')
  const [xpLoading, setXpLoading] = useState(false)
  const [xpMessage, setXpMessage] = useState<string | null>(null)

  const sendDecisionEmail = async () => {
    if (!decisionComposer.row) return
    if (!decisionComposer.to.trim()) {
      setError('Missing recipient email. This application must include a business email to send approval.')
      return
    }

    setProcessingId(decisionComposer.row.id)
    setError('')
    try {
      const html = buildEmailHtml({
        companyName: decisionComposer.row.company_name,
        decision: decisionComposer.decision,
        subject: decisionComposer.subject.trim(),
        message: decisionComposer.message.trim(),
        bannerUrl: decisionComposer.bannerUrl.trim(),
        ctaUrl: decisionComposer.decision === 'partner' ? getPartnerPortalUrl() : undefined,
        ctaLabel: decisionComposer.decision === 'partner' ? 'Access My Partner Dashboard' : undefined,
      })

      const response = await fetch('/api/send-partner-approval-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          to: decisionComposer.to.trim(),
          subject: decisionComposer.subject.trim(),
          message: decisionComposer.message.trim(),
          html,
          companyName: decisionComposer.row.company_name,
          flowTag: decisionComposer.decision === 'partner' ? 'partner_approval' : 'partner_decline',
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || 'Unable to send decision email.')

      await updateStatus(decisionComposer.row, decisionComposer.decision)
      closeDecisionComposer()
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : 'Unable to send decision email.'
      setError(message)
      setProcessingId(null)
    }
  }

  const cycleCertificationLevel = async (row: PartnerApplicationRow) => {
    setProcessingId(row.id)
    setError('')
    const current = (row.certification_level || 'standard').toLowerCase() as CertificationLevel
    const currentIndex = certificationCycle.indexOf(current)
    const nextLevel = certificationCycle[(currentIndex + 1) % certificationCycle.length]

    const ok = await updatePartnerRow(row.id, {
      certification_level: nextLevel,
      updated_at: new Date().toISOString(),
    })
    if (ok) {
      await loadApplications()
    }
    setProcessingId(null)
  }

  const toggleSuspend = async (row: PartnerApplicationRow) => {
    setProcessingId(row.id)
    setError('')
    const next = row.partner_activity_status === 'suspended' ? 'active' : 'suspended'
    const ok = await updatePartnerRow(row.id, {
      partner_activity_status: next,
      updated_at: new Date().toISOString(),
    })
    if (ok) {
      await loadApplications()
    }
    setProcessingId(null)
  }

  const revokeCertification = async (row: PartnerApplicationRow) => {
    await updateStatus(row, 'declined')
  }

  const pendingRequests = useMemo(() => applications.filter((row) => row.status === 'pending'), [applications])
  const certifiedPartners = useMemo(() => applications.filter((row) => row.status === 'partner'), [applications])
  const declinedCount = useMemo(() => applications.filter((row) => row.status === 'declined').length, [applications])
  const activePartners = useMemo(() => applications.filter((row) => row.status === 'partner'), [applications])

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

        <div className="mt-8">
          <div className="relative inline-grid grid-cols-2 rounded-full border border-white/20 bg-white/[0.06] p-1 backdrop-blur-2xl shadow-[0_14px_34px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.22)] overflow-hidden">
            <div className="pointer-events-none absolute inset-0 rounded-full">
              <div className="absolute -top-7 left-5 h-12 w-24 rounded-full bg-white/20 blur-xl" />
              <div className="absolute -bottom-7 right-4 h-12 w-24 rounded-full bg-sky-300/20 blur-xl" />
            </div>

            <div
              className={`pointer-events-none absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full border border-white/35 bg-gradient-to-b from-white/70 via-white/40 to-white/20 shadow-[0_10px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.95)] transition-transform duration-300 ease-out ${
                activeTab === 'applications' ? 'translate-x-0 left-1' : 'translate-x-full left-1'
              }`}
            >
              <div className="absolute left-3 right-3 top-[3px] h-[38%] rounded-full bg-white/60 blur-[1px]" />
            </div>

            <button
              onClick={() => setActiveTab('applications')}
              className={`relative z-10 rounded-full px-5 py-2.5 text-[11px] uppercase tracking-[0.14em] transition-colors ${
                activeTab === 'applications'
                  ? 'text-[#111214]'
                  : 'text-white/78 hover:text-white'
              }`}
            >
              Tab 1 - Applications
            </button>
            <button
              onClick={() => setActiveTab('activePartners')}
              className={`relative z-10 rounded-full px-5 py-2.5 text-[11px] uppercase tracking-[0.14em] transition-colors ${
                activeTab === 'activePartners'
                  ? 'text-[#111214]'
                  : 'text-white/78 hover:text-white'
              }`}
            >
              Tab 2 - Active Partners
            </button>
          </div>
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
          <article className="md:col-span-3 rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-2xl px-5 py-5 shadow-[0_16px_36px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-white/55">XP Quick Adjust</p>
                <p className="mt-1 text-sm text-white/70 max-w-xl">
                  Ajouter ou retirer rapidement de l&apos;XP à un membre en utilisant son email Fireball ou son Member ID externe.
                </p>
              </div>
              <div className="flex flex-col md:flex-row gap-3 md:items-end">
                <div className="flex-1 min-w-[220px]">
                  <label className="block text-[11px] uppercase tracking-[0.14em] text-white/60 mb-1">
                    Email ou Member ID
                  </label>
                  <input
                    value={xpIdentifier}
                    onChange={(e) => setXpIdentifier(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/60"
                    placeholder="client@exemple.com ou 12345678"
                  />
                </div>
                <div className="w-full md:w-32">
                  <label className="block text-[11px] uppercase tracking-[0.14em] text-white/60 mb-1">
                    Montant XP
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={xpAmount}
                    onChange={(e) => setXpAmount(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/60"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={xpLoading}
                    onClick={async () => {
                      setXpMessage(null)
                      const amount = Number(xpAmount)
                      if (!xpIdentifier.trim() || !Number.isFinite(amount) || amount <= 0) {
                        setXpMessage('Entrez un identifiant et un montant XP valide (> 0).')
                        return
                      }
                      setXpLoading(true)
                      const result = await adminAdjustXpByIdentifier({
                        identifier: xpIdentifier.trim(),
                        deltaXp: amount,
                      })
                      if (!result.success) {
                        setXpMessage(result.error || 'Impossible de mettre à jour l’XP.')
                      } else {
                        setXpMessage(
                          `+${amount} XP appliqués à ${result.profileLabel || 'ce membre'} (${result.previousXp ?? 0} → ${
                            result.newXp ?? 0
                          }).`,
                        )
                      }
                      setXpLoading(false)
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-100 hover:bg-emerald-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {xpLoading ? 'En cours…' : 'Add XP'}
                  </button>
                  <button
                    type="button"
                    disabled={xpLoading}
                    onClick={async () => {
                      setXpMessage(null)
                      const amount = Number(xpAmount)
                      if (!xpIdentifier.trim() || !Number.isFinite(amount) || amount <= 0) {
                        setXpMessage('Entrez un identifiant et un montant XP valide (> 0).')
                        return
                      }
                      setXpLoading(true)
                      const result = await adminAdjustXpByIdentifier({
                        identifier: xpIdentifier.trim(),
                        deltaXp: -amount,
                      })
                      if (!result.success) {
                        setXpMessage(result.error || 'Impossible de mettre à jour l’XP.')
                      } else {
                        setXpMessage(
                          `-${amount} XP retirés à ${result.profileLabel || 'ce membre'} (${result.previousXp ?? 0} → ${
                            result.newXp ?? 0
                          }).`,
                        )
                      }
                      setXpLoading(false)
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-rose-300/40 bg-rose-500/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-100 hover:bg-rose-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {xpLoading ? 'En cours…' : 'Remove XP'}
                  </button>
                </div>
              </div>
            </div>
            {xpMessage && (
              <p className="mt-3 text-xs text-white/70">
                {xpMessage}
              </p>
            )}
          </article>
        </div>
        {error && (
          <div className="mt-4 rounded-xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {activeTab === 'applications' && (
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
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedApplication(request)}
                        className="rounded-full border border-white/25 bg-white/[0.06] px-3 py-1 text-[11px] text-white/85 hover:bg-white/[0.14] transition-colors"
                      >
                        View Full Application
                      </button>
                      <button
                        onClick={() => openDecisionComposer(request, 'partner')}
                        disabled={processingId === request.id}
                        className="rounded-full bg-emerald-500/20 border border-emerald-300/35 px-3 py-1 text-[11px] text-emerald-200 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                      >
                        Accept + Email
                      </button>
                      <button
                        onClick={() => openDecisionComposer(request, 'declined')}
                        disabled={processingId === request.id}
                        className="rounded-full bg-rose-500/20 border border-rose-300/35 px-3 py-1 text-[11px] text-rose-200 hover:bg-rose-500/30 transition-colors disabled:opacity-50"
                      >
                        Decline + Email
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
                    <div className="mt-3 flex flex-wrap gap-2">
                      <p className="inline-flex rounded-full border border-white/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-white/75">
                        {titleCase(partner.certification_level || 'standard')}
                      </p>
                      <button
                        onClick={() => setSelectedApplication(partner)}
                        className="rounded-full border border-white/25 bg-white/[0.06] px-3 py-1 text-[11px] text-white/85 hover:bg-white/[0.14] transition-colors"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
                {!loading && certifiedPartners.length === 0 && (
                  <p className="text-xs text-white/55">No certified partners yet.</p>
                )}
              </div>
            </article>
          </div>
        )}

        {activeTab === 'activePartners' && (
          <article className="mt-8 rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-2xl p-4 shadow-[0_16px_36px_rgba(0,0,0,0.35)] overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-white/55 border-b border-white/10">
                  <th className="py-3 pr-3">Company Name</th>
                  <th className="py-3 pr-3">Location</th>
                  <th className="py-3 pr-3">Certification Level</th>
                  <th className="py-3 pr-3">Total Installations</th>
                  <th className="py-3 pr-3">Total Clients</th>
                  <th className="py-3 pr-3">Warranty Registrations</th>
                  <th className="py-3 pr-3">Status</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activePartners.map((partner) => (
                  <tr key={partner.id} className="border-b border-white/5 text-white/85">
                    <td className="py-3 pr-3 font-medium">{partner.company_name}</td>
                    <td className="py-3 pr-3">{partner.application_data?.business_address || '-'}</td>
                    <td className="py-3 pr-3">{titleCase(partner.certification_level || 'standard')}</td>
                    <td className="py-3 pr-3">{partner.total_installations ?? 0}</td>
                    <td className="py-3 pr-3">{partner.total_clients ?? 0}</td>
                    <td className="py-3 pr-3">{partner.warranty_registrations ?? 0}</td>
                    <td className="py-3 pr-3">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${
                          (partner.partner_activity_status || 'active') === 'active'
                            ? 'border-emerald-300/35 bg-emerald-500/15 text-emerald-200'
                            : 'border-amber-300/35 bg-amber-500/15 text-amber-100'
                        }`}
                      >
                        {titleCase(partner.partner_activity_status || 'active')}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => setSelectedApplication(partner)}
                          className="rounded-full border border-white/25 bg-white/[0.06] px-2.5 py-1 text-[10px] text-white/85 hover:bg-white/[0.14] transition-colors"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => cycleCertificationLevel(partner)}
                          disabled={processingId === partner.id}
                          className="rounded-full border border-cyan-300/35 bg-cyan-500/15 px-2.5 py-1 text-[10px] text-cyan-100 hover:bg-cyan-500/25 transition-colors disabled:opacity-50"
                        >
                          Edit Access
                        </button>
                        <button
                          onClick={() => toggleSuspend(partner)}
                          disabled={processingId === partner.id}
                          className="rounded-full border border-amber-300/35 bg-amber-500/15 px-2.5 py-1 text-[10px] text-amber-100 hover:bg-amber-500/25 transition-colors disabled:opacity-50"
                        >
                          {(partner.partner_activity_status || 'active') === 'active' ? 'Suspend' : 'Reactivate'}
                        </button>
                        <button
                          onClick={() => revokeCertification(partner)}
                          disabled={processingId === partner.id}
                          className="rounded-full border border-rose-300/35 bg-rose-500/15 px-2.5 py-1 text-[10px] text-rose-100 hover:bg-rose-500/25 transition-colors disabled:opacity-50"
                        >
                          Revoke Certification
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && activePartners.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-white/55 text-xs">
                      No active partners available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </article>
        )}
      </div>

      {selectedApplication && (
        <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[88vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#17181b] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/55">Partner Application</p>
                <h3 className="mt-1 text-2xl font-semibold">{selectedApplication.company_name}</h3>
              </div>
              <button
                onClick={() => setSelectedApplication(null)}
                className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-1 text-xs text-white/80 hover:bg-white/[0.14]"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-[11px] uppercase text-white/55">Submitted</p>
                <p className="mt-1">{new Date(selectedApplication.submitted_at).toLocaleString('en-CA')}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-[11px] uppercase text-white/55">Status</p>
                <p className="mt-1">{titleCase(selectedApplication.status)}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/55">Full Application Data</p>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {Object.entries(selectedApplication.application_data || {}).map(([key, value]) => (
                  <div key={key} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-white/50">{formatFieldLabel(key)}</p>
                    <p className="mt-1 text-white/85 break-words">{formatFieldValue(value)}</p>
                  </div>
                ))}
                {Object.keys(selectedApplication.application_data || {}).length === 0 && (
                  <p className="text-xs text-white/55">No additional application details available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {decisionComposer.open && decisionComposer.row && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-6xl rounded-2xl border border-white/15 bg-[#17181b] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/55">Official Email Composer</p>
                <h3 className="mt-1 text-xl font-semibold">{decisionComposer.row.company_name}</h3>
                <p className="mt-1 text-xs text-white/55">
                  {decisionComposer.decision === 'partner' ? 'Approval email' : 'Decline email'} - image banner supported.
                </p>
              </div>
              <button
                onClick={closeDecisionComposer}
                className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-1 text-xs text-white/80 hover:bg-white/[0.14]"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/10 bg-black/25 p-4 space-y-3 text-sm">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-white/65">From (official sender)</span>
                  <input
                    value={decisionComposer.from}
                    readOnly
                    className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-white/70 outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-white/65">To</span>
                  <input
                    value={decisionComposer.to}
                    onChange={(e) => setDecisionComposer((prev) => ({ ...prev, to: e.target.value }))}
                    className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-white outline-none focus:border-white/40"
                    placeholder="client@company.com"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-white/65">Subject</span>
                  <input
                    value={decisionComposer.subject}
                    onChange={(e) => setDecisionComposer((prev) => ({ ...prev, subject: e.target.value }))}
                    className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-white outline-none focus:border-white/40"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-white/65">Banner image URL (optional)</span>
                  <input
                    value={decisionComposer.bannerUrl}
                    onChange={(e) => setDecisionComposer((prev) => ({ ...prev, bannerUrl: e.target.value }))}
                    className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-white outline-none focus:border-white/40"
                    placeholder="https://.../banner.jpg"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-white/65">Message</span>
                  <textarea
                    value={decisionComposer.message}
                    onChange={(e) => setDecisionComposer((prev) => ({ ...prev, message: e.target.value }))}
                    className="min-h-[220px] rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-white outline-none focus:border-white/40"
                  />
                </label>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0f1116] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-white/55">Email Preview</p>
                <div className="mt-3 rounded-xl border border-white/10 bg-white h-[520px] overflow-y-auto p-4">
                  <div className="text-[11px] text-slate-500 mb-2">
                    From: Fireball Canada official email (server config)
                  </div>
                  {decisionComposer.bannerUrl.trim() && (
                    <img
                      src={decisionComposer.bannerUrl.trim()}
                      alt="Email banner preview"
                      className="w-full max-h-40 object-cover rounded-md border border-slate-200"
                    />
                  )}
                  <h4 className="mt-3 text-lg font-semibold text-slate-900">
                    {decisionComposer.subject || '(No subject)'}
                  </h4>
                  <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {decisionComposer.message || '(No content)'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeDecisionComposer}
                className="rounded-full border border-white/25 px-4 py-2 text-xs text-white/80 hover:bg-white/[0.1]"
              >
                Cancel
              </button>
              <button
                onClick={sendDecisionEmail}
                disabled={processingId === decisionComposer.row.id}
                className={`rounded-full border px-4 py-2 text-xs disabled:opacity-50 ${
                  decisionComposer.decision === 'partner'
                    ? 'border-emerald-300/35 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30'
                    : 'border-rose-300/35 bg-rose-500/20 text-rose-100 hover:bg-rose-500/30'
                }`}
              >
                {decisionComposer.decision === 'partner'
                  ? 'Send Official Email + Approve'
                  : 'Send Official Email + Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
