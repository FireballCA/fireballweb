import { useCallback, useContext, useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { LenisContext } from '@/components/LenisRoot'
import { AppleButton, appleButtonVisualClassName } from '@/components/ui/AppleButton'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { generatePreviewStripeOrderId, sendTrainingRegistrationEmail } from '@/utils/trainingRegistrationEmail'
import { getCurrentUserProfile, type UserProfile } from '@/utils/supabaseAuth'

/** Doit correspondre à la validation dans `getSafeReturnToPath`. */
export const ACADEMY_TRAINING_RETURN_PATH = '/academy?joinTraining=1'

export const TRAINING_SESSION_OPTIONS: { id: string; label: string; hint?: string }[] = [
  {
    id: 'may-2026-sh',
    label: 'May 15–16, 2026',
    hint: 'Saint-Hyacinthe, QC — hands-on + certification',
  },
  {
    id: 'jun-2026-sh',
    label: 'June 12–13, 2026',
    hint: 'Saint-Hyacinthe, QC — hands-on + certification',
  },
  {
    id: 'sep-2026-sh',
    label: 'September 18–19, 2026',
    hint: 'Saint-Hyacinthe, QC — hands-on + certification',
  },
]

/** Prix de base de la formation (CAD), avant taxes et rabais. */
export const TRAINING_BASE_PRICE_CAD = 999

/** Affichage court du prix (hero / résumé). */
export const TRAINING_REGISTRATION_PRICE = `$${TRAINING_BASE_PRICE_CAD.toLocaleString('en-CA')}`

/** XP affiché pour l’inscription à la formation (placeholder). */
export const TRAINING_REGISTRATION_XP = 500

/** Taux de taxes estimatif (GST + QST, Québec) — le total définitif est confirmé à la facturation. */
const ESTIMATED_TAX_RATE = 0.14975

type Step = 1 | 2

type JoinTrainingEventsModalProps = {
  open: boolean
  onClose: () => void
}

export function JoinTrainingEventsModal({ open, onClose }: JoinTrainingEventsModalProps) {
  const navigate = useNavigate()
  const lenis = useContext(LenisContext)
  const baseId = useId()
  const titleId = `${baseId}-title`
  const [step, setStep] = useState<Step>(1)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [discountCodeInput, setDiscountCodeInput] = useState('')
  const [appliedDiscountCad, setAppliedDiscountCad] = useState(0)
  const [discountMessage, setDiscountMessage] = useState<string | null>(null)
  const [paymentSubmitting, setPaymentSubmitting] = useState(false)

  const returnToQuery = `returnTo=${encodeURIComponent(ACADEMY_TRAINING_RETURN_PATH)}`
  const connectionHref = `/account?${returnToQuery}`

  const refreshProfile = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      setProfile(null)
      return
    }
    const p = await getCurrentUserProfile()
    setProfile(p)
  }, [])

  useEffect(() => {
    if (!open) return
    void refreshProfile()
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void refreshProfile()
    })
    return () => {
      sub.subscription.unsubscribe()
    }
  }, [open, refreshProfile])

  useEffect(() => {
    if (!open || !profile) return
    const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim()
    if (fullName) setName((n) => n.trim() || fullName)
    if (profile.email) setEmail((e) => e.trim() || profile.email)
  }, [open, profile])

  /** Lenis intercepte la molette sur toute la page — on le suspend pour que le scroll natif fonctionne dans le modal. */
  useEffect(() => {
    if (!open) return
    lenis?.stop()
    return () => {
      lenis?.start()
    }
  }, [open, lenis])

  /** Bloque le scroll du document derrière le modal. */
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
    if (!open) {
      setStep(1)
      setDiscountCodeInput('')
      setAppliedDiscountCad(0)
      setDiscountMessage(null)
    }
  }, [open])

  useEffect(() => {
    if (open && step === 2 && !profile) {
      setStep(1)
    }
  }, [open, step, profile])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  /** Prénom pour « Hi, … » (discret) ; repli sur la partie locale de l’email. */
  const greetingFirstName = profile
    ? profile.first_name?.trim() || profile.email?.split('@')[0]?.trim() || null
    : null

  const inputClass =
    'w-full rounded-lg border border-carbon-700/30 bg-white px-2.5 py-2 text-xs text-carbon-900 placeholder:text-carbon-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-carbon-500 lg:px-3 lg:py-2.5 lg:text-sm'
  const labelClass = 'mb-0.5 block text-xs font-medium text-carbon-700 lg:mb-1 lg:text-sm'

  const formValid =
    !!selectedSessionId &&
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0 &&
    message.trim().length > 0

  const canGoToNextStep = formValid && !!profile

  const selectedSession = TRAINING_SESSION_OPTIONS.find((o) => o.id === selectedSessionId)

  const formatCad = (amount: number) =>
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount)

  const amountToPayCad = TRAINING_BASE_PRICE_CAD
  const discountCad = appliedDiscountCad
  const taxableCad = Math.max(0, amountToPayCad - discountCad)
  const estimatedTaxesCad = taxableCad * ESTIMATED_TAX_RATE
  const totalDueCad = taxableCad + estimatedTaxesCad

  const handleApplyDiscount = () => {
    const code = discountCodeInput.trim().toUpperCase()
    if (!code) {
      setDiscountMessage('Please enter a promotional code.')
      return
    }
    // Codes promotionnels : à terme, validation côté serveur. Certaines valeurs peuvent être reconnues en interne.
    const eligibleCodes: Record<string, number> = { ALLO: Math.round(TRAINING_BASE_PRICE_CAD * 0.1 * 100) / 100 }
    const amount = eligibleCodes[code]
    if (amount != null && amount > 0) {
      setAppliedDiscountCad(amount)
      setDiscountMessage('Promotional code applied. Your order summary has been updated.')
    } else {
      setAppliedDiscountCad(0)
      setDiscountMessage(
        'This promotional code is not valid or has expired. You may continue your registration without a promotional code.',
      )
    }
  }

  const handleCompleteRegistration = async () => {
    if (!profile || !email.trim()) return
    setPaymentSubmitting(true)
    try {
      const orderNumber = generatePreviewStripeOrderId()
      const totalFormatted = formatCad(totalDueCad)
      const sessionLabel = selectedSession
        ? `${selectedSession.label}${selectedSession.hint ? ` — ${selectedSession.hint}` : ''}`
        : 'Fireball Academy training'
      const customerName = name.trim() || greetingFirstName || 'Member'

      const result = await sendTrainingRegistrationEmail({
        to: email.trim(),
        customerName,
        orderNumber,
        sessionLabel,
        totalFormatted,
      })
      if (!result.ok) {
        console.warn('Training confirmation email:', result.error)
      }

      navigate('/academy/training-thank-you', {
        replace: true,
        state: {
          orderNumber,
          email: email.trim(),
          customerName,
        },
      })
    } finally {
      setPaymentSubmitting(false)
    }
  }

  if (!open) return null

  const node = (
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center p-3 font-sans sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 flex max-h-[min(96vh,920px)] w-full max-w-[min(96vw,920px)] min-h-[min(70vh,640px)] flex-col overflow-hidden rounded-2xl border border-carbon-200 bg-white text-carbon-900 shadow-[0_24px_80px_rgba(0,0,0,0.12)]',
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-carbon-200 px-5 py-4 sm:px-7 sm:py-5">
          <div className="min-w-0 pr-2">
            <h2 id={titleId} className="text-xl font-bold tracking-tight text-carbon-900 sm:text-2xl md:text-3xl">
              {step === 1 ? 'Join next fireball events' : 'Next steps'}
            </h2>
            {step === 2 ? (
              <p className="mt-1 text-xs text-carbon-500">
                Review your order summary, then confirm your registration. You will receive a confirmation email and your order reference on the next screen.
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {greetingFirstName ? (
              <span className="max-w-[min(200px,46vw)] text-right text-[11px] leading-snug sm:max-w-[220px] sm:text-xs">
                <span className="font-normal text-carbon-400">Hi,</span>{' '}
                <span className="font-medium tracking-tight text-carbon-600">{greetingFirstName}</span>
              </span>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-carbon-300 text-carbon-700 transition hover:bg-carbon-100"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7 sm:py-8 [touch-action:pan-y]"
          onWheelCapture={(e) => {
            e.stopPropagation()
          }}
        >
          {step === 1 ? (
            <>
              <p className="text-sm leading-relaxed text-carbon-600">
                {profile ? (
                  <>
                    Choose your training date and complete the form below. When all required fields are filled, select{' '}
                    <strong className="font-semibold text-carbon-800">Next steps</strong> to continue.
                  </>
                ) : (
                  <>
                    Choose a training date, sign in using <strong className="font-semibold text-carbon-800">Connection</strong>, then complete the form.{' '}
                    <strong className="font-semibold text-carbon-800">Next steps</strong> becomes available once you are signed in and the form is complete.
                  </>
                )}
              </p>

              <fieldset className="mt-8">
                <legend className="text-xs font-semibold uppercase tracking-wider text-carbon-500">Training date</legend>
                <div className="mt-3 divide-y divide-carbon-200 overflow-hidden rounded-lg border border-carbon-200">
                  {TRAINING_SESSION_OPTIONS.map((opt) => {
                    const inputId = `${baseId}-session-${opt.id}`
                    return (
                      <label
                        key={opt.id}
                        htmlFor={inputId}
                        className="flex cursor-pointer items-start gap-3 bg-white px-4 py-3 transition hover:bg-carbon-50 sm:px-5 sm:py-4"
                      >
                        <input
                          id={inputId}
                          type="radio"
                          name={`${baseId}-training-session`}
                          value={opt.id}
                          checked={selectedSessionId === opt.id}
                          onChange={() => setSelectedSessionId(opt.id)}
                          className="mt-1 h-4 w-4 shrink-0 border-carbon-400 text-[#0485F7] focus:ring-carbon-500"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-carbon-900">{opt.label}</span>
                          {opt.hint ? <span className="mt-0.5 block text-sm text-carbon-600">{opt.hint}</span> : null}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>

              {profile ? (
                <div className="mt-10 rounded-xl border border-carbon-200/90 bg-carbon-50/95 px-4 py-4 sm:px-5">
                  <p className="text-sm font-medium text-carbon-900">Account</p>
                  <p className="mt-1 text-sm text-carbon-600">
                    You are signed in. You may continue with the form below.
                  </p>
                  <div className="mt-4">
                    <span
                      aria-disabled
                      className={cn(
                        'inline-flex cursor-not-allowed select-none justify-center opacity-40',
                        appleButtonVisualClassName,
                      )}
                    >
                      Connection
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-10">
                  <p className="text-sm font-medium text-carbon-900">Account</p>
                  <p className="mt-1 text-sm text-carbon-600">
                    Sign in to your Fireball account (or create one). You will be returned to this form automatically.
                  </p>
                  <div className="mt-4">
                    <Link to={connectionHref} className={cn('inline-flex justify-center', appleButtonVisualClassName)}>
                      Connection
                    </Link>
                  </div>
                </div>
              )}

              <form
                className="mt-10 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (canGoToNextStep) setStep(2)
                }}
              >
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-carbon-500">Your details</h3>

                <div>
                  <label htmlFor={`${baseId}-name`} className={labelClass}>
                    Name
                  </label>
                  <input
                    id={`${baseId}-name`}
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor={`${baseId}-email`} className={labelClass}>
                    Email
                  </label>
                  <input
                    id={`${baseId}-email`}
                    type="email"
                    autoComplete="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor={`${baseId}-phone`} className={labelClass}>
                    Phone number
                  </label>
                  <input
                    id={`${baseId}-phone`}
                    type="tel"
                    autoComplete="tel"
                    placeholder="+1 …"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor={`${baseId}-message`} className={labelClass}>
                    Message
                  </label>
                  <textarea
                    id={`${baseId}-message`}
                    rows={4}
                    placeholder="Your message…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[5rem] w-full resize-y rounded-lg border border-carbon-700/30 bg-white px-2.5 py-2 text-xs text-carbon-900 placeholder:text-carbon-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-carbon-500 lg:px-3 lg:py-2.5 lg:text-sm"
                  />
                </div>

                <div className="pt-2">
                  <AppleButton
                    type="submit"
                    disabled={!canGoToNextStep}
                    className="disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[#0485F7] disabled:hover:bg-[#0485F7]"
                  >
                    Next steps
                  </AppleButton>
                  {!profile ? (
                    <p className="mt-2 text-xs text-carbon-500">Sign in using Connection above to enable Next steps.</p>
                  ) : !formValid ? (
                    <p className="mt-2 text-xs text-carbon-500">Complete all required fields to continue.</p>
                  ) : null}
                </div>
              </form>
            </>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3 text-sm leading-relaxed text-carbon-700">
                <p>
                  After you confirm your registration, Fireball Canada will send your schedule, preparation instructions, and next steps{' '}
                  <strong className="font-semibold text-carbon-900">to the email address on file</strong>. Please also check your spam or junk folder.
                </p>
                <p>
                  <strong className="font-semibold text-carbon-900">Cancellation and refunds:</strong> Cancellations received at least{' '}
                  <strong className="font-semibold text-carbon-900">five (5) business days before</strong> the start date of your training session may qualify for a{' '}
                  <strong className="font-semibold text-carbon-900">full refund without administrative fees</strong>. Cancellations after that period may be subject to fees or conditions as described in your written confirmation.
                </p>
              </div>

              {selectedSession ? (
                <div className="rounded-lg border border-carbon-200 bg-carbon-50/80 px-4 py-3 text-sm text-carbon-800">
                  <span className="font-medium text-carbon-600">Selected session</span>
                  <p className="mt-1 font-semibold text-carbon-900">{selectedSession.label}</p>
                  {selectedSession.hint ? <p className="text-carbon-600">{selectedSession.hint}</p> : null}
                </div>
              ) : null}

              <div className="border-t border-carbon-200 pt-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-carbon-700">Training fee</p>
                    <p className="mt-1.5 text-sm font-medium tabular-nums text-carbon-700">
                      Earn {TRAINING_REGISTRATION_XP.toLocaleString()}{' '}
                      <span className="font-bold">XP</span>
                    </p>
                  </div>
                  <p className="text-2xl font-bold tabular-nums tracking-tight text-carbon-900 sm:pt-0.5 sm:text-right">
                    {TRAINING_REGISTRATION_PRICE}
                  </p>
                </div>
                <p className="mt-3 text-xs leading-snug text-carbon-500">
                  Experience points (XP) are credited when your registration is confirmed. Amounts shown below are estimates; final taxes and charges will be confirmed at billing.
                </p>

                <div className="mt-6 rounded-xl border border-carbon-200 bg-carbon-50/50 px-4 py-4 sm:px-5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-carbon-500">Order summary</p>
                  <dl className="mt-3 space-y-2.5 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-carbon-600">Amount to pay</dt>
                      <dd className="tabular-nums font-medium text-carbon-900">{formatCad(amountToPayCad)}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 border-t border-carbon-200/90 pt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-carbon-500">Promotional code</p>
                    <p className="mt-1 text-xs text-carbon-500">
                      If you have a promotional code issued by Fireball Canada, enter it below and select Apply.
                    </p>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                      <input
                        type="text"
                        value={discountCodeInput}
                        onChange={(e) => setDiscountCodeInput(e.target.value)}
                        placeholder="Promotional code"
                        className="min-w-0 flex-1 rounded-lg border border-carbon-700/25 bg-white px-3 py-2 text-sm text-carbon-900 placeholder:text-carbon-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-carbon-500"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={handleApplyDiscount}
                        className="shrink-0 rounded-lg border border-carbon-300 bg-white px-4 py-2 text-xs font-semibold text-carbon-800 transition hover:bg-carbon-100"
                      >
                        Apply
                      </button>
                    </div>
                    {discountMessage ? (
                      <p className="mt-2 text-xs leading-snug text-carbon-600">{discountMessage}</p>
                    ) : null}
                    {discountCad > 0 ? (
                      <div className="mt-3 flex justify-between gap-4 text-sm">
                        <span className="text-emerald-800">Promotional discount</span>
                        <span className="tabular-nums font-medium text-emerald-800">−{formatCad(discountCad)}</span>
                      </div>
                    ) : null}
                  </div>

                  <dl className="mt-4 space-y-2 border-t border-carbon-200/90 pt-4 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-carbon-600">Taxes (estimated)</dt>
                      <dd className="tabular-nums text-carbon-900">{formatCad(estimatedTaxesCad)}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-carbon-200/80 pt-3 text-base font-bold text-carbon-900">
                      <dt>Total due</dt>
                      <dd className="tabular-nums">{formatCad(totalDueCad)}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-[11px] leading-snug text-carbon-500">
                    Review your summary, then select Complete registration to confirm. You will receive a confirmation email and an order reference on the next screen. Secure online payment will be invoiced or charged separately when billing is activated.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex justify-center rounded-full border border-carbon-300 px-5 py-2 text-xs font-semibold text-carbon-800 transition hover:bg-carbon-100"
                >
                  Back
                </button>
                <AppleButton
                  type="button"
                  disabled={!profile || paymentSubmitting}
                  className="disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[#0485F7] disabled:hover:bg-[#0485F7]"
                  onClick={() => void handleCompleteRegistration()}
                >
                  {paymentSubmitting ? 'Processing…' : 'Complete registration'}
                </AppleButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
