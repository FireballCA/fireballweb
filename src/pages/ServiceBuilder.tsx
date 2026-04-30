import { Link } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppleButton } from '@/components/ui/AppleButton'
import { AppleSheet } from '@/components/ui/AppleSheet'
import { GarageAddVehicleFlow } from '@/components/MyGarageSection'
import { useNotifications } from '@/context/NotificationsContext'
import { isAuthenticated } from '@/utils/supabaseAuth'
import { fetchGarageVehicles, type GarageVehicleRow } from '@/utils/supabaseGarage'
import {
  CERAMIC_COATING_SECTIONS,
  COATING_SECTION_IMAGES,
} from '@/data/ceramicCoatingSections'

type VehicleSize = 'Compact' | 'Normal' | 'Large' | 'Exotic'
type PaintCondition = 'Like New' | 'Light Imperfections' | 'Moderate Defects' | 'Heavy Defects'

const VEHICLE_SIZES: Array<{ id: VehicleSize; label: string; price: number }> = [
  { id: 'Compact', label: 'Compact', price: 149 },
  { id: 'Normal', label: 'Normal', price: 199 },
  { id: 'Large', label: 'Large', price: 259 },
  { id: 'Exotic', label: 'Exotic', price: 399 },
]

const PAINT_CONDITIONS: Array<{
  id: PaintCondition
  title: string
  description: string
  adjustment: number
  image: string
}> = [
  {
    id: 'Like New',
    title: 'Like New',
    description: 'No visible defects. Paint is in excellent condition.',
    adjustment: 0,
    image: '/servicebuilder/New.jpg',
  },
  {
    id: 'Light Imperfections',
    title: 'Light Imperfections',
    description: 'Minor swirl marks or light surface scratches.',
    adjustment: 69,
    image: '/servicebuilder/Light.jpg',
  },
  {
    id: 'Moderate Defects',
    title: 'Moderate Defects',
    description: 'Visible scratches, swirls, and dullness.',
    adjustment: 149,
    image: '/servicebuilder/Moderate.jpg',
  },
  {
    id: 'Heavy Defects',
    title: 'Heavy Defects',
    description: 'Deep scratches, oxidation, or heavily damaged paint.',
    adjustment: 249,
    image: '/servicebuilder/Heavy.jpg',
  },
]

const WAX_OPTIONS: Array<{
  id: string
  name: string
  image: string
  ratings: {
    hydrophobicity: number
    slickness: number
    gloss: number
    application: number
  }
}> = [
  {
    id: 'brazil-wax',
    name: 'Brazil Wax',
    image: '/servicebuilder/Wax_Graphene.webp',
    ratings: { hydrophobicity: 5, slickness: 3, gloss: 5, application: 4 },
  },
  {
    id: 'butter-wax-130g',
    name: 'Butter Wax',
    image: '/servicebuilder/Wax_Butter.webp',
    ratings: { hydrophobicity: 5, slickness: 3, gloss: 5, application: 4 },
  },
  {
    id: 'cherry-blossom-wax',
    name: 'Cherry Blossom Wax',
    image: '/servicebuilder/Wax_Cherry.webp',
    ratings: { hydrophobicity: 4, slickness: 3, gloss: 5, application: 4 },
  },
  {
    id: 'fusion-wax-130g',
    name: 'Fusion Wax',
    image: '/servicebuilder/Wax_Fusion.webp',
    ratings: { hydrophobicity: 5, slickness: 1, gloss: 5, application: 2 },
  },
  {
    id: 'ghost-wax',
    name: 'Ghost Wax',
    image: '/servicebuilder/Wax_Ghost.webp',
    ratings: { hydrophobicity: 5, slickness: 2, gloss: 4, application: 4 },
  },
  {
    id: 'liberty-wax-130g',
    name: 'Liberty Wax',
    image: '/servicebuilder/Wax_Lib.png',
    ratings: { hydrophobicity: 5, slickness: 4, gloss: 4, application: 5 },
  },
  {
    id: 'sexy-lady-wax',
    name: 'Sexy Lady Wax',
    image: '/servicebuilder/Wax_Lady.webp',
    ratings: { hydrophobicity: 5, slickness: 3, gloss: 5, application: 4 },
  },
  {
    id: 'wheel-wax-130g',
    name: 'Wheel Wax',
    image: '/servicebuilder/Wax_Wheel.webp',
    ratings: { hydrophobicity: 4, slickness: 3, gloss: 4, application: 3 },
  },
]

