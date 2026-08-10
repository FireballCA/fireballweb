export type EventAccessMode = 'public' | 'private' | 'partner-only'

export type WhatToExpectRow = { num: string; title: string; body: string }

export type SiteEventConfig = {
  id: string
  slug: string
  day: string
  monthFull: string
  title: string
  description: string
  cityRegion: string
  imageSrc: string
  isPrivate: boolean
  accessMode?: EventAccessMode
  allowedRoles?: string[]
  ctaLabel: string
  ctaHref: string
  navTitle?: string
  heroTitle?: string
  dateLine?: string
  locationLine?: string
  startAt?: string
  endAt?: string
  whatToExpect?: WhatToExpectRow[]
}

export const DEFAULT_SITE_EVENT_CONFIGS: SiteEventConfig[] = [
  {
    id: 'driven-show-2026-05-16',
    slug: 'driven-show',
    day: '16',
    monthFull: 'MAY',
    title: 'The Driven Show',
    description:
      'Canada\'s aftermarket performance showcase in Saint-Hyacinthe - builders, brands, vendors, and show cars in one day.',
    cityRegion: 'Saint-Hyacinthe, QC',
    imageSrc: '/Assets/Driven.webp',
    isPrivate: false,
    accessMode: 'public',
    ctaLabel: 'See details',
    ctaHref: 'https://www.drivenshow.ca/sainthyacinthe/',
    navTitle: 'The Driven Show',
    heroTitle: 'The Driven Show',
    dateLine: 'May 16, 2026',
    locationLine: 'Saint-Hyacinthe, QC',
    startAt: '2026-05-16T10:00:00-04:00',
    endAt: '2026-05-16T18:00:00-04:00',
  },
  {
    id: 'fireball-after-party-2026-05-16',
    slug: 'fireball-after-party',
    day: '16',
    monthFull: 'MAY',
    title: 'Fireball After Party',
    description:
      'After the Driven Show, the night belongs to Fireball. An open evening for anyone who lives and breathes the craft — installers, enthusiasts, and the whole Fireball team.',
    cityRegion: 'Saint-Hyacinthe, QC',
    imageSrc: '/Assets/FireballAfterParty.png',
    isPrivate: false,
    accessMode: 'public',
    ctaLabel: 'RSVP NOW',
    ctaHref: '/event/fireball-after-party',
    navTitle: 'Fireball After Party',
    heroTitle: 'Fireball After Party',
    dateLine: 'May 16, 2026 · 7 PM – 11 PM',
    locationLine: 'Saint-Hyacinthe, QC',
    startAt: '2026-05-16T19:00:00-04:00',
    endAt: '2026-05-16T23:00:00-04:00',
  },
]

const DEFAULT_BY_SLUG = new Map(DEFAULT_SITE_EVENT_CONFIGS.map((d) => [d.slug, d]))

const DEFAULT_EVENT_DURATION_MS = 4 * 60 * 60 * 1000

export function resolveSiteEventEndAt(ev: Pick<SiteEventConfig, 'startAt' | 'endAt'>): Date {
  if (ev.endAt) return new Date(ev.endAt)
  if (ev.startAt) return new Date(new Date(ev.startAt).getTime() + DEFAULT_EVENT_DURATION_MS)
  return new Date(Number.NaN)
}

export function isSiteEventPast(
  ev: Pick<SiteEventConfig, 'startAt' | 'endAt'>,
  nowMs: number = Date.now(),
): boolean {
  if (!ev.startAt && !ev.endAt) return false
  const endMs = resolveSiteEventEndAt(ev).getTime()
  if (Number.isNaN(endMs)) return false
  return endMs < nowMs
}

/** True for detail routes like `/event/fireball-after-party` (not the listing `/event`). */
export function isInternalEventDetailHref(href: string): boolean {
  const path = href.split('?')[0]?.split('#')[0]?.trim() ?? ''
  return /^\/event\/[^/]+/.test(path)
}

/** Marketing short paths → preferred event slug (React resolves fuzzy if slug differs). */
export const EVENT_SHORT_LINKS: Record<string, string> = {
  pleingaz: 'pleingaz',
}

