import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { IconChevronDown } from '@tabler/icons-react'
import { LenisContext } from '@/components/LenisRoot'
import { AppleButton } from '@/components/ui/AppleButton'
import { supabase } from '@/lib/supabase'
import {
  DEFAULT_SITE_EVENT_CONFIGS,
  isInternalEventDetailHref,
  isSiteEventPast,
  resolveSiteEventConfigs,
  type SiteEventConfig,
} from '@/constants/siteEventConfigs'
import { usePageTitle } from '@/hooks/usePageTitle'
import { SEO, breadcrumbJsonLd } from '@/components/SEO'

function GpsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 21s-7-4.35-7-11a7 7 0 1 1 14 0c0 6.65-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

function ContactLinkArrow({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 640"
      className={className}
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L406.6 137.3C394.1 124.8 373.8 124.8 361.3 137.3C348.8 149.8 348.8 170.1 361.3 182.6L466.7 288L96 288C78.3 288 64 302.3 64 320C64 337.7 78.3 352 96 352L466.7 352L361.3 457.4C348.8 469.9 348.8 490.2 361.3 502.7C373.8 515.2 394.1 515.2 406.6 502.7L566.6 342.7z"
      />
    </svg>
  )
}

const eventCardOverlayBaseClass = 'absolute inset-0 bg-black/42'
const eventCardOverlayGradientClass =
  'absolute inset-0 bg-gradient-to-r from-black/[0.88] via-black/[0.76] to-black/[0.64] md:from-black/[0.84] md:via-black/[0.72] md:to-black/[0.58]'

const eventCardCtaClass =
  'group pointer-events-auto inline-flex items-center gap-1.5 text-xs font-bold uppercase text-white transition-opacity duration-200 hover:opacity-90'

const eventMetaPillClass =
  'inline-flex items-center gap-2.5 rounded-md bg-white px-4 py-2.5 text-left text-sm font-medium text-carbon-900 shadow-sm'

const eventCardCtaDisabledClass =
  'inline-flex items-center gap-1.5 text-xs font-bold uppercase text-white/45 cursor-not-allowed select-none'

function EventCard({ ev, index }: { ev: SiteEventConfig; index: number }) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const eventEnded = isSiteEventPast(ev)
  const ctaBlocked = eventEnded && isInternalEventDetailHref(ev.ctaHref)

  return (
    <motion.article
      ref={ref}
      key={ev.id}
      className="relative overflow-hidden rounded-2xl md:rounded-3xl"
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.08 }}
    >
      <img
        src={ev.imageSrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        loading={index === 0 ? 'eager' : 'lazy'}
        decoding="async"
      />
      <div className={eventCardOverlayBaseClass} aria-hidden />
      <div className={eventCardOverlayGradientClass} aria-hidden />
      <div className="relative z-10 grid grid-cols-1 gap-8 px-5 py-8 pb-16 md:grid-cols-[minmax(0,7.5rem)_1fr] md:gap-12 md:px-10 md:py-10 md:pb-10 lg:grid-cols-[minmax(0,9rem)_1fr] lg:gap-14">
        <div className="flex flex-col items-center justify-center text-center md:items-center md:justify-start md:pt-1">
          <span className="font-nav text-6xl font-bold tabular-nums leading-[0.95] text-white md:text-7xl lg:text-8xl">
            {ev.day}
          </span>
          <span className="mt-3 font-nav text-2xl font-bold uppercase tracking-[0.16em] text-white md:mt-4 md:text-3xl lg:text-4xl">
            {ev.monthFull}
          </span>
        </div>

        <div className="min-w-0">
          <div className={eventMetaPillClass}>
            <span className="font-nav text-xs font-bold uppercase tracking-[0.18em]">
              {ev.isPrivate ? 'PRIVATE' : 'PUBLIC'}
            </span>
          </div>
          <h3 className="mt-4 font-nav text-xl font-bold tracking-tight text-pearl md:text-2xl lg:text-3xl">
            {ev.title}
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-pearl/85 md:text-base">
            {ev.description}
          </p>

          <div className={`mt-6 max-w-full ${eventMetaPillClass}`}>
            <GpsIcon className="shrink-0 text-carbon-600" />
            <span>{ev.cityRegion}</span>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-end p-5 md:p-8 md:pt-0">
        {ctaBlocked ? (
          <span className={eventCardCtaDisabledClass} aria-disabled="true">
            Event ended
          </span>
        ) : ev.ctaHref.startsWith('/') ? (
          <Link to={ev.ctaHref} className={eventCardCtaClass}>
            {ev.ctaLabel}
            <ContactLinkArrow className="h-[14px] w-[14px] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <a
            href={ev.ctaHref}
            className={eventCardCtaClass}
            target="_blank"
            rel="noopener noreferrer"
          >
            {ev.ctaLabel}
            <ContactLinkArrow className="h-[14px] w-[14px] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
          </a>
        )}
      </div>
    </motion.article>
  )
}

