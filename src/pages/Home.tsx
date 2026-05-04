import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { siApple, siGoogle, siAndroid } from 'simple-icons'
import { ProductCategoryLineup } from '@/components/ProductCategoryLineup'
import { HomeCollectionSection } from '@/components/HomeCollectionSection'
import { LenisContext } from '@/components/LenisRoot'
import { SecondaryClipButton } from '@/components/ui/SecondaryClipButton'
import { supabase } from '@/lib/supabase'
import { resolveHomeCollection } from '@/utils/homeCollectionSettings'
import type { HomeCollectionResolved } from '@/constants/homeCollection'
import { appleButtonVisualClassName } from '@/components/ui/AppleButton'
import { cn } from '@/lib/utils'
import { usePageTitle } from '@/hooks/usePageTitle'

function useCountdown(targetIso: string, enabled = true) {
  const target = useMemo(() => new Date(targetIso).getTime(), [targetIso])
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!enabled) return
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [enabled])

  const diff = Math.max(0, target - Date.now())
  const totalSec = Math.floor(diff / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  return { days, hours, minutes, seconds, expired: diff <= 0 }
}

/** Landing incrémentale : hero + sections réactivées une par une (debug refresh). */
export function Home() {
  const lenis = useContext(LenisContext)
  usePageTitle('Fireball Canada')

  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [homeCollection, setHomeCollection] = useState<HomeCollectionResolved>(() =>
    resolveHomeCollection(null),
  )
  const [calendarMenuOpen, setCalendarMenuOpen] = useState(false)
  const calendarMenuRef = useRef<HTMLDivElement>(null)

  const nextEvent = {
    title: 'Fireball After Party',
    location: 'Saint-Hyacinthe, QC',
    startsAt: '2026-05-16T19:00:00-04:00',
    href: '/event/fireball-after-party',
    imageSrc: '/Assets/FireballAfterParty.png',
  }
  const countdown = useCountdown(nextEvent.startsAt, true)

  const eventStart = useMemo(() => new Date(nextEvent.startsAt), [nextEvent.startsAt])
  const eventEnd = useMemo(() => new Date(eventStart.getTime() + 2 * 60 * 60 * 1000), [eventStart])
  const toGoogleDate = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z$/, 'Z')
  const googleCalendarUrl = useMemo(() => {
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: nextEvent.title,
      details: `${nextEvent.title} - Fireball event`,
      location: nextEvent.location,
      dates: `${toGoogleDate(eventStart)}/${toGoogleDate(eventEnd)}`,
    })
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }, [nextEvent.title, nextEvent.location, eventStart, eventEnd])
  const samsungCalendarUrl = googleCalendarUrl
  const appleCalendarUrl = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, '0')
    const toICSDate = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Fireball//Events//EN',
      'BEGIN:VEVENT',
      `UID:${toICSDate(eventStart)}-fireball-event@fireball`,
      `DTSTAMP:${toICSDate(new Date())}`,
      `DTSTART:${toICSDate(eventStart)}`,
      `DTEND:${toICSDate(eventEnd)}`,
      `SUMMARY:${nextEvent.title}`,
      `LOCATION:${nextEvent.location}`,
      'DESCRIPTION:Fireball event',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
  }, [eventStart, eventEnd, nextEvent.title, nextEvent.location])
  const { showAppleCalendar, showSamsungCalendar } = useMemo(() => {
    if (typeof navigator === 'undefined') {
      return { showAppleCalendar: true, showSamsungCalendar: true }
    }
    const ua = navigator.userAgent.toLowerCase()
    const platform = (navigator.platform || '').toLowerCase()
    const isAppleDevice =
      /iphone|ipad|ipod|macintosh|mac os x/.test(ua) || /mac|iphone|ipad|ipod/.test(platform)
    const isWindowsOrAndroid = /windows|android/.test(ua) || /win/.test(platform)
    if (isAppleDevice) {
      return { showAppleCalendar: true, showSamsungCalendar: false }
    }
    if (isWindowsOrAndroid) {
      return { showAppleCalendar: false, showSamsungCalendar: true }
    }
    return { showAppleCalendar: true, showSamsungCalendar: true }
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const sync = () => setIsMobileViewport(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'announcements')
          .maybeSingle()
        if (data?.value) {
          setHomeCollection(resolveHomeCollection(data.value as Record<string, unknown>))
        }
      } catch {
        /* ignore */
      }
    }
    void load()
    const channel = supabase
      .channel('home-announcements')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings', filter: 'key=eq.announcements' },
        () => {
          void load()
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!calendarMenuRef.current?.contains(event.target as Node)) {
        setCalendarMenuOpen(false)
      }
    }
    if (calendarMenuOpen) {
      document.addEventListener('mousedown', onDocClick)
    }
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [calendarMenuOpen])

  const heroLite = isMobileViewport

  const scrollToProductLineup = useCallback(() => {
    const el = document.getElementById('product-lineup')
    if (!el) return
    if (lenis) {
      lenis.scrollTo(el, { offset: -96, duration: 1.15 })
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [lenis])

  return (
    <main className="relative min-h-0 overflow-x-hidden bg-carbon-950 text-white">
      <section
        className="relative flex h-[var(--app-hero-h)] min-h-[var(--app-hero-h)] flex-col overflow-hidden bg-black"
        aria-label="Hero"
      >
        {heroLite ? (
          <img
            src="/Assets/Carclub Hero.png"
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <video
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/videoplayback.mp4" type="video/mp4" />
          </video>
        )}
        <div className="pointer-events-none absolute inset-0 bg-black/45" aria-hidden />

        <div
          className={cn(
            'relative z-10 flex min-h-0 w-full flex-1 flex-col justify-center px-5 pb-24 pt-20 sm:px-6 md:justify-end md:pb-28 md:pt-16',
            !heroLite && 'animate-slide-up',
          )}
        >
          <div className="mx-auto flex w-full max-w-[90rem] flex-col items-center gap-8 text-center md:flex-row md:items-end md:justify-between md:gap-12 md:text-left">
            <h1 className="max-w-xl font-nav text-4xl font-bold leading-[1.05] tracking-tight text-pearl sm:text-5xl md:max-w-lg md:self-start md:text-6xl lg:text-7xl">
              <span className={heroLite ? '' : 'hero-ground-line hero-ground-line--clean'}>
                <span className={heroLite ? '' : 'hero-ground-text'}>From Detail</span>
              </span>
              <span className={cn('mt-1.5 sm:mt-2', heroLite ? '' : 'hero-ground-line hero-ground-line--clean')}>
                <span className={heroLite ? '' : 'hero-ground-text hero-ground-text--delay'}>To Perfection.</span>
              </span>
            </h1>
            <div className="flex w-full max-w-lg shrink-0 flex-col items-center gap-6 text-center md:max-w-none md:w-auto md:items-end md:text-right">
              <span className={heroLite ? '' : 'hero-ground-line hero-ground-line--clean'}>
                <p
                  className={cn(
                    'mx-auto max-w-md text-pretty text-sm font-light leading-relaxed text-silver/80 md:mx-0 md:text-base lg:text-lg',
                    heroLite ? '' : 'hero-ground-text hero-ground-text--delay-2',
                  )}
                >
                  Crafted for those who demand precision, performance, and flawless results.
                </p>
              </span>
              <span className={heroLite ? '' : 'hero-ground-line hero-ground-line--clean'}>
                <span
                  className={cn(
                    'inline-flex w-full max-w-sm flex-col gap-3 md:max-w-none md:items-end',
                    heroLite ? '' : 'hero-ground-text hero-ground-text--delay-3',
                  )}
                >
                  <button
                    type="button"
                    onClick={scrollToProductLineup}
                    className={cn(
                      'inline-flex w-full cursor-pointer items-center justify-center whitespace-nowrap max-md:min-h-[48px] max-md:px-6 max-md:py-3 max-md:text-sm md:w-auto',
                      appleButtonVisualClassName,
                    )}
                  >
                    Explore Products
                  </button>
                  <Link
                    to="/event"
                    className="inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/15 md:w-auto"
                  >
                    See events
                  </Link>
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-silver/40 md:bottom-8">
          <span className="mx-auto block h-12 w-px animate-pulse bg-current" />
        </div>
      </section>

      <div className="bg-carbon-950">
        <ProductCategoryLineup />
        <HomeCollectionSection config={homeCollection} />

        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="font-sans text-3xl font-bold tracking-tight text-carbon-900 md:text-5xl">
                Our next events
              </h2>
              <div className="flex items-center gap-4 text-carbon-900 sm:gap-6">
                {[
                  { label: 'D', value: countdown.days },
                  { label: 'H', value: countdown.hours },
                  { label: 'M', value: countdown.minutes },
                  { label: 'S', value: countdown.seconds },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="font-nav text-xl font-bold tabular-nums sm:text-2xl">
                      {String(item.value).padStart(2, '0')}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-carbon-500">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mx-auto mt-8 max-w-7xl px-4 md:px-6">
            <div className="overflow-hidden rounded-2xl border border-carbon-200 bg-white">
              <div className="relative aspect-[16/7] min-h-[260px] sm:min-h-[320px]">
                <img
                  src={nextEvent.imageSrc}
                  alt={nextEvent.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-black/10" aria-hidden />

                <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-6">
                  <h3 className="font-nav text-4xl font-bold text-white sm:text-4xl">{nextEvent.title}</h3>
                  <p className="mt-1 text-white/80">{nextEvent.location}</p>
                  <div className="mt-5">
                    <div className="relative flex w-full items-center gap-2">
                      <SecondaryClipButton to={nextEvent.href} idleTextClass="text-white" hoverTextClass="text-black">
                        See event details
                      </SecondaryClipButton>
                      <div ref={calendarMenuRef} className="relative pointer-events-auto sm:ml-auto">
                        <button
                          type="button"
                          onClick={() => setCalendarMenuOpen((prev) => !prev)}
                          aria-label="Open calendar menu"
                          className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[#0485F7] bg-[#0485F7] text-white shadow-lg transition-colors hover:border-[#3592F9] hover:bg-[#3592F9] sm:hidden"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                          >
                            <path d="M8 2v4" />
                            <path d="M16 2v4" />
                            <rect width="18" height="18" x="3" y="4" rx="2" />
                            <path d="M3 10h18" />
                            <path d="M8 14h.01" />
                            <path d="M12 14h.01" />
                            <path d="M16 14h.01" />
                            <path d="M8 18h.01" />
                            <path d="M12 18h.01" />
                            <path d="M16 18h.01" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCalendarMenuOpen((prev) => !prev)}
                          className={cn('hidden sm:inline-flex', appleButtonVisualClassName)}
                        >
                          <span>Add to calendar</span>
                        </button>

                        {calendarMenuOpen && (
                          <div className="absolute bottom-[calc(100%+0.5rem)] left-1/2 w-[calc(100vw-1.5rem)] max-w-[320px] -translate-x-1/2 rounded-xl border border-white/20 bg-[#0f1218] p-2 shadow-2xl sm:left-auto sm:right-0 sm:w-[320px] sm:translate-x-0">
                            {showAppleCalendar && (
                              <a
                                href={appleCalendarUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                              >
                                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-white" aria-hidden>
                                  <path fill="currentColor" d={siApple.path} />
                                </svg>
                                <span>Open Apple Calendar</span>
                              </a>
                            )}
                            <a
                              href={googleCalendarUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                            >
                              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-white" aria-hidden>
                                <path fill="currentColor" d={siGoogle.path} />
                              </svg>
                              <span>Open Google Calendar</span>
                            </a>
                            {showSamsungCalendar && (
                              <a
                                href={samsungCalendarUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                              >
                                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-white" aria-hidden>
                                  <path fill="currentColor" d={siAndroid.path} />
                                </svg>
                                <span>Open Samsung Calendar</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
