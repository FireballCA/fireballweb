import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getCurrentUserProfile, isAuthenticated } from '@/utils/supabaseAuth'
import { MemberStatusHero } from '@/components/MemberStatusHero/MemberStatusHero'
import { AddVehicleModal } from '@/components/AddVehicleModal'
import { FireballLoading } from '@/components/FireballLoading'
import { ProductsPurchasedSheet } from '@/components/ProductsPurchasedSheet'
import { Footer } from '@/components/Layout/Footer'
import {
  fetchGarageVehicles,
  createGarageVehicle,
  updateGarageVehicle,
  deleteGarageVehicle,
} from '@/utils/supabaseGarage'

interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  ceramicProtectionDate: Date // Date de complétion de la protection
  protectionShop?: string
  protectionProduct?: string
}

type ProtectionStatus = 'green' | 'yellow' | 'red'
type SubscriptionTier = 'none' | 'ignition' | 'apex'
type UserRole = 'member' | 'partner' | 'admin'

const XP_TIERS = [
  {
    id: 'brushed_silver',
    index: 1,
    name: 'Brushed Silver',
    minXp: 0,
    colorClass: 'text-slate-100',
    headerLabel: 'TIER 1',
    benefits: [
      { text: 'Base access to Fireball ecosystem' },
      { text: 'Earn XP on every eligible purchase' },
      { text: 'Unlock higher tiers with continued activity' },
    ],
  },
  {
    id: 'titanium',
    index: 2,
    name: 'Titanium',
    minXp: 1200,
    colorClass: 'text-sky-300',
    headerLabel: 'TIER 2',
    benefits: [
      { text: 'Enhanced member recognition' },
      { text: 'Priority access to selected drops' },
      { text: 'Improved member-only pricing windows' },
    ],
  },
  {
    id: 'carbon_fiber',
    index: 3,
    name: 'Carbon Fiber',
    minXp: 8000,
    colorClass: 'text-zinc-100',
    headerLabel: 'TIER 3',
    benefits: [
      { text: 'High-tier member status' },
      { text: 'Invitations to selected private events' },
      { text: 'Access to advanced care recommendations' },
    ],
  },
  {
    id: 'obsidian',
    index: 4,
    name: 'Obsidian',
    minXp: 20000,
    colorClass: 'text-purple-300',
    headerLabel: 'TIER 4',
    benefits: [
      { text: 'Elite recognition across Fireball network' },
      { text: 'Priority access to limited technologies' },
      { text: 'Elevated support and guidance' },
    ],
  },
  {
    id: 'gold',
    index: 5,
    name: 'Gold',
    minXp: 35000,
    colorClass: 'text-amber-300',
    headerLabel: 'TIER 5',
    benefits: [
      { text: 'Top tier within Fireball membership' },
      { text: 'First access to the rarest drops' },
      { text: 'Invite-only experiences and privileges' },
    ],
  },
] as const

function getTierForXp(xp: number) {
  const sorted = [...XP_TIERS].sort((a, b) => a.minXp - b.minXp)
  let current = sorted[0]
  for (const tier of sorted) {
    if (xp >= tier.minXp) {
      current = tier
    } else {
      break
    }
  }
  const currentIndex = sorted.findIndex((t) => t.id === current.id)
  const next = currentIndex >= 0 && currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null
  return { current, next }
}

interface VehicleSettingsModalProps {
  vehicle: Vehicle
  onClose: () => void
  onUpdate: (updates: { brand: string; model: string; year: number }) => void
  onDelete: () => void
}

