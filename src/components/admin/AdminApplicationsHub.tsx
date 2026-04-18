import { type Key, useCallback, useEffect, useMemo, useState } from 'react'
import { Tabs } from '@heroui/react'
import { motion } from 'motion/react'
import { IconChevronDown, IconMail, IconRefresh } from '@tabler/icons-react'
import { supabase } from '@/lib/supabase'
import {
  fetchAllTrainingRequestsForAdmin,
  updateTrainingRequestAdmin,
  type TrainingRequestStatus,
  type TrainingRequestWithProfile,
} from '@/utils/trainingRequests'
import { insertUserTargetedNotification } from '@/utils/adminUserNotification'
import { sendPartnerDecisionEmail, sendTrainingDecisionEmail } from '@/utils/adminRequestEmails'
import {
  TrainingEmailComposeModal,
  TrainingPaymentInstructionsModal,
} from '@/components/admin/TrainingAdminModals'

type PartnerAppStatus = 'pending' | 'payment_pending' | 'partner' | 'declined'

type PartnerApplicationAdminRow = {
  id: string
  user_id: string
  company_name: string | null
  status: PartnerAppStatus
  submitted_at: string | null
  application_data: Record<string, unknown> | null
  profile_email: string | null
}

const TRAINING_STATUS_ORDER: TrainingRequestStatus[] = [
  'pending',
  'approved',
  'payment_pending',
  'paid',
  'declined',
  'cancelled',
]

const TRAINING_LABELS: Record<TrainingRequestStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  payment_pending: 'Paiement dû',
  paid: 'Payé',
  declined: 'Refusé',
  cancelled: 'Annulé',
}

const PARTNER_LABELS: Record<PartnerAppStatus, string> = {
  pending: 'En attente',
  payment_pending: 'Paiement',
  partner: 'Actif',
  declined: 'Refusé',
}

function trainingStatusClass(s: TrainingRequestStatus): string {
  switch (s) {
    case 'pending':
      return 'bg-amber-50 text-amber-900 ring-amber-200/80'
    case 'approved':
      return 'bg-sky-50 text-sky-900 ring-sky-200/80'
    case 'payment_pending':
      return 'bg-orange-50 text-orange-900 ring-orange-200/80'
    case 'paid':
      return 'bg-emerald-50 text-emerald-900 ring-emerald-200/80'
    case 'declined':
      return 'bg-red-50 text-red-800 ring-red-200/80'
    case 'cancelled':
      return 'bg-slate-100 text-slate-600 ring-slate-200/80'
    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200/80'
  }
}

function partnerStatusClass(s: PartnerAppStatus): string {
  switch (s) {
    case 'pending':
      return 'bg-amber-50 text-amber-900 ring-amber-200/80'
    case 'payment_pending':
      return 'bg-orange-50 text-orange-900 ring-orange-200/80'
    case 'partner':
      return 'bg-emerald-50 text-emerald-900 ring-emerald-200/80'
    case 'declined':
      return 'bg-red-50 text-red-800 ring-red-200/80'
    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200/80'
  }
}

function displayName(p: TrainingRequestWithProfile): string {
  const a = `${p.profile_first_name || ''} ${p.profile_last_name || ''}`.trim()
  return a || p.profile_email || 'Membre'
}

function partnerEmail(row: PartnerApplicationAdminRow): string {
  const d = row.application_data || {}
  return String((d as { business_email?: string }).business_email || row.profile_email || '').trim()
}

function partnerContactName(row: PartnerApplicationAdminRow): string {
  const d = row.application_data || {}
  return String((d as { owner_primary_contact?: string }).owner_primary_contact || '').trim() || '—'
}

function countBy<T extends string>(rows: { status: T }[], keys: T[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const k of keys) out[k] = 0
  for (const r of rows) {
    if (out[r.status] !== undefined) out[r.status]++
  }
  return out
}