const EVENT_FAQS = [
  {
    q: 'Are Fireball events open to everyone?',
    a: 'Most Fireball events are open to the public. Private events are reserved for Car Club members or specific invite lists. The event listing clearly marks each event as PUBLIC or PRIVATE so you always know before you try to register.',
  },
  {
    q: 'How do I register for an upcoming event?',
    a: "Registration links are available directly on each event card. For public events, simply click the CTA to secure your spot. For Car Club member events, you'll need an active Ignition or Apex membership to access the registration page.",
  },
  {
    q: 'Can I bring my daily driver?',
    a: 'Absolutely. Fireball events celebrate all types of cars — from daily drivers to track builds and exotics. The more variety, the better the atmosphere.',
  },
  {
    q: 'What can I expect at a Fireball event?',
    a: 'Every Fireball event is built around community and car culture. Expect product showcases, live coating demonstrations, a curated car display, and the chance to meet certified Fireball installers and brand representatives.',
  },
  {
    q: 'Will new events be added throughout the year?',
    a: 'Yes. The events lineup is updated regularly as new dates are confirmed. We recommend joining the Car Club or checking this page frequently to stay ahead of announcements.',
  },
]

function EventFAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/10">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="pr-6 text-sm font-semibold text-white md:text-base">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className="shrink-0">
          <IconChevronDown size={16} className="text-white/40" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-white/60">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Event() {
  const lenis = useContext(LenisContext)
  const [events, setEvents] = useState<SiteEventConfig[]>(DEFAULT_SITE_EVENT_CONFIGS)

  usePageTitle('Events - Fireball Canada')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'events')
        .maybeSingle()
      setEvents(resolveSiteEventConfigs(data?.value))
    }
    void load()
  }, [])

  const scrollToUpcoming = useCallback(() => {
    const el = document.getElementById('upcoming-events')
    if (!el) return
    if (lenis) {
      lenis.scrollTo(el, { offset: -96, duration: 1.15 })
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [lenis])

  return (
    <>
      <SEO
        title="Fireball Events — Detailing Meets, Workshops & Car Shows in Canada"
        description="Discover upcoming Fireball events across Canada — detailing meets, ceramic coating workshops, training days and exclusive car community gatherings."
        canonicalPath="/event"
        keywords="Fireball events, detailing events Canada, ceramic coating workshop, car shows Canada, automotive events"
        jsonLd={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Events', path: '/event' }])}
      />
      <div className="bg-black text-white">
      <section
        className="relative flex h-[var(--app-hero-h)] min-h-[var(--app-hero-h)] flex-col overflow-hidden px-6"
        aria-label="Hero"
      >
        <video
          className="absolute inset-0 z-0 h-full w-full object-cover object-center [transform:translateZ(0)] will-change-transform"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
        >
          <source src="/Assets/videoplayback.mp4" type="video/mp4" />
        </video>
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/70"
          aria-hidden
        />

        <div className="relative z-10 flex h-full min-h-0 flex-1 flex-col pt-20">
          <motion.div
            className="flex min-h-0 flex-1 flex-col items-center justify-center px-0 pb-8 text-center md:pb-10"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.18, delayChildren: 0.3 } },
            }}
          >
            <motion.p
              className="font-nav text-[11px] font-bold uppercase tracking-[0.35em] text-pearl/75 md:text-xs"
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
              }}
            >
              2026
            </motion.p>
            <motion.h1
              className="mt-4 font-nav text-4xl font-black leading-[1.02] tracking-tight text-pearl md:text-5xl lg:text-6xl xl:text-7xl"
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
              }}
            >
              Events lineup
            </motion.h1>

            <motion.div
              className="mt-10 flex justify-center sm:mt-10"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
              }}
            >
              <AppleButton type="button" onClick={scrollToUpcoming}>
                See future events
              </AppleButton>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section
        id="upcoming-events"
        className="scroll-mt-24 border-t border-white/10 bg-black px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
        aria-labelledby="upcoming-events-heading"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-4 sm:gap-6">
            <h2
              id="upcoming-events-heading"
              className="shrink-0 font-nav text-sm font-bold uppercase tracking-[0.2em] text-pearl md:text-base"
            >
              MAY 2026
            </h2>
            <div className="h-px min-w-0 flex-1 bg-white/20" aria-hidden />
          </div>

          <div className="mt-12 space-y-8 md:mt-14 md:space-y-10">
            {events.map((ev, index) => (
              <EventCard key={ev.id} ev={ev} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0a0a0a] py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-[280px_1fr]">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                Common questions
              </h2>
              <p className="mt-2 text-sm text-white/50">
                Everything you need before attending.
              </p>
            </div>
            <div className="border-t border-white/10">
              {EVENT_FAQS.map((f, i) => (
                <EventFAQItem key={i} q={f.q} a={f.a} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  )
}
