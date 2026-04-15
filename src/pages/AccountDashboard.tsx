import { useEffect, useState, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { getCurrentUserProfile, isAuthenticated } from '@/utils/supabaseAuth'
import { MemberStatusHero } from '@/components/MemberStatusHero/MemberStatusHero'
import { AddVehicleModal } from '@/components/AddVehicleModal'
import { AccountDashboardSkeleton } from '@/components/ui/AccountDashboardSkeleton'
import { ProductsPurchasedSheet } from '@/components/ProductsPurchasedSheet'
import { AdminPanelSheet } from '@/components/AdminPanelSheet'
import { SettingsSheet } from '@/components/SettingsSheet'
import { Footer } from '@/components/Layout/Footer'
import { appleButtonClassName } from '@/components/ui/AppleButton'
import {
  fetchGarageVehicles,
  createGarageVehicle,
  updateGarageVehicle,
  deleteGarageVehicle,
} from '@/utils/supabaseGarage'
import { ensureShopifyCustomerForProfile } from '@/utils/shopifySync'
import { getSafeReturnToPath } from '@/utils/safeReturnTo'
import { supabase } from '@/lib/supabase'
import { getClientCache, setClientCache } from '@/utils/clientCache'

interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  ceramicProtectionDate: Date // Date de complétion de la protection
  protectionShop?: string
  protectionProduct?: string
}

interface OrderLineItem {
  title: string
  price: number
  quantity: number
  imageUrl?: string
}

interface Order {
  id: string
  shopifyOrderId?: string
  name: string
  date?: string
  description?: string
  imageUrl?: string
  orderNumber?: string
  totalPrice?: number
  currency?: string
  lineItems?: OrderLineItem[]
  pointsEarned?: number
}

type SubscriptionTier = 'none' | 'ignition' | 'apex'
type UserRole = 'member' | 'partner' | 'admin'

interface DashboardNotification {
  id: string
  title: string | null
  message: string
  created_at: string
}

type LeaderboardEntry = {
  id: string
  label: string
  xp: number
}

type DashboardCacheSnapshot = {
  fullName: string
  xp: number
  subscriptionTier: SubscriptionTier
  userRole: UserRole
  companyName: string | null
  partnerStatus: string | null
  memberId: string | null
  barcodeValue: string | null
  vehicles: Vehicle[]
  orders: Order[]
  notifications: DashboardNotification[]
  latestNotification: DashboardNotification | null
  notificationDismissed: boolean
  currentUserId: string | null
}

const ACCOUNT_DASHBOARD_CACHE_KEY = 'account_dashboard_snapshot_v1'
const ACCOUNT_DASHBOARD_CACHE_TTL_MS = 1000 * 60 * 8

function formatOrderRef(orderNumber?: string | null): string {
  if (!orderNumber) return '-'
  // Utiliser directement le numéro de commande tel qu'il est stocké dans la base
  const raw = String(orderNumber).trim()
  // Si c'est déjà au format "#1066", on garde tel quel, sinon on extrait les chiffres
  if (raw.startsWith('#')) {
    return raw
  }
  const digits = raw.replace(/\D+/g, '')
  return digits ? `#${digits.padStart(5, '0')}` : raw
}

function getImageFromPurchaseRow(purchase: any): string | null {
  const direct =
    purchase?.image_url ||
    purchase?.product_image_url ||
    purchase?.first_product_image_url ||
    purchase?.first_item_image_url ||
    purchase?.featured_image ||
    null

  if (typeof direct === 'string' && direct.trim()) return direct.trim()

  const lineItemsRaw = purchase?.line_items || purchase?.items || purchase?.products || null
  if (lineItemsRaw) {
    try {
      const parsed = typeof lineItemsRaw === 'string' ? JSON.parse(lineItemsRaw) : lineItemsRaw
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0]
        const fromItem =
          first?.image_url ||
          first?.product_image_url ||
          first?.image ||
          first?.featured_image ||
          first?.image?.src ||
          first?.featured_image?.src ||
          null
        if (typeof fromItem === 'string' && fromItem.trim()) return fromItem.trim()
      }
    } catch {
      // Ignore malformed JSON stored in optional metadata fields.
    }
  }

  return null
}

function getFirstPurchaseItemFromPayload(payload: any): any | null {
  if (!payload) return null

  if (Array.isArray(payload)) {
    const firstObject = payload.find((item) => item && typeof item === 'object')
    return firstObject || null
  }

  if (typeof payload !== 'object') return null

  const lineItems =
    (payload as any).line_items ||
    (payload as any).items ||
    (payload as any).products ||
    null

  if (Array.isArray(lineItems) && lineItems.length > 0) {
    const firstObject = lineItems.find((item) => item && typeof item === 'object')
    if (firstObject) return firstObject
  }

  return null
}

