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
      navTitle: str(i.navTitle) ?? codeDefault?.navTitle,
      heroTitle: str(i.heroTitle) ?? codeDefault?.heroTitle,
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