export function ServiceBuilder() {
  const { notify } = useNotifications()
  const [selectedVehicleSize, setSelectedVehicleSize] = useState<VehicleSize | null>(null)
  const [selectedPaintCondition, setSelectedPaintCondition] = useState<PaintCondition | null>(null)
  const [selectedCoatingId, setSelectedCoatingId] = useState<string | null>(null)
  const [selectedWaxId, setSelectedWaxId] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const vehicleStepRef = useRef<HTMLElement | null>(null)
  const [garageSheetOpen, setGarageSheetOpen] = useState(false)
  const [addVehicleSheetOpen, setAddVehicleSheetOpen] = useState(false)
  const [garageVehicles, setGarageVehicles] = useState<GarageVehicleRow[]>([])
  const [garageLoading, setGarageLoading] = useState(false)
  const [importedVehicle, setImportedVehicle] = useState<GarageVehicleRow | null>(null)

  useEffect(() => {
    let cancelled = false
    isAuthenticated()
      .then((ok) => {
        if (!cancelled) setIsLoggedIn(ok)
      })
      .finally(() => {
        if (!cancelled) setIsAuthLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const loadGarage = useCallback(async () => {
    setGarageLoading(true)
    try {
      const rows = await fetchGarageVehicles()
      setGarageVehicles(rows)
    } finally {
      setGarageLoading(false)
    }
  }, [])

  useEffect(() => {
    if (garageSheetOpen) void loadGarage()
  }, [garageSheetOpen, loadGarage])

  const totalPrice = useMemo(() => {
    const vehicleBasePrice = VEHICLE_SIZES.find((size) => size.id === selectedVehicleSize)?.price ?? 0
    const paintAdjustment = PAINT_CONDITIONS.find(
      (condition) => condition.id === selectedPaintCondition
    )?.adjustment ?? 0
    return vehicleBasePrice + paintAdjustment
  }, [selectedVehicleSize, selectedPaintCondition])

  const canSend =
    isLoggedIn &&
    selectedVehicleSize !== null &&
    selectedPaintCondition !== null &&
    selectedCoatingId !== null

  const renderFivePointScale = (value: number) => {
    return (
      <div className="inline-flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            key={index}
            className={`h-1.5 w-1.5 rounded-full ${index < value ? 'bg-[#0485F7]' : 'bg-black/15'}`}
            aria-hidden
          />
        ))}
      </div>
    )
  }

  return (
    <section className="relative min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      {/* Bannière sous la navbar du site : prix à gauche, envoi à droite (3 requis : taille, peinture, coating — wax optionnel) */}
      <div className="sticky top-0 z-[119] border-b border-black/[0.08] bg-[#f5f5f7]/92 backdrop-blur-md supports-[backdrop-filter]:bg-[#f5f5f7]/85">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-3.5 md:px-8">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6e6e73]">Estimate</p>
            <p className="truncate font-nav text-2xl font-bold tracking-tight text-[#1d1d1f] md:text-[28px]">
              ${totalPrice}
              <span className="ml-1 text-base font-semibold text-[#6e6e73] md:text-lg">CAD</span>
            </p>
          </div>
          <AppleButton
            disabled={!canSend}
            className="shrink-0 !rounded-full !border-black !bg-black !px-6 !py-2.5 !text-[13px] !font-semibold !text-white hover:!border-[#2b2b2d] hover:!bg-[#2b2b2d] disabled:!cursor-not-allowed disabled:!border-black/20 disabled:!bg-black/25 disabled:!text-white/70"
            onClick={() => {
              const coatingName =
                CERAMIC_COATING_SECTIONS.find((c) => c.id === selectedCoatingId)?.name ?? ''
              const waxName = selectedWaxId
                ? WAX_OPTIONS.find((w) => w.id === selectedWaxId)?.name ?? ''
                : null
              notify({
                title: 'Configuration sent',
                message: `${selectedVehicleSize} · ${selectedPaintCondition} · ${coatingName}${waxName ? ` · Wax: ${waxName}` : ''} — $${totalPrice} CAD`,
                kind: 'success',
              })
            }}
          >
            Send
          </AppleButton>
        </div>
      </div>

      <header className="relative isolate overflow-hidden border-b border-black/10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/Service Builder.jpg')" }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/58 via-black/30 to-[#f5f5f7]"
          aria-hidden
        />

        <div className="relative mx-auto flex min-h-[58vh] w-full max-w-[1400px] items-center justify-center px-6 py-14 text-center md:min-h-[64vh] md:px-8 md:py-20">
          <div className="max-w-2xl">
            <h1 className="font-nav text-4xl font-bold leading-tight text-white md:text-6xl">
              Configure your service
            </h1>
            <p className="mt-4 text-sm text-white md:text-base">
              A simple way to plan, customize, and manage your vehicle care.
            </p>
            <AppleButton
              className="mt-6 mx-auto"
              onClick={() => {
                vehicleStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              Get started
            </AppleButton>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1400px] px-6 py-12 pb-16 md:px-8 md:py-16 md:pb-20">
        <div className="space-y-28 md:space-y-36">
          <article
            ref={vehicleStepRef}
            className="border-t border-black/10 pt-10 transition"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-nav text-2xl font-bold">Start with your vehicle size</h2>
                <p className="mt-2 text-sm text-[#424245]">
                  This helps us tailor the service to your vehicle
                </p>
                {importedVehicle ? (
                  <p className="mt-2 text-sm font-medium text-[#0485F7]">
                    From My Garage: {importedVehicle.year} {importedVehicle.brand} {importedVehicle.model}
                  </p>
                ) : null}
                {!isLoggedIn && !isAuthLoading ? (
                  <p className="mt-2 text-sm text-[#424245]">
                    Sign in to unlock the next steps and start your configuration.
                  </p>
                ) : null}
              </div>
              {isLoggedIn ? (
                <AppleButton
                  type="button"
                  className="!border-black !bg-black !text-white hover:!border-[#2b2b2d] hover:!bg-[#2b2b2d]"
                  onClick={() => setGarageSheetOpen(true)}
                >
                  Import yours
                </AppleButton>
              ) : null}
            </div>

            {!isLoggedIn && !isAuthLoading ? (
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <Link to="/account" className="inline-flex">
                  <AppleButton>Connection</AppleButton>
                </Link>
              </div>
            ) : null}

            <div className={`grid grid-cols-4 gap-4 ${isLoggedIn ? '' : 'pointer-events-none'}`}>
              {VEHICLE_SIZES.map((size) => {
                const selected = selectedVehicleSize === size.id
                return (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => setSelectedVehicleSize(size.id)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      selected
                        ? 'border-[#0485F7] bg-[#0485F7]/10 shadow-[0_8px_24px_rgba(4,133,247,0.12)]'
                        : 'border-black/10 bg-white hover:bg-black/[0.015]'
                    }`}
                  >
                    <img
                      src="/Service Builder.jpg"
                      alt={size.label}
                      className="mb-3 h-36 w-full rounded-xl object-cover"
                      draggable={false}
                    />
                    <p className="font-nav text-lg font-bold">{size.label}</p>
                    <p className="text-sm text-[#6e6e73]">Starting at ${size.price}</p>
                  </button>
                )
              })}
            </div>
          </article>

          {isLoggedIn ? (
          <article className="border-t border-black/10 pt-10 transition">
            <div className="mb-5">
              <div>
                <h2 className="font-nav text-2xl font-bold">Evaluate your paint condition</h2>
                <p className="mt-2 text-sm text-[#424245]">
                  This helps us determine the level of correction needed.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {PAINT_CONDITIONS.map((condition) => {
                const selected = selectedPaintCondition === condition.id
                return (
                  <button
                    key={condition.id}
                    type="button"
                    onClick={() => setSelectedPaintCondition(condition.id)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      selected
                        ? 'border-[#0485F7] bg-[#0485F7]/10 shadow-[0_8px_24px_rgba(4,133,247,0.12)]'
                        : 'border-black/10 bg-white hover:bg-black/[0.015]'
                    }`}
                  >
                    <img
                      src={condition.image}
                      alt={condition.title}
                      className="mb-3 h-36 w-full rounded-xl object-cover"
                      draggable={false}
                    />
                    <p className="font-nav text-lg font-bold">{condition.title}</p>
                    <p className="mt-1 text-sm text-[#424245]">{condition.description}</p>
                  </button>
                )
              })}
            </div>
          </article>
          ) : null}

          {isLoggedIn ? (
          <article className="border-t border-black/10 pt-10 transition">
            <div className="mb-6">
              <h2 className="font-nav text-2xl font-bold">Choose your coating</h2>
              <p className="mt-2 text-sm text-[#424245]">
                Compare durability, gloss, and performance to find the right protection for your vehicle
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {CERAMIC_COATING_SECTIONS.map((coating) => {
                const selected = selectedCoatingId === coating.id
                return (
                  <button
                    key={coating.id}
                    type="button"
                    onClick={() => setSelectedCoatingId(coating.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      selected
                        ? 'border-[#0485F7] bg-[#0485F7]/10 shadow-[0_8px_24px_rgba(4,133,247,0.12)]'
                        : 'border-black/10 bg-white hover:bg-black/[0.015]'
                    }`}
                  >
                    <img
                      src={COATING_SECTION_IMAGES[coating.id]}
                      alt={coating.name}
                      className="mb-3 h-40 w-full rounded-xl object-contain bg-[#f6f6f7]"
                      draggable={false}
                    />
                    <p className="font-nav text-lg font-bold">{coating.name}</p>
                    <p className="text-sm text-[#6e6e73]">{coating.years} durability</p>
                    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-[#424245]">
                      <p>Hardness: {coating.gauges.hardness}%</p>
                      <p>Gloss: {coating.gauges.gloss}%</p>
                      <p>Resistance: {coating.gauges.resistance}%</p>
                      <p>Hydrophobicity: {coating.gauges.hydrophobicity}%</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </article>
          ) : null}

          {isLoggedIn ? (
          <article className="border-t border-black/10 pt-10 transition">
            <div className="mb-6 flex items-center gap-3">
              <h2 className="font-nav text-2xl font-bold">Add a wax finish</h2>
              <span className="select-none inline-flex items-center gap-2 rounded-full bg-[#e9e9eb] px-3 py-1.5 text-xs font-semibold leading-none text-[#0485F7]">
                <span className="h-1 w-1 rounded-full bg-[#0485F7]" aria-hidden />
                <span>Extra</span>
              </span>
            </div>
            <p className="mb-6 text-sm text-[#424245]">
              Add extra gloss and depth with a premium wax layer
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {WAX_OPTIONS.map((wax) => {
                const selected = selectedWaxId === wax.id
                return (
                  <button
                    key={wax.id}
                    type="button"
                    onClick={() => setSelectedWaxId(wax.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      selected
                        ? 'border-[#0485F7] bg-[#0485F7]/10 shadow-[0_8px_24px_rgba(4,133,247,0.12)]'
                        : 'border-black/10 bg-white hover:bg-black/[0.015]'
                    }`}
                  >
                    <div className="mb-3 h-40 w-full overflow-hidden rounded-xl bg-[#f6f6f7]">
                      <img
                        src={wax.image}
                        alt={wax.name}
                        className="h-full w-full scale-[1.03] object-cover object-center"
                        draggable={false}
                      />
                    </div>
                    <p className="font-nav text-sm font-bold leading-snug">{wax.name}</p>
                    <div className="mt-3 space-y-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#5c5c61]">
                      <div className="flex items-center justify-between gap-3">
                        <span>Hydrophobicity</span>
                        {renderFivePointScale(wax.ratings.hydrophobicity)}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Slickness</span>
                        {renderFivePointScale(wax.ratings.slickness)}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Gloss</span>
                        {renderFivePointScale(wax.ratings.gloss)}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Application</span>
                        {renderFivePointScale(wax.ratings.application)}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </article>
          ) : null}
        </div>
      </div>

      <AppleSheet open={garageSheetOpen} onOpenChange={setGarageSheetOpen} title="My Garage" zIndex={55_000}>
        <div className="px-4 pb-4">
          {garageLoading ? (
            <div className="flex justify-center py-12 text-sm text-[#86868b]">Loading…</div>
          ) : garageVehicles.length === 0 ? (
            <button
              type="button"
              onClick={() => setAddVehicleSheetOpen(true)}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#d2d2d7] bg-[#fafafa] px-6 py-14 text-center transition hover:border-[#b0b0b5] hover:bg-[#f5f5f7]"
            >
              <span className="text-[15px] font-medium text-[#1d1d1f]">No vehicle in your garage yet</span>
              <span className="max-w-xs text-[13px] text-[#86868b]">
                Tap here to add your first vehicle — it will appear in My Garage and here.
              </span>
            </button>
          ) : (
            <ul className="flex flex-col gap-3">
              {garageVehicles.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setImportedVehicle(v)
                      setGarageSheetOpen(false)
                    }}
                    className="flex w-full items-center gap-4 rounded-2xl border border-black/[0.08] bg-white p-3 text-left shadow-sm transition hover:border-black/15 hover:shadow-md"
                  >
                    <div className="h-[72px] w-[104px] shrink-0 overflow-hidden rounded-xl bg-[#f5f5f7]">
                      {v.image_url ? (
                        <img src={v.image_url} alt="" className="h-full w-full object-cover" draggable={false} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[11px] text-[#86868b]">
                          No photo
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[17px] font-semibold tracking-tight text-[#1d1d1f]">
                        {v.brand} {v.model}
                      </p>
                      <p className="mt-0.5 text-[14px] text-[#6e6e73]">{v.year}</p>
                      {v.color ? (
                        <p className="mt-1 truncate text-[12px] text-[#86868b]">{v.color}</p>
                      ) : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </AppleSheet>

      <AppleSheet
        open={addVehicleSheetOpen}
        onOpenChange={setAddVehicleSheetOpen}
        title="Add vehicle"
        zIndex={55_100}
      >
        <GarageAddVehicleFlow
          isOpen={addVehicleSheetOpen}
          layout="embedded"
          onClose={() => setAddVehicleSheetOpen(false)}
          onSaved={() => {
            setAddVehicleSheetOpen(false)
            void loadGarage()
          }}
        />
      </AppleSheet>
    </section>
  )
}