function VehicleSettingsModal({ vehicle, onClose, onUpdate, onDelete }: VehicleSettingsModalProps) {
  const [brand, setBrand] = useState(vehicle.brand)
  const [model, setModel] = useState(vehicle.model)
  const [year, setYear] = useState(vehicle.year.toString())

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  const lastProtection = vehicle.ceramicProtectionDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const handleSave = () => {
    const parsedYear = Number(year)
    if (!brand.trim() || !model.trim() || Number.isNaN(parsedYear)) return
    onUpdate({
      brand: brand.trim(),
      model: model.trim(),
      year: parsedYear,
    })
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.35)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      />
      <div
        className="relative max-w-2xl w-full rounded-3xl p-8"
        style={{
          background:
            'linear-gradient(135deg, rgba(40, 40, 40, 0.96) 0%, rgba(22, 22, 22, 0.96) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow:
            '0 18px 45px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 0 0 1px rgba(255,255,255,0.03)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-nav uppercase text-white/60 tracking-[0.18em]">
              Vehicle settings
            </p>
            <h3 className="mt-2 text-xl text-white font-normal">
              {vehicle.brand} <span className="font-bold">{vehicle.model}</span> {vehicle.year}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div>
            <label className="block text-[11px] font-nav font-bold uppercase text-white/60 mb-1.5">
              Brand
            </label>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-sm text-white focus:outline-none focus:border-white/70"
            />
          </div>
          <div>
            <label className="block text-[11px] font-nav font-bold uppercase text-white/60 mb-1.5">
              Model
            </label>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-sm text-white focus:outline-none focus:border-white/70"
            />
          </div>
          <div>
            <label className="block text-[11px] font-nav font-bold uppercase text-white/60 mb-1.5">
              Year
            </label>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-sm text-white focus:outline-none focus:border-white/70"
            />
          </div>
        </div>

        <div className="mt-5 border-t border-white/12 pt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[11px] font-nav font-bold uppercase text-white/60 tracking-[0.18em]">
              Last protected
            </p>
            <p className="mt-1 text-sm text-white">{lastProtection}</p>
            {vehicle.protectionShop && (
              <p className="mt-0.5 text-xs text-white/70 inline-flex items-center gap-1.5">
                Applied at <span className="font-medium">{vehicle.protectionShop}</span>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-white/25 text-white/80 hover:text-white hover:border-white/70 transition-colors"
                  aria-label="Open business details"
                >
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 17L17 7M9 7h8v8"
                    />
                  </svg>
                </a>
              </p>
            )}
            {vehicle.protectionProduct && (
              <p className="mt-0.5 text-xs text-white/70">
                Protected with{' '}
                <span className="font-medium">{vehicle.protectionProduct}</span>
              </p>
            )}
          </div>
          <div className="flex flex-col items-stretch md:items-end gap-2 min-w-[240px]">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/25 bg-white/[0.05] text-[11px] font-nav uppercase tracking-[0.18em] text-white/85 hover:bg-white/[0.15] hover:border-white/60 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 3v3m8-3v3M5 9h14M7 12h4m-4 4h4M5 5h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
                />
              </svg>
              Book your next appointment
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onDelete}
            className="px-4 py-2.5 rounded-xl border border-red-500/50 text-xs font-nav uppercase tracking-[0.16em] text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Delete vehicle
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/20 text-xs font-nav uppercase tracking-[0.16em] text-white/80 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2.5 rounded-xl bg-white text-black text-xs font-nav uppercase tracking-[0.16em] hover:bg-white/90 transition-colors"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AccountDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const pageState = (location.state as { fromRegister?: boolean; welcomeName?: string; shopifySyncError?: string | null } | null) || null
  const [fullName, setFullName] = useState('')
  const [xp, setXp] = useState(0)
  const [shopifySyncWarning] = useState<string | null>(pageState?.shopifySyncError || null)
  const [welcomeName, setWelcomeName] = useState<string | null>(null)
  const [welcomeLineVisible, setWelcomeLineVisible] = useState(false)
  const [subtitleVisible, setSubtitleVisible] = useState(false)
  const [enterButtonVisible, setEnterButtonVisible] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [isEnteringDashboard, setIsEnteringDashboard] = useState(false)
  const [carModalOpen, setCarModalOpen] = useState(false)
  const [productsPurchasedOpen, setProductsPurchasedOpen] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [settingsVehicle, setSettingsVehicle] = useState<Vehicle | null>(null)
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('none')
  const [userRole, setUserRole] = useState<UserRole>('member')
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [partnerStatus, setPartnerStatus] = useState<string | null>(null)
  const [memberId, setMemberId] = useState<string | null>(null)
  const [barcodeValue, setBarcodeValue] = useState<string | null>(null)
  
  useEffect(() => {
    const checkAuthAndLoadProfile = async () => {
      // Vérifier l'authentification Supabase
      const authenticated = await isAuthenticated()
      
      if (!authenticated) {
        navigate('/account', { replace: true })
        return
      }

      // Charger le profil utilisateur
      const profile = await getCurrentUserProfile()
      
      // Récupérer le state une seule fois
      const state = pageState
      
      // Déterminer le nom complet
      let customerFullName = ''
      if (profile) {
        customerFullName = `${profile.first_name} ${profile.last_name}`.trim() || profile.email
        setSubscriptionTier(normalizeSubscriptionTier(profile.subscription_tier))
        setUserRole(normalizeUserRole(profile.role))
        setCompanyName(profile.company_name ?? null)
        const normalizedPartnerStatus = String(profile.partner_status || '').trim().toLowerCase()
        setPartnerStatus(normalizedPartnerStatus === 'declined' ? null : profile.partner_status ?? null)
        setXp(typeof profile.xp === 'number' ? profile.xp : 0)
        setMemberId(profile.external_member_id ?? null)
        setBarcodeValue(profile.barcode_value ?? profile.external_member_id ?? null)
      } else if (state?.welcomeName) {
        customerFullName = state.welcomeName
        setSubscriptionTier('none')
        setUserRole('member')
        setCompanyName(null)
        setPartnerStatus(null)
        setXp(0)
        setMemberId(null)
        setBarcodeValue(null)
      } else {
        customerFullName = 'Member'
        setSubscriptionTier('none')
        setUserRole('member')
        setCompanyName(null)
        setPartnerStatus(null)
        setXp(0)
        setMemberId(null)
        setBarcodeValue(null)
      }

      setFullName(customerFullName)

      // Charger les véhicules du garage depuis Supabase
      const rows = await fetchGarageVehicles()
      setVehicles(
        rows.map((row) => ({
          id: row.id,
          brand: row.brand,
          model: row.model,
          year: row.year,
          ceramicProtectionDate: new Date(row.ceramic_protection_date),
          protectionShop: row.protection_shop ?? undefined,
          protectionProduct: row.protection_product ?? undefined,
        }))
      )

      const shouldShowWelcome = state?.fromRegister === true && Boolean(state.welcomeName)
      if (!shouldShowWelcome) {
        setShowDashboard(true)
        return
      }
      setWelcomeName(state?.welcomeName ?? customerFullName)

    const lineTimer = window.setTimeout(() => setWelcomeLineVisible(true), 120)
    const subtitleTimer = window.setTimeout(() => setSubtitleVisible(true), 2600)
    const ctaTimer = window.setTimeout(() => setEnterButtonVisible(true), 3400)
    const safetyTimer = window.setTimeout(() => setShowDashboard(true), 20000)

      return () => {
        window.clearTimeout(lineTimer)
        window.clearTimeout(subtitleTimer)
        window.clearTimeout(ctaTimer)
        window.clearTimeout(safetyTimer)
      }
    }

    checkAuthAndLoadProfile()
  }, [pageState, navigate])

  const showWelcomeScreen = welcomeName !== null && !showDashboard
  const nameParts = (welcomeName ?? '').trim().split(/\s+/).filter(Boolean)
  const firstName = (nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0]) || 'Member'

  const { current: currentTier, next: nextTier } = getTierForXp(xp)
  const targetXp = nextTier ? nextTier.minXp : Math.max(currentTier.minXp || 1, xp || 1)

  // Calculer le statut de protection en fonction de la date
  const getProtectionStatus = (protectionDate: Date): ProtectionStatus => {
    const now = new Date()
    const diffTime = now.getTime() - protectionDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    // Supposons que la protection dure 6 mois (180 jours)
    const protectionDuration = 180
    const daysRemaining = protectionDuration - diffDays
    
    if (daysRemaining > 90) {
      return 'green' // Plus de 3 mois restants
    } else if (daysRemaining > 30) {
      return 'yellow' // Moins de 3 mois mais plus de 1 mois
    } else {
      return 'red' // Moins de 1 mois
    }
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const statusColors = {
    green: '#10B981', // Vert
    yellow: '#F59E0B', // Jaune
    red: '#EF4444', // Rouge
  }

  const normalizeSubscriptionTier = (tier?: string | null): SubscriptionTier => {
    const value = String(tier || '').trim().toLowerCase()
    if (value === 'ignition') return 'ignition'
    if (value === 'apex') return 'apex'
    return 'none'
  }

  const normalizeUserRole = (role?: string | null): UserRole => {
    const value = String(role || '').trim().toLowerCase()
    if (value === 'admin') return 'admin'
    if (value === 'partner') return 'partner'
    return 'member'
  }

  const subscriptionLabel = {
    none: 'None',
    ignition: 'Ignition',
    apex: 'Apex',
  } as const

  const subscriptionColorClass = {
    none: 'text-white/55',
    ignition: 'text-sky-400',
    apex: 'text-red-400',
  } as const

  const apexBenefits = [
    'Unlock $100 in premium products',
    'Highest member discount tier',
    'Priority support and concierge access',
    'Early access to exclusive drops',
    'Premium partner perks across Fireball network',
  ]

  const upcomingServices = [
    'Ceramic Protection Inspection',
    'Seasonal Surface Decontamination',
    'Premium Interior Detail Session',
  ]

  const certifiedPartners = [
    { name: 'Fireball Laval Studio', city: 'Laval, QC' },
    { name: 'Apex Detailing Montreal', city: 'Montreal, QC' },
    { name: 'North Shore Fireball Hub', city: 'Boisbriand, QC' },
  ]

  return (
    <section className="relative min-h-screen bg-[#0a0a0a] text-pearl">
      {isEnteringDashboard && (
        <div className="fixed inset-0 z-[135]">
          <FireballLoading />
        </div>
      )}
      {showWelcomeScreen && (
        <div className="fixed inset-0 z-[130] bg-black">
          <div className="h-full w-full flex items-center justify-center px-6">
            <div className="text-center">
              <h1
                className="font-nav font-bold text-5xl md:text-6xl text-white"
                style={{
                  clipPath: welcomeLineVisible ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
                  transform: welcomeLineVisible ? 'translateX(0)' : 'translateX(-22px)',
                  opacity: welcomeLineVisible ? 1 : 0.2,
                  transition:
                    'clip-path 2400ms cubic-bezier(0.22, 1, 0.36, 1), transform 2400ms cubic-bezier(0.22, 1, 0.36, 1), opacity 1800ms ease',
                }}
              >
                Welcome, {firstName}.
              </h1>
              <p
                className={`mt-7 text-[11px] md:text-xs font-nav font-bold uppercase tracking-[0.14em] text-silver/90 transition-all duration-[1400ms] ease-out ${
                  subtitleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                Your journey into fireball network starts here.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsEnteringDashboard(true)
                  setWelcomeName(null)
                  // Court delai pour eviter un flash vide, puis afficher le dashboard
                  window.setTimeout(() => {
                    setShowDashboard(true)
                    setIsEnteringDashboard(false)
                  }, 400)
                }}
                className={`mt-10 inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-nav font-bold text-white transition-all duration-700 hover:bg-white/20 ${
                  enterButtonVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                }`}
              >
                Access dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {showDashboard && (
        <div className="w-full relative bg-[#0a0a0a]">
          {shopifySyncWarning && (
            <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 pt-6">
              <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-amber-200 text-sm">
                Compte Supabase cree, mais la synchronisation Shopify a echoue: {shopifySyncWarning}
              </div>
            </div>
          )}
          <MemberStatusHero 
            userName={fullName || 'Anthony Bergeron'}
            currentXp={xp}
            targetXp={targetXp}
            isAdmin={userRole === 'admin'}
            companyName={companyName}
            partnerStatus={partnerStatus}
            tier={currentTier.headerLabel}
            benefits={currentTier.benefits}
            currentTierName={currentTier.name}
            currentTierColorClass={currentTier.colorClass}
            memberId={memberId}
            barcodeValue={barcodeValue}
            onProductsPurchasedClick={() => setProductsPurchasedOpen(true)}
          />
          <div 
            className="w-full bg-[#0a0a0a] relative z-20 overflow-hidden"
            style={{
              marginTop: '-40px',
              borderRadius: '45px 45px 45px 45px',
              boxShadow: '0 24px 36px rgba(0, 0, 0, 0.28)',
            }}
          >
            <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 pt-12 pb-24 md:pb-28">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-white text-5xl font-bold tracking-tight inline-flex items-center gap-3">
                  My Garage
                </h2>
                <button
                  type="button"
                  onClick={() => setCarModalOpen(true)}
                  className="group inline-flex items-center gap-2 text-sm font-nav text-white/80 hover:text-white transition-colors"
                >
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <svg
                      className="w-3.5 h-3.5 text-white/80 transition-transform duration-300 group-hover:rotate-90"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeWidth="2"
                        d="M6 6l12 12M18 6l-12 12"
                      />
                    </svg>
                  </span>
                  <span className="underline-offset-4 group-hover:underline">Add new car</span>
                </button>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {vehicles.map((vehicle) => {
                  const protectionStatus = getProtectionStatus(vehicle.ceramicProtectionDate)
                  return (
                    <article
                      key={vehicle.id}
                      className="group relative rounded-2xl border border-white/20 bg-white/[0.08] backdrop-blur-2xl shadow-[0_18px_40px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-white text-2xl font-normal">
                          {vehicle.brand} <span className="font-bold">{vehicle.model}</span> {vehicle.year}
                        </p>
                        <button
                          type="button"
                          onClick={() => setSettingsVehicle(vehicle)}
                          className="shrink-0 w-9 h-9 rounded-full border border-white/35 bg-white/[0.12] flex items-center justify-center text-white/80 backdrop-blur-xl shadow-[0_14px_35px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.55)] transition-all duration-300 opacity-0 scale-90 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-hover:border-white/80 group-hover:bg-white/[0.24]"
                          aria-label="Vehicle settings"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.89 3.31.877 2.42 2.42a1.724 1.724 0 0 0 1.065 2.572c1.757.426 1.757 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.89 1.543-.877 3.31-2.42 2.42a1.724 1.724 0 0 0-2.572 1.065c-.426 1.757-2.924 1.757-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.89-3.31-.877-2.42-2.42a1.724 1.724 0 0 0-1.065-2.572c-1.757-.426-1.757-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.89-1.543.877-3.31 2.42-2.42.996.575 2.255.05 2.572-1.065z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
                            />
                          </svg>
                        </button>
                      </div>

                      <div className="mt-5 flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: statusColors[protectionStatus] }}
                        />
                        <span className="text-white text-sm">Ceramic protection: Active</span>
                      </div>
                      <p className="mt-2 text-white/65 text-xs">
                        Completed the {formatDate(vehicle.ceramicProtectionDate)}
                      </p>
                    </article>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="w-full bg-[#0a0a0a] pt-24 pb-24">
            <div className="relative max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16">
              <p className="text-center text-xs md:text-sm text-white/55">
                Your current subscription :{' '}
                <span className={`font-semibold ${subscriptionColorClass[subscriptionTier]}`}>
                  {subscriptionLabel[subscriptionTier]}
                </span>
              </p>
              <h3 className="relative z-10 text-center text-white text-4xl md:text-6xl font-black tracking-tight">
                MEMBERSHIP
              </h3>
              <div className="-mt-3 md:-mt-4 flex justify-center pointer-events-none select-none">
                <p className="text-center text-[clamp(6rem,20vw,14rem)] font-black uppercase leading-[0.74] scale-y-[1.2] tracking-[-0.05em] bg-gradient-to-b from-white/[0.2] via-white/[0.08] to-transparent bg-clip-text text-transparent">
                  APEX
                </p>
              </div>

              <div className="hidden lg:block pointer-events-none absolute -left-28 top-[34px] z-0">
                <img
                  src="/Assets/DoubleCards.png"
                  alt="Club Member cards"
                  draggable={false}
                  className="w-[900px] max-w-none object-contain rotate-[8deg] opacity-100 drop-shadow-[0_22px_35px_rgba(0,0,0,0.45)] select-none"
                />
              </div>

              <div className="mt-8 lg:hidden flex items-center justify-center pointer-events-none">
                <img
                  src="/Assets/DoubleCards.png"
                  alt="Club Member cards"
                  draggable={false}
                  className="w-full max-w-[520px] object-contain rotate-[8deg] opacity-100 drop-shadow-[0_22px_35px_rgba(0,0,0,0.45)] select-none"
                />
              </div>

              <div className="mt-10 lg:mt-16 w-full lg:max-w-[620px] lg:ml-auto relative z-10">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">APEX BENEFITS</p>
                <div className="mt-4 flex flex-col gap-2.5">
                  {apexBenefits.map((benefit) => (
                    <div
                      key={benefit}
                      className="bg-[#252525] border border-white/10 text-white px-3.5 py-2.5 rounded-[8px] text-xs flex items-center gap-2 w-full"
                    >
                      <span className="text-red-400 text-sm select-none">+</span>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex justify-end">
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="inline-flex items-center gap-2 text-sm font-nav text-white/80 hover:text-white transition-colors"
                  >
                    <span>Join club</span>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 17L17 7M9 7h8v8"
                      />
                    </svg>
                  </a>
                </div>
              </div>

              <div className="mt-20 relative z-10">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">
                  UPCOMING SERVICES
                </p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {upcomingServices.map((service) => (
                    <article
                      key={service}
                      className="rounded-xl border border-white/10 bg-[#252525] px-4 py-4 text-white text-sm"
                    >
                      {service}
                    </article>
                  ))}
                </div>
              </div>

              <div id="certified-fireball-partners" className="mt-16 relative z-10 scroll-mt-28">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">
                  CERTIFIED FIREBALL PARTNERS
                </p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {certifiedPartners.map((partner) => (
                    <article
                      key={partner.name}
                      className="rounded-xl border border-white/10 bg-[#252525] px-4 py-4"
                    >
                      <p className="text-white text-sm font-semibold">{partner.name}</p>
                      <p className="mt-1 text-xs text-white/65">{partner.city}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <Footer />
          </div>
        </div>
      )}

      <AddVehicleModal
        isOpen={carModalOpen}
        onClose={() => setCarModalOpen(false)}
        onSelect={async (make, model, year) => {
          const row = await createGarageVehicle({
            brand: make,
            model,
            year,
            ceramicProtectionDate: new Date(),
          })
          if (!row) return
          setVehicles((prev) => [
            ...prev,
            {
              id: row.id,
              brand: row.brand,
              model: row.model,
              year: row.year,
              ceramicProtectionDate: new Date(row.ceramic_protection_date),
              protectionShop: row.protection_shop ?? undefined,
            },
          ])
        }}
      />
      <ProductsPurchasedSheet
        isOpen={productsPurchasedOpen}
        onClose={() => setProductsPurchasedOpen(false)}
      />
      {settingsVehicle && (
        <VehicleSettingsModal
          vehicle={settingsVehicle}
          onClose={() => setSettingsVehicle(null)}
          onUpdate={async (updates) => {
            const updated = await updateGarageVehicle(settingsVehicle.id, {
              brand: updates.brand,
              model: updates.model,
              year: updates.year,
            })
            if (!updated) return
            setVehicles((prev) =>
              prev.map((v) =>
                v.id === settingsVehicle.id
                  ? {
                      ...v,
                      brand: updates.brand,
                      model: updates.model,
                      year: updates.year,
                    }
                  : v
              )
            )
            setSettingsVehicle(null)
          }}
          onDelete={async () => {
            const ok = await deleteGarageVehicle(settingsVehicle.id)
            if (!ok) return
            setVehicles((prev) => prev.filter((v) => v.id !== settingsVehicle.id))
            setSettingsVehicle(null)
          }}
        />
      )}
    </section>
  )
}
