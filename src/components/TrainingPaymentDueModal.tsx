import { useContext, useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LenisContext } from '@/components/LenisRoot'
import { cn } from '@/lib/utils'
import type { TrainingRequestRow } from '@/utils/trainingRequests'
import { TRAINING_BASE_PRICE_CAD, TRAINING_REGISTRATION_XP } from '@/components/JoinTrainingEventsModal'

type TrainingPaymentDueModalProps = {
  open: boolean
  onClose: () => void
  request: TrainingRequestRow | null
  memberEmail: string | null
}

const GST_RATE = 0.05
const QST_RATE = 0.09975

function formatCAD(amount: number) {
  return amount.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })
}

function isApplePayAvailable(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      'ApplePaySession' in window &&
      // @ts-expect-error ApplePaySession is Safari-only
      typeof window.ApplePaySession.canMakePayments === 'function' &&
      // @ts-expect-error
      window.ApplePaySession.canMakePayments()
    )
  } catch {
    return false
  }
}

export function TrainingPaymentDueModal({ open, onClose, request, memberEmail }: TrainingPaymentDueModalProps) {
  const lenis = useContext(LenisContext)
  const baseId = useId()
  const titleId = `${baseId}-title`
  const { i18n } = useTranslation()
  const isFr = i18n.language?.startsWith('fr')
  const [applePayAvailable] = useState(isApplePayAvailable)
  const [applePayError, setApplePayError] = useState<string | null>(null)
  const [applePayPending, setApplePayPending] = useState(false)

  const gst = TRAINING_BASE_PRICE_CAD * GST_RATE
  const qst = TRAINING_BASE_PRICE_CAD * QST_RATE
  const total = TRAINING_BASE_PRICE_CAD + gst + qst

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

  const instructions = request.payment_instructions?.trim() || ''

  const handleApplePay = () => {
    if (!applePayAvailable) return
    setApplePayError(null)
    setApplePayPending(true)

    const paymentRequest = {
      countryCode: 'CA',
      currencyCode: 'CAD',
      supportedNetworks: ['visa', 'masterCard', 'amex', 'interac'],
      merchantCapabilities: ['supports3DS'],
      lineItems: [
        { label: isFr ? 'Formation Fireball Academy' : 'Fireball Academy Training', amount: TRAINING_BASE_PRICE_CAD.toFixed(2) },
        { label: isFr ? 'TPS (5%)' : 'GST (5%)', amount: gst.toFixed(2) },
        { label: isFr ? 'TVQ (9,975%)' : 'QST (9.975%)', amount: qst.toFixed(2) },
      ],
      total: {
        label: 'Fireball Canada',
        amount: total.toFixed(2),
      },
    }

    try {
      // @ts-expect-error ApplePaySession is Safari-only
      const session = new window.ApplePaySession(3, paymentRequest)

      session.onvalidatemerchant = (event: { validationURL: string }) => {
        fetch('/api/apple-pay-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ validationURL: event.validationURL, reference: request.reference }),
        })
          .then((r) => r.json())
          .then((merchantSession) => session.completeMerchantValidation(merchantSession))
          .catch(() => {
            session.abort()
            setApplePayError(isFr ? 'Validation échouée. Contactez-nous.' : 'Validation failed. Please contact us.')
            setApplePayPending(false)
          })
      }

      session.onpaymentauthorized = (event: { payment: unknown }) => {
        fetch('/api/apple-pay-process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment: event.payment, reference: request.reference, email: memberEmail }),
        })
          .then((r) => r.json())
          .then((result) => {
            if (result.success) {
              // @ts-expect-error
              session.completePayment(window.ApplePaySession.STATUS_SUCCESS)
              onClose()
            } else {
              // @ts-expect-error
              session.completePayment(window.ApplePaySession.STATUS_FAILURE)
              setApplePayError(isFr ? 'Paiement refusé. Réessayez.' : 'Payment declined. Please try again.')
            }
          })
          .catch(() => {
            // @ts-expect-error
            session.completePayment(window.ApplePaySession.STATUS_FAILURE)
            setApplePayError(isFr ? 'Erreur réseau. Réessayez.' : 'Network error. Please try again.')
          })
          .finally(() => setApplePayPending(false))
      }

      session.oncancel = () => {
        setApplePayPending(false)
      }

      session.begin()
    } catch {
      setApplePayError(isFr ? 'Apple Pay non disponible sur cet appareil.' : 'Apple Pay is not available on this device.')
      setApplePayPending(false)
    }
  }

  const node = (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label={isFr ? 'Fermer' : 'Close'}
        onClick={onClose}
      />

      <div
        className={cn(
          'relative z-10 flex max-h-[min(92vh,680px)] w-full max-w-md flex-col overflow-hidden',
          'rounded-t-[2rem] bg-[#f5f5f7] shadow-[0_32px_80px_rgba(0,0,0,0.28)] sm:rounded-[2rem]',
        )}
      >
        {/* Header */}
        <div className="px-6 pb-0 pt-6 sm:px-7 sm:pt-7">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0485F7]">
                {isFr ? 'Academy — Paiement' : 'Academy — Payment'}
              </p>
              <h2 id={titleId} className="mt-1 text-xl font-bold tracking-tight text-carbon-900">
                {isFr ? 'Confirmer votre place' : 'Secure your spot'}
              </h2>
              <p className="mt-1 text-sm text-carbon-600 break-words">{request.session_label}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full bg-black/[0.06] p-2 text-carbon-600 transition hover:bg-black/[0.1]"
              aria-label={isFr ? 'Fermer' : 'Close'}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <p
            className="mt-2 font-mono text-[10px] text-carbon-400 break-all"
            title={request.reference}
          >
            {isFr ? 'Réf.' : 'Ref.'} {request.reference}
          </p>
        </div>

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-7">
          {/* Price breakdown card */}
          <div className="rounded-2xl bg-white px-5 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-carbon-500 mb-3">
              {isFr ? 'Détail du paiement' : 'Payment breakdown'}
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-carbon-700">
                <span>{isFr ? 'Formation' : 'Training fee'}</span>
                <span className="tabular-nums font-medium text-carbon-900">{formatCAD(TRAINING_BASE_PRICE_CAD)}</span>
              </div>
              <div className="flex justify-between text-carbon-500">
                <span>{isFr ? 'TPS (5%)' : 'GST (5%)'}</span>
                <span className="tabular-nums">{formatCAD(gst)}</span>
              </div>
              <div className="flex justify-between text-carbon-500">
                <span>{isFr ? 'TVQ (9,975%)' : 'QST (9.975%)'}</span>
                <span className="tabular-nums">{formatCAD(qst)}</span>
              </div>
            </div>

            <div className="mt-3 border-t border-carbon-100 pt-3 flex justify-between items-baseline">
              <span className="text-sm font-semibold text-carbon-900">{isFr ? 'Total CAD' : 'Total CAD'}</span>
              <span className="text-2xl font-black tabular-nums tracking-tight text-carbon-900">{formatCAD(total)}</span>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#f5f5f7] px-3 py-2.5">
              <span className="text-base">✦</span>
              <p className="text-[12px] font-medium text-carbon-700">
                <span className="font-bold text-[#0485F7]">+{TRAINING_REGISTRATION_XP.toLocaleString()} XP</span>{' '}
                {isFr
                  ? 'crédités à votre profil après confirmation de participation.'
                  : 'credited to your profile upon confirmed attendance.'}
              </p>
            </div>
          </div>

          {/* Payment instructions */}
          {instructions ? (
            <div className="mt-4 rounded-2xl bg-white px-5 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-carbon-500 mb-2">
                {isFr ? 'Instructions Fireball' : 'Fireball Instructions'}
              </p>
              <p className="text-sm leading-relaxed text-carbon-800 whitespace-pre-wrap">{instructions}</p>
            </div>
          ) : (
            <p className="mt-4 text-[13px] leading-relaxed text-carbon-500">
              {isFr
                ? 'Les instructions détaillées vous ont été envoyées par courriel. Procédez au paiement ci-dessous.'
                : 'Detailed instructions were sent to your email. Proceed with payment below.'}
            </p>
          )}

          {applePayError && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-800 border border-red-100">
              {applePayError}
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-carbon-100 bg-white/80 px-6 py-4 sm:px-7 backdrop-blur-sm">
          {applePayAvailable ? (
            <button
              type="button"
              disabled={applePayPending}
              onClick={handleApplePay}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-2xl py-[14px] text-[16px] font-semibold transition',
                'bg-black text-white hover:bg-neutral-900 active:scale-[0.98]',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              )}
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
            >
              <svg width="18" height="18" viewBox="0 0 814 1000" fill="currentColor" aria-hidden>
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.8-155.5-109.2L203 667.2c-32.5-50.3-55.6-127.7-55.6-198.7 0-121.3 79.1-185.5 156.2-185.5 51.5 0 94.5 33.7 127.3 33.7 31.5 0 81.6-35.9 139.8-35.9 22.1 0 108.2 2 168.3 83.4zm-172.9-145.5c29.5-34.7 50.3-82.7 50.3-130.7 0-6.5-.6-13-1.3-18.2-47.5 1.8-103.8 33-137.5 70.7-26.9 30.2-50.9 78.3-50.9 127.6 0 7.2 1.3 14.3 2 17.5 2.6.3 6.5.5 10.5.5 43 0 95.8-30.5 126.9-66.6z" />
              </svg>
              {applePayPending
                ? (isFr ? 'Traitement…' : 'Processing…')
                : (isFr ? 'Payer avec Apple Pay' : 'Pay with Apple Pay')}
            </button>
          ) : (
            <div className="rounded-2xl border border-carbon-200 bg-carbon-50 px-4 py-3 text-center">
              <p className="text-[13px] font-semibold text-carbon-700">
                {isFr ? 'Apple Pay non disponible sur cet appareil' : 'Apple Pay not available on this device'}
              </p>
              <p className="mt-1 text-[12px] text-carbon-500">
                {isFr
                  ? 'Utilisez Safari sur iPhone ou Mac pour payer avec Apple Pay, ou contactez-nous.'
                  : 'Use Safari on iPhone or Mac to pay with Apple Pay, or contact us.'}
              </p>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-[13px] font-semibold text-carbon-500 hover:text-carbon-800 transition"
            >
              {isFr ? 'Fermer' : 'Close'}
            </button>
            <Link
              to="/academy"
              className="text-[13px] font-semibold text-[#0485F7] hover:underline"
              onClick={onClose}
            >
              {isFr ? "Retour à l'Academy" : 'Back to Academy'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
