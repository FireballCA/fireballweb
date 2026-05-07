import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { ReserveYourSpot } from '@/components/events/ReserveYourSpot'
import { WhatToExpect } from '@/components/events/WhatToExpect'
import { supabase } from '@/lib/supabase'
import { resolveSiteEventConfigs, type EventAccessMode, type WhatToExpectRow } from '@/constants/siteEventConfigs'
import { usePageTitle } from '@/hooks/usePageTitle'

/** Scales down font size so the title stays on one line within its container */
function HeroSingleLineTitle({ text, className }: { text: string; className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    const el = titleRef.current
    if (!wrap || !el) return

    const fit = () => {
      const maxW = wrap.clientWidth
      if (maxW < 8) return
      let low = 10
      let high = 160
      el.style.whiteSpace = 'nowrap'
      while (low < high - 1) {
        const mid = Math.floor((low + high) / 2)
        el.style.fontSize = `${mid}px`
        if (el.scrollWidth <= maxW) low = mid
        else high = mid
      }
      el.style.fontSize = `${low}px`
    }

    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [text])

  return (
    <div ref={wrapRef} className="mx-auto w-full max-w-5xl px-4 sm:px-6">
      <h1 ref={titleRef} className={className}>
        {text}
      </h1>
    </div>
  )
}

function EventCountdown({ targetIso }: { targetIso: string }) {
  const target = useMemo(() => new Date(targetIso).getTime(), [targetIso])
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const diff = Math.max(0, target - Date.now())
  const s = Math.floor(diff / 1000)
  const days = Math.floor(s / 86400)
  const hours = Math.floor((s % 86400) / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60

  const pad = (n: number) => n.toString().padStart(2, '0')
  const ended = diff <= 0

  const units = [
    { label: 'Days', display: String(days) },
    { label: 'Hours', display: pad(hours) },
    { label: 'Minutes', display: pad(minutes) },
    { label: 'Seconds', display: pad(seconds) },
  ]

  return (
    <div className="flex w-full items-stretch justify-center">
      {ended ? (
        <p className="py-4 text-center font-nav text-xl font-bold text-white sm:text-2xl">
          We're live — see you there.
        </p>
      ) : (
        units.map((u, i) => (
          <Fragment key={u.label}>
            {i > 0 ? (
              <div
                className="my-4 w-px shrink-0 self-stretch bg-white/[0.07] sm:my-6"
                aria-hidden
              />
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-2 py-10 sm:px-4 sm:py-14 md:px-8">
              <p className="font-nav text-4xl font-bold tabular-nums text-white sm:text-5xl md:text-6xl lg:text-7xl">
                {u.display}
              </p>
              <p className="mt-3 font-nav text-[10px] font-bold uppercase tracking-[0.22em] text-white/35 sm:text-[11px]">
                {u.label}
              </p>
            </div>
          </Fragment>
        ))
      )}
    </div>
  )
}

// ─── Add to Calendar ──────────────────────────────────────────────────────────

function useCalendarUrls(title: string, location: string, startIso: string, endIso: string) {
  return useMemo(() => {
    const start = new Date(startIso)
    const end = new Date(endIso)

    const pad = (n: number) => String(n).padStart(2, '0')
    const toGCal = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
    const toICS = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`

    const google = `https://calendar.google.com/calendar/render?${new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      details: `${title} — Fireball event`,
      location,
      dates: `${toGCal(start)}/${toGCal(end)}`,
    }).toString()}`

    const outlook = `https://outlook.live.com/calendar/0/deeplink/compose?${new URLSearchParams({
      subject: title,
      startdt: start.toISOString(),
      enddt: end.toISOString(),
      location,
      body: `${title} — Fireball event`,
    }).toString()}`

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Fireball//Events//EN',
      'BEGIN:VEVENT',
      `UID:${toICS(start)}-fireball@fireball`,
      `DTSTAMP:${toICS(new Date())}`,
      `DTSTART:${toICS(start)}`,
      `DTEND:${toICS(end)}`,
      `SUMMARY:${title}`,
      `LOCATION:${location}`,
      `DESCRIPTION:${title} — Fireball event`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const apple = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`

    return { google, outlook, apple }
  }, [title, location, startIso, endIso])
}

const CAL_PROVIDERS = [
  {
    key: 'google',
    label: 'Google',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
  },
  {
    key: 'apple',
    label: 'Apple',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-white" aria-hidden>
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
  },
  {
    key: 'outlook',
    label: 'Outlook',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
        <path fill="#0078D4" d="M7 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/>
        <path fill="#fff" d="M5 9l7 4.5L19 9"/>
      </svg>
    ),
  },
] as const

