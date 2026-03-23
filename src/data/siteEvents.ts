/**
 * Configurable “normal” event detail pages at /event/:eventSlug
 * (excludes one-offs like /event/driven26).
 */
export type SiteEventDetail = {
  slug: string
  /** Shown in the top white bar (can match hero title) */
  navTitle: string
  /** Large single-line hero title (auto-sized to fit width) */
  heroTitle: string
  description: string
  imageSrc: string
  /** Left side of the sticky meta bar */
  dateLine: string
  /** Right side of the sticky meta bar */
  locationLine: string
  /** ISO 8601 — countdown target (event start) */
  startAt: string
}

export const SITE_EVENT_DETAILS: Record<string, SiteEventDetail> = {
  'fireball-after-party': {
    slug: 'fireball-after-party',
    navTitle: 'Fireball After Party',
    heroTitle: 'Fireball After Party',
    description:
      'Private evening after The Driven Show — by invitation only. Meet the team, connect with the community, and get the details once your spot is confirmed.',
    imageSrc: '/Assets/FireballAfterParty.png',
    dateLine: 'May 16, 2026',
    locationLine: 'Saint-Hyacinthe, QC',
    startAt: '2026-05-16T20:00:00-04:00',
  },
}

export function getSiteEventDetail(slug: string | undefined): SiteEventDetail | null {
  if (!slug) return null
  return SITE_EVENT_DETAILS[slug] ?? null
}
