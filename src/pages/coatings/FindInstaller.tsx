import { Link } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState, type FormEvent, type WheelEvent } from 'react'
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

const photonCanadaOpts = {
  bbox: PHOTON_BBOX_CANADA,
  minQueryLength: 1 as const,
  canadaOnly: true as const,
}

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
  const mapRef = useRef<MapRef | null>(null)
  const searchWrapRef = useRef<HTMLDivElement | null>(null)
  const installers = useMemo(() => STOCKIST_LOCATIONS, [])
  const activeInstaller = installers.find((i) => i.id === activeId) ?? null

  const preventPageScrollOnMapWheel = (e: WheelEvent<HTMLDivElement>) => {
    // Keep wheel interaction inside the map (zoom) without scrolling the page.
    e.stopPropagation()
  }

  const focusMapOn = (lng: number, lat: number, zoom = 8) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 1100 })
  }

  const formatDistanceEn = (km: number) =>
    km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`

  const focusNearestToPoint = (lat: number, lng: number) => {
    const nearest = findNearestStockist(lat, lng, installers)
    if (!nearest) return
    setActiveId(nearest.stockist.id)
    focusMapOn(nearest.stockist.lng, nearest.stockist.lat, 14)
    setSearchSuccess(
      `The closest certified installer is about ${formatDistanceEn(nearest.distanceKm)} away.`,
    )
    setSearchHint(null)
    setSearchError(null)
  }

  /** Autocomplete addresses / cities (Photon). */
  useEffect(() => {
    const q = searchQuery.trim()
    if (q.length < 1) {
      setSuggestions([])
      return
    }
    const id = window.setTimeout(() => {
      void searchPhotonPlaces(q, 8, photonCanadaOpts).then((places) => {
        setSuggestions(places)
      })
    }, 280)
    return () => window.clearTimeout(id)
  }, [searchQuery])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const el = searchWrapRef.current
      if (el && !el.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const handleLocateMe = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => {
        focusMapOn(position.coords.longitude, position.coords.latitude, 13)
      },
      () => {
        setSearchError('Unable to retrieve your location.')
      },
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
      [
        installer.name,
        installer.city,
        installer.province,
        installer.postalCode || '',
        installer.address1 || '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
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

  return (
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
                    if (selectedPlace && v.trim() !== selectedPlace.label) {
                      setSelectedPlace(null)
                    }
                  }}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true)
                  }}
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
                          onMouseDown={(ev) => {
                            ev.preventDefault()
                            handlePickSuggestion(place)
                          }}
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
            <SecondaryClipButton
              type="button"
              onClick={handleLocateMe}
              className="h-10 shrink-0"
              idleTextClass="text-white"
              hoverTextClass="text-black"
            >
              Locate me
            </SecondaryClipButton>
          </div>
          {searchSuccess && (
            <p className="mb-2 px-2 text-xs font-medium text-emerald-400">{searchSuccess}</p>
          )}
          {searchHint && <p className="mb-2 px-2 text-xs text-silver/60">{searchHint}</p>}
          {searchError && <p className="mb-2 px-2 text-xs text-red-300">{searchError}</p>}
          <div
            className="find-installer-map h-[360px] w-full overflow-hidden rounded-xl md:h-[520px]"
            onWheel={preventPageScrollOnMapWheel}
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
              {installers.map((installer) => (
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
                  <button
                    type="button"
                    aria-label={installer.name}
                    className="h-3.5 w-3.5 rounded-full border border-white/80 bg-[#d9242f] shadow-[0_0_10px_rgba(217,36,47,0.65)]"
                  />
                </Marker>
              ))}
              {activeInstaller && (
                <Popup
                  latitude={activeInstaller.lat}
                  longitude={activeInstaller.lng}
                  anchor="top"
                  closeOnClick={false}
                  onClose={() => setActiveId(null)}
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-carbon-900">{activeInstaller.name}</p>
                    <p className="text-xs text-carbon-600">
                      {[activeInstaller.address1, activeInstaller.city, activeInstaller.province, activeInstaller.postalCode]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    {activeInstaller.phone && (
                      <p className="inline-flex items-center gap-1.5 text-xs text-carbon-700">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#0485F7]" aria-hidden>
                          <path
                            fill="currentColor"
                            d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24 11.36 11.36 0 0 0 3.56.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.33a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.56 1 1 0 0 1-.24 1.01z"
                          />
                        </svg>
                        {activeInstaller.phone}
                      </p>
                    )}
                    <Link
                      to="/account/dashboard"
                      className="mt-4 inline-flex w-[95%] items-center justify-center self-center rounded-full border border-[#0485F7] bg-[#0485F7] px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:border-[#3592F9] hover:bg-[#3592F9]"
                    >
                      Add Vehicle
                    </Link>
                  </div>
                </Popup>
              )}
            </Map>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-carbon-900/70 p-5 md:p-6">
          <h2 className="text-xl font-semibold text-white md:text-2xl">Save your vehicle and track your services.</h2>
          <p className="mt-2 text-sm text-silver/75 md:text-base">
            Add your car to My Garage for a personalized experience.
          </p>
          <Link
            to="/account/dashboard"
            className="mt-4 inline-flex items-center justify-center rounded-full border border-[#0485F7] bg-[#0485F7] px-4 py-2 text-xs font-semibold text-white transition-colors hover:border-[#3592F9] hover:bg-[#3592F9]"
          >
            Open My Garage
          </Link>
        </div>
      </div>
    </section>
  )
}

