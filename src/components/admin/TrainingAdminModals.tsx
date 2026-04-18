import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { sendTrainingManualEmail } from '@/utils/adminRequestEmails'
import type { TrainingRequestWithProfile } from '@/utils/trainingRequests'

function displayName(p: TrainingRequestWithProfile): string {
  const a = `${p.profile_first_name || ''} ${p.profile_last_name || ''}`.trim()
  return a || p.profile_email || 'Member'
}

export function defaultManualTrainingEmailSubject(row: TrainingRequestWithProfile): string {
  return `Fireball Academy — ${row.session_label} (${row.reference})`
}

export function defaultManualTrainingEmailBody(row: TrainingRequestWithProfile): string {
  const name = displayName(row)
  return `Bonjour ${name},\n\nNous faisons suite à votre demande pour « ${row.session_label} » (référence ${row.reference}).\n\n[Votre message ici]\n\nCordialement,\nL'équipe Fireball Canada`
}

type TrainingEmailComposeModalProps = {
  open: boolean
  row: TrainingRequestWithProfile | null
  onClose: () => void
  onSent?: () => void
}

export function TrainingEmailComposeModal({ open, row, onClose, onSent }: TrainingEmailComposeModalProps) {
  const baseId = useId()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!open || !row) return
    setSubject(defaultManualTrainingEmailSubject(row))
    setBody(defaultManualTrainingEmailBody(row))
    setErr('')
  }, [open, row])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open || !row) return null

  const email = row.profile_email?.trim()
  const canSend = Boolean(email && subject.trim() && body.trim() && !sending)

  const handleSend = async () => {
    if (!email || !canSend) return
    setSending(true)
    setErr('')
    const res = await sendTrainingManualEmail({
      to: email,
      customerName: displayName(row),
      subject: subject.trim(),
      bodyText: body.trim(),
    })
    setSending(false)
    if (!res.ok) {
      setErr(res.error)
      return
    }
    onSent?.()
    onClose()
  }

  const node = (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label="Fermer" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-[11px] font-nav font-bold uppercase tracking-[0.14em] text-slate-400">Envoyer un courriel</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">{row.session_label}</h2>
          <p className="mt-1 font-mono text-xs text-slate-500 break-all">Vers : {email || '—'}</p>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <div>
            <label className="text-xs font-medium text-slate-600" htmlFor={`${baseId}-sub`}>
              Objet
            </label>
            <input
              id={`${baseId}-sub`}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600" htmlFor={`${baseId}-body`}>
              Message
            </label>
            <textarea
              id={`${baseId}-body`}
              rows={12}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-1 w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
            />
          </div>
          {err ? <p className="text-sm text-red-700">{err}</p> : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!canSend}
            onClick={() => void handleSend()}
            className="rounded-full bg-[#0485F7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0366c7] disabled:opacity-50"
          >
            {sending ? 'Envoi…' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}

type TrainingPaymentInstructionsModalProps = {
  open: boolean
  row: TrainingRequestWithProfile | null
  onClose: () => void
  onConfirm: (instructions: string) => void
  busy: boolean
}

export function TrainingPaymentInstructionsModal({
  open,
  row,
  onClose,
  onConfirm,
  busy,
}: TrainingPaymentInstructionsModalProps) {
  const baseId = useId()
  const [text, setText] = useState('')

  useEffect(() => {
    if (!open || !row) return
    setText(
      `Pour confirmer votre place pour « ${row.session_label} », merci de procéder au paiement selon les modalités ci-dessous.\n\n` +
        `Référence dossier : ${row.reference}\n\n` +
        `Vous pouvez également utiliser le bouton « Payer avec Stripe » sur votre tableau de bord une fois ce message enregistré.\n`,
    )
  }, [open, row])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open || !row) return null

  const node = (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label="Fermer" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-[11px] font-nav font-bold uppercase tracking-[0.14em] text-slate-400">Demander le paiement</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">{row.session_label}</h2>
          <p className="mt-1 font-mono text-xs text-slate-500 break-all">Réf. {row.reference}</p>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4">
          <label className="text-xs font-medium text-slate-600" htmlFor={`${baseId}-pi`}>
            Instructions pour le membre (stockées + visibles sur son tableau de bord)
          </label>
          <textarea
            id={`${baseId}-pi`}
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
          />
          <p className="text-xs text-slate-500">
            Un courriel automatique « paiement requis » sera envoyé après validation si une adresse est enregistrée.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={busy || !text.trim()}
            onClick={() => onConfirm(text.trim())}
            className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
          >
            {busy ? '…' : 'Enregistrer et notifier'}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
