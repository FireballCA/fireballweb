import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { IconCertificate, IconSchool, IconChartBar, IconLock } from '@tabler/icons-react'
import { LenisContext } from '@/components/LenisRoot'
import { JoinTrainingEventsModal } from '@/components/JoinTrainingEventsModal'
import { AppleButton, appleButtonVisualClassName } from '@/components/ui/AppleButton'
import { SecondaryClipButton } from '@/components/ui/SecondaryClipButton'
import { cn } from '@/lib/utils'
import { usePageTitle } from '@/hooks/usePageTitle'
import { supabase } from '@/lib/supabase'
import {
  DEFAULT_TRAINING_SESSION_OPTIONS,
  resolveTrainingSessionOptions,
  type TrainingSessionOption,
} from '@/constants/trainingSessions'

/** Affichage court type « May 15-16 » à partir du libellé admin (ex. « May 15-16, 2026 »). */
function compactTrainingDateLabel(label: string): string {
  const t = label.trim()
  if (!t) return ''
  return t.replace(/,\s*\d{4}\s*$/, '').trim()
}

/** Même principe que les icônes rondes du leaderboard / trophy (AccountDashboard). */
const academyFeatureIconCircleClass =
  'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-carbon-900'

/** Même hiérarchie typographique que les titres de section sur la landing (Home). */
const landingSectionTitle = 'font-sans text-3xl font-bold tracking-tight md:text-5xl'

