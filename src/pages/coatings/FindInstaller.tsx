import { Link } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type TouchEvent } from 'react'
import { ServiceBuilderQuickMapSheet } from '@/components/service-builder/ServiceBuilderQuickMapSheet'
import type { StockistLocation } from '@/data/stockists'
import Map, { Marker, Popup, type MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { SecondaryClipButton } from '@/components/ui/SecondaryClipButton'
import { STOCKIST_LOCATIONS } from '@/data/stockists'
import {
  findNearestStockist,
  PHOTON_BBOX_CANADA,
  searchPhotonPlaces,
  type PhotonPlace,
} from '@/utils/photonGeocode'
import { cn } from '@/lib/utils'
import { AppleInfoPill } from '@/components/ui/AppleInfoPill'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile } from '@/utils/supabaseAuth'
import { SEO, breadcrumbJsonLd, serviceJsonLd } from '@/components/SEO'

const photonCanadaOpts = {
  bbox: PHOTON_BBOX_CANADA,
  minQueryLength: 1 as const,
  canadaOnly: true as const,
}

// ── Admin add form ──────────────────────────────────────────────────────────────

const PROVINCES = [
  'Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland and Labrador',
  'Nova Scotia','Ontario','Prince Edward Island','Quebec','Saskatchewan',
  'Northwest Territories','Nunavut','Yukon',
]

const EMPTY_FORM = {
  name: '', address1: '', address2: '', city: '', province: 'Quebec',
  postalCode: '', country: 'Canada', phone: '', website: '', email: '',
  notes: '', type: 'installer' as 'installer' | 'dealer',
}

