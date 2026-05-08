import type { RefObject } from 'react'
import { useEffect, useRef } from 'react'
import { AppleButton } from '@/components/ui/AppleButton'
import type { ServiceBuilderFormApi } from '@/hooks/useServiceBuilderForm'
import { cn } from '@/lib/utils'
import {
  PAINT_CONDITIONS,
  PAINT_CORRECTION_PRICES,
  PRODUCT_KITS,
  TALON_WHEEL_COATING,
  VEHICLE_SIZES,
  WAX_OPTIONS,
  WAX_PRICE,
  WHEEL_EXTRA_PRICES,
  getKitPrice,
  getKitRetailTotal,
} from '@/constants/serviceBuilderCatalog'
import {
  CERAMIC_COATING_SECTIONS,
  COATING_SECTION_IMAGES,
} from '@/data/ceramicCoatingSections'
import { ServiceBuilderChoiceRail, SB_MOBILE_CARD_ROW } from '@/components/service-builder/ServiceBuilderChoiceRail'

const ALL_FINISH_IMAGES = [
  ...CERAMIC_COATING_SECTIONS.map((c) => COATING_SECTION_IMAGES[c.id]).filter(Boolean),
  ...WAX_OPTIONS.map((w) => w.image),
]

function usePreloadImages(srcs: string[]) {
  const cached = useRef(new Set<string>())
  useEffect(() => {
    for (const src of srcs) {
      if (cached.current.has(src)) continue
      cached.current.add(src)
      const img = new Image()
      img.src = src
    }
  }, [srcs])
}

const VEHICLE_SIZE_IMAGES: Record<string, string> = {
  Compact: '/servicebuilder/Compact.webp',
  Medium: '/servicebuilder/Normal.jpg',
  Large: '/servicebuilder/Large.jpg',
  Exotic: '/servicebuilder/Exotics.webp',
}

