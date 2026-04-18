import { useContext, useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { LenisContext } from '@/components/LenisRoot'
import { cn } from '@/lib/utils'
import type { TrainingRequestRow } from '@/utils/trainingRequests'
import { buildTrainingStripePaymentUrl, getTrainingStripeCheckoutUrl } from '@/constants/trainingPayment'
import { TRAINING_REGISTRATION_PRICE } from '@/components/JoinTrainingEventsModal'

type TrainingPaymentDueModalProps = {
  open: boolean
  onClose: () => void
  request: TrainingRequestRow | null
  memberEmail: string | null
}

export function TrainingPaymentDueModal({ open, onClose, request, memberEmail }: TrainingPaymentDueModalProps) {
  const lenis = useContext(LenisContext)
  const baseId = useId()
  const titleId = `${baseId}-title`

  useEffect(() => {
    if (!open) return
    lenis?.stop()
    return () => lenis?.start()
  }, [open, lenis])

  useEffect(() => {
    if (!open) return
    const scrollY = window.scrollY
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    const prevBodyPosition = body.style.position
    const prevBodyTop = body.style.top
    const prevBodyWidth = body.style.width
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
      body.style.position = prevBodyPosition
      body.style.top = prevBodyTop
      body.style.width = prevBodyWidth
      window.scrollTo(0, scrollY)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !request) return null

  const stripeBase = getTrainingStripeCheckoutUrl()
  const payHref =
    stripeBase && request.reference
      ? buildTrainingStripePaymentUrl(stripeBase, { reference: request.reference, email: memberEmail })
      : null

  const instructions = request.payment_instructions?.trim() || ''

  const node = (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl',
        )}
      >
        <div className="min-w-0 overflow-hidden border-b border-carbon-100 px-5 py-4 sm:px-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0485F7]">Academy — paiement</p>
          <h2 id={titleId} className="mt-1 text-lg font-semibold text-carbon-900">
            Confirmer votre place
          </h2>
          <p className="mt-1 break-words text-sm text-carbon-600">{request.session_label}</p>
          <p
            className="mt-1 block max-w-full min-w-0 break-all font-mono text-xs text-carbon-500 [overflow-wrap:anywhere]"
            title={request.reference}
          >
            Réf. {request.reference}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="rounded-xl border border-carbon-200 bg-carbon-50/80 px-4 py-3 text-sm text-carbon-800">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-carbon-500">Barème indicatif</p>
            <p className="mt-1 text-carbon-700">
              Frais typiques (avant taxes) :{' '}
              <span className="font-semibold tabular-nums text-carbon-900">{TRAINING_REGISTRATION_PRICE}</span>
            </p>
          </div>

          {instructions ? (
            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-carbon-500">
                Instructions Fireball
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-carbon-800">{instructions}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-carbon-600">
              Les instructions de paiement détaillées vous ont été communiquées par courriel. Vous pouvez aussi payer
              en ligne ci-dessous si un lien est configuré.
            </p>
          )}

          {!payHref ? (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Le lien de paiement en ligne n’est pas encore disponible ici — suivez les instructions ci-dessus ou celles reçues par courriel.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 border-t border-carbon-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex justify-center rounded-full border border-carbon-300 px-5 py-2.5 text-sm font-semibold text-carbon-800 transition hover:bg-carbon-50"
          >
            Fermer
          </button>
          {payHref ? (
            <a
              href={payHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex justify-center rounded-full bg-[#0485F7] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0366c7]"
            >
              Payer avec Stripe
            </a>
          ) : null}
          <Link
            to="/academy"
            className="inline-flex justify-center text-center text-sm font-semibold text-[#0485F7] hover:underline sm:items-center"
            onClick={onClose}
          >
            Academy
          </Link>
        </div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