export function Academy() {
  const lenis = useContext(LenisContext)
  const reduceMotion = useReducedMotion()
  const [searchParams, setSearchParams] = useSearchParams()
  const trainingModalOpen = searchParams.get('joinTraining') === '1'
  const openTrainingModal = () => setSearchParams({ joinTraining: '1' }, { replace: true })
  const closeTrainingModal = () => setSearchParams({}, { replace: true })

  const heroSentinelRef = useRef<HTMLDivElement | null>(null)
  const [compactNavVisible, setCompactNavVisible] = useState(false)
  const [trainingSessions, setTrainingSessions] = useState<TrainingSessionOption[]>(
    DEFAULT_TRAINING_SESSION_OPTIONS,
  )

  usePageTitle('Academy - Fireball Canada')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'training_sessions')
        .maybeSingle()
      if (!cancelled) setTrainingSessions(resolveTrainingSessionOptions(data?.value))
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const el = heroSentinelRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return

    const obs = new IntersectionObserver(
      ([entry]) => {
        setCompactNavVisible(!entry.isIntersecting)
      },
      { threshold: 0, rootMargin: '0px 0px 0px 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const nextTrainingLabel = compactTrainingDateLabel(trainingSessions[0]?.label ?? '')
  const compactNavTransition = reduceMotion
    ? { duration: 0.01 }
    : {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1] as const,
      }

  const scrollToWhatYouLearn = useCallback(() => {
    const el = document.getElementById('what-you-learn')
    if (!el) return
    if (lenis) {
      lenis.scrollTo(el, { offset: -96, duration: 1.15 })
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [lenis])

  const roadmapRef = useRef<HTMLDivElement>(null)
  const roadmapFillRef = useRef<HTMLDivElement>(null)

  const nextTrainingDisplay =
    nextTrainingLabel.length > 0 ? nextTrainingLabel : trainingSessions[0]?.label?.trim() || '—'
  const nextTrainingLocation = trainingSessions[0]?.hint?.trim() || ''
  const upcomingTrainingSessions = trainingSessions.slice(0, 3)
  const featuredTrainingSession = upcomingTrainingSessions[0] ?? null
  const secondaryTrainingSessions = upcomingTrainingSessions.slice(1)

  useEffect(() => {
    const reveals = document.querySelectorAll<HTMLElement>('.academy-reveal')
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('academy-visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    )
    reveals.forEach((el) => revealObs.observe(el))

    const roadmap = roadmapRef.current
    const fill = roadmapFillRef.current
    if (!roadmap || !fill) {
      return () => {
        revealObs.disconnect()
      }
    }

    const dots = Array.from(roadmap.querySelectorAll<HTMLElement>('.rm-dot'))
    const cards = Array.from(roadmap.querySelectorAll<HTMLElement>('.rm-content'))

    const update = () => {
      const winH = window.innerHeight
      const rect = roadmap.getBoundingClientRect()
      const total = roadmap.offsetHeight
      const threshold = winH * 0.6

      const scrolled = Math.max(0, Math.min(1, (threshold - rect.top) / total))
      fill.style.height = `${scrolled * 100}%`

      dots.forEach((dot, i) => {
        const dotRect = dot.getBoundingClientRect()
        const dotCenter = dotRect.top + dotRect.height / 2
        if (dotCenter < threshold) {
          dot.classList.add('active')
          if (cards[i]) cards[i].classList.add('visible')
        }
      })
    }

    window.addEventListener('scroll', update, { passive: true })
    update()

    return () => {
      revealObs.disconnect()
      window.removeEventListener('scroll', update)
    }
  }, [])

  return (
    <main className="bg-carbon-950 text-pearl min-h-screen">
      <AnimatePresence>
        {compactNavVisible && (
          <motion.header
            key="academy-compact-training-bar"
            role="banner"
            aria-label="Next training"
            initial={reduceMotion ? false : { y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? undefined : { y: -80, opacity: 0 }}
            transition={compactNavTransition}
            className="fixed left-0 right-0 top-0 z-[125] border-b border-neutral-200/90 bg-white/95 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-md supports-[backdrop-filter]:bg-white/85"
          >
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 md:px-6 md:py-4">
              <div className="min-w-0 flex-1 pr-2 font-nav text-[13px] font-bold tracking-tight text-carbon-900 md:text-[15px]">
                <div className="truncate">
                  <span className="font-semibold text-carbon-700">Next Training :</span>{' '}
                  <span className="text-carbon-900 text-[14px] md:text-[16px]">
                    {nextTrainingDisplay}
                  </span>
                </div>
                {nextTrainingLocation && (
                  <div className="mt-0.5 text-[11px] md:text-[12px] font-medium text-carbon-600 truncate">
                    {nextTrainingLocation}
                  </div>
                )}
              </div>
              <div className="shrink-0">
                <AppleButton
                  type="button"
                  className="whitespace-nowrap px-3 py-1.5 text-[10px] font-nav md:text-xs"
                  onClick={openTrainingModal}
                >
                  Secure your spot
                </AppleButton>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <section
        className="relative -mt-20 flex h-[92dvh] min-h-[92dvh] flex-col overflow-hidden px-6"
        aria-label="Hero"
      >
        <video
          className="absolute inset-0 z-0 h-full w-full object-cover object-center [transform:translateZ(0)] will-change-transform"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="/Academy Background.mp4" type="video/mp4" />
        </video>
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/70"
          aria-hidden
        />

        <div className="relative z-10 flex h-full min-h-0 flex-1 flex-col pt-20">
          <div
            ref={heroSentinelRef}
            className="flex min-h-0 flex-1 flex-col items-center justify-center px-0 pb-8 text-center md:pb-10 max-w-7xl mx-auto w-full"
          >
            <h1 className="academy-reveal font-nav text-4xl font-black leading-[1.02] tracking-tight text-pearl md:text-5xl lg:text-6xl xl:text-7xl mb-8 md:mb-10">
              Build your expertise.
            </h1>

            <p
              className="academy-reveal max-w-2xl mx-auto text-base md:text-lg leading-relaxed text-silver/70 mb-10"
              style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}
            >
              <strong className="font-normal text-pearl">
                Effective training is the foundation of a profitable business.
              </strong>{' '}
              Master professional ceramic coating installation, grow your client base, and join an exclusive network of certified Fireball installers across Canada.
            </p>

            <div className="academy-reveal flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <SecondaryClipButton type="button" onClick={openTrainingModal}>
                Join next training
              </SecondaryClipButton>
              <button
                type="button"
                onClick={scrollToWhatYouLearn}
                className={cn('inline-flex whitespace-nowrap', appleButtonVisualClassName)}
              >
                Training details
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white text-carbon-900 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <h2 className={cn('academy-reveal text-carbon-900 text-left mb-10 md:mb-16', landingSectionTitle)}>
            Everything you need step on your buisness.
          </h2>
          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            {[
              {
                Icon: IconSchool,
                stat: '100%',
                statLabel: 'hands-on focus',
                title: 'Real-world installation training',
                body:
                  'Work in a true training environment with professional tools and products — the same techniques Fireball-certified installers use every day across Canada.',
              },
              {
                Icon: IconCertificate,
                stat: '2×',
                statLabel: 'stronger positioning',
                title: 'Certification that opens doors',
                body:
                  'Earn recognized Fireball certification and market yourself with confidence: credibility with clients, partners, and your local detailing network.',
              },
            ].map((item, idx) => {
              const FeatureIcon = item.Icon
              return (
              <div
                key={idx}
                className="academy-reveal rounded-2xl border border-carbon-900/10 bg-pearl p-6 shadow-sm md:p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className={academyFeatureIconCircleClass} aria-hidden>
                    <FeatureIcon className="h-6 w-6" stroke={1.75} />
                  </span>
                  <div className="min-w-0 text-right">
                    <p
                      className="font-nav text-3xl font-black tabular-nums tracking-tight text-carbon-900 md:text-4xl"
                      style={{ fontFamily: "'Roboto', sans-serif" }}
                    >
                      {item.stat}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-carbon-500">
                      {item.statLabel}
                    </p>
                  </div>
                </div>
                <h3
                  className="mt-6 text-left text-xl font-bold text-carbon-900 md:text-[1.35rem]"
                  style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 700 }}
                >
                  {item.title}
                </h3>
                <p
                  className="mt-3 text-left text-base leading-relaxed text-carbon-600"
                  style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}
                >
                  {item.body}
                </p>
              </div>
              )
            })}
          </div>

          <div className="mt-6 grid gap-6 md:mt-8 md:grid-cols-2 md:gap-8">
            {[
              {
                Icon: IconLock,
                stat: '1:1',
                statLabel: 'exclusive access',
                title: 'Unlock exclusive Fireball products',
                body:
                  'Gain access to pro-only coatings and accessories reserved for trained installers, so your shop can offer protection clients cannot get anywhere else.',
              },
              {
                Icon: IconChartBar,
                stat: 'ROI',
                statLabel: 'faster growth',
                title: 'Built for business outcomes',
                body:
                  'Learn how to price, package, and communicate your service so training translates directly into sales and retention.',
              },
            ].map((item, idx) => {
              const FeatureIcon = item.Icon
              return (
                <div
                  key={idx}
                  className="academy-reveal rounded-2xl border border-carbon-900/10 bg-pearl p-6 shadow-sm md:p-7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className={academyFeatureIconCircleClass} aria-hidden>
                      <FeatureIcon className="h-6 w-6" stroke={1.75} />
                    </span>
                    <div className="min-w-0 text-right">
                      <p
                        className="font-nav text-3xl font-black tabular-nums tracking-tight text-carbon-900 md:text-4xl"
                        style={{ fontFamily: "'Roboto', sans-serif" }}
                      >
                        {item.stat}
                      </p>
                      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-carbon-500">
                        {item.statLabel}
                      </p>
                    </div>
                  </div>
                  <h3
                    className="mt-6 text-left text-xl font-bold text-carbon-900 md:text-[1.35rem]"
                    style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 700 }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="mt-3 text-left text-base leading-relaxed text-carbon-600"
                    style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}
                  >
                    {item.body}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="what-you-learn" className="roadmap-section">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <h2 className={cn('academy-reveal text-carbon-900 text-center mb-10 md:mb-16 mt-16 md:mt-24', landingSectionTitle)}>
            What you will learn
          </h2>
        </div>
        <div className="roadmap-wrap" ref={roadmapRef}>
          <div className="roadmap-spine"></div>
          <div className="roadmap-fill" ref={roadmapFillRef}></div>

          <div className="roadmap-item">
            <div className="rm-content">
              <div className="rm-card">
                <span className="rm-num">01</span>
                <div className="rm-title">Ceramic Coating Application</div>
                <p className="rm-body">Professional coating installation techniques.</p>
                <span className="rm-tag highlight">Day 1 — Morning</span>
              </div>
            </div>
            <div className="rm-node">
              <div className="rm-dot"></div>
            </div>
            <div className="rm-empty"></div>
          </div>

          <div className="roadmap-item">
            <div className="rm-empty"></div>
            <div className="rm-node">
              <div className="rm-dot"></div>
            </div>
            <div className="rm-content">
              <div className="rm-card">
                <span className="rm-num">02</span>
                <div className="rm-title">Surface Preparation</div>
                <p className="rm-body">Proper paint correction and preparation methods.</p>
                <span className="rm-tag">Day 1 — Afternoon</span>
              </div>
            </div>
          </div>

          <div className="roadmap-item">
            <div className="rm-content">
              <div className="rm-card">
                <span className="rm-num">03</span>
                <div className="rm-title">Product Knowledge</div>
                <p className="rm-body">Understanding Fireball's coating technologies.</p>
                <span className="rm-tag highlight">Day 2 — Morning</span>
              </div>
            </div>
            <div className="rm-node">
              <div className="rm-dot"></div>
            </div>
            <div className="rm-empty"></div>
          </div>

          <div className="roadmap-item">
            <div className="rm-empty"></div>
            <div className="rm-node">
              <div className="rm-dot"></div>
            </div>
            <div className="rm-content">
              <div className="rm-card">
                <span className="rm-num">04</span>
                <div className="rm-title">Business Strategies</div>
                <p className="rm-body">How to position and sell professional protection services.</p>
                <span className="rm-tag highlight">Certification Day</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-black text-pearl py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="academy-reveal">
              <h2 className={cn('text-pearl mb-6', landingSectionTitle)}>
                Become Fireball Certified
              </h2>
              <p className="text-lg leading-relaxed text-silver/70" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}>
                After completing the training, participants may qualify to become certified Fireball installers and gain access to professional products and support.
              </p>
            </div>
            <div className="academy-reveal text-center">
              <div className="w-48 h-48 mx-auto rounded-full border border-white/20 bg-white/[0.06] flex items-center justify-center text-[#0485F7] text-6xl font-bold shadow-[0_0_40px_rgba(4,133,247,0.25)]">
                ✓
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="max-w-3xl text-left">
            <h2 className={cn('text-carbon-900', landingSectionTitle)}>Our next trainings</h2>
            <p className="mt-4 text-base leading-relaxed text-carbon-600 md:text-lg">
              The next available session takes the spotlight first, while upcoming dates stay easy to browse
              underneath in a cleaner event-list format.
            </p>
          </div>

          {featuredTrainingSession && (() => {
            const shortDate = compactTrainingDateLabel(featuredTrainingSession.label) || featuredTrainingSession.label
            const sessionLocation = featuredTrainingSession.hint?.split(' - ')[0]?.trim() || 'Location coming soon'
            const sessionMeta =
              featuredTrainingSession.hint?.split(' - ').slice(1).join(' - ').trim() || 'Hands-on + certification'

            return (
              <div className="academy-reveal mt-8 overflow-hidden rounded-[2.2rem] border border-carbon-900/10 bg-carbon-950 shadow-[0_22px_60px_rgba(0,0,0,0.18)]">
                <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
                  <div className="relative min-h-[280px] overflow-hidden lg:min-h-[420px]">
                    <img
                      src="/Assets/FireballAfterParty.png"
                      alt={shortDate}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent lg:bg-gradient-to-t lg:from-black/55 lg:via-black/20 lg:to-transparent" aria-hidden />
                    <div className="absolute left-5 top-5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85 backdrop-blur-md">
                      Next available session
                    </div>
                  </div>

                  <div className="flex flex-col justify-between px-5 py-6 text-left sm:px-7 sm:py-8 lg:px-10 lg:py-10">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                        Fireball Academy
                      </p>
                      <h3 className="mt-3 font-nav text-3xl font-bold tracking-tight text-white md:text-5xl">
                        {shortDate}
                      </h3>
                      <p className="mt-3 text-lg font-semibold text-white/88">{sessionLocation}</p>
                      <p className="mt-2 text-sm text-white/55 md:text-base">{sessionMeta}</p>
                      <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/72 md:text-base">
                        This is the main session to highlight first: clear date, location, and a stronger premium
                        presentation so the next training feels like the primary action on the page.
                      </p>
                    </div>

                    <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-white/50">Limited seats. Registration handled through the academy flow.</div>
                      <button
                        type="button"
                        onClick={openTrainingModal}
                        className={cn('inline-flex whitespace-nowrap', appleButtonVisualClassName)}
                      >
                        Secure your spot
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {secondaryTrainingSessions.length > 0 && (
            <div className="mt-5 space-y-3">
              {secondaryTrainingSessions.map((session, idx) => {
                const shortDate = compactTrainingDateLabel(session.label) || session.label
                const sessionLocation = session.hint?.split(' - ')[0]?.trim() || 'Location coming soon'
                const sessionMeta = session.hint?.split(' - ').slice(1).join(' - ').trim() || 'Hands-on + certification'

                return (
                  <div
                    key={session.id}
                    className="academy-reveal rounded-[1.75rem] border border-carbon-900/10 bg-[#f7f7f7] p-4 shadow-[0_10px_35px_rgba(0,0,0,0.05)]"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-carbon-500">
                          Upcoming training {String(idx + 2).padStart(2, '0')}
                        </p>
                        <h4 className="mt-1 font-nav text-xl font-bold tracking-tight text-carbon-900 md:text-2xl">
                          {shortDate}
                        </h4>
                        <div className="mt-2 flex flex-col gap-1 text-sm text-carbon-600 md:flex-row md:items-center md:gap-3">
                          <span className="font-medium text-carbon-900">{sessionLocation}</span>
                          <span className="text-carbon-400 max-md:hidden">/</span>
                          <span>{sessionMeta}</span>
                        </div>
                      </div>

                      <div className="flex items-center sm:justify-end">
                        <button
                          type="button"
                          onClick={openTrainingModal}
                          className={cn('inline-flex whitespace-nowrap', appleButtonVisualClassName)}
                        >
                          View details
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <JoinTrainingEventsModal open={trainingModalOpen} onClose={closeTrainingModal} />
    </main>
  )
}
