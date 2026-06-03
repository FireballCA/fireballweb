import { useCallback, useContext, useEffect, useId, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LenisContext } from '@/components/LenisRoot'
import { AppleButton, appleButtonVisualClassName } from '@/components/ui/AppleButton'
import { AppleSheet } from '@/components/ui/AppleSheet'
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

const TRAINING_BLOCKING_STATUSES = new Set<string>(['pending', 'approved', 'payment_pending', 'paid'])

type Step = 1 | 2

type JoinTrainingEventsModalProps = {
  open: boolean
  onClose: () => void
}

export function JoinTrainingEventsModal({ open, onClose }: JoinTrainingEventsModalProps) {
  const navigate = useNavigate()
  const lenis = useContext(LenisContext)
  const baseId = useId()
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

  useEffect(() => {
    if (!open) return
    lenis?.stop()
    return () => {
      lenis?.start()
    }
  }, [open, lenis])

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

  const greetingFirstName = profile
    ? profile.first_name?.trim() || profile.email?.split('@')[0]?.trim() || null
    : null

  const inputClass =
    'w-full rounded-[14px] border-0 bg-[#f2f2f7] px-3.5 py-3 text-[15px] leading-snug text-[#1d1d1f] placeholder:text-neutral-400 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] transition-shadow focus:outline-none focus:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06),0_0_0_3px_rgba(4,133,247,0.28)] sm:py-3.5'
  const labelClass = 'mb-1.5 block text-[13px] font-medium text-neutral-600'
  const sectionLabelClass = 'text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500'

  const formValid =
    !!selectedSessionId &&
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0 &&
    message.trim().length >= 10

  const sessionIdsWithActiveRequest = useMemo(() => {
    const ids = new Set<string>()
    for (const r of existingTrainingRequests) {
      if (r.session_id && TRAINING_BLOCKING_STATUSES.has(String(r.status))) ids.add(r.session_id)
    }
    return ids
  }, [existingTrainingRequests])

  useEffect(() => {
    if (selectedSessionId && sessionIdsWithActiveRequest.has(selectedSessionId)) {
      setSelectedSessionId('')
    }
  }, [selectedSessionId, sessionIdsWithActiveRequest])

  /** Une seule demande active par session (même `session_id`) — d’autres dates / sessions restent autorisées. */
  const hasBlockingRequestForSelectedSession =
    selectedSessionId !== '' &&
    existingTrainingRequests.some(
      (r) => TRAINING_BLOCKING_STATUSES.has(String(r.status)) && r.session_id === selectedSessionId,
    )
  const canGoToNextStep = formValid && !!profile && !hasBlockingRequestForSelectedSession

  const selectedSession = trainingSessions.find((o) => o.id === selectedSessionId)

  const handleSubmitRequest = async () => {
    if (!profile || !email.trim() || hasBlockingRequestForSelectedSession) return
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

  const sheetTitle = step === 1 ? 'Request a future training session' : 'Review your request'

  return (
    <AppleSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      title={sheetTitle}
      zIndex={100_050}
      avoidHeaderOffset
      avoidHeaderOffsetDesktopOnly
      desktopWidthClassName="max-w-[min(92vw,56rem)]"
    >
      <div className="px-3 pb-5 pt-0 font-sans sm:px-4 sm:pb-6">
        {greetingFirstName ? (
          <p className="mb-3 text-[12px] leading-snug text-neutral-500">
            <span className="text-neutral-400">Hi,</span>{' '}
            <span className="font-medium text-neutral-700">{greetingFirstName}</span>
          </p>
        ) : null}

        {step === 2 ? (
          <p className="mb-5 text-[13px] leading-relaxed text-neutral-500">
            No payment is taken here. The Fireball Canada team will review your request and notify you by email if it is approved or declined.
          </p>
        ) : null}

        {step === 1 ? (
          <>
            <p className="text-[15px] leading-relaxed text-neutral-600">
              {profile ? (
                <>
                  You are submitting a <strong className="font-semibold text-neutral-800">request</strong> to attend a future Fireball Academy training session — not a live checkout.{' '}
                  <strong className="font-semibold text-neutral-800">You are not charged today.</strong> Fireball Canada will review your request and{' '}
                  <strong className="font-semibold text-neutral-800">approve or decline</strong> it. Choose a session, complete the form, then use{' '}
                  <strong className="font-semibold text-neutral-800">Next steps</strong> to review and send your request.
                </>
              ) : (
                <>
                  Choose a session and sign in with <strong className="font-semibold text-neutral-800">Connection</strong>. This form submits a{' '}
                  <strong className="font-semibold text-neutral-800">request</strong> for a future training — there is no payment on this screen.{' '}
                  <strong className="font-semibold text-neutral-800">Next steps</strong> is available once you are signed in and the form is complete.
                </>
              )}
            </p>

            <fieldset className="fb-training-session-picker mt-7">
              <legend className={sectionLabelClass}>Training date</legend>
              {trainingSessions.length === 0 ? (
                <div className="mt-3 rounded-2xl bg-[#f2f2f7] px-4 py-8 text-center shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]">
                  <p className="text-[15px] font-semibold text-[#1d1d1f]">No training sessions scheduled yet</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
                    Upcoming dates will be announced soon. Check back later.
                  </p>
                </div>
              ) : (
              <div className="mt-3 space-y-1 rounded-2xl bg-[#f2f2f7] p-1.5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]">
                  {trainingSessions.map((opt) => {
                    const inputId = `${baseId}-session-${opt.id}`
                    const selected = selectedSessionId === opt.id
                    const sessionAlreadyRequested = sessionIdsWithActiveRequest.has(opt.id)
                    return (
                      <label
                        key={opt.id}
                        htmlFor={inputId}
                        className={cn(
                          'flex items-start gap-3 rounded-[13px] px-3.5 py-3.5 outline-none transition sm:py-4',
                          sessionAlreadyRequested
                            ? 'cursor-not-allowed opacity-50'
                            : 'cursor-pointer hover:bg-black/[0.03] active:bg-black/[0.05]',
                          selected && 'bg-[#0485F7]/10 shadow-[inset_0_0_0_1px_rgba(4,133,247,0.22)]',
                        )}
                      >
                        <input
                          id={inputId}
                          type="radio"
                          name={`${baseId}-training-session`}
                          value={opt.id}
                          checked={selectedSessionId === opt.id}
                          disabled={sessionAlreadyRequested}
                          onChange={() => setSelectedSessionId(opt.id)}
                          className="mt-1 h-4 w-4 shrink-0 cursor-pointer border-neutral-300 accent-[#0485F7] shadow-none outline-none ring-0 ring-offset-0 focus:outline-none focus:shadow-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed"
                        />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold tracking-tight text-[#1d1d1f]">{opt.label}</span>
                          {opt.hint ? <span className="mt-1 block text-[13px] leading-snug text-neutral-500">{opt.hint}</span> : null}
                          {sessionAlreadyRequested ? (
                            <span className="mt-1 block text-[11px] font-medium text-amber-800/90">Active request already on file for this session.</span>
                          ) : null}
                        </span>
                      </label>
                  )
                })}
              </div>
              )}
            </fieldset>

            {!profile ? (
              <div className="mt-8 rounded-2xl bg-[#f2f2f7] px-4 py-4 sm:px-5 sm:py-5">
                <p className="text-[13px] font-semibold text-[#1d1d1f]">Account</p>
                <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">
                  Sign in to your Fireball account (or create one). You will be returned to this form automatically.
                </p>
                <div className="mt-4">
                  <Link to={connectionHref} className={cn('inline-flex justify-center', appleButtonVisualClassName)}>
                    Connection
                  </Link>
                </div>
              </div>
            ) : null}

            <form
              className="mt-8 space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (canGoToNextStep) setStep(2)
              }}
            >
              <h3 className={sectionLabelClass}>Your details</h3>
              {hasBlockingRequestForSelectedSession ? (
                  <p className="rounded-[14px] bg-amber-50 px-3.5 py-3 text-[14px] text-amber-900 shadow-[inset_0_0_0_1px_rgba(217,119,6,0.25)]">
                    You already have an active request for this session. Choose another training date or wait until this request is completed or closed.
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
                  placeholder="Tell us about your experience level, goals… (10 chars min)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={cn(inputClass, 'min-h-[5.5rem] resize-y')}
                />
              </div>

              <div className="pt-2">
                <AppleButton
                  type="submit"
                  disabled={!canGoToNextStep}
                  className="min-h-[44px] w-full justify-center sm:min-h-0 sm:w-auto disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[#0485F7] disabled:hover:bg-[#0485F7]"
                >
                  Next steps
                </AppleButton>
                {!profile ? (
                  <p className="mt-2 text-xs text-neutral-500">Sign in using Connection above to enable Next steps.</p>
                ) : hasBlockingRequestForSelectedSession ? (
                    <p className="mt-2 text-xs text-neutral-500">You already have an active request for the selected session. Pick another date to continue.</p>
                  ) : !formValid ? (
                  <p className="mt-2 text-xs text-neutral-500">Complete all required fields (message: 10 chars min) to continue.</p>
                ) : null}
              </div>
            </form>
          </>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3 text-[15px] leading-relaxed text-neutral-700">
              <p>
                By submitting, you confirm that you understand this is a <strong className="font-semibold text-[#1d1d1f]">request only</strong>.{' '}
                Fireball Canada will email you at <strong className="font-semibold text-[#1d1d1f]">the address on file</strong> to let you know whether your request is{' '}
                <strong className="font-semibold text-[#1d1d1f]">approved or declined</strong>. Please check spam or junk folders.
              </p>
              <p>
                <strong className="font-semibold text-[#1d1d1f]">No payment today.</strong> If your request is approved, we will send instructions and any applicable{' '}
                <strong className="font-semibold text-[#1d1d1f]">training fee</strong>, taxes, and cancellation or refund terms in writing before you are asked to pay.
              </p>
              <p className="text-neutral-600">
                <strong className="font-semibold text-[#1d1d1f]">XP:</strong> experience points may be credited when your participation is confirmed after approval,{' '}
                according to Fireball program rules.
              </p>
            </div>

            {selectedSession ? (
              <div className="rounded-2xl bg-[#f2f2f7] px-4 py-4 text-[14px] text-neutral-800 sm:px-5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">Requested session</span>
                <p className="mt-2 font-semibold tracking-tight text-[#1d1d1f]">{selectedSession.label}</p>
                {selectedSession.hint ? <p className="mt-1 text-neutral-600">{selectedSession.hint}</p> : null}
              </div>
            ) : null}

            <div className="rounded-2xl bg-[#f2f2f7] px-4 py-4 sm:px-5">
              <p className={sectionLabelClass}>Indicative training fee</p>
              <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <p className="text-sm text-neutral-700">
                  Typical program fee (before taxes){' '}
                  <span className="font-medium tabular-nums text-[#1d1d1f]">{TRAINING_REGISTRATION_PRICE}</span>
                </p>
                <p className="text-xs font-medium text-neutral-600">
                  +{TRAINING_REGISTRATION_XP.toLocaleString()} XP when eligible
                </p>
              </div>
              <p className="mt-3 text-[11px] leading-snug text-neutral-500">
                This amount is for planning only. You are not invoiced from this screen. Final pricing and taxes will be confirmed if your request is approved.
              </p>
            </div>

            {requestSaveError ? (
              <p
                className="rounded-[14px] bg-red-50 px-3.5 py-3 text-[14px] text-red-800 shadow-[inset_0_0_0_1px_rgba(220,38,38,0.2)]"
                role="alert"
              >
                {requestSaveError}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-[#e8e8ed] px-6 text-[15px] font-semibold text-[#1d1d1f] transition hover:bg-[#dcdcde] active:scale-[0.98] sm:w-auto sm:min-h-0 sm:py-2.5"
              >
                Back
              </button>
              <AppleButton
                type="button"
                disabled={!profile || requestSubmitting}
                className="min-h-[44px] w-full justify-center sm:min-h-0 sm:w-auto disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[#0485F7] disabled:hover:bg-[#0485F7]"
                onClick={() => void handleSubmitRequest()}
              >
                {requestSubmitting ? 'Sending…' : 'Submit my request'}
              </AppleButton>
            </div>
          </div>
        )}
      </div>
    </AppleSheet>
  )
}