export function slugifyEventTitle(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeLooseKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

/** Prefer real title over leftover "New Event" hero/nav placeholders from admin create. */
export function displayEventTitle(ev: Pick<SiteEventConfig, 'title' | 'heroTitle' | 'navTitle'>): string {
  const hero = ev.heroTitle?.trim()
  if (hero && hero.toLowerCase() !== 'new event') return hero
  const nav = ev.navTitle?.trim()
  if (nav && nav.toLowerCase() !== 'new event') return nav
  return ev.title
}

export function resolveEventSlugFromShortLink(
  shortKey: string,
  events: SiteEventConfig[],
): string | null {
  const preferred = EVENT_SHORT_LINKS[shortKey] ?? shortKey
  const exactPreferred = events.find((e) => e.slug === preferred)
  if (exactPreferred) return exactPreferred.slug

  const keyNorm = normalizeLooseKey(shortKey)
  const fuzzy = events.find((e) => {
    const slugN = normalizeLooseKey(e.slug)
    const titleN = normalizeLooseKey(e.title)
    const heroN = normalizeLooseKey(e.heroTitle || '')
    return (
      slugN === keyNorm ||
      titleN === keyNorm ||
      heroN === keyNorm ||
      slugN.includes(keyNorm) ||
      titleN.includes(keyNorm) ||
      heroN.includes(keyNorm)
    )
  })
  if (fuzzy) return fuzzy.slug

  // Still send users to the preferred slug path (admin can set slug to match).
  return preferred || null
}

/** Soonest upcoming event; falls back to the latest configured event. */
export function pickNextSiteEvent(
  events: SiteEventConfig[],
  nowMs: number = Date.now(),
): SiteEventConfig | null {
  if (!events.length) return null
  const withStart = events
    .map((ev) => ({ ev, startMs: ev.startAt ? new Date(ev.startAt).getTime() : Number.NaN }))
    .filter((x) => !Number.isNaN(x.startMs))
  const upcoming = withStart
    .filter((x) => !isSiteEventPast(x.ev, nowMs))
    .sort((a, b) => a.startMs - b.startMs)
  if (upcoming[0]) return upcoming[0].ev
  const past = withStart.sort((a, b) => b.startMs - a.startMs)
  return past[0]?.ev ?? events[0] ?? null
}

export function resolveSiteEventConfigs(raw: unknown): SiteEventConfig[] {
  if (!Array.isArray(raw)) return DEFAULT_SITE_EVENT_CONFIGS
  const parsed: SiteEventConfig[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const i = item as Record<string, unknown>
    const title = typeof i.title === 'string' ? i.title.trim() : ''
    const slug = typeof i.slug === 'string' ? i.slug.trim() : ''
    if (!title || !slug) continue

    const codeDefault = DEFAULT_BY_SLUG.get(slug)
    const rawMode = typeof i.accessMode === 'string' ? i.accessMode.trim() : ''
    const accessMode: EventAccessMode =
      rawMode === 'private' ? 'private'
      : rawMode === 'partner-only' ? 'partner-only'
      : rawMode === 'public' ? 'public'
      : (codeDefault?.accessMode ?? 'public')

    // Supabase (admin) wins for all fields; code defaults fill in anything missing.
    const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)
    const rawHero = str(i.heroTitle)
    const rawNav = str(i.navTitle)
    const heroTitle =
      !rawHero || rawHero.toLowerCase() === 'new event'
        ? (codeDefault?.heroTitle ?? title)
        : rawHero
    const navTitle =
      !rawNav || rawNav.toLowerCase() === 'new event'
        ? (codeDefault?.navTitle ?? title)
        : rawNav

    parsed.push({
      id: str(i.id) ?? codeDefault?.id ?? `${slug}-${Date.now()}`,
      slug,
      day: str(i.day) ?? codeDefault?.day ?? '',
      monthFull: str(i.monthFull) ?? codeDefault?.monthFull ?? '',
      title: str(i.title) ?? codeDefault?.title ?? title,
      description: str(i.description) ?? codeDefault?.description ?? '',
      cityRegion: str(i.cityRegion) ?? codeDefault?.cityRegion ?? '',
      imageSrc: str(i.imageSrc) ?? codeDefault?.imageSrc ?? '',
      isPrivate: accessMode !== 'public',
      accessMode,
      allowedRoles: Array.isArray(i.allowedRoles)
        ? (i.allowedRoles as unknown[]).filter((r): r is string => typeof r === 'string')
        : codeDefault?.allowedRoles,
      ctaLabel: str(i.ctaLabel) ?? codeDefault?.ctaLabel ?? 'See details',
      ctaHref: str(i.ctaHref) ?? codeDefault?.ctaHref ?? `/event/${slug}`,
      navTitle,
      heroTitle,
      dateLine: str(i.dateLine) ?? codeDefault?.dateLine,
      locationLine: str(i.locationLine) ?? codeDefault?.locationLine,
      startAt: str(i.startAt) ?? codeDefault?.startAt,
      endAt: str(i.endAt) ?? codeDefault?.endAt,
      whatToExpect: Array.isArray(i.whatToExpect)
        ? (i.whatToExpect as unknown[])
            .filter(
              (r): r is Record<string, unknown> =>
                typeof r === 'object' && r !== null && typeof (r as Record<string, unknown>).title === 'string',
            )
            .map((r) => ({
              num: typeof r.num === 'string' ? r.num : '',
              title: (r.title as string).trim(),
              body: typeof r.body === 'string' ? r.body : '',
            }))
        : codeDefault?.whatToExpect,
    })
  }
  return parsed.length ? parsed : DEFAULT_SITE_EVENT_CONFIGS
}