function getTitleFromPurchaseRow(purchase: any): string | null {
  const directTitle =
    purchase?.product_title ||
    purchase?.first_product_title ||
    purchase?.title ||
    purchase?.name ||
    null

  if (typeof directTitle === 'string' && directTitle.trim()) return directTitle.trim()

  const payloadCandidates = [
    purchase?.line_items,
    purchase?.items,
    purchase?.products,
    purchase?.raw_payload,
    purchase?.payload,
    purchase?.shopify_payload,
    purchase?.order_payload,
    purchase?.metadata,
    purchase?.raw_order,
  ]

  for (const candidate of payloadCandidates) {
    if (!candidate) continue
    let parsed: any = candidate
    if (typeof candidate === 'string') {
      try {
        parsed = JSON.parse(candidate)
      } catch {
        continue
      }
    }
    const firstItem = getFirstPurchaseItemFromPayload(parsed)
    if (!firstItem) continue
    const title = firstItem?.product_title || firstItem?.title || firstItem?.name || null
    if (typeof title === 'string' && title.trim()) return title.trim()
  }

  return null
}

function getLineItemsFromPurchase(purchase: any): OrderLineItem[] {
  const lineItemsRaw =
    purchase?.line_items ||
    purchase?.items ||
    purchase?.products ||
    (purchase?.raw_payload && (() => {
      try {
        const p = typeof purchase.raw_payload === 'string' ? JSON.parse(purchase.raw_payload) : purchase.raw_payload
        return p?.line_items || p?.items || p?.products || null
      } catch {
        return null
      }
    })()) ||
    null

  if (!lineItemsRaw) return []

  try {
    const parsed = typeof lineItemsRaw === 'string' ? JSON.parse(lineItemsRaw) : lineItemsRaw
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((item: any) => item && typeof item === 'object')
      .map((item: any) => {
        const price =
          typeof item?.price === 'number'
            ? item.price
            : Number.parseFloat(String(item?.price ?? item?.original_unit_price ?? 0)) || 0
        const qty = Math.max(1, Number(item?.quantity) || 1)
        const img =
          item?.image_url ||
          item?.product_image_url ||
          item?.image?.src ||
          item?.featured_image?.src ||
          item?.image ||
          item?.featured_image ||
          null
        return {
          title:
            typeof (item?.product_title ?? item?.title ?? item?.name) === 'string'
              ? (item.product_title ?? item.title ?? item.name).trim()
              : 'Product',
          price,
          quantity: qty,
          imageUrl: typeof img === 'string' && img.trim() ? img.trim() : undefined,
        }
      })
  } catch {
    return []
  }
}

