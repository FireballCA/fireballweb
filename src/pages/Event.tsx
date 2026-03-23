import {
  useCallback,
  useContext,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Link } from 'react-router-dom'
import { LenisContext } from '@/components/LenisRoot'

function setLearnClipVars(el: HTMLAnchorElement, clientX: number, clientY: number) {
  const rect = el.getBoundingClientRect()
  const w = rect.width || 1
  const h = rect.height || 1
  const x = ((clientX - rect.left) / w) * 100
  const y = ((clientY - rect.top) / h) * 100
  el.style.setProperty('--clip-x', `${x}%`)
  el.style.setProperty('--clip-y', `${y}%`)
}

const learnLinkCssVars = {
  '--clip-x': '50%',
  '--clip-y': '50%',
} as CSSProperties

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

/** Same arrow as Contact “Send message” / “Sign in” links */
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

type CalendarEvent = {
  id: string
  day: string
  monthFull: string
  title: string
  description: string
  cityRegion: string
  imageSrc: string
  isPrivate: boolean
  ctaLabel: string
  ctaHref: string
}

const UPCOMING_EVENTS: CalendarEvent[] = [
  {
    id: 'driven-show-2026-05-16',
    day: '16',
    monthFull: 'MAY',
    title: 'The Driven Show',
    description:
      'Canada’s aftermarket performance showcase in Saint-Hyacinthe — builders, brands, vendors, and show cars in one day.',
    cityRegion: 'Saint-Hyacinthe, QC',
    imageSrc: '/Assets/Driven.webp',
    isPrivate: false,
    ctaLabel: 'See details',
    ctaHref: '/event/driven26',
  },
  {
    id: 'fireball-after-party-2026-05-16',
    day: '16',
    monthFull: 'MAY',
    title: 'Fireball After Party',
    description:
      'Private evening after the show — invitation only. Meet the team, connect with the community, and get details once your spot is confirmed.',
    cityRegion: 'Saint-Hyacinthe, QC',
    imageSrc: '/Assets/FireballAfterParty.png',
    isPrivate: true,
    ctaLabel: 'RSVP NOW',
    ctaHref: '/event/fireball-after-party',
  },
]

/** Slightly lighter overlay so photos read through; text stays readable */
const eventCardOverlayBaseClass = 'absolute inset-0 bg-black/42'
const eventCardOverlayGradientClass =
  'absolute inset-0 bg-gradient-to-r from-black/[0.88] via-black/[0.76] to-black/[0.64] md:from-black/[0.84] md:via-black/[0.72] md:to-black/[0.58]'

const eventCardCtaClass =
  'group pointer-events-auto inline-flex items-center gap-1.5 text-xs font-bold text-white transition-opacity duration-200 hover:opacity-90'

const eventMetaPillClass =
  'inline-flex items-center gap-2.5 rounded-md bg-white px-4 py-2.5 text-left text-sm font-medium text-carbon-900 shadow-sm'

export function Event() {
  const lenis = useContext(LenisContext)
  const [learnHover, setLearnHover] = useState(false)

  const onLearnPointerEnter = useCallback((e: ReactPointerEvent<HTMLAnchorElement>) => {
    setLearnClipVars(e.currentTarget, e.clientX, e.clientY)
    setLearnHover(true)
  }, [])

  const onLearnPointerMove = useCallback((e: ReactPointerEvent<HTMLAnchorElement>) => {
    setLearnClipVars(e.currentTarget, e.clientX, e.clientY)
  }, [])

  const onLearnPointerLeave = useCallback(() => {
    setLearnHover(false)
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
    <div className="bg-black text-white">
      <section
        className="relative -mt-20 flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden px-6"
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
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-0 pb-8 text-center md:pb-10">
            <p className="font-nav text-[11px] font-bold uppercase tracking-[0.35em] text-pearl/75 md:text-xs">
              UPCOMING EVENTS
            </p>
            <h1 className="mt-4 font-nav text-5xl font-bold leading-[1.02] tracking-tight text-pearl md:text-6xl lg:text-7xl xl:text-8xl">
              An Evening After the Show
            </h1>

            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:mt-10 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
              <a
                href="#request-invitation"
                className="inline-flex items-center justify-center rounded-lg bg-black px-6 py-3.5 text-center font-nav text-sm font-bold text-white transition-opacity hover:opacity-90 md:px-8"
              >
                Request your invitation
              </a>
              <a
                href="#learn-more"
                className="relative inline-flex items-center justify-center overflow-hidden rounded-lg border border-white/[0.12] bg-transparent px-6 py-3.5 text-center font-nav text-sm font-bold transition-[border-color,color] duration-500 ease-out hover:border-white/25 motion-reduce:transition-none md:px-8"
                style={learnLinkCssVars}
                onPointerEnter={onLearnPointerEnter}
                onPointerMove={onLearnPointerMove}
                onPointerLeave={onLearnPointerLeave}
              >
                <span
                  className="pointer-events-none absolute inset-0 z-0 bg-white transition-[clip-path] duration-[550ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:!transition-none"
                  style={{
                    clipPath: `circle(${learnHover ? 240 : 0}% at var(--clip-x, 50%) var(--clip-y, 50%))`,
                  }}
                  aria-hidden
                />
                <span
                  className={`relative z-10 transition-colors duration-500 motion-reduce:duration-200 ${
                    learnHover ? 'text-black' : 'text-pearl'
                  }`}
                >
                  Learn more
                </span>
              </a>
            </div>
          </div>

          <div className="relative z-10 flex shrink-0 justify-center pb-8 md:pb-10">
            <button
              type="button"
              onClick={scrollToUpcoming}
              className="group flex flex-col items-center gap-2 font-nav text-[11px] font-bold uppercase tracking-[0.28em] text-pearl/80 transition-colors hover:text-white"
            >
              <span>View upcoming events</span>
              <svg
                className="h-5 w-5 transition-transform duration-300 group-hover:translate-y-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
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
            {UPCOMING_EVENTS.map((ev, index) => (
              <article
                key={ev.id}
                className="relative overflow-hidden rounded-2xl md:rounded-3xl"
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
                  {ev.ctaHref.startsWith('/') ? (
                    <Link to={ev.ctaHref} className={eventCardCtaClass}>
                      {ev.ctaLabel}
                      <ContactLinkArrow className="h-[14px] w-[14px] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  ) : (
                    <a href={ev.ctaHref} className={eventCardCtaClass}>
                      {ev.ctaLabel}
                      <ContactLinkArrow className="h-[14px] w-[14px] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
