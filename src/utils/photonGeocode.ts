import type { StockistLocation } from '@/data/stockists'

/** Distance en km entre deux points WGS84 (formule haversine). */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export type PhotonPlace = {
  label: string
  lat: number
  lng: number
}

type PhotonFeature = {
  geometry?: { type?: string; coordinates?: [number, number] }
  properties?: {
    name?: string
    street?: string
    housenumber?: string
    city?: string
    state?: string
    country?: string
    countrycode?: string
    postcode?: string
  }
}

function labelFromProperties(p: PhotonFeature['properties']): string {
  if (!p) return ''
  const parts = [
    [p.housenumber, p.street].filter(Boolean).join(' '),
    p.city,
    p.state,
    p.postcode,
    p.country,
  ].filter((x) => typeof x === 'string' && x.trim().length > 0)
  if (parts.length) return parts.join(', ')
  return p.name?.trim() || ''
}

/**
 * BBox WGS84 approximatif du Canada (Photon filtre la recherche dans cette zone).
 * minLon,minLat,maxLon,maxLat
 */
export const PHOTON_BBOX_CANADA = '-141.0,41.7,-52.0,83.5' as const

export type SearchPhotonOptions = {
  /** Default 1 — autocomplete can start from the first character. */
  minQueryLength?: number
  /** Photon `bbox` — use {@link PHOTON_BBOX_CANADA} to limit to Canada. */
  bbox?: string
  /**
   * If true, drop results whose `countrycode` is set and not CA (extra safety near borders).
   */
  canadaOnly?: boolean
}

/**
 * Recherche d'adresses / villes via Photon (OSM Komoot), pas Google — pas de clé API.
 * Usage raisonnable uniquement (pas de spam).
 */
export async function searchPhotonPlaces(
  query: string,
  limit = 6,
  options?: SearchPhotonOptions,
): Promise<PhotonPlace[]> {
  const q = query.trim()
  const minLen = options?.minQueryLength ?? 1
  if (q.length < minLen) return []

  const url = new URL('https://photon.komoot.io/api/')
  url.searchParams.set('q', q)
  url.searchParams.set('limit', String(Math.min(50, Math.max(1, limit * 3))))
  if (options?.bbox) {
    url.searchParams.set('bbox', options.bbox)
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) return []

  const data = (await res.json()) as { features?: PhotonFeature[] }
  const features = Array.isArray(data.features) ? data.features : []
  const out: PhotonPlace[] = []
  const canadaOnly = options?.canadaOnly ?? Boolean(options?.bbox)

  for (const f of features) {
    const coords = f.geometry?.coordinates
    if (!coords || coords.length < 2) continue
    const [lng, lat] = coords
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    const cc = f.properties?.countrycode?.toLowerCase()
    if (canadaOnly && cc && cc !== 'ca') continue
    const label = labelFromProperties(f.properties) || f.properties?.name?.trim() || q
    out.push({ label, lat, lng })
    if (out.length >= limit) break
  }

  return out
}

/** Revendeur le plus proche d'un point (km). */
export function findNearestStockist(
  lat: number,
  lng: number,
  stockists: StockistLocation[],
): { stockist: StockistLocation; distanceKm: number } | null {
  if (!stockists.length) return null
  let best = stockists[0]!
  let bestD = haversineKm(lat, lng, best.lat, best.lng)
  for (let i = 1; i < stockists.length; i += 1) {
    const s = stockists[i]!
    const d = haversineKm(lat, lng, s.lat, s.lng)
    if (d < bestD) {
      bestD = d
      best = s
    }
  }
  return { stockist: best, distanceKm: bestD }
}