function AddToCalendar({
  title,
  location,
  startIso,
  endIso,
}: {
  title: string
  location: string
  startIso: string
  endIso: string
}) {
  const { google, outlook, apple } = useCalendarUrls(title, location, startIso, endIso)
  const urls: Record<string, string> = { google, apple, outlook }

  return (
    <div className="flex flex-col items-center gap-3 border-t border-white/[0.07] pb-8 pt-6 sm:pb-10">
      <p className="font-nav text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">
        Add to calendar
      </p>
      <div className="flex items-center gap-2">
        {CAL_PROVIDERS.map(({ key, label, icon }) => (
          <a
            key={key}
            href={urls[key]}
            target={key !== 'apple' ? '_blank' : undefined}
            rel="noopener noreferrer"
            download={key === 'apple' ? `${title.replace(/\s+/g, '-')}.ics` : undefined}
            className="flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.05] px-4 py-2 text-[12px] font-medium text-white/60 transition-all hover:border-white/25 hover:bg-white/[0.1] hover:text-white/90"
          >
            {icon}
            {label}
          </a>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function EventDetail() {
  const { eventSlug } = useParams<{ eventSlug: string }>()
  const [resolved, setResolved] = useState<{
    navTitle: string
    heroTitle: string
    description: string
    imageSrc: string
    dateLine: string
    locationLine: string
    startAt: string
    endAt: string
    accessMode: EventAccessMode
    allowedRoles: string[] | undefined
    whatToExpect: WhatToExpectRow[] | undefined
  } | null>(null)
  const [loaded, setLoaded] = useState(false)

  usePageTitle(
    resolved?.heroTitle
      ? `${resolved.heroTitle} - Fireball Events`
      : 'Event - Fireball Events',
  )

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'events')
        .maybeSingle()
      const events = resolveSiteEventConfigs(data?.value)
      const ev = events.find((item) => item.slug === eventSlug)
      setResolved(
        ev
          ? {
              navTitle: ev.navTitle || ev.title,
              heroTitle: ev.heroTitle || ev.title,
              description: ev.description,
              imageSrc: ev.imageSrc,
              dateLine: ev.dateLine || '',
              locationLine: ev.locationLine || ev.cityRegion,
              startAt: ev.startAt || new Date().toISOString(),
              endAt: ev.endAt || new Date(new Date(ev.startAt || Date.now()).getTime() + 4 * 60 * 60 * 1000).toISOString(),
              accessMode: ev.accessMode || (ev.isPrivate ? 'private' : 'public'),
              allowedRoles: ev.allowedRoles,
              whatToExpect: ev.whatToExpect,
            }
          : null,
      )
      setLoaded(true)
    }
    void load()
  }, [eventSlug])

  if (!loaded) return null
  if (!resolved) {
    return <Navigate to="/event" replace />
  }

  return (
    <div className="w-full min-w-0 bg-black text-white">
      {/* One viewport below site header: hero fills to bottom; countdown is below the fold */}
      <div className="flex h-[var(--app-hero-h)] min-h-0 w-full flex-shrink-0 flex-col">
        <nav
          className="sticky top-0 z-30 w-full shrink-0 border-b border-black/10 bg-white text-carbon-900 shadow-sm"
          aria-label="Event date and location"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
            <p className="font-nav text-[11px] font-bold uppercase tracking-[0.2em] text-carbon-800">
              {resolved.dateLine}
            </p>
            <p className="text-right font-nav text-[11px] font-bold uppercase tracking-[0.18em] text-carbon-700">
              {resolved.locationLine}
            </p>
          </div>
        </nav>

        <header className="relative min-h-0 w-full flex-1 overflow-hidden">
          <img
            src={resolved.imageSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading="eager"
            decoding="async"
            {...{ fetchpriority: 'high' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/75" aria-hidden />

          <div className="relative z-10 flex h-full min-h-0 flex-col items-center justify-center px-2 py-8 text-center sm:py-12">
            <HeroSingleLineTitle
              text={resolved.heroTitle}
              className="font-nav font-bold leading-none tracking-tight text-white"
            />
            <p className="mx-auto mt-6 max-w-2xl px-4 text-sm leading-relaxed text-white/88 sm:mt-8 sm:text-base">
              {resolved.description}
            </p>
          </div>
        </header>
      </div>

      {/* Full-width strip, same mood as footer */}
      <section
        className="w-full border-t border-carbon-700 bg-carbon-900"
        aria-label="Countdown to event"
      >
        <EventCountdown targetIso={resolved.startAt} />
        <AddToCalendar
          title={resolved.heroTitle}
          location={resolved.locationLine}
          startIso={resolved.startAt}
          endIso={resolved.endAt}
        />
      </section>

      <WhatToExpect rows={resolved.whatToExpect} />
      <ReserveYourSpot
        eventSlug={eventSlug!}
        eventTitle={resolved.heroTitle}
        accessMode={resolved.accessMode}
        allowedRoles={resolved.allowedRoles}
      />
    </div>
  )
}