function InstallerFormPanel({
  mode,
  initial,
  onClose,
  onSaved,
}: {
  mode: 'add' | 'edit'
  initial?: StockistLocation
  onClose: () => void
  onSaved: (loc: StockistLocation, originalId?: string) => void
}) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          name: initial.name,
          address1: initial.address1 ?? '',
          address2: initial.address2 ?? '',
          city: initial.city,
          province: initial.province,
          postalCode: initial.postalCode ?? '',
          country: initial.country,
          phone: initial.phone ?? '',
          website: initial.website ?? '',
          email: initial.email ?? '',
          notes: initial.notes ?? '',
          lat: String(initial.lat),
          lng: String(initial.lng),
          type: (initial.type ?? 'installer') as 'installer' | 'dealer',
        }
      : { ...EMPTY_FORM, lat: '', lng: '' },
  )
  const [saving, setSaving] = useState(false)
  const [tableError, setTableError] = useState(false)
  const [geocodeError, setGeocodeError] = useState(false)

  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  const canSubmit = form.name.trim() && form.city.trim() && form.province.trim() &&
    (mode === 'add' || (form.lat.trim() && form.lng.trim()))

  const handleSave = async () => {
    if (!canSubmit) return
    setSaving(true)
    setGeocodeError(false)

    let lat: number
    let lng: number

    if (mode === 'edit') {
      lat = parseFloat(form.lat)
      lng = parseFloat(form.lng)
    } else {
      const geoQuery = [form.address1, form.city, form.province, form.postalCode, form.country]
        .filter(Boolean).join(' ')
      const places = await searchPhotonPlaces(geoQuery, 1, photonCanadaOpts).catch(() => [])
      const place = places[0]
      if (!place) {
        setGeocodeError(true)
        setSaving(false)
        return
      }
      lat = place.lat
      lng = place.lng
    }

    const isStaticEntry = mode === 'edit' && initial && initial.id.startsWith('loc_')

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      address1: form.address1.trim(),
      address2: form.address2.trim() || null,
      city: form.city.trim(),
      province: form.province.trim(),
      postal_code: form.postalCode.trim() || null,
      country: form.country.trim() || 'Canada',
      phone: form.phone.trim() || null,
      website: form.website.trim() || null,
      email: form.email.trim() || null,
      notes: form.notes.trim() || null,
      lat,
      lng,
      type: form.type,
      // Track which static entry this overrides so it can be hidden
      ...(isStaticEntry ? { original_id: initial!.id } : {}),
    }

    try {
      let data: Record<string, unknown>
      if (mode === 'edit' && initial && !isStaticEntry) {
        // DB entry → UPDATE in place
        const res = await supabase
          .from('stockist_locations')
          .update(payload)
          .eq('id', initial.id)
          .select()
          .single()
        if (res.error) {
          if (res.error.code === '42P01') { setTableError(true); setSaving(false); return }
          throw res.error
        }
        data = res.data
      } else {
        // Add (new) or static override → INSERT
        const res = await supabase
          .from('stockist_locations')
          .insert(payload)
          .select()
          .single()
        if (res.error) {
          if (res.error.code === '42P01') { setTableError(true); setSaving(false); return }
          throw res.error
        }
        data = res.data
      }
      const loc: StockistLocation = {
        id: data.id as string,
        name: data.name as string,
        address1: (data.address1 as string) ?? '',
        address2: (data.address2 as string) ?? undefined,
        city: data.city as string,
        province: data.province as string,
        postalCode: (data.postal_code as string) ?? undefined,
        country: data.country as string,
        phone: (data.phone as string) ?? undefined,
        website: (data.website as string) ?? undefined,
        email: (data.email as string) ?? undefined,
        notes: (data.notes as string) ?? undefined,
        lat: data.lat as number,
        lng: data.lng as number,
        type: (data.type as 'installer' | 'dealer') ?? 'installer',
      }
      onSaved(loc, initial?.id)
      onClose()
    } catch {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full rounded-[10px] border border-white/15 bg-white/8 px-3.5 py-2.5 text-[13px] text-white placeholder:text-white/35 outline-none focus:border-[#0485F7] focus:ring-2 focus:ring-[#0485F7]/20'
  const labelClass = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50'

  return (
    <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-6 backdrop-blur-sm">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-white">
          {mode === 'edit' ? `Edit — ${initial?.name}` : 'Add installer / dealer'}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {tableError && (
        <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <p className="text-xs font-semibold text-amber-300">Table not found in Supabase</p>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-400/80">Run this SQL in your Supabase SQL editor:</p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-black/30 px-3 py-2 text-[10px] leading-relaxed text-amber-200">
{`create table if not exists stockist_locations (
  id          uuid primary key default gen_random_uuid(),
  original_id text,
  name        text not null,
  address1    text not null default '',
  address2    text,
  city        text not null,
  province    text not null,
  postal_code text,
  country     text not null default 'Canada',
  phone       text,
  website     text,
  email       text,
  notes       text,
  lat         numeric not null,
  lng         numeric not null,
  type        text not null default 'installer',
  created_at  timestamptz not null default now()
);
alter table stockist_locations enable row level security;
create policy "public_read" on stockist_locations for select using (true);
create policy "admin_all"   on stockist_locations for all    using (true);`}
          </pre>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Type toggle */}
        <div className="sm:col-span-2">
          <label className={labelClass}>Type</label>
          <div className="flex gap-2">
            {(['installer', 'dealer'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set('type', t)}
                className={`rounded-full px-4 py-2 text-[12px] font-semibold transition-colors ${
                  form.type === t
                    ? t === 'dealer' ? 'bg-[#0485F7] text-white' : 'bg-[#d9242f] text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/15'
                }`}
              >
                {t === 'dealer' ? 'Dealer' : 'Certified Installer'}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Business name *</label>
          <input type="text" placeholder="e.g. Monza Autospa" value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Address line 1</label>
          <input type="text" placeholder="123 Main St" value={form.address1} onChange={(e) => set('address1', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Address line 2</label>
          <input type="text" placeholder="Suite 4" value={form.address2} onChange={(e) => set('address2', e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>City *</label>
          <input type="text" placeholder="Montreal" value={form.city} onChange={(e) => set('city', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Province *</label>
          <select value={form.province} onChange={(e) => set('province', e.target.value)} className={`${inputClass} appearance-none`}>
            {PROVINCES.map((p) => <option key={p} value={p} className="bg-carbon-900">{p}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass}>Postal code</label>
          <input type="text" placeholder="H1A 2B3" value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Country</label>
          <input type="text" placeholder="Canada" value={form.country} onChange={(e) => set('country', e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Phone</label>
          <input type="text" placeholder="(514) 000-0000" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" placeholder="info@example.com" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Website</label>
          <input type="url" placeholder="https://example.com" value={form.website} onChange={(e) => set('website', e.target.value)} className={inputClass} />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Notes</label>
          <input type="text" placeholder="e.g. MASTER INSTALLER" value={form.notes} onChange={(e) => set('notes', e.target.value)} className={inputClass} />
        </div>

        {/* Coordinates shown in edit mode */}
        {mode === 'edit' && (
          <>
            <div>
              <label className={labelClass}>Latitude *</label>
              <input type="number" step="any" value={form.lat} onChange={(e) => set('lat', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Longitude *</label>
              <input type="number" step="any" value={form.lng} onChange={(e) => set('lng', e.target.value)} className={inputClass} />
            </div>
          </>
        )}
      </div>

      {geocodeError && (
        <p className="mt-3 text-xs font-medium text-red-400">
          Could not find coordinates for this address. Try adding more details (street, postal code).
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3 border-t border-white/8 pt-5">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-5 py-2.5 text-[13px] font-semibold text-white/70 transition-colors hover:bg-white/10 active:scale-95"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !canSubmit}
          className="rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-carbon-900 transition-colors hover:bg-white/90 active:scale-95 disabled:opacity-40"
        >
          {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Add to map'}
        </button>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function FindInstaller() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchSuccess, setSearchSuccess] = useState<string | null>(null)
  const [searchHint, setSearchHint] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<PhotonPlace[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<PhotonPlace | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingLocation, setEditingLocation] = useState<StockistLocation | null>(null)
  const [quickServiceOpen, setQuickServiceOpen] = useState(false)
  const [quickServiceShop, setQuickServiceShop] = useState<StockistLocation | null>(null)
  const [dbLocations, setDbLocations] = useState<StockistLocation[]>([])
  const [overriddenStaticIds, setOverriddenStaticIds] = useState<Set<string>>(new Set())
  const mapRef = useRef<MapRef | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const searchWrapRef = useRef<HTMLDivElement | null>(null)

  const installers = useMemo(
    () => [
      ...STOCKIST_LOCATIONS.filter((s) => !overriddenStaticIds.has(s.id)),
      ...dbLocations,
    ],
    [dbLocations, overriddenStaticIds],
  )

  const stockistsForMap = useMemo(() => {
    const rows = [...installers]
    rows.sort((a, b) => {
      const da = a.type === 'dealer' ? 1 : 0
      const db = b.type === 'dealer' ? 1 : 0
      return da - db
    })
    return rows
  }, [installers])

  const activeInstaller = installers.find((i) => i.id === activeId) ?? null

  useEffect(() => {
    async function init() {
      const profile = await getCurrentUserProfile()
      setIsAdmin(String(profile?.role || '').trim().toLowerCase() === 'admin')
      try {
        const { data } = await supabase.from('stockist_locations').select('*')
        if (data && data.length > 0) {
          setDbLocations(
            data.map((r) => ({
              id: r.id,
              name: r.name,
              address1: r.address1 ?? '',
              address2: r.address2 ?? undefined,
              city: r.city,
              province: r.province,
              postalCode: r.postal_code ?? undefined,
              country: r.country,
              phone: r.phone ?? undefined,
              website: r.website ?? undefined,
              email: r.email ?? undefined,
              notes: r.notes ?? undefined,
              lat: r.lat,
              lng: r.lng,
              type: r.type ?? 'installer',
            })),
          )
          const overridden = new Set(
            data.filter((r) => r.original_id).map((r) => r.original_id as string),
          )
          if (overridden.size > 0) setOverriddenStaticIds(overridden)
        }
      } catch { /* table may not exist yet */ }
    }
    void init()
  }, [])

  useEffect(() => {
    const el = mapContainerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => e.stopPropagation()
    el.addEventListener('wheel', onWheel, { passive: true })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const preventPageScrollOnMapTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    e.stopPropagation()
  }

  const focusMapOn = useCallback((lng: number, lat: number, zoom = 8) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 1100 })
  }, [])

  const formatDistanceEn = (km: number) =>
    km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`

  const focusNearestToPoint = useCallback(
    (lat: number, lng: number) => {
      const nearest = findNearestStockist(lat, lng, installers)
      if (!nearest) return
      setActiveId(nearest.stockist.id)
      focusMapOn(nearest.stockist.lng, nearest.stockist.lat, 14)
      setSearchSuccess(
        `The closest certified installer is about ${formatDistanceEn(nearest.distanceKm)} away.`,
      )
      setSearchHint(null)
      setSearchError(null)
    },
    [installers, focusMapOn],
  )

  useEffect(() => {
    const q = searchQuery.trim()
    if (q.length < 1) { setSuggestions([]); return }
    const id = window.setTimeout(() => {
      void searchPhotonPlaces(q, 8, photonCanadaOpts).then(setSuggestions)
    }, 280)
    return () => window.clearTimeout(id)
  }, [searchQuery])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node))
        setShowSuggestions(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const handleLocateMe = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => focusMapOn(position.coords.longitude, position.coords.latitude, 13),
      () => setSearchError('Unable to retrieve your location.'),
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  const handlePickSuggestion = (place: PhotonPlace) => {
    setSearchQuery(place.label)
    setSelectedPlace(place)
    setShowSuggestions(false)
    setSuggestions([])
    focusNearestToPoint(place.lat, place.lng)
  }

  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (!query) return
    setIsSearching(true)
    setSearchError(null)
    setSearchSuccess(null)
    setSearchHint(null)

    if (selectedPlace && query === selectedPlace.label) {
      focusNearestToPoint(selectedPlace.lat, selectedPlace.lng)
      setIsSearching(false)
      return
    }

    const normalized = query.toLowerCase()
    const match = installers.find((installer) =>
      [installer.name, installer.city, installer.province, installer.postalCode || '', installer.address1 || '']
        .join(' ').toLowerCase().includes(normalized),
    )
    if (match) {
      setActiveId(match.id)
      focusMapOn(match.lng, match.lat, 14)
      setSelectedPlace(null)
      setIsSearching(false)
      return
    }

    const places = await searchPhotonPlaces(query, 8, photonCanadaOpts)
    if (places.length === 0) {
      setSearchHint('We could not find that location. Try a city name or pick a suggestion from the list.')
      setIsSearching(false)
      return
    }
    const place = places[0]!
    setSelectedPlace(place)
    focusNearestToPoint(place.lat, place.lng)
    setIsSearching(false)
  }

  const isMasterInstaller = (loc: StockistLocation) =>
    loc.notes?.toUpperCase().includes('MASTER') ?? false

  return (
    <>
      <SEO
        title="Find a Certified Fireball Ceramic Coating Installer in Canada"
        description="Locate Fireball certified ceramic coating installers across Canada. Trusted, authorized partners for premium 9H+ ceramic coating application — find your nearest installer today."
        canonicalPath="/coatings/find-installer"
        keywords="ceramic coating installer near me, Fireball certified installer, ceramic coating Canada, find installer, professional ceramic coating, authorized Fireball partner"
        jsonLd={[
          breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Ceramic Coatings', path: '/all-coatings' }, { name: 'Find an Installer', path: '/coatings/find-installer' }]),
          serviceJsonLd({ name: 'Fireball Certified Installer Network', description: 'Locate a Fireball Canada certified ceramic coating installer near you.', serviceType: 'Ceramic Coating Installer Locator', url: '/coatings/find-installer' }),
        ]}
      />
      <section className="bg-carbon-950">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">Find your installer</h1>
          <p className="mt-3 max-w-2xl text-sm text-silver/75 md:text-base">
            Locate certified Fireball installers across Canada and connect with a nearby partner.
          </p>
          <Link
            to="/contact"
            className="mt-6 inline-flex items-center justify-center rounded-full border border-[#0485F7] bg-[#0485F7] px-4 py-2 text-xs font-semibold text-white transition-colors hover:border-[#3592F9] hover:bg-[#3592F9]"
          >
            Need help finding one?
          </Link>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl bg-carbon-900 p-2">
          <div className="mb-3 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
            <form onSubmit={handleSearch} className="flex w-full max-w-xl items-center gap-2">
              <div ref={searchWrapRef} className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const v = e.target.value
                    setSearchQuery(v)
                    setShowSuggestions(true)
                    if (selectedPlace && v.trim() !== selectedPlace.label) setSelectedPlace(null)
                  }}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={showSuggestions && suggestions.length > 0}
                  aria-autocomplete="list"
                  placeholder="Search by postal code, city or address"
                  className="h-10 w-full rounded-full border border-white/15 bg-black/35 px-4 text-sm text-white placeholder:text-white/45"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <ul
                    role="listbox"
                    className="absolute left-0 right-0 top-[calc(100%+6px)] z-[60] max-h-56 overflow-auto rounded-xl border border-white/15 bg-carbon-950 py-1 text-left text-sm shadow-xl"
                  >
                    {suggestions.map((place, i) => (
                      <li key={`${place.label}-${place.lat}-${place.lng}-${i}`}>
                        <button
                          type="button"
                          role="option"
                          className="w-full px-3 py-2 text-left text-white/90 hover:bg-white/10"
                          onMouseDown={(ev) => { ev.preventDefault(); handlePickSuggestion(place) }}
                        >
                          {place.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 text-xs font-semibold text-white transition-colors hover:bg-white/20 disabled:opacity-60"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </form>
            <div className="flex items-center gap-2">
              <SecondaryClipButton
                type="button"
                onClick={handleLocateMe}
                className="h-10 shrink-0"
                idleTextClass="text-white"
                hoverTextClass="text-black"
              >
                Locate me
              </SecondaryClipButton>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAddForm((v) => !v)}
                  className={cn(
                    'inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-xs font-semibold transition-colors',
                    showAddForm
                      ? 'bg-white text-carbon-900 hover:bg-white/90'
                      : 'border border-white/15 bg-white/10 text-white hover:bg-white/20',
                  )}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add
                </button>
              )}
            </div>
          </div>

          {searchSuccess && <p className="mb-2 px-2 text-xs font-medium text-emerald-400">{searchSuccess}</p>}
          {searchHint && <p className="mb-2 px-2 text-xs text-silver/60">{searchHint}</p>}
          {searchError && <p className="mb-2 px-2 text-xs text-red-300">{searchError}</p>}

          {isAdmin && showAddForm && !editingLocation && (
            <div className="mb-3 px-1">
              <InstallerFormPanel
                mode="add"
                onClose={() => setShowAddForm(false)}
                onSaved={(loc) => {
                  setDbLocations((prev) => [...prev, loc])
                  setShowAddForm(false)
                }}
              />
            </div>
          )}
          {isAdmin && editingLocation && (
            <div className="mb-3 px-1">
              <InstallerFormPanel
                mode="edit"
                initial={editingLocation}
                onClose={() => setEditingLocation(null)}
                onSaved={(updated, originalId) => {
                  if (originalId?.startsWith('loc_')) {
                    // Static entry promoted to DB — add override, hide static
                    setDbLocations((prev) => [...prev, updated])
                    setOverriddenStaticIds((prev) => new Set([...prev, originalId]))
                  } else {
                    // DB entry updated in place
                    setDbLocations((prev) =>
                      prev.map((l) => l.id === (originalId ?? updated.id) ? updated : l),
                    )
                  }
                  setEditingLocation(null)
                }}
              />
            </div>
          )}

          <div
            ref={mapContainerRef}
            className="find-installer-map h-[360px] w-full overflow-hidden rounded-xl touch-none overscroll-contain md:h-[520px]"
            onTouchMoveCapture={preventPageScrollOnMapTouchMove}
          >
            <Map
              ref={mapRef}
              initialViewState={{ longitude: -40, latitude: 35, zoom: 1.45 }}
              mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
              minZoom={1}
              maxZoom={18}
              renderWorldCopies={false}
              attributionControl={false}
              onClick={() => setActiveId(null)}
            >
              {stockistsForMap.map((installer) => {
                const isDealer = installer.type === 'dealer'
                return (
                  <Marker
                    key={installer.id}
                    latitude={installer.lat}
                    longitude={installer.lng}
                    anchor="bottom"
                    onClick={(e) => {
                      e.originalEvent.stopPropagation()
                      setActiveId(installer.id)
                    }}
                  >
                    <div
                      className={cn(
                        'flex cursor-pointer justify-center p-2 -m-2 touch-manipulation',
                        isDealer ? 'relative z-[3]' : 'relative z-[2]',
                      )}
                    >
                      <button
                        type="button"
                        aria-label={installer.name}
                        className={
                          isDealer
                            ? 'h-3.5 w-3.5 shrink-0 rounded-full border border-white/80 bg-[#0485F7] shadow-[0_0_10px_rgba(4,133,247,0.65)]'
                            : 'h-3.5 w-3.5 shrink-0 rounded-full border border-white/80 bg-[#d9242f] shadow-[0_0_10px_rgba(217,36,47,0.65)]'
                        }
                      />
                    </div>
                  </Marker>
                )
              })}
              {activeInstaller && (
                <Popup
                  latitude={activeInstaller.lat}
                  longitude={activeInstaller.lng}
                  anchor="top"
                  closeOnClick={false}
                  onClose={() => setActiveId(null)}
                >
                  <div className="flex min-w-[220px] max-w-[min(92vw,300px)] flex-col gap-2">
                    {/* Pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {activeInstaller.type === 'dealer' && (
                        <AppleInfoPill label="Dealer" tone="info" />
                      )}
                      {isMasterInstaller(activeInstaller) && (
                        <AppleInfoPill label="Master Installer" tone="success" />
                      )}
                      {activeInstaller.type !== 'dealer' && !isMasterInstaller(activeInstaller) && (
                        <AppleInfoPill label="Certified Installer" tone="neutral" />
                      )}
                    </div>

                    <p className="text-sm font-semibold text-carbon-900">{activeInstaller.name}</p>
                    <p className="text-xs text-carbon-600">
                      {[activeInstaller.address1, activeInstaller.city, activeInstaller.province, activeInstaller.postalCode]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    {activeInstaller.phone && (
                      <p className="inline-flex items-center gap-1.5 text-xs text-carbon-700">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-[#0485F7]" aria-hidden>
                          <path
                            fill="currentColor"
                            d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24 11.36 11.36 0 0 0 3.56.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.33a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.56 1 1 0 0 1-.24 1.01z"
                          />
                        </svg>
                        {activeInstaller.phone}
                      </p>
                    )}
                    {activeInstaller.website && (
                      <a
                        href={activeInstaller.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#0485F7] hover:underline"
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                          <circle cx="12" cy="12" r="10" />
                          <path strokeLinecap="round" d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                        Website
                      </a>
                    )}
                    {activeInstaller.type !== 'dealer' && (
                      <button
                        type="button"
                        className="mt-1 inline-flex w-full items-center justify-center rounded-full border border-[#0485F7] bg-[#0485F7] px-3 py-2 text-[11px] font-semibold text-white transition-colors hover:border-[#3592F9] hover:bg-[#3592F9]"
                        onClick={() => {
                          setQuickServiceShop(activeInstaller)
                          setQuickServiceOpen(true)
                        }}
                      >
                        Quick service
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-carbon-200 bg-carbon-50 px-3 py-2 text-[11px] font-semibold text-carbon-700 transition-colors hover:bg-carbon-100"
                        onClick={() => {
                          setEditingLocation(activeInstaller)
                          setActiveId(null)
                          setShowAddForm(false)
                        }}
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.929l-3.536.707.707-3.536A4 4 0 019 13z" />
                        </svg>
                        Edit
                      </button>
                    )}
                  </div>
                </Popup>
              )}
            </Map>
          </div>

          <div className="mt-3 flex items-center gap-5 px-2">
            <span className="flex items-center gap-2 text-xs text-silver/70">
              <span className="inline-block h-3 w-3 rounded-full bg-[#d9242f] shadow-[0_0_6px_rgba(217,36,47,0.65)]" />
              Certified installer
            </span>
            <span className="flex items-center gap-2 text-xs text-silver/70">
              <span className="inline-block h-3 w-3 rounded-full bg-[#0485F7] shadow-[0_0_6px_rgba(4,133,247,0.65)]" />
              Dealer
            </span>
          </div>
        </div>
      </div>

      <ServiceBuilderQuickMapSheet
        open={quickServiceOpen}
        onOpenChange={(next) => {
          setQuickServiceOpen(next)
          if (!next) setQuickServiceShop(null)
        }}
        shop={quickServiceShop}
      />
    </section>
    </>
  )
}