function OrdersEmptyStateSvg() {
  return (
    <svg width="171" height="216" viewBox="0 0 171 216" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[170px] h-auto">
      <rect x="0.48" y="0.48" width="169.4" height="214.43" fill="white" stroke="#BABABA" strokeWidth="0.95" />
      <path d="M33.78 39.12L46.78 38.02C48.4011 37.878 50.0218 38.2973 51.3707 39.2075C52.7196 40.1177 53.7149 41.4636 54.19 43.02L66.65 84.72L64.21 89.09C63.5833 90.216 63.2739 91.4909 63.3149 92.7789C63.3558 94.0669 63.7455 95.3196 64.4424 96.4035C65.1394 97.4874 66.1174 98.3619 67.2723 98.9336C68.4271 99.5053 69.7155 99.7529 71 99.65L120.9 95.41" stroke="#BABABA" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M56.05 49.35L114.05 44.43C114.621 44.381 115.196 44.4613 115.733 44.665C116.269 44.8686 116.752 45.1903 117.147 45.6062C117.542 46.0221 117.838 46.5216 118.013 47.0675C118.188 47.6135 118.239 48.192 118.16 48.76L114.23 77.13C114.111 77.9812 113.709 78.7675 113.088 79.3624C112.468 79.9573 111.665 80.3263 110.81 80.41L66.65 84.72L56.05 49.35Z" fill="white" stroke="#BABABA" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="76.55" cy="104.5" r="4.71" fill="white" stroke="#BABABA" />
      <circle cx="109.35" cy="101.72" r="4.71" fill="white" stroke="#BABABA" />
      <path d="M80.47 71.26C80.7091 69.4349 81.565 67.7465 82.8957 66.4747C84.2263 65.2029 85.9517 64.4242 87.7857 64.2678C89.6197 64.1113 91.4521 64.5866 92.9789 65.6146C94.5057 66.6427 95.6352 68.1618 96.18 69.92" stroke="#BABABA" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M66.5 157.5H104.5" stroke="#D0D0D0"/>
      <text x="85.5" y="176" textAnchor="middle" fill="#8B8B8B" fontSize="11" fontFamily="SF Pro, system-ui, sans-serif" fontWeight="600">
        NO ORDERS YET
      </text>
      <text x="85.5" y="191" textAnchor="middle" fill="#A0A0A0" fontSize="9" fontFamily="SF Pro, system-ui, sans-serif">
        Your purchases will appear here
      </text>
    </svg>
  )
}

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
  const pageState =
    (location.state as {
      fromRegister?: boolean
      welcomeName?: string
      shopifySyncError?: string | null
      redirectAfterWelcome?: string | null
    } | null) || null
  const redirectAfterWelcome = getSafeReturnToPath(pageState?.redirectAfterWelcome ?? null)
  const [fullName, setFullName] = useState('')
  const [xp, setXp] = useState(0)
  const [shopifySyncWarning] = useState<string | null>(pageState?.shopifySyncError || null)
  const [welcomeName, setWelcomeName] = useState<string | null>(null)
  const [welcomeLineVisible, setWelcomeLineVisible] = useState(false)
  const [subtitleVisible, setSubtitleVisible] = useState(false)
  const [enterButtonVisible, setEnterButtonVisible] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [isEnteringDashboard, setIsEnteringDashboard] = useState(false)
  const [dashboardDataLoaded, setDashboardDataLoaded] = useState(false)
  const [carModalOpen, setCarModalOpen] = useState(false)
  const [productsPurchasedOpen, setProductsPurchasedOpen] = useState(false)
  const [adminPanelOpen, setAdminPanelOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [leaderboardOpen, setLeaderboardOpen] = useState(false)
  const [trophyOpen, setTrophyOpen] = useState(false)
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [settingsVehicle, setSettingsVehicle] = useState<Vehicle | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [orderDetailsOrder, setOrderDetailsOrder] = useState<Order | null>(null)
  const [ordersCarouselIndex, setOrdersCarouselIndex] = useState(0)
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('none')
  const [userRole, setUserRole] = useState<UserRole>('member')
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [partnerStatus, setPartnerStatus] = useState<string | null>(null)
  const [memberId, setMemberId] = useState<string | null>(null)
  const [barcodeValue, setBarcodeValue] = useState<string | null>(null)
  const [latestNotification, setLatestNotification] = useState<DashboardNotification | null>(null)
  const [notifications, setNotifications] = useState<DashboardNotification[]>([])
  const [notificationDismissed, setNotificationDismissed] = useState(false)
  const [notificationsMenuOpen, setNotificationsMenuOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const notificationsMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (pageState?.fromRegister) return
    const cached = getClientCache<DashboardCacheSnapshot>(ACCOUNT_DASHBOARD_CACHE_KEY)
    if (!cached) return

    setFullName(cached.fullName || '')
    setXp(typeof cached.xp === 'number' ? cached.xp : 0)
    setSubscriptionTier(cached.subscriptionTier ?? 'none')
    setUserRole(cached.userRole ?? 'member')
    setCompanyName(cached.companyName ?? null)
    setPartnerStatus(cached.partnerStatus ?? null)
    setMemberId(cached.memberId ?? null)
    setBarcodeValue(cached.barcodeValue ?? null)
    setVehicles(Array.isArray(cached.vehicles) ? cached.vehicles : [])
    setOrders(Array.isArray(cached.orders) ? cached.orders : [])
    setNotifications(Array.isArray(cached.notifications) ? cached.notifications : [])
    setLatestNotification(cached.latestNotification ?? null)
    setNotificationDismissed(Boolean(cached.notificationDismissed))
    setCurrentUserId(cached.currentUserId ?? null)
    setShowDashboard(true)
    setDashboardDataLoaded(true)
  }, [pageState?.fromRegister])

  useEffect(() => {
    if (!notificationsMenuOpen) {
      return () => {
        // Cleanup toujours retourné pour éviter l'erreur React #310
      }
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target as Node)) {
        setNotificationsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [notificationsMenuOpen])
  
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
        if (profile.language && (profile.language === 'en' || profile.language === 'fr')) {
          const { default: i18n } = await import('@/i18n')
          if (i18n.language !== profile.language) {
            i18n.changeLanguage(profile.language)
          }
        }
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

      // Créer un client Shopify si absent (ex. utilisateur connecté via Google OAuth)
      if (profile?.email && !profile.shopify_customer_id) {
        ensureShopifyCustomerForProfile({
          id: profile.id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
        }).then(async (res) => {
          if (res.success && res.shopifyCustomerId) {
            await supabase
              .from('profiles')
              .update({ shopify_customer_id: res.shopifyCustomerId })
              .eq('id', profile.id)
          }
        }).catch((err) => {
          console.warn('Ensure Shopify customer failed:', err)
        })
      }

      // Charger la dernière notification destinée à cet utilisateur
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        const userId = user?.id
        if (userId) {
          setCurrentUserId(userId)
          const role: UserRole =
            profile && profile.role ? normalizeUserRole(profile.role) : 'member'
          const list = await fetchNotificationsForUser(userId, role)
          setNotifications(list)
          const latest = list[0] ?? null
          setLatestNotification(latest)
          setNotificationDismissed(!latest)
        }
      } catch (error) {
        console.error('Error loading dashboard notifications:', error)
      }

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

      // Charger les commandes Shopify/Supabase pour la section My Orders
      if (currentUserId || true) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser()
          const userId = user?.id

          if (userId) {
            const { data: purchases, error: purchasesError } = await supabase
              .from('purchases')
              .select('*')
              .eq('user_id', userId)
              .order('placed_at', { ascending: false })

            if (purchasesError) {
              console.warn('Failed to load purchases for dashboard cards', purchasesError.message)
              setOrders([])
            } else {
              const mappedOrders: Order[] = (purchases || []).map((purchase: any) => {
                const placedAt = purchase?.placed_at ? new Date(purchase.placed_at) : null
                const formattedDate =
                  placedAt && !Number.isNaN(placedAt.getTime())
                    ? placedAt.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
                    : undefined
                const extractedProductTitle = getTitleFromPurchaseRow(purchase)

                const purchaseImage = getImageFromPurchaseRow(purchase)

                const lineItems = getLineItemsFromPurchase(purchase)
                const pointsEarned =
                  typeof purchase?.points_earned === 'number'
                    ? purchase.points_earned
                    : typeof purchase?.xp_earned === 'number'
                      ? purchase.xp_earned
                      : undefined

                return {
                  id: String(purchase.id),
                  shopifyOrderId: purchase?.shopify_order_id ? String(purchase.shopify_order_id) : undefined,
                  orderNumber: purchase?.order_number ? String(purchase.order_number) : undefined,
                  name: extractedProductTitle || (purchase?.order_number ? String(purchase.order_number) : 'Order'),
                  date: formattedDate,
                  description: 'Product ordered via Fireball store.',
                  imageUrl: purchaseImage || '',
                  totalPrice:
                    typeof purchase?.total_price === 'number'
                      ? purchase.total_price
                      : Number.parseFloat(String(purchase?.total_price ?? '0')) || 0,
                  currency: purchase?.currency ? String(purchase.currency).toUpperCase() : 'CAD',
                  lineItems: lineItems.length > 0 ? lineItems : undefined,
                  pointsEarned,
                }
              })

              const shopifyOrderIds = mappedOrders
                .map((order) => order.shopifyOrderId)
                .filter((id): id is string => Boolean(id))

              if (shopifyOrderIds.length > 0) {
                try {
                  const previewResponse = await fetch('/api/shopify-order-preview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderIds: shopifyOrderIds }),
                  })
                  const previewJson = await previewResponse.json().catch(() => null)
                  const previews = (previewJson && typeof previewJson === 'object' ? (previewJson as any).previews : {}) || {}

                  const ordersWithPreview = mappedOrders.map((order) => {
                    const preview = order.shopifyOrderId ? previews[order.shopifyOrderId] : null
                    if (!preview) {
                      return {
                        ...order,
                        imageUrl: '',
                      }
                    }
                    return {
                      ...order,
                      name: preview.productTitle || order.name,
                      imageUrl: preview.imageUrl || order.imageUrl || '',
                      currency: preview.currency || order.currency,
                    }
                  })
                  setOrders(ordersWithPreview)
                } catch {
                  setOrders(mappedOrders)
                }
              } else {
                setOrders(mappedOrders)
              }
            }
          } else {
            setOrders([])
          }
        } catch (ordersError) {
          console.error('Error loading dashboard orders:', ordersError)
          setOrders([])
        }
      }

      setDashboardDataLoaded(true)

      const shouldShowWelcome = state?.fromRegister === true && Boolean(state.welcomeName)
      if (!shouldShowWelcome) {
        setShowDashboard(true)
        return
      }
      setWelcomeName(state?.welcomeName ?? customerFullName)

    const lineTimer = window.setTimeout(() => setWelcomeLineVisible(true), 120)
    const subtitleTimer = window.setTimeout(() => setSubtitleVisible(true), 2600)
    const ctaTimer = window.setTimeout(() => setEnterButtonVisible(true), 3400)
    const safeRedirect = getSafeReturnToPath(state?.redirectAfterWelcome ?? null)
    const safetyTimer = window.setTimeout(() => {
      if (safeRedirect) {
        navigate(safeRedirect, { replace: true })
      } else {
        setShowDashboard(true)
      }
    }, 20000)

      return () => {
        window.clearTimeout(lineTimer)
        window.clearTimeout(subtitleTimer)
        window.clearTimeout(ctaTimer)
        window.clearTimeout(safetyTimer)
      }
    }

    checkAuthAndLoadProfile()
  }, [pageState, navigate])

  useEffect(() => {
    if (!leaderboardOpen && !trophyOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLeaderboardOpen(false)
        setTrophyOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [leaderboardOpen, trophyOpen])

  useEffect(() => {
    if (!leaderboardOpen) return
    let cancelled = false
    const loadLeaderboard = async () => {
      setLeaderboardLoading(true)
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id,first_name,last_name,xp')
          .order('xp', { ascending: false })
          .limit(200)

        if (error) {
          console.warn('Failed to load leaderboard:', error.message)
          if (!cancelled) setLeaderboardEntries([])
          return
        }

        const entries: LeaderboardEntry[] = (data ?? [])
          .map((row: any) => {
            const first = String(row?.first_name || '').trim()
            const last = String(row?.last_name || '').trim()
            const id = String(row?.id || '')
            const xpValue = typeof row?.xp === 'number' ? row.xp : 0
            const label =
              first && last
                ? `${first} ${last.charAt(0).toUpperCase()}.`
                : first || last || 'Member'
            return { id, label, xp: xpValue }
          })
          .filter((entry) => entry.id)

        if (!cancelled) setLeaderboardEntries(entries)
      } finally {
        if (!cancelled) setLeaderboardLoading(false)
      }
    }
    void loadLeaderboard()
    return () => {
      cancelled = true
    }
  }, [leaderboardOpen])

  useEffect(() => {
    if (!leaderboardOpen && !trophyOpen) return
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
    }
  }, [leaderboardOpen, trophyOpen])

  const showWelcomeScreen = welcomeName !== null && !showDashboard
  const nameParts = (welcomeName ?? '').trim().split(/\s+/).filter(Boolean)
  const firstName = (nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0]) || 'Member'

  const { current: currentTier, next: nextTier } = getTierForXp(xp)
  const targetXp = nextTier ? nextTier.minXp : Math.max(currentTier.minXp || 1, xp || 1)

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

  const fetchNotificationsForUser = async (
    userId: string,
    role: UserRole,
  ): Promise<DashboardNotification[]> => {
    try {
      const [allRes, roleRes, userRes] = await Promise.all([
        supabase
          .from('user_notifications')
          .select('id,title,message,created_at,target_type')
          .eq('target_type', 'all')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('user_notifications')
          .select('id,title,message,created_at,target_type,target_role')
          .eq('target_type', 'role')
          .eq('target_role', role)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('user_notifications')
          .select('id,title,message,created_at,target_type,target_user_id')
          .eq('target_type', 'user')
          .eq('target_user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      const rows: DashboardNotification[] = []

      if (!allRes.error && allRes.data) {
        for (const row of allRes.data) {
          rows.push({
            id: row.id as string,
            title: (row as any).title ?? null,
            message: (row as any).message ?? '',
            created_at: (row as any).created_at as string,
          })
        }
      }

      if (!roleRes.error && roleRes.data) {
        for (const row of roleRes.data) {
          rows.push({
            id: row.id as string,
            title: (row as any).title ?? null,
            message: (row as any).message ?? '',
            created_at: (row as any).created_at as string,
          })
        }
      }

      if (!userRes.error && userRes.data) {
        for (const row of userRes.data) {
          rows.push({
            id: row.id as string,
            title: (row as any).title ?? null,
            message: (row as any).message ?? '',
            created_at: (row as any).created_at as string,
          })
        }
      }

      if (!rows.length) return []

      rows.sort((a, b) => {
        const aTime = new Date(a.created_at).getTime()
        const bTime = new Date(b.created_at).getTime()
        return bTime - aTime
      })

      return rows
    } catch (error) {
      console.error('Error fetching notifications for user:', error)
      return []
    }
  }

  const formatNotificationTimeAgo = (isoDate: string): string => {
    if (!isoDate) return ''
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) return ''
    try {
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoDate
    }
  }

  const displayOrders = useMemo(() => [...orders], [orders])
  const hasTwoOrders = displayOrders.length >= 2
  const hasThreeOrders = displayOrders.length >= 3
  const hasFourOrMoreOrders = displayOrders.length >= 4
  const showAddAnotherBlock = displayOrders.length > 0 && displayOrders.length < 3
  const carouselMaxIndex = Math.max(0, displayOrders.length - 3)
  const visiblePrimary = hasFourOrMoreOrders ? (displayOrders[ordersCarouselIndex] ?? null) : (displayOrders[0] ?? null)
  const visibleSecond = hasFourOrMoreOrders ? (displayOrders[ordersCarouselIndex + 1] ?? null) : (displayOrders[1] ?? null)
  const visibleThird = hasFourOrMoreOrders ? (displayOrders[ordersCarouselIndex + 2] ?? null) : (displayOrders[2] ?? null)

  const ordersSummaryPreview = displayOrders[0] ?? null
  const summaryFirstLine = ordersSummaryPreview?.lineItems?.[0]
  const summaryOrderTitle = summaryFirstLine?.title ?? ordersSummaryPreview?.name ?? 'Order'
  const summaryQty = summaryFirstLine?.quantity ?? 1
  const summaryLineUnit =
    typeof summaryFirstLine?.price === 'number' ? summaryFirstLine.price : undefined
  const summaryThumb = summaryFirstLine?.imageUrl || ordersSummaryPreview?.imageUrl
  const summaryTotal = ordersSummaryPreview?.totalPrice ?? 0
  const summaryCurrency = ordersSummaryPreview?.currency || 'CAD'
  const summaryTotalLabel = `${summaryTotal.toFixed(2)}$ ${summaryCurrency}`
  const summaryLinePriceLabel =
    summaryLineUnit !== undefined ? `${summaryLineUnit.toFixed(2)}$` : undefined
  const summaryXp =
    ordersSummaryPreview &&
    typeof ordersSummaryPreview.pointsEarned === 'number' &&
    Number.isFinite(ordersSummaryPreview.pointsEarned)
      ? ordersSummaryPreview.pointsEarned
      : null
  const personalLeaderboardIndex = leaderboardEntries.findIndex((entry) => entry.id === currentUserId)
  const personalLeaderboardRank = personalLeaderboardIndex >= 0 ? personalLeaderboardIndex + 1 : null

  useEffect(() => {
    setOrdersCarouselIndex((i) => Math.min(i, carouselMaxIndex))
  }, [carouselMaxIndex, displayOrders.length])

  useEffect(() => {
    if (!dashboardDataLoaded) return
    if (!showDashboard) return
    const snapshot: DashboardCacheSnapshot = {
      fullName,
      xp,
      subscriptionTier,
      userRole,
      companyName,
      partnerStatus,
      memberId,
      barcodeValue,
      vehicles,
      orders,
      notifications,
      latestNotification,
      notificationDismissed,
      currentUserId,
    }
    setClientCache(ACCOUNT_DASHBOARD_CACHE_KEY, snapshot, ACCOUNT_DASHBOARD_CACHE_TTL_MS)
  }, [
    dashboardDataLoaded,
    showDashboard,
    fullName,
    xp,
    subscriptionTier,
    userRole,
    companyName,
    partnerStatus,
    memberId,
    barcodeValue,
    vehicles,
    orders,
    notifications,
    latestNotification,
    notificationDismissed,
    currentUserId,
  ])

  return (
    <section className="relative min-h-screen bg-white text-carbon-900">
      {(!dashboardDataLoaded || isEnteringDashboard) && <AccountDashboardSkeleton />}
      {showWelcomeScreen && (
        <div className="fixed inset-0 z-[130] bg-white">
          <div className="h-full w-full flex items-center justify-center px-6">
            <div className="text-center">
              <h1
                className="font-nav font-bold text-5xl md:text-6xl text-carbon-900"
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
                className={`mt-7 text-[11px] md:text-xs font-nav font-bold uppercase tracking-[0.14em] text-carbon-500 transition-all duration-[1400ms] ease-out ${
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
                  window.setTimeout(() => {
                    if (redirectAfterWelcome) {
                      navigate(redirectAfterWelcome, { replace: true })
                    } else {
                      setShowDashboard(true)
                    }
                    setIsEnteringDashboard(false)
                  }, 400)
                }}
                className={`mt-10 inline-flex items-center justify-center rounded-xl border border-carbon-300 bg-white px-5 py-2.5 text-sm font-nav font-bold text-carbon-900 transition-all duration-700 hover:bg-carbon-50 ${
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
        <div className="w-full relative bg-white">
          {latestNotification && !notificationDismissed && (
            <div className="pointer-events-none fixed top-[92px] md:top-[96px] left-0 right-0 z-[90] flex justify-center">
              <div className="pointer-events-auto max-w-3xl w-full mx-4 rounded-[24px] bg-white backdrop-blur-2xl shadow-[0_22px_55px_rgba(0,0,0,0.55)] px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center gap-3 sm:gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-black">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-white"
                  >
                    <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  {latestNotification.title && (
                    <p className="text-[13px] sm:text-[14px] font-semibold text-[#0B1020] mb-0.5 truncate">
                      {latestNotification.title}
                    </p>
                  )}
                  <p className="text-[12px] sm:text-[13px] text-[#111827] truncate">
                    {latestNotification.message}
                  </p>
                </div>
                <div className="ml-2 flex-shrink-0 text-[11px] sm:text-[12px] font-medium text-[#4B5563]">
                  {formatNotificationTimeAgo(latestNotification.created_at)}
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationDismissed(true)}
                  className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/5 text-[#374151] hover:bg-black/10 hover:text-[#111827] transition-colors"
                  aria-label="Close notification"
                >
                  ×
                </button>
              </div>
            </div>
          )}
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
            onAdminPanelClick={() => setAdminPanelOpen(true)}
            onSettingsClick={() => setSettingsOpen(true)}
            headerRight={
              <div ref={notificationsMenuRef} className="flex items-center gap-6">
                <button
                  type="button"
                  className="flex items-center justify-center text-white/90 hover:text-white transition-colors"
                  aria-label="Open membership QR"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M17 12v4a1 1 0 0 1-1 1h-4" />
                    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                    <path d="M17 8V7" />
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                    <path d="M7 17h.01" />
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                    <rect x="7" y="7" width="5" height="5" rx="1" />
                  </svg>
                </button>
                <div className="relative flex items-center justify-center">
                  <button
                    type="button"
                    onClick={async () => {
                      setNotificationsMenuOpen((open) => !open)
                      if (!notificationsMenuOpen && currentUserId) {
                        const role: UserRole = userRole
                        const list = await fetchNotificationsForUser(currentUserId, role)
                        setNotifications(list)
                      }
                    }}
                    className="flex items-center justify-center text-white/90 hover:text-white transition-colors"
                    aria-label="Open notifications"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <path d="M10.268 21a2 2 0 0 0 3.464 0" />
                      <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
                    </svg>
                  </button>
                  {notificationsMenuOpen && (
                    <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-black/90 border border-white/15 backdrop-blur-2xl shadow-[0_18px_45px_rgba(0,0,0,0.65)] px-3 py-3 z-50">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/65">
                          Notifications
                        </span>
                        <button
                          type="button"
                          className="text-[11px] text-white/55 hover:text-white/80"
                          onClick={async () => {
                            if (!currentUserId) return
                            const ids = notifications.map((n) => n.id)
                            if (!ids.length) return
                            await supabase.from('user_notifications').delete().in('id', ids)
                            setNotifications([])
                            setLatestNotification(null)
                            setNotificationDismissed(true)
                          }}
                        >
                          Clear all
                        </button>
                      </div>
                      {notifications.length === 0 ? (
                        <p className="text-xs text-white/60">No notifications.</p>
                      ) : (
                        <div className="max-h-64 overflow-y-auto flex flex-col gap-2">
                          {notifications.map((n) => (
                            <div
                              key={n.id}
                              className="group rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-xs text-white/85 flex items-start gap-2"
                            >
                              <div className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                {n.title && (
                                  <p className="font-semibold text-[12px] mb-0.5 truncate">{n.title}</p>
                                )}
                                <p className="text-[11px] text-white/75 line-clamp-2">{n.message}</p>
                                <p className="mt-1 text-[10px] text-white/45">
                                  {formatNotificationTimeAgo(n.created_at)}
                                </p>
                              </div>
                              <button
                                type="button"
                                className="ml-1 text-[11px] text-white/45 hover:text-red-300"
                                onClick={async () => {
                                  await supabase.from('user_notifications').delete().eq('id', n.id)
                                  setNotifications((prev) => prev.filter((x) => x.id !== n.id))
                                  if (latestNotification?.id === n.id) {
                                    setLatestNotification(
                                      (prev) => (prev && prev.id === n.id ? null : prev),
                                    )
                                  }
                                }}
                              >
                                Clear
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            }
          />
          <section className="w-full min-h-[90vh] bg-white relative z-20 px-6 md:px-12 lg:px-16 py-10 md:py-14" aria-label="Account actions section">
            <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
              <article className="rounded-2xl bg-[#F3F3F3] px-6 py-6 md:px-8 md:py-8">
                <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#171717]">Orders</p>
                {displayOrders.length === 0 ? (
                  <div className="mt-7 flex flex-col items-center text-center">
                    <div className="mb-5 flex h-28 w-28 items-center justify-center rounded-full bg-[#E7E7E7] text-4xl text-[#8E8E8E]">
                      <span aria-hidden>🧥</span>
                    </div>
                    <p className="max-w-[320px] text-sm leading-6 text-[#4A4A4A]">
                      You haven&apos;t made any orders yet. When you make an order it&apos;ll show up here.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      <Link to="/#product-lineup" className={appleButtonClassName}>
                        Explore products
                      </Link>
                    </div>
                  </div>
                ) : ordersSummaryPreview ? (
                  <div className="mt-6 rounded-2xl border border-[#E2E2E2] bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#171717]">
                          Order {formatOrderRef(ordersSummaryPreview.orderNumber)}
                        </p>
                        <p className="mt-1 text-xs text-[#6B6B6B]">
                          {ordersSummaryPreview.date
                            ? `Placed on ${ordersSummaryPreview.date}`
                            : 'Date unavailable'}
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-[#E8F5EC] px-2.5 py-1 text-[11px] font-semibold text-[#1F7A3E]">
                        Completed
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#F7F7F7] p-3">
                      {summaryThumb ? (
                        <img
                          src={summaryThumb}
                          alt=""
                          className="h-14 w-14 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#E9E9E9] text-xl text-[#7B7B7B]"
                          aria-hidden
                        >
                          🧴
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#171717]">{summaryOrderTitle}</p>
                        <p className="mt-0.5 text-xs text-[#6B6B6B]">
                          Qty {summaryQty}
                          {summaryLinePriceLabel ? ` · ${summaryLinePriceLabel}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-start justify-between border-t border-[#E8E8E8] pt-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6B6B6B]">Total</p>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#171717]">{summaryTotalLabel}</p>
                        <p className="mt-0.5 text-xs text-[#6B6B6B]">
                          {summaryXp !== null ? `+${summaryXp} XP` : 'XP —'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </article>

              <div className="flex flex-col gap-5">
                <article className="flex items-center justify-between rounded-[2px] bg-[#F3F3F3] px-6 py-6">
                  <div>
                    <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#171717]">My garage</p>
                    <p className="mt-2 text-sm text-[#4A4A4A]">Manage your vehicles and protection history.</p>
                  </div>
                </article>
                <button
                  type="button"
                  onClick={() => setLeaderboardOpen(true)}
                  className="flex items-center justify-between rounded-[2px] bg-[#F3F3F3] px-6 py-6 text-left transition-colors hover:bg-[#ECECEC]"
                >
                  <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#171717]">Leaderboard</p>
                  <span className="text-xl text-[#8A8A8A]" aria-hidden>›</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTrophyOpen(true)}
                  className="flex items-center justify-between rounded-[2px] bg-[#F3F3F3] px-6 py-6 text-left transition-colors hover:bg-[#ECECEC]"
                >
                  <div>
                    <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#171717]">Trophy</p>
                    <p className="mt-2 text-sm text-[#4A4A4A]">See your rewards, milestones and achievements.</p>
                  </div>
                  <span className="text-xl text-[#8A8A8A]" aria-hidden>›</span>
                </button>
                <article className="flex items-center justify-between rounded-[2px] bg-[#F3F3F3] px-6 py-6">
                  <div>
                    <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#171717]">Refer a Friend</p>
                    <p className="mt-2 text-sm text-[#4A4A4A]">
                      Introduce your friends and give them £10 off, and to say thanks we&apos;ll give you £10 off your next order too.
                    </p>
                  </div>
                  <span className="text-xl text-[#8A8A8A]" aria-hidden>›</span>
                </article>
              </div>
            </div>
          </section>
          {leaderboardOpen && createPortal(
            <div className="fixed inset-0 z-[10040] flex items-center justify-center p-4 md:p-6" role="dialog" aria-modal="true">
              <button
                type="button"
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                aria-label="Close leaderboard"
                onClick={() => setLeaderboardOpen(false)}
              />
              <div className="relative z-10 flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="p-6 text-3xl font-bold text-carbon-900 md:px-10 md:pt-8 md:text-5xl">Leaderboard</h3>
                  <button
                    type="button"
                    className="mr-6 mt-6 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8E8E8] text-[#5C5C5C] transition-colors duration-200 hover:bg-[#DADADA] hover:text-[#4A4A4A] md:mr-8"
                    onClick={() => setLeaderboardOpen(false)}
                    aria-label="Fermer"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="shrink-0"
                      aria-hidden
                    >
                      <path
                        d="M18 6L6 18M6 6l12 12"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-24 md:px-10">
                  {leaderboardLoading ? (
                    <p className="text-sm text-carbon-600">Chargement du leaderboard...</p>
                  ) : leaderboardEntries.length === 0 ? (
                    <p className="text-sm text-carbon-600">Aucun score disponible.</p>
                  ) : (
                    <div className="space-y-2">
                      {leaderboardEntries.map((entry, idx) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between rounded-xl border border-carbon-200 bg-carbon-50 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 text-sm font-semibold text-carbon-500">#{idx + 1}</span>
                            <span className="text-sm font-semibold text-carbon-900">{entry.label}</span>
                          </div>
                          <span className="text-sm font-semibold text-carbon-700">{entry.xp.toLocaleString()} XP</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 border-t border-carbon-200 bg-white/85 px-6 py-4 backdrop-blur-md md:px-10">
                  <div className="flex items-center justify-between">
                    <div className="text-xs uppercase tracking-[0.12em] text-carbon-500">
                      {personalLeaderboardRank ? `#${personalLeaderboardRank}` : '--'}
                    </div>
                    <div className="text-sm font-semibold text-carbon-900">{fullName || 'Member'}</div>
                    <div className="text-sm font-semibold text-carbon-700">{xp.toLocaleString()} XP</div>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}
          {trophyOpen && createPortal(
            <div className="fixed inset-0 z-[10040] flex items-center justify-center p-4 md:p-6" role="dialog" aria-modal="true">
              <button
                type="button"
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                aria-label="Close trophy"
                onClick={() => setTrophyOpen(false)}
              />
              <div className="relative z-10 flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="p-6 text-3xl font-bold text-carbon-900 md:px-10 md:pt-8 md:text-5xl">Trophy</h3>
                  <button
                    type="button"
                    className="mr-6 mt-6 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8E8E8] text-[#5C5C5C] transition-colors duration-200 hover:bg-[#DADADA] hover:text-[#4A4A4A] md:mr-8"
                    onClick={() => setTrophyOpen(false)}
                    aria-label="Fermer"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="shrink-0"
                      aria-hidden
                    >
                      <path
                        d="M18 6L6 18M6 6l12 12"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 md:px-10">
                  <div className="mt-2 rounded-2xl border border-carbon-200 bg-carbon-50 p-6 text-carbon-700 md:p-8">
                  Trophy content coming soon.
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}
          <Footer />
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
      <ProductsPurchasedSheet isOpen={productsPurchasedOpen} onClose={() => setProductsPurchasedOpen(false)} />
      {orderDetailsOrder && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          onClick={() => setOrderDetailsOrder(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#E3E5EA] shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Détails de la commande"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#111111]/10">
              <div>
                <p className="text-[13px] font-semibold text-[#111111]">
                  Commande {formatOrderRef(orderDetailsOrder.orderNumber)}
                </p>
                <p className="text-xs text-[#6E7075] mt-0.5">{orderDetailsOrder.date ?? '-'}</p>
              </div>
              <button
                type="button"
                onClick={() => setOrderDetailsOrder(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111111] text-white hover:bg-[#2a2a2a]"
                aria-label="Fermer"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
              {orderDetailsOrder.lineItems && orderDetailsOrder.lineItems.length > 0 ? (
                <ul className="space-y-3">
                  {orderDetailsOrder.lineItems.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 rounded-xl bg-white/70 p-3 border border-[#111111]/8"
                    >
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#E3E5EA]">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[#8A8C91] text-xs">
                            —
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-[#111111] truncate">{item.title}</p>
                        <p className="text-xs text-[#6E7075] mt-0.5">
                          {item.quantity} × {(item.price || 0).toFixed(2)} {orderDetailsOrder.currency ?? 'CAD'}
                        </p>
                      </div>
                      <p className="text-[13px] font-semibold text-[#111111] shrink-0">
                        {((item.price || 0) * item.quantity).toFixed(2)} {orderDetailsOrder.currency ?? 'CAD'}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#6E7075]">Aucun détail de produit disponible pour cette commande.</p>
              )}
              <div className="mt-4 pt-4 border-t border-[#111111]/10 flex items-center justify-between">
                <span className="text-sm font-medium text-[#111111]">Total</span>
                <span className="text-base font-semibold text-[#111111]">
                  {(orderDetailsOrder.totalPrice ?? 0).toFixed(2)} {orderDetailsOrder.currency ?? 'CAD'}
                </span>
              </div>
              {orderDetailsOrder.pointsEarned != null && orderDetailsOrder.pointsEarned > 0 && (
                <div className="mt-2 flex items-center justify-between text-sm text-[#6E7075]">
                  <span>Points gagnés</span>
                  <span className="font-medium text-[#111111]">+{orderDetailsOrder.pointsEarned} XP</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <AdminPanelSheet isOpen={adminPanelOpen} onClose={() => setAdminPanelOpen(false)} />
      <SettingsSheet isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
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
