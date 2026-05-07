import { useContext, useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
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

function isIOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function isApplePayAvailable(): boolean {
  try {
    return (
      isIOS() &&
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

function AppleLogo() {
  return (
    <svg width="15" height="18" viewBox="0 0 17 20" fill="currentColor" aria-hidden>
      <path d="M13.65 10.62c-.02-2.1 1.72-3.12 1.8-3.17-.98-1.44-2.51-1.63-3.05-1.65-1.3-.13-2.54.77-3.2.77-.66 0-1.68-.75-2.77-.73-1.42.02-2.73.83-3.46 2.1-1.48 2.57-.38 6.37 1.06 8.45.7 1.02 1.54 2.16 2.64 2.12 1.06-.04 1.46-.68 2.74-.68 1.28 0 1.64.68 2.76.66 1.14-.02 1.86-1.03 2.56-2.05.81-1.17 1.14-2.31 1.16-2.37-.03-.01-2.22-.85-2.24-3.45zM11.55 4.3c.58-.71.98-1.69.87-2.67-.84.03-1.85.56-2.45 1.26-.54.62-1.01 1.62-.88 2.58.93.07 1.87-.47 2.46-1.17z" />
    </svg>
  )
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
      total: { label: 'Fireball Canada', amount: total.toFixed(2) },
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
          .then((ms) => session.completeMerchantValidation(ms))
          .catch(() => {
            session.abort()
            setApplePayError(isFr ? 'Validation échouée.' : 'Validation failed.')
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
              setApplePayError(isFr ? 'Paiement refusé.' : 'Payment declined.')
            }
          })
          .catch(() => {
            // @ts-expect-error
            session.completePayment(window.ApplePaySession.STATUS_FAILURE)
            setApplePayError(isFr ? 'Erreur réseau.' : 'Network error.')
          })
          .finally(() => setApplePayPending(false))
      }

      session.oncancel = () => setApplePayPending(false)
      session.begin()
    } catch {
      setApplePayError(isFr ? 'Apple Pay non disponible.' : 'Apple Pay unavailable.')
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
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label={isFr ? 'Fermer' : 'Close'}
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative z-10 w-full max-w-sm flex flex-col overflow-hidden rounded-t-[2.5rem] bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.18)] sm:rounded-[2rem] sm:shadow-[0_32px_80px_rgba(0,0,0,0.22)] max-h-[92dvh]">

        {/* Pull indicator (mobile) */}
        <div className="flex justify-center pt-3 pb-0 sm:hidden" aria-hidden>
          <div className="h-[5px] w-10 rounded-full bg-black/[0.14]" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-2 sm:px-7 sm:pt-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/40">
              {isFr ? 'Fireball Academy' : 'Fireball Academy'}
            </p>
            <h2
              id={titleId}
              className="mt-0.5 text-[22px] font-bold tracking-tight text-black leading-snug"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
            >
              {isFr ? 'Confirmer votre place' : 'Secure your spot'}
            </h2>
            <p className="mt-1 text-[13px] text-black/50 leading-snug break-words">{request.session_label}</p>
          </div>
          {/* X close */}
          <button
            type="button"
            onClick={onClose}
            className="mt-0.5 ml-3 shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.07] text-black/50 transition hover:bg-black/[0.12]"
            aria-label={isFr ? 'Fermer' : 'Close'}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
              <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-black/[0.06] sm:mx-7" />

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-7 space-y-3">

          {/* Price rows */}
          <div className="rounded-2xl bg-[#f2f2f7] px-4 py-4">
            <div className="space-y-1.5 text-[14px]">
              <div className="flex justify-between">
                <span className="text-black/60">{isFr ? 'Formation' : 'Training fee'}</span>
                <span className="tabular-nums font-medium text-black">{formatCAD(TRAINING_BASE_PRICE_CAD)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/40">{isFr ? 'TPS (5%)' : 'GST (5%)'}</span>
                <span className="tabular-nums text-black/40">{formatCAD(gst)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/40">{isFr ? 'TVQ (9,975%)' : 'QST (9.975%)'}</span>
                <span className="tabular-nums text-black/40">{formatCAD(qst)}</span>
              </div>
            </div>
            <div className="mt-3 border-t border-black/[0.08] pt-3 flex justify-between items-baseline">
              <span className="text-[14px] font-semibold text-black">{isFr ? 'Total' : 'Total'}</span>
              <span
                className="text-[26px] font-bold tabular-nums tracking-tight text-black"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
              >
                {formatCAD(total)}
              </span>
            </div>
          </div>

          {/* XP */}
          <div className="flex items-center gap-2.5 rounded-2xl bg-[#f2f2f7] px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0485F7]/10">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0485F7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <p className="text-[13px] text-black/70">
              <span className="font-semibold text-[#0485F7]">+{TRAINING_REGISTRATION_XP.toLocaleString()} XP</span>{' '}
              {isFr ? 'après confirmation de participation' : 'upon confirmed attendance'}
            </p>
          </div>

          {/* Instructions */}
          {instructions ? (
            <div className="rounded-2xl bg-[#f2f2f7] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-black/40 mb-2">
                {isFr ? 'Instructions' : 'Instructions'}
              </p>
              <p className="text-[14px] leading-relaxed text-black/80 whitespace-pre-wrap">{instructions}</p>
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed text-black/40 px-1">
              {isFr
                ? 'Instructions envoyées par courriel. Référence : '
                : 'Instructions sent by email. Reference: '}
              <span className="font-mono text-black/50">{request.reference}</span>
            </p>
          )}

          {applePayError && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-[13px] text-red-700">
              {applePayError}
            </p>
          )}
        </div>

        {/* Action buttons — no text links below */}
        <div className="px-6 pb-[max(1.25rem,env(safe-area-inset-bottom,1.25rem))] pt-3 space-y-2.5 sm:px-7 sm:pb-6">
          {applePayAvailable ? (
            <>
              {/* Apple Pay */}
              <button
                type="button"
                disabled={applePayPending}
                onClick={handleApplePay}
                className={cn(
                  'w-full flex items-center justify-center gap-2 rounded-[14px] py-[15px] text-[17px] font-semibold tracking-[-0.02em] transition active:scale-[0.98]',
                  'bg-black text-white disabled:opacity-60 disabled:cursor-not-allowed',
                )}
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
              >
                <AppleLogo />
                {applePayPending
                  ? (isFr ? 'Traitement…' : 'Processing…')
                  : (isFr ? 'Payer avec Apple Pay' : 'Pay with Apple Pay')}
              </button>

              {/* Secondary */}
              <button
                type="button"
                onClick={onClose}
                className="w-full flex items-center justify-center rounded-[14px] bg-[#f2f2f7] py-[14px] text-[16px] font-semibold text-black transition hover:bg-[#e5e5ea] active:scale-[0.98]"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
              >
                {isFr ? 'Autre méthode' : 'Other method'}
              </button>
            </>
          ) : (
            /* Non-iOS: single dark button */
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 rounded-[14px] bg-black py-[15px] text-[17px] font-semibold text-white transition hover:bg-neutral-800 active:scale-[0.98]"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
              onClick={onClose}
            >
              <svg width="15" height="12" viewBox="0 0 22 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="1" y="1" width="20" height="14" rx="2" />
                <line x1="1" y1="6" x2="21" y2="6" />
              </svg>
              {isFr ? 'Procéder au paiement' : 'Proceed to payment'}
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
