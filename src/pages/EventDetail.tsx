import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { ReserveYourSpot } from '@/components/events/ReserveYourSpot'
import { WhatToExpect } from '@/components/events/WhatToExpect'
import { getSiteEventDetail } from '@/data/siteEvents'

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
          We’re live — see you there.
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

export function EventDetail() {
  const { eventSlug } = useParams<{ eventSlug: string }>()
  const data = getSiteEventDetail(eventSlug)

  if (!data) {
    return <Navigate to="/event" replace />
  }

  return (
    <div className="w-full min-w-0 bg-black text-white">
      {/* One viewport below site header: hero fills to bottom; countdown is below the fold */}
      <div className="flex h-[calc(100dvh-5rem)] min-h-0 w-full flex-shrink-0 flex-col">
        <nav
          className="sticky top-20 z-30 w-full shrink-0 border-b border-black/10 bg-white text-carbon-900 shadow-sm"
          aria-label="Event date and location"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
            <p className="font-nav text-[11px] font-bold uppercase tracking-[0.2em] text-carbon-800">
              {data.dateLine}
            </p>
            <p className="text-right font-nav text-[11px] font-bold uppercase tracking-[0.18em] text-carbon-700">
              {data.locationLine}
            </p>
          </div>
        </nav>

        <header className="relative min-h-0 w-full flex-1 overflow-hidden">
          <img
            src={data.imageSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/75" aria-hidden />

          <div className="relative z-10 flex h-full min-h-0 flex-col items-center justify-center px-2 py-8 text-center sm:py-12">
            <HeroSingleLineTitle
              text={data.heroTitle}
              className="font-nav font-bold leading-none tracking-tight text-white"
            />
            <p className="mx-auto mt-6 max-w-2xl px-4 text-sm leading-relaxed text-white/88 sm:mt-8 sm:text-base">
              {data.description}
            </p>
          </div>
        </header>
      </div>

      {/* Full-width strip, same mood as footer */}
      <section
        className="w-full border-t border-carbon-700 bg-carbon-900"
        aria-label="Countdown to event"
      >
        <EventCountdown targetIso={data.startAt} />
      </section>

      <WhatToExpect />
      <ReserveYourSpot />
    </div>
  )
}