export function serviceBuilderFivePointScale(value: number) {
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

type Props = {
  form: ServiceBuilderFormApi
  vehicleStepRef?: RefObject<HTMLElement | null>
  showGarageImport: boolean
  showEstimateBar?: boolean
  firstSectionScrollMarginTopPx?: number
}

export function ServiceBuilderConfigurationBody({
  form,
  vehicleStepRef,
  showGarageImport,
  showEstimateBar = false,
  firstSectionScrollMarginTopPx = 0,
}: Props) {
  const {
    selectedVehicleSize,
    setSelectedVehicleSize,
    selectedPaintCondition,
    setSelectedPaintCondition,
    selectedCoatingId,
    setSelectedCoatingId,
    selectedWaxId,
    setSelectedWaxId,
    selectedFinishType,
    setSelectedFinishType,
    selectedKitIds,
    setSelectedKitIds,
    selectedWheelExtra,
    setSelectedWheelExtra,
    isLoggedIn,
    isAuthLoading,
    setGarageSheetOpen,
    importedVehicle,
    totalPrice,
    canProceed,
    setReviewSheetOpen,
  } = form

  usePreloadImages(ALL_FINISH_IMAGES)

  const handleFinishTypeSwitch = (type: 'coating' | 'wax') => {
    setSelectedFinishType(type)
    if (type === 'coating') setSelectedWaxId(null)
    else setSelectedCoatingId(null)
  }

  const toggleKit = (id: string) => {
    setSelectedKitIds((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id],
    )
  }

  return (
    <div className={cn('flex min-h-0 flex-col', showEstimateBar && 'gap-0')}>
      <div className={cn('space-y-10 md:space-y-12', showEstimateBar && 'pb-28 md:pb-32')}>

        {/* Step 1 — Vehicle Size */}
        <article
          ref={vehicleStepRef}
          className="border-t border-black/10 pt-8 transition md:pt-10"
          style={{ scrollMarginTop: firstSectionScrollMarginTopPx }}
        >
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <h2 className="font-nav text-2xl font-bold">Start with your vehicle size</h2>
              <p className="mt-2 text-sm text-[#424245]">
                Base price includes a full wash &amp; decontamination of your vehicle.
              </p>
              {importedVehicle ? (
                <p className="mt-2 text-sm font-medium text-[#0485F7]">
                  From My Garage: {importedVehicle.year} {importedVehicle.brand} {importedVehicle.model}
                </p>
              ) : null}
              {!isLoggedIn && !isAuthLoading ? (
                <p className="mt-2 text-sm text-[#424245]">You can complete your service request without an account.</p>
              ) : null}
            </div>
            {showGarageImport && isLoggedIn ? (
              <AppleButton
                type="button"
                className="touch-manipulation min-h-[44px] w-full justify-center sm:w-auto sm:min-w-0 sm:shrink-0 !border-black !bg-black !text-white hover:!border-[#2b2b2d] hover:!bg-[#2b2b2d]"
                onClick={() => setGarageSheetOpen(true)}
              >
                Import yours
              </AppleButton>
            ) : null}
          </div>

          <ServiceBuilderChoiceRail>
            {VEHICLE_SIZES.map((size) => {
              const selected = selectedVehicleSize === size.id
              const startingPrice = PAINT_CORRECTION_PRICES[size.id]['Like New']
              return (
                <button
                  key={size.id}
                  type="button"
                  onClick={() => setSelectedVehicleSize((prev) => (prev === size.id ? null : size.id))}
                  className={cn(
                    SB_MOBILE_CARD_ROW,
                    'touch-manipulation rounded-2xl border p-3 text-left transition',
                    selected
                      ? 'border-[#0485F7] bg-[#0485F7]/10 shadow-[0_8px_24px_rgba(4,133,247,0.12)]'
                      : 'border-black/10 bg-white hover:bg-black/[0.015]',
                  )}
                >
                  <img
                    src={VEHICLE_SIZE_IMAGES[size.id] ?? '/servicebuilder/Compact.webp'}
                    alt={size.label}
                    className="mb-3 h-36 w-full rounded-xl object-cover"
                    draggable={false}
                  />
                  <p className="font-nav text-lg font-bold">{size.label}</p>
                  <p className="text-sm text-[#6e6e73]">Starting at ${startingPrice}</p>
                </button>
              )
            })}
          </ServiceBuilderChoiceRail>
        </article>

        {/* Step 2 — Paint Condition */}
        <article className="border-t border-black/10 pt-8 transition md:pt-10">
          <div className="mb-5">
            <h2 className="font-nav text-2xl font-bold">Evaluate your paint condition</h2>
            <p className="mt-2 text-sm text-[#424245]">This helps us determine the level of correction needed.</p>
          </div>
          <ServiceBuilderChoiceRail>
            {PAINT_CONDITIONS.map((condition) => {
              const selected = selectedPaintCondition === condition.id
              const price = selectedVehicleSize
                ? PAINT_CORRECTION_PRICES[selectedVehicleSize]?.[condition.id]
                : null
              return (
                <button
                  key={condition.id}
                  type="button"
                  onClick={() =>
                    setSelectedPaintCondition((prev) => (prev === condition.id ? null : condition.id))
                  }
                  className={cn(
                    SB_MOBILE_CARD_ROW,
                    'touch-manipulation rounded-2xl border p-3 text-left transition',
                    selected
                      ? 'border-[#0485F7] bg-[#0485F7]/10 shadow-[0_8px_24px_rgba(4,133,247,0.12)]'
                      : 'border-black/10 bg-white hover:bg-black/[0.015]',
                  )}
                >
                  <img
                    src={condition.image}
                    alt={condition.title}
                    className="mb-3 h-36 w-full rounded-xl object-cover"
                    draggable={false}
                  />
                  <p className="font-nav text-lg font-bold">{condition.title}</p>
                  <p className="mt-1 text-sm text-[#424245]">{condition.description}</p>
                  {price != null ? (
                    <p className="mt-1.5 text-sm font-semibold text-[#1d1d1f]">${price}</p>
                  ) : null}
                </button>
              )
            })}
          </ServiceBuilderChoiceRail>
        </article>

        {/* Step 3 — Finish: Ceramic Coating OR Wax */}
        <article className="border-t border-black/10 pt-8 transition md:pt-10">
          <div className="mb-5">
            <h2 className="font-nav text-2xl font-bold">Choose your finish</h2>
            <p className="mt-2 text-sm text-[#424245]">
              Long-term ceramic protection or a premium wax — pick one.
            </p>
          </div>

          {/* Toggle coating / wax */}
          <div className="mb-6 inline-flex rounded-full border border-black/10 bg-[#f5f5f7] p-1 gap-1">
            <button
              type="button"
              onClick={() => handleFinishTypeSwitch('coating')}
              className={cn(
                'rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200',
                selectedFinishType === 'coating'
                  ? 'bg-white text-[#1d1d1f] shadow-sm'
                  : 'text-[#6e6e73] hover:text-[#1d1d1f]',
              )}
            >
              Ceramic Coating
            </button>
            <button
              type="button"
              onClick={() => handleFinishTypeSwitch('wax')}
              className={cn(
                'rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200',
                selectedFinishType === 'wax'
                  ? 'bg-white text-[#1d1d1f] shadow-sm'
                  : 'text-[#6e6e73] hover:text-[#1d1d1f]',
              )}
            >
              Wax Finish
            </button>
          </div>

          {selectedFinishType === 'coating' ? (
            <ServiceBuilderChoiceRail>
              {CERAMIC_COATING_SECTIONS.map((coating) => {
                const selected = selectedCoatingId === coating.id
                return (
                  <button
                    key={coating.id}
                    type="button"
                    onClick={() => setSelectedCoatingId((prev) => (prev === coating.id ? null : coating.id))}
                    className={cn(
                      SB_MOBILE_CARD_ROW,
                      'w-full touch-manipulation rounded-2xl border p-3 text-left transition',
                      selected
                        ? 'border-[#0485F7] bg-[#0485F7]/10 shadow-[0_8px_24px_rgba(4,133,247,0.12)]'
                        : 'border-black/10 bg-white hover:bg-black/[0.015]',
                    )}
                  >
                    <img
                      src={COATING_SECTION_IMAGES[coating.id]}
                      alt={coating.name}
                      className="mb-3 h-40 w-full rounded-xl object-contain bg-[#f6f6f7]"
                      draggable={false}
                    />
                    <p className="font-nav text-lg font-bold">{coating.name}</p>
                    <p className="text-sm text-[#6e6e73]">{coating.years} durability</p>
                    <p className="mt-1 text-sm font-semibold text-[#1d1d1f]">${coating.price.toLocaleString()}</p>
                    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-[#424245]">
                      <p>Hardness: {coating.gauges.hardness}%</p>
                      <p>Gloss: {coating.gauges.gloss}%</p>
                      <p>Resistance: {coating.gauges.resistance}%</p>
                      <p>Hydrophobicity: {coating.gauges.hydrophobicity}%</p>
                    </div>
                  </button>
                )
              })}
            </ServiceBuilderChoiceRail>
          ) : (
            <ServiceBuilderChoiceRail>
              {WAX_OPTIONS.map((wax) => {
                const selected = selectedWaxId === wax.id
                return (
                  <button
                    key={wax.id}
                    type="button"
                    onClick={() => setSelectedWaxId((prev) => (prev === wax.id ? null : wax.id))}
                    className={cn(
                      SB_MOBILE_CARD_ROW,
                      'w-full touch-manipulation rounded-2xl border p-3 text-left transition',
                      selected
                        ? 'border-[#0485F7] bg-[#0485F7]/10 shadow-[0_8px_24px_rgba(4,133,247,0.12)]'
                        : 'border-black/10 bg-white hover:bg-black/[0.015]',
                    )}
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
                    <p className="mt-1 text-sm font-semibold text-[#1d1d1f]">${WAX_PRICE}</p>
                    <div className="mt-3 space-y-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#5c5c61]">
                      <div className="flex items-center justify-between gap-3">
                        <span>Hydrophobicity</span>
                        {serviceBuilderFivePointScale(wax.ratings.hydrophobicity)}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Slickness</span>
                        {serviceBuilderFivePointScale(wax.ratings.slickness)}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Gloss</span>
                        {serviceBuilderFivePointScale(wax.ratings.gloss)}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Application</span>
                        {serviceBuilderFivePointScale(wax.ratings.application)}
                      </div>
                    </div>
                  </button>
                )
              })}
            </ServiceBuilderChoiceRail>
          )}
        </article>

        {/* Step 4 — Product Kits (Extras) */}
        <article className="border-t border-black/10 pt-8 transition md:pt-10">
          <div className="mb-5 flex items-center gap-3">
            <h2 className="font-nav text-2xl font-bold">Add a product kit</h2>
            <span className="select-none inline-flex items-center gap-2 rounded-full bg-[#e9e9eb] px-3 py-1.5 text-xs font-semibold leading-none text-[#0485F7]">
              <span className="h-1 w-1 rounded-full bg-[#0485F7]" aria-hidden />
              <span>Extra</span>
            </span>
          </div>
          <p className="mb-6 text-sm text-[#424245]">
            Take home a curated kit — all products included at 20% off the individual price.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCT_KITS.map((kit) => {
              const selected = selectedKitIds.includes(kit.id)
              const retail = getKitRetailTotal(kit)
              const kitPrice = getKitPrice(kit)
              const discountPct = kit.discountLabel ?? `${Math.round((1 - kitPrice / retail) * 100)}%`
              return (
                <button
                  key={kit.id}
                  type="button"
                  onClick={() => toggleKit(kit.id)}
                  className={cn(
                    'touch-manipulation rounded-2xl border p-3 text-left transition w-full',
                    selected
                      ? 'border-[#0485F7] bg-[#0485F7]/10 shadow-[0_8px_24px_rgba(4,133,247,0.12)]'
                      : 'border-black/10 bg-white hover:bg-black/[0.015]',
                  )}
                >
                  <img
                    src={kit.image}
                    alt={kit.name}
                    className="mb-3 h-36 w-full rounded-xl object-cover bg-[#f6f6f7]"
                    draggable={false}
                  />

                  <p className="font-nav text-base font-bold mb-3">{kit.name}</p>

                  <ul className="mb-3 space-y-1">
                    {kit.items.map((item) => (
                      <li key={item.name} className="flex items-center gap-1.5 text-[12px] text-[#424245]">
                        <span className="h-1 w-1 shrink-0 rounded-full bg-[#6e6e73]" aria-hidden />
                        <span className="min-w-0 truncate">{item.name}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="border-t border-black/[0.06] pt-2.5 mt-2">
                    <div className="flex items-baseline justify-between gap-2">
                      {retail > 0 ? (
                        <span className="text-[11px] text-[#6e6e73] line-through">${retail.toFixed(2)}</span>
                      ) : (
                        <span />
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-[#0485F7]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#0485F7]">
                          −{discountPct}
                        </span>
                        <span className="font-nav text-base font-bold text-[#1d1d1f]">
                          ${kitPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </article>

        {/* Step 5 — Wheel Extra */}
        <article className="border-t border-black/10 pt-8 transition md:pt-10">
          <div className="mb-5 flex items-center gap-3">
            <h2 className="font-nav text-2xl font-bold">Wheel Treatment</h2>
            <span className="select-none inline-flex items-center gap-2 rounded-full bg-[#e9e9eb] px-3 py-1.5 text-xs font-semibold leading-none text-[#0485F7]">
              <span className="h-1 w-1 rounded-full bg-[#0485F7]" aria-hidden />
              <span>Extra</span>
            </span>
          </div>
          <p className="mb-6 text-sm text-[#424245]">
            Protect your wheels with a premium wax or a Talon ceramic coating.
          </p>

          <ServiceBuilderChoiceRail>
            {/* Wax option */}
            {(() => {
              const wheelWax = WAX_OPTIONS.find((w) => w.id === 'wheel-wax-130g')!
              return (
                <button
                  type="button"
                  onClick={() => setSelectedWheelExtra((prev) => (prev === 'wax' ? null : 'wax'))}
                  className={cn(
                    SB_MOBILE_CARD_ROW,
                    'w-full touch-manipulation rounded-2xl border p-3 text-left transition',
                    selectedWheelExtra === 'wax'
                      ? 'border-[#0485F7] bg-[#0485F7]/10 shadow-[0_8px_24px_rgba(4,133,247,0.12)]'
                      : 'border-black/10 bg-white hover:bg-black/[0.015]',
                  )}
                >
                  <div className="mb-3 h-40 w-full overflow-hidden rounded-xl bg-[#f6f6f7]">
                    <img
                      src={wheelWax.image}
                      alt={wheelWax.name}
                      className="h-full w-full scale-[1.03] object-cover object-center"
                      draggable={false}
                    />
                  </div>
                  <p className="font-nav text-sm font-bold leading-snug">{wheelWax.name}</p>
                  <p className="mt-1 text-sm font-semibold text-[#1d1d1f]">${WHEEL_EXTRA_PRICES.wax}</p>
                  <div className="mt-3 space-y-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#5c5c61]">
                    <div className="flex items-center justify-between gap-3">
                      <span>Hydrophobicity</span>
                      {serviceBuilderFivePointScale(wheelWax.ratings.hydrophobicity)}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Slickness</span>
                      {serviceBuilderFivePointScale(wheelWax.ratings.slickness)}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Gloss</span>
                      {serviceBuilderFivePointScale(wheelWax.ratings.gloss)}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Application</span>
                      {serviceBuilderFivePointScale(wheelWax.ratings.application)}
                    </div>
                  </div>
                </button>
              )
            })()}

            {/* Talon Coating option */}
            <button
              type="button"
              onClick={() => setSelectedWheelExtra((prev) => (prev === 'coating' ? null : 'coating'))}
              className={cn(
                SB_MOBILE_CARD_ROW,
                'w-full touch-manipulation rounded-2xl border p-3 text-left transition',
                selectedWheelExtra === 'coating'
                  ? 'border-[#0485F7] bg-[#0485F7]/10 shadow-[0_8px_24px_rgba(4,133,247,0.12)]'
                  : 'border-black/10 bg-white hover:bg-black/[0.015]',
              )}
            >
              <img
                src={TALON_WHEEL_COATING.image}
                alt={TALON_WHEEL_COATING.name}
                className="mb-3 h-40 w-full rounded-xl object-contain bg-[#f6f6f7]"
                draggable={false}
              />
              <p className="font-nav text-lg font-bold">{TALON_WHEEL_COATING.name}</p>
              <p className="text-sm text-[#6e6e73]">Wheel ceramic coating</p>
              <p className="mt-1 text-sm font-semibold text-[#1d1d1f]">${WHEEL_EXTRA_PRICES.coating}</p>
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-[#424245]">
                <p>Hardness: {TALON_WHEEL_COATING.gauges.hardness}%</p>
                <p>Gloss: {TALON_WHEEL_COATING.gauges.gloss}%</p>
                <p>Resistance: {TALON_WHEEL_COATING.gauges.resistance}%</p>
                <p>Hydrophobicity: {TALON_WHEEL_COATING.gauges.hydrophobicity}%</p>
              </div>
            </button>
          </ServiceBuilderChoiceRail>
        </article>

      </div>

      {showEstimateBar ? (
        <div className="sticky bottom-0 z-20 mt-auto flex flex-col gap-3 border-t border-black/[0.08] bg-[#f5f5f7]/95 px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom,12px))] shadow-[0_-6px_28px_rgba(0,0,0,0.07)] backdrop-blur-md supports-[backdrop-filter]:bg-[#f5f5f7]/90 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="min-w-0">
            <p className="text-[12px] font-medium tracking-normal text-[#6e6e73]">Estimate</p>
            <p className="font-nav text-xl font-bold tracking-tight text-[#1d1d1f]">
              ${totalPrice.toLocaleString()}
              <span className="ml-1 text-sm font-semibold text-[#6e6e73]">CAD</span>
            </p>
          </div>
          <AppleButton
            disabled={!canProceed}
            className="w-full shrink-0 justify-center sm:w-auto !rounded-full !px-6 !py-2.5 !text-[13px] disabled:!cursor-not-allowed disabled:!opacity-40"
            onClick={() => setReviewSheetOpen(true)}
          >
            Next step
          </AppleButton>
        </div>
      ) : null}
    </div>
  )
}