export function AdminApplicationsHub() {
  const [tab, setTab] = useState<'training' | 'partner'>('training')
  const [trainingRows, setTrainingRows] = useState<TrainingRequestWithProfile[]>([])
  const [partnerRows, setPartnerRows] = useState<PartnerApplicationAdminRow[]>([])
  const [loadingT, setLoadingT] = useState(true)
  const [loadingP, setLoadingP] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [expandedTrainingId, setExpandedTrainingId] = useState<string | null>(null)
  const [trainingEmailRow, setTrainingEmailRow] = useState<TrainingRequestWithProfile | null>(null)
  const [trainingPaymentRow, setTrainingPaymentRow] = useState<TrainingRequestWithProfile | null>(null)

  const loadTraining = useCallback(async () => {
    setLoadingT(true)
    setError('')
    const rows = await fetchAllTrainingRequestsForAdmin()
    setTrainingRows(rows)
    setLoadingT(false)
  }, [])

  const loadPartner = useCallback(async () => {
    setLoadingP(true)
    setError('')
    const { data, error: e } = await supabase
      .from('partner_companies')
      .select('id, user_id, company_name, status, submitted_at, application_data')
      .order('submitted_at', { ascending: false })
      .limit(200)
    if (e) {
      setError(e.message || 'Impossible de charger les données partenaires.')
      setLoadingP(false)
      return
    }
    const raw = (data || []) as PartnerApplicationAdminRow[]
    const userIds = [...new Set(raw.map((r) => r.user_id))]
    let emailMap = new Map<string, string>()
    if (userIds.length) {
      const { data: profs } = await supabase.from('profiles').select('id, email').in('id', userIds)
      emailMap = new Map((profs || []).map((p: { id: string; email: string | null }) => [p.id, String(p.email || '')]))
    }
    setPartnerRows(
      raw.map((r) => ({
        ...r,
        profile_email: emailMap.get(r.user_id) ?? null,
      })),
    )
    setLoadingP(false)
  }, [])

  useEffect(() => {
    void loadTraining()
    void loadPartner()
  }, [loadTraining, loadPartner])

  const notifyUser = async (userId: string, title: string, message: string) => {
    await insertUserTargetedNotification({ userId, title, message })
  }

  const onTrainingAction = async (
    row: TrainingRequestWithProfile,
    next: TrainingRequestStatus,
    opts?: { paymentInstructions?: string; adminNote?: string },
  ) => {
    setBusyId(row.id)
    setError('')
    const email = row.profile_email?.trim()
    const name = displayName(row)

    const patch: Parameters<typeof updateTrainingRequestAdmin>[1] = { status: next }
    if (opts?.adminNote !== undefined) {
      patch.admin_note = opts.adminNote
    }
    if (next === 'payment_pending') {
      patch.payment_instructions = opts?.paymentInstructions ?? null
    }

    const res = await updateTrainingRequestAdmin(row.id, patch)
    if (!res.ok) {
      setError(res.error)
      setBusyId(null)
      return
    }

    if (email) {
      if (next === 'approved') {
        await sendTrainingDecisionEmail({
          to: email,
          customerName: name,
          reference: row.reference,
          sessionLabel: row.session_label,
          kind: 'approved',
        })
      } else if (next === 'payment_pending') {
        await sendTrainingDecisionEmail({
          to: email,
          customerName: name,
          reference: row.reference,
          sessionLabel: row.session_label,
          kind: 'payment_pending',
          extraNote: patch.payment_instructions || undefined,
        })
      } else if (next === 'paid') {
        await sendTrainingDecisionEmail({
          to: email,
          customerName: name,
          reference: row.reference,
          sessionLabel: row.session_label,
          kind: 'paid',
        })
      } else if (next === 'declined') {
        await sendTrainingDecisionEmail({
          to: email,
          customerName: name,
          reference: row.reference,
          sessionLabel: row.session_label,
          kind: 'declined',
          extraNote: opts?.adminNote || undefined,
        })
      }
    }

    const notifTitle =
      next === 'approved'
        ? 'Training request approved'
        : next === 'payment_pending'
          ? 'Payment required — Academy'
          : next === 'paid'
            ? 'Training payment received'
            : next === 'declined'
              ? 'Training request update'
              : 'Training request updated'
    const notifBody =
      next === 'payment_pending'
        ? `Payment is due for your session: ${row.session_label}. Reference ${row.reference}.`
        : next === 'paid'
          ? `We recorded your payment for ${row.session_label} (${row.reference}).`
          : next === 'declined'
            ? `An update is available for your training request ${row.reference}.`
            : `Your Academy training request (${row.reference}) status is now: ${next}.`

    await notifyUser(row.user_id, notifTitle, notifBody)

    setTrainingRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...patch, updated_at: new Date().toISOString() } : r)))
    setBusyId(null)
  }

  const confirmTrainingPaymentRequest = async (instructions: string) => {
    if (!trainingPaymentRow) return
    await onTrainingAction(trainingPaymentRow, 'payment_pending', { paymentInstructions: instructions })
    setTrainingPaymentRow(null)
  }

  const onPartnerAction = async (row: PartnerApplicationAdminRow, next: PartnerAppStatus, declineNote?: string) => {
    setBusyId(row.id)
    setError('')
    const email = partnerEmail(row)
    const { error: uerr } = await supabase
      .from('partner_companies')
      .update({
        status: next,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id)
    if (uerr) {
      setError(uerr.message || 'Mise à jour impossible.')
      setBusyId(null)
      return
    }

    if (email) {
      if (next === 'payment_pending') {
        await sendPartnerDecisionEmail({
          to: email,
          contactName: partnerContactName(row),
          companyName: row.company_name || 'Your business',
          kind: 'payment_pending',
          extraNote: declineNote,
        })
      } else if (next === 'partner') {
        await sendPartnerDecisionEmail({
          to: email,
          contactName: partnerContactName(row),
          companyName: row.company_name || 'Your business',
          kind: 'partner',
        })
      } else if (next === 'declined') {
        await sendPartnerDecisionEmail({
          to: email,
          contactName: partnerContactName(row),
          companyName: row.company_name || 'Your business',
          kind: 'declined',
          extraNote: declineNote,
        })
      }
    }

    const titles: Record<string, string> = {
      payment_pending: 'Partner application — payment required',
      partner: 'Partner account activated',
      declined: 'Partner application update',
    }
    await notifyUser(
      row.user_id,
      titles[next] || 'Partner application',
      next === 'partner'
        ? 'Your Fireball partner access is active.'
        : next === 'payment_pending'
          ? 'Complete partner payment to activate your account.'
          : 'There is an update on your partner application.',
    )

    setPartnerRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: next } : r)))
    setBusyId(null)
  }

  const trainingSorted = useMemo(
    () => [...trainingRows].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
    [trainingRows],
  )

  const partnerSorted = useMemo(
    () =>
      [...partnerRows].sort((a, b) => {
        const ta = a.submitted_at ? new Date(a.submitted_at).getTime() : 0
        const tb = b.submitted_at ? new Date(b.submitted_at).getTime() : 0
        return tb - ta
      }),
    [partnerRows],
  )

  const trainingCounts = useMemo(
    () => countBy(trainingRows as { status: TrainingRequestStatus }[], TRAINING_STATUS_ORDER),
    [trainingRows],
  )

  const partnerCounts = useMemo(
    () =>
      countBy(partnerRows as { status: PartnerAppStatus }[], [
        'pending',
        'payment_pending',
        'partner',
        'declined',
      ]),
    [partnerRows],
  )

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Même ordre que AdminConfigurationPage : onglets centrés en premier */}
      <div className="flex justify-center">
        <Tabs
          selectedKey={tab}
          onSelectionChange={(key: Key) => setTab(String(key) as 'training' | 'partner')}
          className="w-full max-w-xl"
        >
          <Tabs.List
            aria-label="Training ou Partner"
            className="mx-auto flex w-fit items-center gap-1 rounded-full bg-slate-100 p-1"
          >
            <Tabs.Tab
              id="training"
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition-colors data-[selected=true]:bg-white data-[selected=true]:text-slate-900"
            >
              Training
            </Tabs.Tab>
            <Tabs.Tab
              id="partner"
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition-colors data-[selected=true]:bg-white data-[selected=true]:text-slate-900"
            >
              Partner
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </div>

      <div className="relative">
        {error ? (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        ) : null}

        <motion.div
          initial={false}
          animate={{
            opacity: tab === 'training' ? 1 : 0,
            y: tab === 'training' ? 0 : 8,
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={tab === 'training' ? 'block' : 'hidden'}
        >
          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-slate-400">Admin</p>
                <h2 className="mt-1 text-2xl md:text-3xl font-semibold text-slate-900">Training</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Demandes Academy : approuver, demander un paiement, marquer payé ou refuser.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadTraining()}
                disabled={loadingT}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
              >
                <IconRefresh className={`h-4 w-4 ${loadingT ? 'animate-spin' : ''}`} stroke={1.75} />
                Actualiser
              </button>
            </div>

        <section aria-label="Indicateurs formation">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {TRAINING_STATUS_ORDER.map((s) => (
              <StatCard key={s} label={TRAINING_LABELS[s]} value={loadingT ? null : trainingCounts[s] ?? 0} />
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/90 px-4 py-4 md:px-6">
            <h3 className="text-base font-semibold text-slate-900">Liste des demandes</h3>
            <p className="mt-0.5 text-sm text-slate-500">Tri par dernière mise à jour (récent en premier).</p>
          </div>

          {loadingT ? (
            <TableSkeleton rows={5} />
          ) : trainingSorted.length === 0 ? (
            <EmptyState message="Aucune demande de formation pour le moment." />
          ) : (
            <>
              <div className="hidden min-w-0 overflow-x-auto md:block">
                <div className="grid min-w-[640px] grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,2fr)] gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-2.5 text-[11px] font-nav font-bold uppercase tracking-[0.12em] text-slate-500 md:px-6">
                  <span>Session &amp; réf.</span>
                  <span>Membre</span>
                  <span>Statut</span>
                  <span className="text-right">Actions</span>
                </div>
                <ul className="min-w-[640px] divide-y divide-slate-100">
                  {trainingSorted.map((row) => {
                    const open = expandedTrainingId === row.id
                    return (
                      <li key={row.id} className="bg-white">
                        <div className="grid min-w-0 grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,2fr)] items-start gap-3 px-4 py-4 md:px-6">
                          <div className="min-w-0 max-w-full overflow-hidden">
                            <p className="break-words font-medium text-slate-900">{row.session_label}</p>
                            <p
                              className="mt-1 block max-w-full min-w-0 break-all font-mono text-[11px] leading-snug text-slate-500 [overflow-wrap:anywhere]"
                              title={row.reference}
                            >
                              Réf. {row.reference}
                            </p>
                          </div>
                          <div className="min-w-0 max-w-full overflow-hidden text-sm text-slate-700">
                            <div className="truncate font-medium">{displayName(row)}</div>
                            {row.profile_email ? (
                              <div className="break-all text-xs text-slate-500">{row.profile_email}</div>
                            ) : null}
                          </div>
                          <span
                            className={`inline-flex w-fit shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${trainingStatusClass(row.status)}`}
                          >
                            {TRAINING_LABELS[row.status]}
                          </span>
                          <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setExpandedTrainingId((id) => (id === row.id ? null : row.id))}
                              className="inline-flex items-center gap-0.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Détails
                              <IconChevronDown
                                className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
                                stroke={1.75}
                              />
                            </button>
                            <TrainingActions
                              row={row}
                              busyId={busyId}
                              onAction={onTrainingAction}
                              onOpenPaymentModal={() => setTrainingPaymentRow(row)}
                              onOpenEmail={() => setTrainingEmailRow(row)}
                            />
                          </div>
                        </div>
                        {open ? (
                          <TrainingDetailPanel row={row} />
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              </div>
              <ul className="divide-y divide-slate-100 md:hidden">
                {trainingSorted.map((row) => {
                  const open = expandedTrainingId === row.id
                  return (
                    <li key={row.id} className="px-4 py-4">
                      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 max-w-[calc(100%-4rem)] flex-1 overflow-hidden sm:max-w-none">
                          <p className="break-words font-semibold text-slate-900">{row.session_label}</p>
                          <p
                            className="mt-1 block max-w-full min-w-0 break-all font-mono text-[11px] text-slate-500 [overflow-wrap:anywhere]"
                            title={row.reference}
                          >
                            Réf. {row.reference}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${trainingStatusClass(row.status)}`}
                        >
                          {TRAINING_LABELS[row.status]}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">
                        {displayName(row)}
                        {row.profile_email ? <span className="block break-all text-xs text-slate-500">{row.profile_email}</span> : null}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedTrainingId((id) => (id === row.id ? null : row.id))}
                          className="inline-flex items-center gap-0.5 rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700"
                        >
                          Détails
                          <IconChevronDown className={`h-3.5 w-3.5 ${open ? 'rotate-180' : ''}`} stroke={1.75} />
                        </button>
                        <TrainingActions
                          row={row}
                          busyId={busyId}
                          onAction={onTrainingAction}
                          onOpenPaymentModal={() => setTrainingPaymentRow(row)}
                          onOpenEmail={() => setTrainingEmailRow(row)}
                        />
                      </div>
                      {open ? <TrainingDetailPanel row={row} /> : null}
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </section>
          </div>
        </motion.div>

        <motion.div
          initial={false}
          animate={{
            opacity: tab === 'partner' ? 1 : 0,
            y: tab === 'partner' ? 0 : 8,
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={tab === 'partner' ? 'block' : 'hidden'}
        >
          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-slate-400">Admin</p>
                <h2 className="mt-1 text-2xl md:text-3xl font-semibold text-slate-900">Partner</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Candidatures revendeur : demander un paiement, activer le compte ou refuser.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadPartner()}
                disabled={loadingP}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
              >
                <IconRefresh className={`h-4 w-4 ${loadingP ? 'animate-spin' : ''}`} stroke={1.75} />
                Actualiser
              </button>
            </div>

        <section aria-label="Indicateurs partenaires">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(['pending', 'payment_pending', 'partner', 'declined'] as PartnerAppStatus[]).map((s) => (
              <StatCard key={s} label={PARTNER_LABELS[s]} value={loadingP ? null : partnerCounts[s] ?? 0} />
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/90 px-4 py-4 md:px-6">
            <h3 className="text-base font-semibold text-slate-900">Liste des demandes</h3>
            <p className="mt-0.5 text-sm text-slate-500">Tri par date de soumission.</p>
          </div>

          {loadingP ? (
            <TableSkeleton rows={4} />
          ) : partnerSorted.length === 0 ? (
            <EmptyState message="Aucune demande partenaire." />
          ) : (
            <>
              <div className="hidden min-w-0 overflow-x-auto lg:block">
                <div className="grid min-w-[960px] grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)] gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-2.5 text-[11px] font-nav font-bold uppercase tracking-[0.12em] text-slate-500 lg:px-6">
                  <span>Entreprise</span>
                  <span>Contact</span>
                  <span>Email</span>
                  <span>Statut</span>
                  <span>Reçu</span>
                  <span className="text-right">Actions</span>
                </div>
                <ul className="min-w-[960px] divide-y divide-slate-100">
                  {partnerSorted.map((row) => (
                    <li
                      key={row.id}
                      className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)] items-start gap-3 px-4 py-4 lg:px-6"
                    >
                      <span className="font-medium text-slate-900">{row.company_name || '—'}</span>
                      <span className="text-sm text-slate-700">{partnerContactName(row)}</span>
                      <span className="truncate text-sm text-slate-600">{partnerEmail(row) || '—'}</span>
                      <span
                        className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${partnerStatusClass(row.status)}`}
                      >
                        {PARTNER_LABELS[row.status]}
                      </span>
                      <span className="text-xs text-slate-500">
                        {row.submitted_at ? new Date(row.submitted_at).toLocaleString() : '—'}
                      </span>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <PartnerActions row={row} busyId={busyId} onAction={onPartnerAction} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <ul className="divide-y divide-slate-100 lg:hidden">
                {partnerSorted.map((row) => (
                  <li key={row.id} className="px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900">{row.company_name || '—'}</p>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${partnerStatusClass(row.status)}`}
                      >
                        {PARTNER_LABELS[row.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{partnerContactName(row)}</p>
                    <p className="text-xs text-slate-600">{partnerEmail(row) || 'Sans email'}</p>
                    {row.submitted_at ? (
                      <p className="mt-1 text-xs text-slate-500">{new Date(row.submitted_at).toLocaleString()}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <PartnerActions row={row} busyId={busyId} onAction={onPartnerAction} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
          </div>
        </motion.div>
      </div>

      <TrainingEmailComposeModal
        open={Boolean(trainingEmailRow)}
        row={trainingEmailRow}
        onClose={() => setTrainingEmailRow(null)}
      />
      <TrainingPaymentInstructionsModal
        open={Boolean(trainingPaymentRow)}
        row={trainingPaymentRow}
        onClose={() => setTrainingPaymentRow(null)}
        onConfirm={(instructions) => void confirmTrainingPaymentRequest(instructions)}
        busy={Boolean(trainingPaymentRow && busyId === trainingPaymentRow.id)}
      />
    </div>
  )
}

function TrainingDetailPanel({ row }: { row: TrainingRequestWithProfile }) {
  return (
    <div className="border-t border-slate-100 bg-slate-50/90 px-4 py-4 text-sm text-slate-700 md:px-6">
      <div className="space-y-3">
        {row.applicant_message ? (
          <div>
            <p className="text-[10px] font-nav font-bold uppercase tracking-[0.14em] text-slate-400">Message du candidat</p>
            <p className="mt-1 whitespace-pre-wrap">{row.applicant_message}</p>
          </div>
        ) : (
          <p className="text-xs italic text-slate-400">Aucun message.</p>
        )}
        {row.phone ? (
          <p className="text-sm">
            <span className="text-slate-500">Téléphone · </span>
            {row.phone}
          </p>
        ) : null}
        {row.payment_instructions ? (
          <div>
            <p className="text-[10px] font-nav font-bold uppercase tracking-[0.14em] text-slate-400">Instructions de paiement</p>
            <p className="mt-1 whitespace-pre-wrap">{row.payment_instructions}</p>
          </div>
        ) : null}
        {row.admin_note ? (
          <div>
            <p className="text-[10px] font-nav font-bold uppercase tracking-[0.14em] text-slate-400">Note interne</p>
            <p className="mt-1 whitespace-pre-wrap text-slate-600">{row.admin_note}</p>
          </div>
        ) : null}
        <p className="text-xs text-slate-400">
          Créé le {new Date(row.created_at).toLocaleString()} — Mis à jour le {new Date(row.updated_at).toLocaleString()}
        </p>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:px-4 sm:py-3.5">
      <p className="text-[10px] font-nav font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value === null ? '—' : value}</p>
    </div>
  )
}

function ActionBtn(props: {
  label: string
  onClick: () => void
  busy: boolean
  variant: 'primary' | 'amber' | 'danger' | 'ghost'
}) {
  const { label, onClick, busy, variant } = props
  const styles =
    variant === 'primary'
      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
      : variant === 'amber'
        ? 'bg-amber-500 text-white hover:bg-amber-600'
        : variant === 'danger'
          ? 'border border-red-200 bg-red-50 text-red-800 hover:bg-red-100'
          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50 ${styles}`}
    >
      {busy ? '…' : label}
    </button>
  )
}

function TrainingActions({
  row,
  busyId,
  onAction,
  onOpenPaymentModal,
  onOpenEmail,
}: {
  row: TrainingRequestWithProfile
  busyId: string | null
  onAction: (
    row: TrainingRequestWithProfile,
    next: TrainingRequestStatus,
    opts?: { paymentInstructions?: string; adminNote?: string },
  ) => void
  onOpenPaymentModal: (row: TrainingRequestWithProfile) => void
  onOpenEmail: (row: TrainingRequestWithProfile) => void
}) {
  const busy = busyId === row.id
  const hasEmail = Boolean(row.profile_email?.trim())

  const EmailBtn =
    hasEmail && row.status !== 'declined' && row.status !== 'cancelled' ? (
      <button
        type="button"
        disabled={busy}
        onClick={() => onOpenEmail(row)}
        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
      >
        <IconMail className="h-3.5 w-3.5" stroke={1.75} />
        Courriel
      </button>
    ) : null

  if (row.status === 'pending') {
    return (
      <>
        {EmailBtn}
        <ActionBtn busy={busy} variant="primary" label="Approuver" onClick={() => onAction(row, 'approved')} />
        <ActionBtn
          busy={busy}
          variant="danger"
          label="Refuser"
          onClick={() => {
            const note = window.prompt('Note optionnelle (email au membre) :') || ''
            void onAction(row, 'declined', { adminNote: note })
          }}
        />
      </>
    )
  }
  if (row.status === 'approved') {
    return (
      <>
        {EmailBtn}
        <ActionBtn
          busy={busy}
          variant="amber"
          label="Demander paiement"
          onClick={() => onOpenPaymentModal(row)}
        />
        <ActionBtn busy={busy} variant="primary" label="Marquer payé" onClick={() => onAction(row, 'paid')} />
        <ActionBtn
          busy={busy}
          variant="danger"
          label="Refuser"
          onClick={() => {
            const note = window.prompt('Note optionnelle :') || ''
            void onAction(row, 'declined', { adminNote: note })
          }}
        />
      </>
    )
  }
  if (row.status === 'payment_pending') {
    return (
      <>
        {EmailBtn}
        <ActionBtn busy={busy} variant="primary" label="Marquer payé" onClick={() => onAction(row, 'paid')} />
        <ActionBtn
          busy={busy}
          variant="danger"
          label="Refuser"
          onClick={() => {
            const note = window.prompt('Note optionnelle :') || ''
            void onAction(row, 'declined', { adminNote: note })
          }}
        />
      </>
    )
  }
  return EmailBtn ? <>{EmailBtn}</> : <span className="text-xs text-slate-400">—</span>
}

function PartnerActions({
  row,
  busyId,
  onAction,
}: {
  row: PartnerApplicationAdminRow
  busyId: string | null
  onAction: (row: PartnerApplicationAdminRow, next: PartnerAppStatus, note?: string) => void
}) {
  const busy = busyId === row.id
  if (row.status === 'pending') {
    return (
      <>
        <ActionBtn
          busy={busy}
          variant="amber"
          label="Paiement requis"
          onClick={() => {
            const note = window.prompt('Instructions / contexte pour le candidat :') || ''
            void onAction(row, 'payment_pending', note)
          }}
        />
        <ActionBtn busy={busy} variant="primary" label="Activer" onClick={() => onAction(row, 'partner')} />
        <ActionBtn
          busy={busy}
          variant="danger"
          label="Refuser"
          onClick={() => {
            const note = window.prompt('Note de refus (optionnel) :') || ''
            void onAction(row, 'declined', note)
          }}
        />
      </>
    )
  }
  if (row.status === 'payment_pending') {
    return (
      <>
        <ActionBtn busy={busy} variant="primary" label="Confirmer & activer" onClick={() => onAction(row, 'partner')} />
        <ActionBtn
          busy={busy}
          variant="danger"
          label="Refuser"
          onClick={() => {
            const note = window.prompt('Note optionnelle :') || ''
            void onAction(row, 'declined', note)
          }}
        />
      </>
    )
  }
  return <span className="text-xs text-slate-400">—</span>
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="divide-y divide-slate-100 px-4 py-2 md:px-6">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse py-4">
          <div className="h-4 w-1/3 rounded bg-slate-200" />
          <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  )
}
