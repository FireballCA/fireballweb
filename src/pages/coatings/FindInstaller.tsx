import { Link } from 'react-router-dom'
import { useMemo, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent as ReactPointerEvent, type WheelEvent } from 'react'
import Map, { Marker, Popup, type MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { STOCKIST_LOCATIONS } from '@/data/stockists'

const locateClipCssVars = {
  '--clip-x': '50%',
  '--clip-y': '50%',
  '--clip-r': '0px',
} as CSSProperties

function setClipRevealVars(el: HTMLElement, clientX: number, clientY: number) {
  const rect = el.getBoundingClientRect()
  const w = rect.width || 1
  const h = rect.height || 1
  const localX = clientX - rect.left
  const localY = clientY - rect.top
  const x = (localX / w) * 100
  const y = (localY / h) * 100
  const d1 = Math.hypot(localX, localY)
  const d2 = Math.hypot(w - localX, localY)
  const d3 = Math.hypot(localX, h - localY)
  const d4 = Math.hypot(w - localX, h - localY)
  const r = Math.max(d1, d2, d3, d4)
  el.style.setProperty('--clip-x', `${x}%`)
  el.style.setProperty('--clip-y', `${y}%`)
  el.style.setProperty('--clip-r', `${r}px`)
}

export function FindInstaller() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [locateHover, setLocateHover] = useState(false)
  const [locateFocus, setLocateFocus] = useState(false)
  const mapRef = useRef<MapRef | null>(null)
  const installers = useMemo(() => STOCKIST_LOCATIONS, [])
  const activeInstaller = installers.find((i) => i.id === activeId) ?? null
  const locateActive = locateHover || locateFocus

  const preventPageScrollOnMapWheel = (e: WheelEvent<HTMLDivElement>) => {
    // Keep wheel interaction inside the map (zoom) without scrolling the page.
    e.stopPropagation()
  }

  const focusMapOn = (lng: number, lat: number, zoom = 8) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 1100 })
  }

  const handleLocateMe = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => {
        focusMapOn(position.coords.longitude, position.coords.latitude, 10)
      },
      () => {
        setSearchError('Unable to retrieve your location.')
      },
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (!query) return
    setIsSearching(true)
    setSearchError(null)
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
    if (!match) {
      setSearchError('No installer found for this search.')
      setIsSearching(false)
      return
    }
    setActiveId(match.id)
    focusMapOn(match.lng, match.lat, 10)
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
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by postal code, city or address"
                className="h-10 w-full rounded-full border border-white/15 bg-black/35 px-4 text-sm text-white placeholder:text-white/45"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 text-xs font-semibold text-white transition-colors hover:bg-white/20 disabled:opacity-60"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </form>
            <button
              type="button"
              onClick={handleLocateMe}
              onPointerEnter={(e: ReactPointerEvent<HTMLButtonElement>) => {
                setClipRevealVars(e.currentTarget, e.clientX, e.clientY)
                setLocateHover(true)
              }}
              onPointerMove={(e: ReactPointerEvent<HTMLButtonElement>) => {
                setClipRevealVars(e.currentTarget, e.clientX, e.clientY)
              }}
              onPointerLeave={(e: ReactPointerEvent<HTMLButtonElement>) => {
                setClipRevealVars(e.currentTarget, e.clientX, e.clientY)
                setLocateHover(false)
              }}
              onFocus={() => setLocateFocus(true)}
              onBlur={() => setLocateFocus(false)}
              className="relative inline-flex h-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-transparent px-4 text-xs font-semibold text-white transition-[border-color,color] duration-500 ease-out hover:border-white/45"
              style={locateClipCssVars}
            >
              <span
                className="pointer-events-none absolute inset-0 z-0 bg-white"
                style={{
                  clipPath: `circle(${locateActive ? 'var(--clip-r, 0px)' : '0px'} at var(--clip-x, 50%) var(--clip-y, 50%))`,
                  WebkitClipPath: `circle(${locateActive ? 'var(--clip-r, 0px)' : '0px'} at var(--clip-x, 50%) var(--clip-y, 50%))`,
                  transition:
                    'clip-path 900ms cubic-bezier(0.22,1,0.36,1), -webkit-clip-path 900ms cubic-bezier(0.22,1,0.36,1)',
                  willChange: 'clip-path',
                }}
                aria-hidden
              />
              <span className={`relative z-10 transition-colors duration-500 ${locateActive ? 'text-black' : 'text-white'}`}>
                Locate me
              </span>
            </button>
          </div>
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
              maxZoom={10}
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

