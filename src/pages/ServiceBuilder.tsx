import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { IconChevronDown } from '@tabler/icons-react'
import { AppleButton } from '@/components/ui/AppleButton'
import { AppleSheet } from '@/components/ui/AppleSheet'
import { GarageAddVehicleFlow } from '@/components/MyGarageSection'
import { useNotifications } from '@/context/NotificationsContext'
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion'
import { cn } from '@/lib/utils'
import { isAuthenticated } from '@/utils/supabaseAuth'
import { fetchGarageVehicles, type GarageVehicleRow } from '@/utils/supabaseGarage'
import { XP_PER_DOLLAR } from '@/utils/supabaseXp'
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

const SERVICE_BUILDER_FAQS = [
  {
    q: 'Is the price estimate a final quote?',
    a: 'The estimate is a starting price based on your vehicle size and paint condition. The final price is confirmed by your installer after an in-person inspection. Additional factors such as heavily contaminated paint or specialty surfaces may affect the final cost.',
  },
  {
    q: 'What does paint condition affect in the estimate?',
    a: 'Paint condition determines the level of correction work needed before the coating can be applied. Light imperfections require a one-stage polish, while heavy defects require multi-stage machine correction — each adding to the preparation time and cost.',
  },
  {
    q: 'Can I modify or cancel my service request after sending?',
    a: 'Yes. Since your request is reviewed manually by our team before any appointment is confirmed, you can contact us directly to update your configuration, change your coating choice, or cancel altogether at no charge.',
  },
  {
    q: 'Do I earn XP for submitting a service request?',
    a: 'XP is awarded once your service request is reviewed and approved by a certified installer — not at submission. The estimated XP shown during configuration gives you a preview of what you stand to earn when the service is completed.',
  },
  {
    q: 'What happens after I send my service request?',
    a: "Our team reviews your configuration and will follow up by email and phone to confirm details and schedule your appointment. You will also receive a request confirmation number to track your service in your account dashboard if you're signed in.",
  },
]

function ServiceBuilderFAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-black/10">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="pr-6 text-sm font-semibold text-[#1d1d1f] md:text-base">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className="shrink-0">
          <IconChevronDown size={16} className="text-[#86868b]" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-[#424245]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function ServiceBuilder() {
  const { notify } = useNotifications()
  const reduceMotion = useEffectiveReducedMotion()
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
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false)
  const [successSheetOpen, setSuccessSheetOpen] = useState(false)
  const [requestNumber, setRequestNumber] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [contactFirstName, setContactFirstName] = useState('')
  const [contactLastName, setContactLastName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [uploadedVehicleImages, setUploadedVehicleImages] = useState<File[]>([])
  const [vehicleMakeInput, setVehicleMakeInput] = useState('')
  const [vehicleModelInput, setVehicleModelInput] = useState('')
  const [vehicleYearInput, setVehicleYearInput] = useState('')
  const heroRef = useRef<HTMLElement | null>(null)
  const [heroPassed, setHeroPassed] = useState(false)

  const refreshAuthState = useCallback(async () => {
    const ok = await isAuthenticated()
    setIsLoggedIn(ok)
  }, [])

  useEffect(() => {
    const root = document.getElementById('app-scroll-root')
    const hero = heroRef.current
    if (!root || !hero) return

    const io = new IntersectionObserver(
      ([entry]) => {
        setHeroPassed(!entry.isIntersecting)
      },
      { root, threshold: 0 },
    )
    io.observe(hero)
    return () => io.disconnect()
  }, [])

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

  useEffect(() => {
    const onFocus = () => {
      void refreshAuthState()
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshAuthState()
      }
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [refreshAuthState])

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

  const estimatedXp = useMemo(
    () => Math.max(0, Math.round(totalPrice * XP_PER_DOLLAR)),
    [totalPrice],
  )

  const canProceed =
    selectedVehicleSize !== null &&
    selectedPaintCondition !== null &&
    selectedCoatingId !== null

  const isReviewFormValid = useMemo(() => {
    const hasVehicleModel = vehicleModelInput.trim().length > 0
    const hasPhone = contactPhone.trim().length > 0
    if (isLoggedIn) return hasVehicleModel
    return (
      hasVehicleModel &&
      hasPhone &&
      vehicleMakeInput.trim().length > 0 &&
      vehicleYearInput.trim().length > 0 &&
      contactFirstName.trim().length > 0 &&
      contactLastName.trim().length > 0 &&
      contactEmail.trim().length > 0
    )
  }, [
    isLoggedIn,
    vehicleModelInput,
    contactPhone,
    vehicleMakeInput,
    vehicleYearInput,
    contactFirstName,
    contactLastName,
    contactEmail,
  ])

  const coatingName = useMemo(
    () => CERAMIC_COATING_SECTIONS.find((c) => c.id === selectedCoatingId)?.name ?? '',
    [selectedCoatingId],
  )
  const waxName = useMemo(
    () => (selectedWaxId ? WAX_OPTIONS.find((w) => w.id === selectedWaxId)?.name ?? '' : ''),
    [selectedWaxId],
  )

  useEffect(() => {
    if (!importedVehicle) return
    setVehicleMakeInput(importedVehicle.brand ?? '')
    setVehicleModelInput(importedVehicle.model ?? '')
    setVehicleYearInput(importedVehicle.year ? String(importedVehicle.year) : '')
  }, [importedVehicle])

  const generateRequestNumber = useCallback(() => {
    const now = new Date()
    const yyyy = now.getFullYear()
    const rnd = Math.floor(100000 + Math.random() * 900000)
    return `FB-SRV-${yyyy}-${rnd}`
  }, [])

  const handleSendService = useCallback(async () => {
    if (!isReviewFormValid || isSending) return
    setIsSending(true)
    const generatedRequestNumber = generateRequestNumber()
    setRequestNumber(generatedRequestNumber)
    setReviewSheetOpen(false)
    setSuccessSheetOpen(true)
    setIsSending(false)
    notify({ title: 'Service request sent successfully.', message: '', kind: 'success' })
  }, [
    isReviewFormValid,
    isSending,
    generateRequestNumber,
    notify,
    selectedVehicleSize,
    selectedPaintCondition,
    coatingName,
    waxName,
  ])

  const handleCopyRequestNumber = useCallback(async () => {
    if (!requestNumber) return
    try {
      await navigator.clipboard.writeText(requestNumber)
      notify({ title: 'Request number copied.', message: '', kind: 'success' })
    } catch {
      notify({ title: 'Unable to copy request number.', message: '', kind: 'error' })
    }
  }, [requestNumber, notify])

  const handleVehicleImagesChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    setUploadedVehicleImages(files.slice(0, 6))
  }, [])

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

  const bannerTransition = reduceMotion
    ? ''
    : 'transition-[max-height,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'

  return (
    <section className="relative min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <header ref={heroRef} className="relative isolate overflow-hidden border-b border-black/10">
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
            <motion.h1
              className="font-nav text-4xl font-bold leading-tight text-white md:text-6xl"
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            >
              Configure your service
            </motion.h1>
            <motion.p
              className="mt-4 text-sm text-white md:text-base"
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              A simple way to plan, customize, and manage your vehicle care.
            </motion.p>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <AppleButton
                className="mt-6 mx-auto"
                onClick={() => {
                  vehicleStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                Get started
              </AppleButton>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Bannière prix / Send : uniquement après avoir dépassé le hero (slide depuis le haut) */}
      <div
        className={cn(
          'sticky top-0 z-[119] overflow-hidden bg-[#f5f5f7]/95 backdrop-blur-md supports-[backdrop-filter]:bg-[#f5f5f7]/88',
          bannerTransition,
          heroPassed
            ? 'max-h-[96px] translate-y-0 border-b border-black/[0.08] opacity-100'
            : 'pointer-events-none max-h-0 -translate-y-full opacity-0',
        )}
        aria-hidden={!heroPassed}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-3.5 md:px-8">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6e6e73]">Estimate</p>
            <p className="truncate font-nav text-2xl font-bold tracking-tight text-[#1d1d1f] md:text-[28px]">
              ${totalPrice}
              <span className="ml-1 text-base font-semibold text-[#6e6e73] md:text-lg">CAD</span>
            </p>
          </div>
          <AppleButton
            disabled={!canProceed}
            className="shrink-0 !rounded-full !px-6 !py-2.5 !text-[13px] disabled:!cursor-not-allowed disabled:!opacity-40"
            onClick={() => setReviewSheetOpen(true)}
          >
            Next step
          </AppleButton>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-6 py-12 pb-16 md:px-8 md:py-16 md:pb-20">
        <div className="space-y-28 md:space-y-36">
          <article
            ref={vehicleStepRef}
            className="border-t border-black/10 pt-10 transition"
            style={{ scrollMarginTop: heroPassed ? 72 : 0 }}
          >
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
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
                    You can complete your service request without an account.
                  </p>
                ) : null}
              </div>
              {isLoggedIn ? (
                <AppleButton
                  type="button"
                  className="touch-manipulation min-h-[44px] w-full justify-center sm:w-auto sm:min-w-0 sm:shrink-0 !border-black !bg-black !text-white hover:!border-[#2b2b2d] hover:!bg-[#2b2b2d]"
                  onClick={() => setGarageSheetOpen(true)}
                >
                  Import yours
                </AppleButton>
              ) : null}
            </div>

            <div className="grid grid-cols-4 gap-4">
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
        </div>
      </div>

      <section className="border-t border-black/10 bg-white py-20 md:py-28">
        <div className="mx-auto w-full max-w-[1400px] px-6 md:px-8">
          <div className="grid gap-12 md:grid-cols-[280px_1fr]">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f] md:text-3xl">
                Common questions
              </h2>
              <p className="mt-2 text-sm text-[#6e6e73]">
                Everything you need before configuring your service.
              </p>
            </div>
            <div className="border-t border-black/10">
              {SERVICE_BUILDER_FAQS.map((f, i) => (
                <ServiceBuilderFAQItem key={i} q={f.q} a={f.a} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <AppleSheet
        open={reviewSheetOpen}
        onOpenChange={setReviewSheetOpen}
        title="Final review"
        zIndex={100_040}
        desktopWidthClassName="max-w-5xl"
        avoidHeaderOffset
      >
        <div className="px-4 pb-5">
          <div className="mb-5 rounded-[28px] bg-white px-4 py-4 shadow-[0_8px_22px_rgba(0,0,0,0.1)]">
            <div className="flex items-center gap-4">
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-[#0485F7]" aria-hidden>
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" aria-hidden>
                  <circle cx="10" cy="10" r="7.25" />
                  <path d="M10 8.25v5" />
                  <circle cx="10" cy="5.55" r="0.85" fill="currentColor" stroke="none" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[15px] font-semibold leading-tight text-[#0485F7]">
                    {isLoggedIn ? 'Connected account' : 'Not connected'}
                  </p>
                  {!isLoggedIn ? (
                    <Link to="/account" target="_blank" rel="noreferrer" className="shrink-0">
                      <AppleButton className="!rounded-full !px-4 !py-2 !text-[12px]">Sign in</AppleButton>
                    </Link>
                  ) : null}
                </div>
                <p className="mt-1 text-[14px] leading-relaxed text-[#6b7280]">
                  {isLoggedIn
                    ? `You are eligible to earn +${estimatedXp} XP if this service request is approved.`
                    : (
                      <>
                        Connect your account to be eligible for <span className="font-semibold text-[#1d1d1f]">+{estimatedXp} XP</span> if this service request is approved.
                      </>
                    )}
                </p>
              </div>
            </div>
          </div>

          <section className="pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6e6e73]">Service summary</p>
            <div className="mt-3 space-y-1.5 text-[14px] text-[#2b2b2d]">
              <p>Vehicle size: <span className="font-semibold">{selectedVehicleSize ?? '-'}</span></p>
              <p>Paint condition: <span className="font-semibold">{selectedPaintCondition ?? '-'}</span></p>
              <p>Coating: <span className="font-semibold">{coatingName || '-'}</span></p>
              <p>Wax: <span className="font-semibold">{waxName || 'None'}</span></p>
              <p className="pt-1 text-[17px] font-semibold text-[#1d1d1f]">Total estimate: ${totalPrice} CAD</p>
            </div>
          </section>

          <div className="h-px bg-black/10" />

          <section className="pt-4 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6e6e73]">Vehicle information</p>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              {!isLoggedIn ? (
                <>
                  <input
                    value={vehicleMakeInput}
                    onChange={(e) => setVehicleMakeInput(e.target.value)}
                    placeholder="Vehicle make"
                    className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm text-[#1d1d1f] placeholder:text-[#86868b] outline-none focus:border-[#0485F7]"
                  />
                  <input
                    value={vehicleModelInput}
                    onChange={(e) => setVehicleModelInput(e.target.value)}
                    placeholder="Vehicle model"
                    className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm text-[#1d1d1f] placeholder:text-[#86868b] outline-none focus:border-[#0485F7]"
                  />
                  <input
                    value={vehicleYearInput}
                    onChange={(e) => setVehicleYearInput(e.target.value)}
                    placeholder="Vehicle year"
                    className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm text-[#1d1d1f] placeholder:text-[#86868b] outline-none focus:border-[#0485F7]"
                  />
                </>
              ) : (
                <>
                  <input
                    value={vehicleModelInput}
                    onChange={(e) => setVehicleModelInput(e.target.value)}
                    placeholder="Vehicle model"
                    className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm text-[#1d1d1f] placeholder:text-[#86868b] outline-none focus:border-[#0485F7]"
                  />
                  <input
                    value={vehicleMakeInput}
                    onChange={(e) => setVehicleMakeInput(e.target.value)}
                    placeholder="Vehicle make (optional)"
                    className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm text-[#1d1d1f] placeholder:text-[#86868b] outline-none focus:border-[#0485F7]"
                  />
                  <input
                    value={vehicleYearInput}
                    onChange={(e) => setVehicleYearInput(e.target.value)}
                    placeholder="Vehicle year (optional)"
                    className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm text-[#1d1d1f] placeholder:text-[#86868b] outline-none focus:border-[#0485F7]"
                  />
                </>
              )}
            </div>
          </section>

          <div className="h-px bg-black/10" />

          <section className="pt-4 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6e6e73]">Contact information</p>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                value={contactFirstName}
                onChange={(e) => setContactFirstName(e.target.value)}
                placeholder={isLoggedIn ? 'First name (optional)' : 'First name'}
                className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm text-[#1d1d1f] placeholder:text-[#86868b] outline-none focus:border-[#0485F7]"
              />
              <input
                value={contactLastName}
                onChange={(e) => setContactLastName(e.target.value)}
                placeholder={isLoggedIn ? 'Last name (optional)' : 'Last name'}
                className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm text-[#1d1d1f] placeholder:text-[#86868b] outline-none focus:border-[#0485F7]"
              />
              <input
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder={isLoggedIn ? 'Email (optional)' : 'Email'}
                className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm text-[#1d1d1f] placeholder:text-[#86868b] outline-none focus:border-[#0485F7]"
              />
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Contact phone number"
                className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm text-[#1d1d1f] placeholder:text-[#86868b] outline-none focus:border-[#0485F7]"
              />
            </div>
          </section>

          <div className="h-px bg-black/10" />

          <section className="pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6e6e73]">Extra details</p>
            <div className="mt-3 space-y-3">
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add a custom message for our team (paint concerns, schedule preference, etc.)"
                rows={4}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-[#1d1d1f] placeholder:text-[#86868b] outline-none focus:border-[#0485F7]"
              />
              <div className="rounded-xl border border-dashed border-black/15 bg-[#fafafa] p-3">
                <label className="block text-[12px] font-medium text-[#424245]">
                  Add one or more photos of your vehicle
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleVehicleImagesChange}
                  className="mt-2 block w-full text-sm text-[#424245] file:mr-3 file:rounded-lg file:border-0 file:bg-[#ececef] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#1d1d1f] hover:file:bg-[#e2e2e6]"
                />
                {uploadedVehicleImages.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {uploadedVehicleImages.map((file) => (
                      <span key={file.name} className="rounded-full bg-white px-2.5 py-1 text-[11px] text-[#424245] border border-black/10">
                        {file.name}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <div className="mt-4 flex items-center justify-end gap-3">
            <AppleButton
              className="!border-[#ff3b3b]/25 !bg-white !text-[#ff3b3b]"
              onClick={() =>
                notify({
                  title: 'Unable to send service request.',
                  message: '',
                  kind: 'error',
                })
              }
            >
              Show error notification
            </AppleButton>
            <AppleButton
              className="!border-black/20 !bg-white !text-[#1d1d1f]"
              onClick={() => setReviewSheetOpen(false)}
            >
              Back
            </AppleButton>
            <AppleButton disabled={!isReviewFormValid || isSending} onClick={handleSendService}>
              {isSending ? 'Sending…' : 'Send my service'}
            </AppleButton>
          </div>
        </div>
      </AppleSheet>

      <AppleSheet open={successSheetOpen} onOpenChange={setSuccessSheetOpen} title="Request received" zIndex={100_050}>
        <div className="px-4 pb-5">
          <p className="text-xl font-semibold text-[#1d1d1f]">Thank you for sending your service request.</p>
          <p className="mt-2 text-sm leading-relaxed text-[#424245]">
            Our team will review your configuration and follow up shortly. You will receive updates by email and phone.
            {isLoggedIn ? ' You will also see this request in your dashboard.' : ''}
          </p>
          <div className="mt-6 border-t border-black/10 pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6e6e73]">Request number</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="font-mono text-[14px] font-semibold text-[#1d1d1f]">{requestNumber || '-'}</p>
              <button
                type="button"
                onClick={handleCopyRequestNumber}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f3f4f6] text-[#1d1d1f] transition hover:bg-[#e8e8ed]"
                aria-label="Copy request number"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </AppleSheet>

      <AppleSheet open={garageSheetOpen} onOpenChange={setGarageSheetOpen} title="My Garage" zIndex={100_020}>
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
        zIndex={100_030}
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
