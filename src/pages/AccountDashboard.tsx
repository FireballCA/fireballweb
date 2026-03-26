import { useEffect, useState, useRef, useMemo } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getCurrentUserProfile, isAuthenticated } from '@/utils/supabaseAuth'
import { MemberStatusHero } from '@/components/MemberStatusHero/MemberStatusHero'
import { AddVehicleModal } from '@/components/AddVehicleModal'
import { FireballLoading } from '@/components/FireballLoading'
import { ProductsPurchasedSheet } from '@/components/ProductsPurchasedSheet'
import { AdminPanelSheet } from '@/components/AdminPanelSheet'
import { SettingsSheet } from '@/components/SettingsSheet'
import { Footer } from '@/components/Layout/Footer'
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

type ProtectionStatus = 'green' | 'yellow' | 'red'
type SubscriptionTier = 'none' | 'ignition' | 'apex'
type UserRole = 'member' | 'partner' | 'admin'

interface DashboardNotification {
  id: string
  title: string | null
  message: string
  created_at: string
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

function GarageEmptyStateSvg() {
  return (
    <svg width="171" height="216" viewBox="0 0 171 216" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[170px] h-auto">
      <rect x="0.48" y="0.48" width="169.4" height="214.43" fill="#111214" stroke="#2C3138" strokeWidth="0.95" />
      <path d="M56.91 31.41H110.21C111.536 31.41 112.808 31.9368 113.746 32.8745C114.683 33.8122 115.21 35.084 115.21 36.41V99.82C115.21 101.146 114.683 102.418 113.746 103.356C112.808 104.293 111.536 104.82 110.21 104.82H50.08C48.754 104.82 47.4822 104.293 46.5445 103.356C45.6069 102.418 45.08 101.146 45.08 99.82V43.36L56.91 31.41Z" fill="#17191D" stroke="#5D6572" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M45.08 43.36H54.77C55.3386 43.3574 55.8829 43.1297 56.2839 42.7268C56.6849 42.3239 56.91 41.7785 56.91 41.21V31.41L45.08 43.36Z" fill="#17191D" stroke="#5D6572" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="56.51" y="48.54" width="62.02" height="19.29" rx="3.83" fill="#111214" stroke="#5D6572" />
      <rect x="56.51" y="69.92" width="62.02" height="19.29" rx="3.83" fill="#111214" stroke="#5D6572" />
      <rect x="56.51" y="91.31" width="62.02" height="19.29" rx="3.83" fill="#111214" stroke="#5D6572" />
      <circle cx="67.07" cy="58.21" r="3.34" fill="#5D6572"/>
      <circle cx="77.57" cy="58.21" r="3.34" fill="#5D6572"/>
      <circle cx="88.06" cy="58.21" r="3.34" fill="#5D6572"/>
      <circle cx="67.07" cy="79.6" r="3.34" fill="#5D6572"/>
      <circle cx="77.57" cy="79.6" r="3.34" fill="#5D6572"/>
      <circle cx="88.06" cy="79.6" r="3.34" fill="#5D6572"/>
      <circle cx="67.07" cy="100.98" r="3.34" fill="#5D6572"/>
      <circle cx="77.57" cy="100.98" r="3.34" fill="#5D6572"/>
      <circle cx="88.06" cy="100.98" r="3.34" fill="#5D6572"/>
      <circle cx="119.62" cy="52.17" r="20.73" fill="#17191D" stroke="#5D6572" />
      <path d="M134.34 67.21L139.86 72.73" stroke="#5D6572" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="137.82" y="69.69" width="21.8" height="7.2" rx="3.6" transform="rotate(43.7 137.82 69.69)" fill="#17191D" stroke="#5D6572"/>
      <path d="M57 157.5H113" stroke="#2C3138"/>
      <text x="85.5" y="176" textAnchor="middle" fill="#7E8794" fontSize="11" fontFamily="SF Pro, system-ui, sans-serif" fontWeight="600">
        NO VEHICLES YET
      </text>
      <text x="85.5" y="191" textAnchor="middle" fill="#616A77" fontSize="9" fontFamily="SF Pro, system-ui, sans-serif">
        Add your first car to start tracking
      </text>
    </svg>
  )
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
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehiclePhotos, setVehiclePhotos] = useState<Record<string, string>>({})
  const [garageCarouselIndex, setGarageCarouselIndex] = useState(0)
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
  const displayOrders = useMemo(() => [...orders], [orders])
  const hasTwoOrders = displayOrders.length >= 2
  const hasThreeOrders = displayOrders.length >= 3
  const hasFourOrMoreOrders = displayOrders.length >= 4
  const showAddAnotherBlock = displayOrders.length > 0 && displayOrders.length < 3
  const carouselMaxIndex = Math.max(0, displayOrders.length - 3)
  const visiblePrimary = hasFourOrMoreOrders ? (displayOrders[ordersCarouselIndex] ?? null) : (displayOrders[0] ?? null)
  const visibleSecond = hasFourOrMoreOrders ? (displayOrders[ordersCarouselIndex + 1] ?? null) : (displayOrders[1] ?? null)
  const visibleThird = hasFourOrMoreOrders ? (displayOrders[ordersCarouselIndex + 2] ?? null) : (displayOrders[2] ?? null)
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
    <section className="relative min-h-screen bg-[#0a0a0a] text-pearl">
      {(!dashboardDataLoaded || isEnteringDashboard) && (
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
                  window.setTimeout(() => {
                    if (redirectAfterWelcome) {
                      navigate(redirectAfterWelcome, { replace: true })
                    } else {
                      setShowDashboard(true)
                    }
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
          <div className="w-full flex justify-center relative z-20" style={{ marginTop: '-40px' }}>
            <svg viewBox="0 0 361 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="block w-[95vw] h-[10px] opacity-80" preserveAspectRatio="none">
              <path d="M0 10C0 4.47715 4.47715 0 10 0H351C356.523 0 361 4.47715 361 10H0Z" fill="#000000" fillOpacity="0.25" />
              <path d="M0 10C0 4.47715 4.47715 0 10 0H351C356.523 0 361 4.47715 361 10H0Z" fill="#000000" fillOpacity="0.8" />
            </svg>
          </div>
          <div 
            className="w-full min-w-full bg-[#0A0A0A] relative z-20 overflow-hidden px-6 md:px-12 lg:px-16 pt-12 pb-16 md:pb-24 lg:pb-32 min-h-[960px] lg:min-h-[1200px]"
            style={{ borderRadius: '45px 45px 45px 45px' }}
          >
              {/* Section My Garage (standalone) */}
              <div className="w-full">
                <div className="flex flex-col items-start gap-4">
                  <h2
                    className="text-white font-bold whitespace-nowrap"
                    style={{
                      fontFamily: 'SF Pro, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                      fontSize: 46,
                      lineHeight: '54px',
                      letterSpacing: '0.4px',
                    }}
                  >
                    My Garage
                  </h2>
                  <p
                    className="font-bold whitespace-nowrap"
                    style={{
                      fontFamily: 'SF Pro, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                      fontSize: 46,
                      lineHeight: '54px',
                      letterSpacing: '0.2px',
                      color: '#83868B',
                    }}
                  >
                    Your vehicles. <span className="text-white">All in one place.</span>
                  </p>
                </div>

                {/* Vehicle carousel ou empty state */}
                {vehicles.length === 0 ? (
                  <div className="mt-8 relative min-h-[280px] lg:min-h-[320px] w-full">
                    <div className="flex flex-col items-start gap-2 max-w-[375px]">
                      <h3
                        className="text-white font-bold"
                        style={{
                          fontFamily: 'SF Pro, sans-serif',
                          fontSize: 28,
                          lineHeight: '34px',
                          letterSpacing: '0.38px',
                        }}
                      >
                        Your garage is empty
                      </h3>
                      <p
                        className="text-white/60"
                        style={{
                          fontFamily: 'SF Pro, sans-serif',
                          fontWeight: 400,
                          fontSize: 17,
                          lineHeight: '22px',
                          letterSpacing: '-0.43px',
                        }}
                      >
                        Track your vehicles, services and Fireball protection history.
                      </p>
                      <button
                        type="button"
                        onClick={() => setCarModalOpen(true)}
                        className="group mt-2 inline-flex items-center gap-1.5 font-medium transition-colors duration-200 hover:opacity-95"
                        style={{
                          fontSize: 12,
                          lineHeight: '16px',
                          color: '#FF6363',
                        }}
                      >
                        Add new car
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="shrink-0 w-[14px] h-[14px] transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: '#FF6363' }}>
                          <path fill="currentColor" d="M566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L406.6 137.3C394.1 124.8 373.8 124.8 361.3 137.3C348.8 149.8 348.8 170.1 361.3 182.6L466.7 288L96 288C78.3 288 64 302.3 64 320C64 337.7 78.3 352 96 352L466.7 352L361.3 457.4C348.8 469.9 348.8 490.2 361.3 502.7C373.8 515.2 394.1 515.2 406.6 502.7L566.6 342.7z" />
                        </svg>
                      </button>
                    </div>
                    <div className="absolute right-0 bottom-8 lg:bottom-10 flex flex-col items-end w-full lg:w-auto mt-10 lg:mt-0">
                      <GarageEmptyStateSvg />
                    </div>
                  </div>
                ) : (
                <div className="mt-8 flex items-center gap-3 w-full">
                {vehicles.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setGarageCarouselIndex((i) => Math.max(0, i - 1))}
                    disabled={garageCarouselIndex === 0}
                    className="shrink-0 w-10 h-10 rounded-full border border-white/30 bg-white/10 flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Previous vehicles"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                <div className="flex flex-wrap gap-5 min-w-0 justify-start">
                {(vehicles.length > 2 ? vehicles.slice(garageCarouselIndex, garageCarouselIndex + 2) : vehicles).map((vehicle) => {
                  const protectionStatus = getProtectionStatus(vehicle.ceramicProtectionDate)
                  const isActive = protectionStatus === 'green' || protectionStatus === 'yellow'
                  return (
                    <article
                      key={vehicle.id}
                      className="relative w-[358px] h-[410px] flex-none rounded-[34px] overflow-hidden"
                      style={{
                        background: 'rgba(30, 30, 30, 0.75)',
                        backdropFilter: 'blur(40px)',
                      }}
                    >
                      {/* Image - 358×236, top */}
                      <div
                        className="absolute left-0 top-0 w-full h-[236px] bg-cover bg-center bg-no-repeat bg-neutral-800"
                        style={{
                          backgroundImage: vehiclePhotos[vehicle.id]
                            ? `url(${vehiclePhotos[vehicle.id]})`
                            : 'url(/Assets/DoubleCards.png)',
                        }}
                      />

                      {/* Upload photo for banner */}
                      <input
                        id={`vehicle-photo-${vehicle.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          if (!file) return
                          const url = URL.createObjectURL(file)
                          setVehiclePhotos((prev) => ({ ...prev, [vehicle.id]: url }))
                        }}
                      />
                      <label
                        htmlFor={`vehicle-photo-${vehicle.id}`}
                        className="absolute z-10 flex items-center justify-center cursor-pointer whitespace-nowrap px-2 py-1.5"
                        style={{
                          left: 12,
                          top: 12,
                          minHeight: 28,
                          background: 'rgba(120, 120, 120, 0.2)',
                          borderRadius: 9999,
                          fontFamily:
                            'SF Pro, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                          fontWeight: 590,
                          fontSize: 11,
                          lineHeight: '13px',
                          letterSpacing: '0.06px',
                          color: '#FFFFFF',
                        }}
                      >
                        {vehiclePhotos[vehicle.id] ? 'Change Photo' : 'Add Photo'}
                      </label>

                      {/* Trailing Button (Settings) - plus petit, dans le coin haut droit */}
                      <div
                        className="absolute flex flex-row justify-center items-center isolate"
                        style={{
                          width: 36,
                          height: 36,
                          right: 16,
                          top: 16,
                          borderRadius: 296,
                        }}
                      >
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: '#0088FF',
                            zIndex: 0,
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setSettingsVehicle(vehicle)}
                          className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-white"
                          aria-label="Vehicle settings"
                        >
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
                            className="lucide lucide-settings-2"
                          >
                            <path d="M14 17H5" />
                            <path d="M19 7h-9" />
                            <circle cx="17" cy="17" r="3" />
                            <circle cx="7" cy="7" r="3" />
                            <circle cx="7" cy="7" r="3" />
                          </svg>
                        </button>
                      </div>

                      {/* Name + Desc. - left 24px, top 261px */}
                      <div
                        className="absolute flex flex-col items-start gap-1"
                        style={{ left: 24, right: 24, top: 262 }}
                      >
                        <p
                          className="font-bold text-white truncate max-w-[178px]"
                          style={{
                            fontFamily: 'SF Pro Display, sans-serif',
                            fontSize: 22,
                            lineHeight: '28px',
                            letterSpacing: '0.35px',
                          }}
                        >
                          {vehicle.brand} {vehicle.model} {vehicle.year}
                        </p>
                        <p
                          className="text-white/90 max-w-[178px] line-clamp-2"
                          style={{
                            fontFamily: 'SF Pro Text, sans-serif',
                            fontWeight: 400,
                            fontSize: 12,
                            lineHeight: '16px',
                          }}
                        >
                          Ceramic protection:{' '}
                          <span style={{ color: isActive ? '#30D158' : '#FF453A', fontWeight: 600 }}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                          . Completed the {formatDate(vehicle.ceramicProtectionDate)}
                        </p>
                      </div>

                      {/* Separator - bottom 67.5px */}
                      <div
                        className="absolute left-6 right-6 h-px"
                        style={{
                          bottom: 67.5,
                          background: 'rgba(84, 84, 88, 0.65)',
                        }}
                      />

                      {/* Bottom row: Done at (left) + See details (right), aligned */}
                      <div
                        className="absolute left-6 right-6 flex flex-row items-center justify-between"
                        style={{ bottom: 18 }}
                      >
                        <span
                          className="text-xs text-white/70"
                          style={{ fontSize: 12, lineHeight: '16px' }}
                        >
                          Done at: {vehicle.protectionShop || 'Not specified'}
                        </span>
                        <a
                          href="#"
                          onClick={(event) => {
                            event.preventDefault()
                            setSettingsVehicle(vehicle)
                          }}
                          className="flex flex-row items-center gap-1.5"
                        >
                          <span
                            className="font-medium"
                            style={{
                              fontSize: 12,
                              lineHeight: '16px',
                              color: 'rgba(235, 235, 245, 0.6)',
                            }}
                          >
                            See details
                          </span>
                        <svg
                          width="4.83"
                          height="8.09"
                          viewBox="0 0 6 8"
                          fill="none"
                          className="shrink-0"
                          style={{ color: 'rgba(235, 235, 245, 0.6)' }}
                        >
                          <path
                            d="M1 1l4 3-4 3"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        </a>
                      </div>
                    </article>
                  )
                })}
                </div>
                {vehicles.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setGarageCarouselIndex((i) => Math.min(vehicles.length - 2, i + 1))}
                    disabled={garageCarouselIndex >= vehicles.length - 2}
                    className="shrink-0 w-10 h-10 rounded-full border border-white/30 bg-white/10 flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Next vehicles"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
                </div>
                )}
              </div>

              {/* Section My Orders */}
              <section className="mt-20 -mx-6 md:-mx-12 lg:-mx-16 min-h-[90vh] bg-white py-14 md:py-20">
                <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col px-6 md:px-12 lg:pl-[176px] lg:pr-16 xl:pl-[188px] xl:pr-16">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <p
                      className="font-bold text-[#111111]"
                      style={{
                        fontFamily: 'SF Pro, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                        fontSize: 52,
                        lineHeight: '60px',
                        letterSpacing: '0.4px',
                      }}
                    >
                      Where every order lives.
                    </p>
                    {displayOrders.length > 0 && (
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="group/journal flex shrink-0 items-center gap-1.5 text-xs font-medium text-[#c73659] hover:text-[#a82d4a] transition-colors duration-200 pb-1"
                      >
                        <span>Open FIREBALL journal</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 640 640"
                          className="h-3.5 w-3.5 transition-transform duration-200 group-hover/journal:translate-x-0.5"
                        >
                          <path fill="currentColor" d="M566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L406.6 137.3C394.1 124.8 373.8 124.8 361.3 137.3C348.8 149.8 348.8 170.1 361.3 182.6L466.7 288L96 288C78.3 288 64 302.3 64 320C64 337.7 78.3 352 96 352L466.7 352L361.3 457.4C348.8 469.9 348.8 490.2 361.3 502.7C373.8 515.2 394.1 515.2 406.6 502.7L566.6 342.7z" />
                        </svg>
                      </a>
                    )}
                  </div>

                  <div
                    className={`mt-10 flex-1 min-w-0 ${
                      displayOrders.length === 0
                        ? 'rounded-[36px] bg-[#f5f5f7] px-6 py-8 md:px-10 md:py-10'
                        : ''
                    }`}
                  >
                    {displayOrders.length === 0 ? (
                      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                        <OrdersEmptyStateSvg />
                        <p className="mt-6 text-[#6E7075] text-sm">
                          Your Fireball purchases will appear here.
                        </p>
                        <Link
                          to="/shop"
                          className="group mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#5c5c5e] hover:text-[#111111] transition-colors duration-200"
                        >
                          Browse the shop
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="shrink-0 h-[14px] w-[14px] transition-transform duration-200 group-hover:translate-x-0.5">
                            <path fill="currentColor" d="M566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L406.6 137.3C394.1 124.8 373.8 124.8 361.3 137.3C348.8 149.8 348.8 170.1 361.3 182.6L466.7 288L96 288C78.3 288 64 302.3 64 320C64 337.7 78.3 352 96 352L466.7 352L361.3 457.4C348.8 469.9 348.8 490.2 361.3 502.7C373.8 515.2 394.1 515.2 406.6 502.7L566.6 342.7z" />
                          </svg>
                        </Link>
                      </div>
                    ) : (
                      <div
                        className={`grid grid-cols-1 gap-6 sm:gap-8 w-full overflow-visible ${
                          hasTwoOrders
                            ? 'lg:grid-cols-[minmax(260px,1fr)_minmax(260px,1fr)_minmax(260px,1fr)] lg:gap-8'
                            : 'lg:grid-cols-[minmax(260px,1fr)_minmax(280px,2fr)] lg:gap-8'
                        }`}
                      >
                        {/* Carte 1 : Last commands */}
                        <div className="relative min-h-[320px] lg:min-h-[420px] overflow-hidden rounded-[24px] bg-[#E3E5EA] px-5 py-5 md:px-6 md:py-6 lg:min-w-0">
                          <div
                            className="pointer-events-none absolute inset-0 bg-cover bg-top bg-no-repeat"
                            style={{
                              backgroundImage: visiblePrimary?.imageUrl ? `url(${visiblePrimary.imageUrl})` : 'none',
                            }}
                          />
                          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(227,229,234,0)_20%,rgba(227,229,234,0.68)_58%,#E3E5EA_84%,#E3E5EA_100%)]" />
                          <div className="relative z-10 flex min-h-[280px] lg:min-h-[380px] flex-col">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-[15px] font-semibold tracking-[-0.24px] text-[#111111]">
                                {(!hasFourOrMoreOrders || ordersCarouselIndex === 0) ? 'Last commands' : 'Previous order'}
                              </p>
                              <button
                                type="button"
                                onClick={() => setOrderDetailsOrder(visiblePrimary ?? null)}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#111111] text-white transition hover:bg-[#2a2a2a]"
                                aria-label="Voir les détails de la commande"
                              >
                                <span className="text-lg leading-none">+</span>
                              </button>
                            </div>
                            <div className="mt-auto">
                              <div className="flex items-start gap-2">
                                <p className="text-[#111111] text-[28px] leading-[34px] tracking-[-0.4px] font-semibold">
                                  {(visiblePrimary?.totalPrice ?? 0).toFixed(2)}
                                </p>
                                <span className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#111111]/80">
                                  {visiblePrimary?.currency || 'CAD'}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center justify-between text-xs font-medium text-[#6E7075]">
                                <span>{visiblePrimary?.date || '-'}</span>
                                <span>{formatOrderRef(visiblePrimary?.orderNumber)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Carte 2 */}
                        {hasTwoOrders && (
                          <div className="relative min-h-[320px] lg:min-h-[420px] overflow-hidden rounded-[24px] bg-[#E3E5EA] px-5 py-5 md:px-6 md:py-6 lg:min-w-0">
                            <div
                              className="pointer-events-none absolute inset-0 bg-cover bg-top bg-no-repeat"
                              style={{
                                backgroundImage: visibleSecond?.imageUrl ? `url(${visibleSecond.imageUrl})` : 'none',
                              }}
                            />
                            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(227,229,234,0)_20%,rgba(227,229,234,0.68)_58%,#E3E5EA_84%,#E3E5EA_100%)]" />
                            <div className="relative z-10 flex min-h-[280px] lg:min-h-[380px] flex-col">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-[15px] font-semibold tracking-[-0.24px] text-[#111111]">
                                  Previous order
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setOrderDetailsOrder(visibleSecond!)}
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#111111] text-white transition hover:bg-[#2a2a2a]"
                                  aria-label="Voir les détails de la commande"
                                >
                                  <span className="text-lg leading-none">+</span>
                                </button>
                              </div>
                              <div className="mt-auto">
                                <div className="flex items-start gap-2">
                                  <p className="text-[#111111] text-[28px] leading-[34px] tracking-[-0.4px] font-semibold">
                                    {(visibleSecond?.totalPrice ?? 0).toFixed(2)}
                                  </p>
                                  <span className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#111111]/80">
                                    {visibleSecond?.currency || 'CAD'}
                                  </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-xs font-medium text-[#6E7075]">
                                  <span>{visibleSecond?.date || '-'}</span>
                                  <span>{formatOrderRef(visibleSecond?.orderNumber)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Carte 3 (seulement si 3 commandes, pas de Add another) */}
                        {hasThreeOrders && (
                          <div className="relative min-h-[320px] lg:min-h-[420px] overflow-hidden rounded-[24px] bg-[#E3E5EA] px-5 py-5 md:px-6 md:py-6 lg:min-w-0">
                            <div
                              className="pointer-events-none absolute inset-0 bg-cover bg-top bg-no-repeat"
                              style={{
                                backgroundImage: visibleThird?.imageUrl ? `url(${visibleThird.imageUrl})` : 'none',
                              }}
                            />
                            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(227,229,234,0)_20%,rgba(227,229,234,0.68)_58%,#E3E5EA_84%,#E3E5EA_100%)]" />
                            <div className="relative z-10 flex min-h-[280px] lg:min-h-[380px] flex-col">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-[15px] font-semibold tracking-[-0.24px] text-[#111111]">
                                  Previous order
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setOrderDetailsOrder(visibleThird!)}
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#111111] text-white transition hover:bg-[#2a2a2a]"
                                  aria-label="Voir les détails de la commande"
                                >
                                  <span className="text-lg leading-none">+</span>
                                </button>
                              </div>
                              <div className="mt-auto">
                                <div className="flex items-start gap-2">
                                  <p className="text-[#111111] text-[28px] leading-[34px] tracking-[-0.4px] font-semibold">
                                    {(visibleThird?.totalPrice ?? 0).toFixed(2)}
                                  </p>
                                  <span className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#111111]/80">
                                    {visibleThird?.currency || 'CAD'}
                                  </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-xs font-medium text-[#6E7075]">
                                  <span>{visibleThird?.date || '-'}</span>
                                  <span>{formatOrderRef(visibleThird?.orderNumber)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Add another Fireball product (seulement si 1 ou 2 commandes) */}
                        {showAddAnotherBlock && (
                          <div className="min-h-[320px] lg:min-h-[420px] rounded-[24px] bg-[#E3E5EA] px-5 py-5 md:px-6 md:py-6 flex flex-col justify-between min-[1400px]:mr-[calc(-50vw+700px)] min-[1400px]:w-[calc(100%+50vw-700px)] lg:min-w-0">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.16em] text-[#8A8C91]">
                                Keep shopping
                              </p>
                              <h3 className="mt-2 text-[#111111] text-2xl font-semibold leading-tight">
                                Add another Fireball product
                              </h3>
                              <p className="mt-3 max-w-xl text-sm text-[#6E7075]">
                                Discover coatings, maintenance and accessories for your next order.
                              </p>
                            </div>
                            <Link
                              to="/shop"
                              className="group/shop mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-[#5c5c5e] hover:text-[#111111] transition-colors duration-200"
                            >
                              Browse the shop
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 640 640"
                                className="shrink-0 h-[14px] w-[14px] transition-transform duration-200 group-hover/shop:translate-x-0.5"
                              >
                                <path fill="currentColor" d="M566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L406.6 137.3C394.1 124.8 373.8 124.8 361.3 137.3C348.8 149.8 348.8 170.1 361.3 182.6L466.7 288L96 288C78.3 288 64 302.3 64 320C64 337.7 78.3 352 96 352L466.7 352L361.3 457.4C348.8 469.9 348.8 490.2 361.3 502.7C373.8 515.2 394.1 515.2 406.6 502.7L566.6 342.7z" />
                              </svg>
                            </Link>
                          </div>
                        )}
                        {hasFourOrMoreOrders && (
                          <>
                            <div className="hidden lg:block lg:col-span-2" />
                            <div className="mt-4 flex items-center gap-3 lg:justify-end">
                              <button
                                type="button"
                                onClick={() => setOrdersCarouselIndex((i) => Math.max(0, i - 1))}
                                disabled={ordersCarouselIndex === 0}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#111111]/25 bg-white text-[#111111] transition hover:bg-[#f5f5f7] disabled:opacity-40 disabled:pointer-events-none"
                                aria-label="Commandes précédentes"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => setOrdersCarouselIndex((i) => Math.min(carouselMaxIndex, i + 1))}
                                disabled={ordersCarouselIndex >= carouselMaxIndex}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#111111]/25 bg-white text-[#111111] transition hover:bg-[#f5f5f7] disabled:opacity-40 disabled:pointer-events-none"
                                aria-label="Commandes suivantes"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>
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
