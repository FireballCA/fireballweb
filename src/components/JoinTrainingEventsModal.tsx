import { useCallback, useContext, useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { LenisContext } from '@/components/LenisRoot'
import { AppleButton, appleButtonVisualClassName } from '@/components/ui/AppleButton'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { generatePreviewStripeOrderId, sendTrainingRegistrationEmail } from '@/utils/trainingRegistrationEmail'
import { fetchTrainingRequestsForDashboard, insertTrainingRequest } from '@/utils/trainingRequests'
import { getCurrentUserProfile, type UserProfile } from '@/utils/supabaseAuth'
import {
  DEFAULT_TRAINING_SESSION_OPTIONS,
  resolveTrainingSessionOptions,
  type TrainingSessionOption,
} from '@/constants/trainingSessions'

/** Doit correspondre à la validation dans `getSafeReturnToPath`. */
export const ACADEMY_TRAINING_RETURN_PATH = '/academy?joinTraining=1'

export const TRAINING_SESSION_OPTIONS: TrainingSessionOption[] = DEFAULT_TRAINING_SESSION_OPTIONS

/** Prix de base de la formation (CAD), avant taxes et rabais. */
export const TRAINING_BASE_PRICE_CAD = 999

/** Affichage court du prix (hero / résumé). */
export const TRAINING_REGISTRATION_PRICE = `$${TRAINING_BASE_PRICE_CAD.toLocaleString('en-CA')}`

/** XP affiché pour l’inscription à la formation (placeholder). */
export const TRAINING_REGISTRATION_XP = 500

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
  const [trainingSessions, setTrainingSessions] = useState<TrainingSessionOption[]>(
    DEFAULT_TRAINING_SESSION_OPTIONS,
  )
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [requestSubmitting, setRequestSubmitting] = useState(false)
  const [requestSaveError, setRequestSaveError] = useState<string | null>(null)
  const [existingTrainingRequests, setExistingTrainingRequests] = useState<
    { session_id: string | null; session_label: string; status: string }[]
  >([])

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
    if (!open) return
    const loadSessions = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'training_sessions')
        .maybeSingle()
      setTrainingSessions(resolveTrainingSessionOptions(data?.value))
    }
    void loadSessions()
  }, [open])

  useEffect(() => {
    if (!open || !profile) return
    const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim()
    if (fullName) setName((n) => n.trim() || fullName)
    if (profile.email) setEmail((e) => e.trim() || profile.email)
  }, [open, profile])

  useEffect(() => {
    if (!open || !profile?.id) {
      setExistingTrainingRequests([])
      return
    }
    void fetchTrainingRequestsForDashboard(profile.id).then((rows) => {
      setExistingTrainingRequests(rows.map((r) => ({ session_id: r.session_id, session_label: r.session_label, status: r.status })))
    })
  }, [open, profile?.id])

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
      setRequestSaveError(null)
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

  const parseSessionStartFromLabel = (label: string): Date | null => {
    const raw = String(label || '').trim()
    if (!raw) return null
    const firstChunk = raw.split('-')[0]?.trim() ?? raw
    const withYear = /\b\d{4}\b/.test(firstChunk) ? firstChunk : `${firstChunk} ${new Date().getFullYear()}`
    const t = Date.parse(withYear)
    if (Number.isNaN(t)) return null
    return new Date(t)
  }

  const now = new Date()
  const blockingStatuses = new Set(['pending', 'approved', 'payment_pending', 'paid'])
  const blockingExistingRequest = existingTrainingRequests.find((r) => {
    if (!blockingStatuses.has(String(r.status))) return false
    const d = parseSessionStartFromLabel(r.session_label)
    if (!d) return true
    return d.getTime() >= now.getTime()
  })
  const hasOngoingTrainingRequest = Boolean(blockingExistingRequest)
  const canGoToNextStep = formValid && !!profile && !hasOngoingTrainingRequest

  const selectedSession = trainingSessions.find((o) => o.id === selectedSessionId)

  const handleSubmitRequest = async () => {
    if (!profile || !email.trim() || hasOngoingTrainingRequest) return
    setRequestSaveError(null)
    setRequestSubmitting(true)
    try {
      const requestRef = generatePreviewStripeOrderId()
      const indicativeFeeNote = `${TRAINING_REGISTRATION_PRICE} CAD (before taxes) — invoiced only if your request is approved`
      const sessionLabel = selectedSession
        ? `${selectedSession.label}${selectedSession.hint ? ` — ${selectedSession.hint}` : ''}`
        : 'Fireball Academy training'
      const customerName = name.trim() || greetingFirstName || 'Member'

      const saved = await insertTrainingRequest({
        userId: profile.id,
        reference: requestRef,
        sessionId: selectedSessionId || null,
        sessionLabel,
        message: message.trim(),
        phone: phone.trim(),
      })
      if (!saved.ok) {
        setRequestSaveError(saved.error)
        return
      }

      const result = await sendTrainingRegistrationEmail({
        to: email.trim(),
        customerName,
        orderNumber: requestRef,
        sessionLabel,
        indicativeFeeNote,
      })
      if (!result.ok) {
        console.warn('Training confirmation email:', result.error)
      }

      navigate('/academy/training-thank-you', {
        replace: true,
        state: {
          orderNumber: requestRef,
          email: email.trim(),
          customerName,
        },
      })
    } finally {
      setRequestSubmitting(false)
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
              {step === 1 ? 'Request a future training session' : 'Review your request'}
            </h2>
            {step === 2 ? (
              <p className="mt-1 text-xs text-carbon-500">
                No payment is taken here. The Fireball Canada team will review your request and notify you by email if it is approved or declined.
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
                    You are submitting a <strong className="font-semibold text-carbon-800">request</strong> to attend a future Fireball Academy training session — not a live checkout.{' '}
                    <strong className="font-semibold text-carbon-800">You are not charged today.</strong> Fireball Canada will review your request and{' '}
                    <strong className="font-semibold text-carbon-800">approve or decline</strong> it. Choose a session, complete the form, then use{' '}
                    <strong className="font-semibold text-carbon-800">Next steps</strong> to review and send your request.
                  </>
                ) : (
                  <>
                    Choose a session and sign in with <strong className="font-semibold text-carbon-800">Connection</strong>. This form submits a{' '}
                    <strong className="font-semibold text-carbon-800">request</strong> for a future training — there is no payment on this screen.{' '}
                    <strong className="font-semibold text-carbon-800">Next steps</strong> is available once you are signed in and the form is complete.
                  </>
                )}
              </p>

              <fieldset className="fb-training-session-picker mt-8">
                <legend className="text-xs font-semibold uppercase tracking-wider text-carbon-500">Training date</legend>
                <div className="mt-3 divide-y divide-carbon-200 overflow-hidden rounded-lg border border-carbon-200">
                  {trainingSessions.map((opt) => {
                    const inputId = `${baseId}-session-${opt.id}`
                    return (
                      <label
                        key={opt.id}
                        htmlFor={inputId}
                        className="flex cursor-pointer items-start gap-3 bg-white px-4 py-3 outline-none transition hover:bg-carbon-50 focus-within:outline-none sm:px-5 sm:py-4"
                      >
                        <input
                          id={inputId}
                          type="radio"
                          name={`${baseId}-training-session`}
                          value={opt.id}
                          checked={selectedSessionId === opt.id}
                          onChange={() => setSelectedSessionId(opt.id)}
                          className="mt-1 h-4 w-4 shrink-0 cursor-pointer border-carbon-300 accent-[#0485F7] shadow-none outline-none ring-0 ring-offset-0 focus:outline-none focus:shadow-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
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
                    You are signed in. Continue with your training request below.
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
                {hasOngoingTrainingRequest ? (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    You already have a training request in progress for a future session. You can submit a new request after this training is completed.
                  </p>
                ) : null}

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
                  ) : hasOngoingTrainingRequest ? (
                    <p className="mt-2 text-xs text-carbon-500">A request is already active for an upcoming training session.</p>
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
                  By submitting, you confirm that you understand this is a <strong className="font-semibold text-carbon-900">request only</strong>.{' '}
                  Fireball Canada will email you at <strong className="font-semibold text-carbon-900">the address on file</strong> to let you know whether your request is{' '}
                  <strong className="font-semibold text-carbon-900">approved or declined</strong>. Please check spam or junk folders.
                </p>
                <p>
                  <strong className="font-semibold text-carbon-900">No payment today.</strong> If your request is approved, we will send instructions and any applicable{' '}
                  <strong className="font-semibold text-carbon-900">training fee</strong>, taxes, and cancellation or refund terms in writing before you are asked to pay.
                </p>
                <p className="text-carbon-600">
                  <strong className="font-semibold text-carbon-900">XP:</strong> experience points may be credited when your participation is confirmed after approval,{' '}
                  according to Fireball program rules.
                </p>
              </div>

              {selectedSession ? (
                <div className="rounded-lg border border-carbon-200 bg-carbon-50/80 px-4 py-3 text-sm text-carbon-800">
                  <span className="font-medium text-carbon-600">Requested session</span>
                  <p className="mt-1 font-semibold text-carbon-900">{selectedSession.label}</p>
                  {selectedSession.hint ? <p className="text-carbon-600">{selectedSession.hint}</p> : null}
                </div>
              ) : null}

              <div className="rounded-xl border border-carbon-200 bg-carbon-50/50 px-4 py-4 sm:px-5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-carbon-500">Indicative training fee</p>
                <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <p className="text-sm text-carbon-700">
                    Typical program fee (before taxes){' '}
                    <span className="font-medium tabular-nums text-carbon-900">{TRAINING_REGISTRATION_PRICE}</span>
                  </p>
                  <p className="text-xs font-medium text-carbon-600">
                    +{TRAINING_REGISTRATION_XP.toLocaleString()} XP when eligible
                  </p>
                </div>
                <p className="mt-3 text-[11px] leading-snug text-carbon-500">
                  This amount is for planning only. You are not invoiced from this screen. Final pricing and taxes will be confirmed if your request is approved.
                </p>
              </div>

              {requestSaveError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                  {requestSaveError}
                </p>
              ) : null}

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
                  disabled={!profile || requestSubmitting}
                  className="disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[#0485F7] disabled:hover:bg-[#0485F7]"
                  onClick={() => void handleSubmitRequest()}
                >
                  {requestSubmitting ? 'Sending…' : 'Submit my request'}
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
