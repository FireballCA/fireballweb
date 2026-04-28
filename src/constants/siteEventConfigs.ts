export type EventAccessMode = 'public' | 'private' | 'partner-only'

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
      'An evening after the show — the team, the community, and the people who take their craft seriously. Open to all.',
    cityRegion: 'Saint-Hyacinthe, QC',
    imageSrc: '/Assets/FireballAfterParty.png',
    isPrivate: false,
    accessMode: 'public',
    ctaLabel: 'RSVP NOW',
    ctaHref: '/event/fireball-after-party',
    navTitle: 'Fireball After Party',
    heroTitle: 'Fireball After Party',
    dateLine: 'May 16, 2026',
    locationLine: 'Saint-Hyacinthe, QC',
    startAt: '2026-05-16T20:00:00-04:00',
    endAt: '2026-05-16T23:00:00-04:00',
  },
]

export function resolveSiteEventConfigs(raw: unknown): SiteEventConfig[] {
  if (!Array.isArray(raw)) return DEFAULT_SITE_EVENT_CONFIGS
  const parsed: SiteEventConfig[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const i = item as Record<string, unknown>
    const title = typeof i.title === 'string' ? i.title.trim() : ''
    const slug = typeof i.slug === 'string' ? i.slug.trim() : ''
    if (!title || !slug) continue
    const rawMode = typeof i.accessMode === 'string' ? i.accessMode : ''
    const accessMode: EventAccessMode =
      rawMode === 'private' ? 'private' : rawMode === 'partner-only' ? 'partner-only' : 'public'
    parsed.push({
      id:
        typeof i.id === 'string' && i.id.trim()
          ? i.id.trim()
          : `${slug}-${Date.now()}`,
      slug,
      day: typeof i.day === 'string' ? i.day : '',
      monthFull: typeof i.monthFull === 'string' ? i.monthFull : '',
      title,
      description: typeof i.description === 'string' ? i.description : '',
      cityRegion: typeof i.cityRegion === 'string' ? i.cityRegion : '',
      imageSrc: typeof i.imageSrc === 'string' ? i.imageSrc : '',
      isPrivate: Boolean(i.isPrivate),
      accessMode,
      allowedRoles: Array.isArray(i.allowedRoles)
        ? (i.allowedRoles as unknown[]).filter((r): r is string => typeof r === 'string')
        : undefined,
      ctaLabel: typeof i.ctaLabel === 'string' ? i.ctaLabel : 'See details',
      ctaHref: typeof i.ctaHref === 'string' ? i.ctaHref : `/event/${slug}`,
      navTitle: typeof i.navTitle === 'string' ? i.navTitle : undefined,
      heroTitle: typeof i.heroTitle === 'string' ? i.heroTitle : undefined,
      dateLine: typeof i.dateLine === 'string' ? i.dateLine : undefined,
      locationLine: typeof i.locationLine === 'string' ? i.locationLine : undefined,
      startAt: typeof i.startAt === 'string' ? i.startAt : undefined,
      endAt: typeof i.endAt === 'string' ? i.endAt : undefined,
    })
  }
  return parsed.length ? parsed : DEFAULT_SITE_EVENT_CONFIGS
}
