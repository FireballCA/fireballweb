import { useEffect, useLayoutEffect, useState, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { getCurrentUserProfile, isAuthenticated } from '@/utils/supabaseAuth'
import { MemberStatusHero } from '@/components/MemberStatusHero/MemberStatusHero'
import { MobileDashboard } from '@/components/MobileDashboard/MobileDashboard'
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
  uploadGarageVehicleImage,
} from '@/utils/supabaseGarage'
import { ensureShopifyCustomerForProfile } from '@/utils/shopifySync'
import { getSafeReturnToPath } from '@/utils/safeReturnTo'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { getClientCache, setClientCache } from '@/utils/clientCache'
import { SHOPIFY_CUSTOMER_ORDERS_URL } from '@/constants/shopifyShopApp'
import { fetchCustomerOrders, formatOrderRef, type CustomerOrder as Order } from '@/utils/customerOrders'
import {
  fetchTrainingRequestsForDashboard,
  pickPrimaryTrainingRequestForDashboard,
  type TrainingRequestRow,
  type TrainingRequestStatus,
} from '@/utils/trainingRequests'
import { TrainingPaymentDueModal } from '@/components/TrainingPaymentDueModal'
import { broadcastUnreadNotifications } from '@/utils/inAppNotificationsFlag'
import { NotificationMessageWithStatusHighlight } from '@/utils/notificationTextHighlight'
import {
  loadDismissedNotificationIds,
  saveDismissedNotificationIds,
} from '@/utils/dismissedNotificationsStorage'

interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  color?: string
  imageUrl?: string
  notes?: string
  ceramicProtectionDate?: Date
  protectionShop?: string
  protectionProduct?: string
}

type SubscriptionTier = 'none' | 'ignition' | 'apex'
type UserRole = 'member' | 'partner' | 'admin'

interface DashboardNotification {
  id: string
  title: string | null
  message: string
  created_at: string
}

/**
 * Aperçu UI : une notif factice si la liste Supabase est vide.
 * Mettre à `false` pour masquer (ou retirer le bloc une fois satisfait).
 */
const SHOW_DEMO_NOTIFICATIONS = import.meta.env.DEV && true

const DEMO_NOTIFICATIONS: DashboardNotification[] = [
  {
    id: '__demo_fireball_preview',
    title: 'Fireball Canada',
    message:
      'Notification de démonstration (mode dev) : bandeau bleu, pastille sur la cloche et carte Notifications. Désactivez SHOW_DEMO_NOTIFICATIONS dans AccountDashboard.tsx pour masquer.',
    created_at: new Date().toISOString(),
  },
]

function isDemoNotificationId(id: string): boolean {
  return id.startsWith('__demo_')
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
  currentUserId: string | null
}

const ACCOUNT_DASHBOARD_CACHE_KEY = 'account_dashboard_snapshot_v1'
const ACCOUNT_DASHBOARD_CACHE_TTL_MS = 1000 * 60 * 8

function trainingStatusCopy(status: TrainingRequestStatus): {
  badge: string
  badgeClass: string
  description: string
} {
  switch (status) {
    case 'pending':
      return {
        badge: 'Under review',
        badgeClass: 'bg-amber-100 text-amber-900 ring-1 ring-amber-200/80',
        description:
          'Fireball Canada is reviewing your training request. You will be notified by email when a decision is made.',
      }
    case 'approved':
      return {
        badge: 'Approved',
        badgeClass: 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80',
        description: 'Check your email for next steps. Payment instructions are sent only after approval.',
      }
    case 'payment_pending':
      return {
        badge: 'Payment due',
        badgeClass: 'bg-orange-100 text-orange-900 ring-1 ring-orange-200/80',
        description:
          'Your seat is reserved pending payment. Check your email and your dashboard for instructions and reference.',
      }
    case 'paid':
      return {
        badge: 'Paid',
        badgeClass: 'bg-sky-100 text-sky-900 ring-1 ring-sky-200/80',
        description: 'Payment received. Our team will follow up with schedule and logistics.',
      }
    case 'declined':
      return {
        badge: 'Not approved',
        badgeClass: 'bg-[#F3F3F3] text-[#4A4A4A] ring-1 ring-carbon-200/90',
        description: 'See the message from our team in your email for details.',
      }
    case 'cancelled':
      return {
        badge: 'Cancelled',
        badgeClass: 'bg-carbon-100 text-carbon-600 ring-1 ring-carbon-200/80',
        description: 'This request is no longer active.',
      }
    default:
      return {
        badge: 'Closed',
        badgeClass: 'bg-carbon-100 text-carbon-600',
        description: '',
      }
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
      { text: '10$ Rewards' },
      { text: 'Early access to select offers' },
      { text: 'Priority email support' },
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
      { text: '15$ Rewards' },
      { text: 'Access to exclusive products' },
      { text: 'Early access to new releases' },
      { text: 'Occasional bonus rewards' },
      { text: 'Fireball Partnership' },
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
      { text: '20$ Rewards' },
      { text: 'Priority access to limited drops' },
      { text: 'Exclusive member offers' },
      { text: 'Special event access' },
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
      { text: '30$ Rewards' },
      { text: 'VIP-only products & drops' },
      { text: 'Maximum priority access' },
      { text: 'Annual exclusive reward' },
      { text: 'Top-tier member status' },
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

// ─── Light field helpers ───────────────────────────────────────────────────────

function GarageInput({ label, optional, ...props }: { label: string; optional?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[13px] font-medium text-[#1d1d1f] mb-1.5">
        {label}{optional && <span className="text-[#86868b] font-normal">(optional)</span>}
      </label>
      <input
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
        className="w-full h-[44px] rounded-[10px] px-3.5 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] outline-none transition-all"
        style={{ background: '#fff', border: focused ? '1.5px solid #0071e3' : '1.5px solid #d2d2d7', boxShadow: focused ? '0 0 0 3px rgba(0,113,227,0.15)' : 'none', ...(props.style ?? {}) }}
      />
    </div>
  )
}

function GarageImageField({ preview, onChange }: { preview: string | null; onChange: (file: File, url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div>
      <label className="text-[13px] font-medium text-[#1d1d1f] mb-1.5 block">
        Photo <span className="text-[#86868b] font-normal">(optional)</span>
      </label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full h-[110px] rounded-[10px] flex flex-col items-center justify-center gap-2 transition-all overflow-hidden relative"
        style={{ border: '1.5px dashed #d2d2d7', background: preview ? 'transparent' : '#f5f5f7' }}
        onMouseEnter={(e) => { if (!preview) e.currentTarget.style.background = '#ebebf0' }}
        onMouseLeave={(e) => { if (!preview) e.currentTarget.style.background = '#f5f5f7' }}
      >
        {preview ? (
          <>
            <img src={preview} alt="Vehicle" className="absolute inset-0 w-full h-full object-cover" />
            <span className="relative z-10 flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium text-white" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.929l-3.536.707.707-3.536A4 4 0 019 13z" /></svg>
              Change photo
            </span>
          </>
        ) : (
          <>
            <svg className="w-6 h-6 text-[#86868b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-[13px] text-[#86868b]">Add a photo</span>
          </>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => onChange(file, ev.target?.result as string)
        reader.readAsDataURL(file)
      }} />
    </div>
  )
}

// ─── Vehicle edit / add-details modal (light mode) ────────────────────────────

interface VehicleSettingsModalProps {
  vehicle: Vehicle
  onClose: () => void
  onUpdate: (updates: Partial<Vehicle> & { brand: string; model: string; year: number }) => void
  onDelete: () => void
}

function VehicleSettingsModal({ vehicle, onClose, onUpdate, onDelete }: VehicleSettingsModalProps) {
  const [color, setColor] = useState(vehicle.color ?? '')
  const [notes, setNotes] = useState(vehicle.notes ?? '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(vehicle.imageUrl ?? null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    let imageUrl: string | undefined = vehicle.imageUrl
    if (imageFile) {
      const uploaded = await uploadGarageVehicleImage(imageFile)
      if (uploaded) imageUrl = uploaded
    }
    onUpdate({
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      color: color || undefined,
      imageUrl,
      notes: notes || undefined,
    })
    setSaving(false)
  }


  return (
    <div className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }} />
      <div
        className="relative w-full sm:max-w-lg rounded-t-[20px] sm:rounded-[20px]"
        style={{ background: '#fff', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', maxHeight: '92dvh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#f0f0f0] shrink-0">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#86868b]">My Garage</p>
            <h3 className="text-[18px] font-semibold text-[#1d1d1f] leading-tight mt-0.5">
              {vehicle.year} {vehicle.brand} {vehicle.model}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#f5f5f7' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#e8e8ed')} onMouseLeave={(e) => (e.currentTarget.style.background = '#f5f5f7')}>
            <svg className="w-4 h-4 text-[#1d1d1f]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
          <GarageImageField preview={imagePreview} onChange={(f, u) => { setImageFile(f); setImagePreview(u) }} />

          <GarageInput label="Color" optional value={color} onChange={(e) => setColor(e.target.value)} placeholder="e.g. Frozen Grey" />

          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-medium text-[#1d1d1f] mb-1.5">
              Notes <span className="text-[#86868b] font-normal">(optional)</span>
            </label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this vehicle…" rows={2}
              onFocus={(e) => { e.currentTarget.style.border = '1.5px solid #0071e3'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)' }}
              onBlur={(e) => { e.currentTarget.style.border = '1.5px solid #d2d2d7'; e.currentTarget.style.boxShadow = 'none' }}
              className="w-full rounded-[10px] px-3.5 py-3 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] outline-none resize-none transition-all"
              style={{ background: '#fff', border: '1.5px solid #d2d2d7' }} />
          </div>

          {/* Protection section — read-only, set by installer */}
          <div className="rounded-[14px] p-4 space-y-3" style={{ background: '#f5f5f7', border: '1.5px solid #e8e8ed' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: vehicle.ceramicProtectionDate ? '#e3f5e8' : '#ffeeed' }}>
                <svg className="w-4 h-4" fill="none" stroke={vehicle.ceramicProtectionDate ? '#34c759' : '#ff3b30'} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#1d1d1f]">Ceramic Protection</p>
                <p className="text-[11px] text-[#86868b]">Recorded by your installer after service</p>
              </div>
              {vehicle.ceramicProtectionDate ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: '#e3f5e8', color: '#1a8c3a' }}>Protected</span>
              ) : (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: '#ffeeed', color: '#ff3b30' }}>Not protected</span>
              )}
            </div>
            {vehicle.ceramicProtectionDate && (
              <div className="space-y-2 pt-1">
                {[
                  { label: 'When', value: vehicle.ceramicProtectionDate.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }) },
                  ...(vehicle.protectionShop ? [{ label: 'Where', value: vehicle.protectionShop }] : []),
                  ...(vehicle.protectionProduct ? [{ label: 'Product', value: vehicle.protectionProduct }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-baseline gap-2">
                    <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider w-14 shrink-0">{label}</span>
                    <span className="text-[13px] text-[#1d1d1f]">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!vehicle.ceramicProtectionDate && (
            <a href="/products"
              className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-95"
              style={{ background: '#1d1d1f' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#333')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#1d1d1f')}>
              Book Protection
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#f0f0f0] px-6 py-4">
          {confirmDelete ? (
            <div className="space-y-2">
              <p className="text-[13px] text-[#1d1d1f] text-center font-medium">Remove this vehicle from your garage?</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setConfirmDelete(false)}
                  className="rounded-full px-5 py-2.5 text-sm font-semibold transition-all active:scale-95"
                  style={{ background: '#f5f5f7', color: '#1d1d1f' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#e8e8ed')} onMouseLeave={(e) => (e.currentTarget.style.background = '#f5f5f7')}>
                  Cancel
                </button>
                <button type="button" onClick={onDelete}
                  className="rounded-full px-5 py-2.5 text-sm font-semibold transition-all active:scale-95"
                  style={{ background: '#ff3b30', color: '#fff' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#e0362c')} onMouseLeave={(e) => (e.currentTarget.style.background = '#ff3b30')}>
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirmDelete(true)}
                className="rounded-full px-5 py-2.5 text-sm font-semibold transition-all active:scale-95"
                style={{ background: '#fff1f0', color: '#ff3b30', border: '1.5px solid #ffd6d4' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#ffe5e3')} onMouseLeave={(e) => (e.currentTarget.style.background = '#fff1f0')}>
                Delete
              </button>
              <button type="button" onClick={onClose}
                className="rounded-full px-5 py-2.5 text-sm font-semibold transition-all active:scale-95"
                style={{ background: '#f5f5f7', color: '#1d1d1f' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#e8e8ed')} onMouseLeave={(e) => (e.currentTarget.style.background = '#f5f5f7')}>
                Cancel
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="rounded-full px-5 py-2.5 text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
                style={{ background: '#1d1d1f', color: '#fff' }}
                onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = '#333' }} onMouseLeave={(e) => (e.currentTarget.style.background = '#1d1d1f')}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Add-vehicle step-2 modal (details after make/model/year selection) ────────

interface VehicleAddDetailsModalProps {
  base: { brand: string; model: string; year: number }
  onClose: () => void
  onBack: () => void
  onCreated: (v: Vehicle) => void
}

function VehicleAddDetailsModal({ base, onClose, onBack, onCreated }: VehicleAddDetailsModalProps) {
  const [color, setColor] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    let imageUrl: string | undefined
    if (imageFile) {
      const uploaded = await uploadGarageVehicleImage(imageFile)
      if (uploaded) imageUrl = uploaded
    }
    const row = await createGarageVehicle({
      brand: base.brand,
      model: base.model,
      year: base.year,
      color: color || undefined,
      imageUrl,
    })
    setSaving(false)
    if (!row) return
    onCreated({
      id: row.id,
      brand: row.brand,
      model: row.model,
      year: row.year,
      color: row.color ?? undefined,
      imageUrl: row.image_url ?? undefined,
      ceramicProtectionDate: row.ceramic_protection_date ? new Date(row.ceramic_protection_date) : undefined,
      protectionShop: row.protection_shop ?? undefined,
      protectionProduct: row.protection_product ?? undefined,
    })
  }


  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }} />
      <div
        className="relative w-full sm:max-w-lg rounded-t-[20px] sm:rounded-[20px]"
        style={{ background: '#fff', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', maxHeight: '92dvh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-[#f0f0f0] shrink-0">
          <button type="button" onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: '#f5f5f7' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#e8e8ed')} onMouseLeave={(e) => (e.currentTarget.style.background = '#f5f5f7')}>
            <svg className="w-4 h-4 text-[#1d1d1f]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#86868b]">Adding to garage</p>
            <h3 className="text-[17px] font-semibold text-[#1d1d1f] truncate">{base.year} {base.brand} {base.model}</h3>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: '#f5f5f7' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#e8e8ed')} onMouseLeave={(e) => (e.currentTarget.style.background = '#f5f5f7')}>
            <svg className="w-4 h-4 text-[#1d1d1f]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
          <GarageImageField preview={imagePreview} onChange={(f, u) => { setImageFile(f); setImagePreview(u) }} />
          <GarageInput label="Color" optional value={color} onChange={(e) => setColor(e.target.value)} placeholder="e.g. Frozen Grey" />
          {/* Protection is recorded by the installer, not the user */}
          <div className="rounded-[14px] p-4 flex items-center gap-3" style={{ background: '#f5f5f7', border: '1.5px solid #e8e8ed' }}>
            <div className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: '#e3f5e8' }}>
              <svg className="w-4 h-4" fill="none" stroke="#34c759" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#1d1d1f]">Ceramic Protection</p>
              <p className="text-[11px] text-[#86868b]">Recorded by your installer after service</p>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#f0f0f0] px-6 py-4 flex gap-3">
          <button type="button" onClick={onClose}
            className="rounded-full px-5 py-2.5 text-sm font-semibold transition-all active:scale-95"
            style={{ background: '#f5f5f7', color: '#1d1d1f' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#e8e8ed')} onMouseLeave={(e) => (e.currentTarget.style.background = '#f5f5f7')}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="rounded-full px-5 py-2.5 text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
            style={{ background: '#1d1d1f', color: '#fff' }}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = '#333' }} onMouseLeave={(e) => (e.currentTarget.style.background = '#1d1d1f')}>
            {saving ? 'Saving…' : 'Add to Garage'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AccountDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const pageState = useMemo(
    () =>
      (location.state as {
        fromRegister?: boolean
        welcomeName?: string
        shopifySyncError?: string | null
        redirectAfterWelcome?: string | null
      } | null) || null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
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
  const [trainingRequests, setTrainingRequests] = useState<TrainingRequestRow[]>([])
  const [accountEmail, setAccountEmail] = useState<string | null>(null)
  const [trainingPaymentModalOpen, setTrainingPaymentModalOpen] = useState(false)
  const [adminPanelOpen, setAdminPanelOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [leaderboardOpen, setLeaderboardOpen] = useState(false)
  const [trophyOpen, setTrophyOpen] = useState(false)
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [settingsVehicle, setSettingsVehicle] = useState<Vehicle | null>(null)
  const [pendingAdd, setPendingAdd] = useState<{ brand: string; model: string; year: number } | null>(null)
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
  const [notificationsMenuOpen, setNotificationsMenuOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const notificationsMenuRef = useRef<HTMLDivElement | null>(null)
  const notificationsBellAnchorRef = useRef<HTMLDivElement | null>(null)
  const notificationsPanelRef = useRef<HTMLDivElement | null>(null)
  const [notificationsPanelBox, setNotificationsPanelBox] = useState<{
    top: number
    left: number
    width: number
  } | null>(null)
  const dashboardNotificationsRef = useRef<HTMLElement | null>(null)
  const [demoNotificationsDismissed, setDemoNotificationsDismissed] = useState(false)
  const [slidePillVisible, setSlidePillVisible] = useState(false)
  const [adminXpSnapSaving, setAdminXpSnapSaving] = useState(false)
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([])

  const visibleNotifications = useMemo(() => {
    const afterDismiss = notifications.filter((n) => !dismissedNotificationIds.includes(n.id))
    if (SHOW_DEMO_NOTIFICATIONS && afterDismiss.length === 0 && !demoNotificationsDismissed) {
      return DEMO_NOTIFICATIONS
    }
    return afterDismiss
  }, [notifications, demoNotificationsDismissed, dismissedNotificationIds])

  const notificationCount = visibleNotifications.length

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
    setCurrentUserId(cached.currentUserId ?? null)
    setShowDashboard(true)
    setDashboardDataLoaded(true)
  }, [pageState?.fromRegister])

  useEffect(() => {
    if (!currentUserId) {
      setDismissedNotificationIds([])
      return
    }
    setDismissedNotificationIds(loadDismissedNotificationIds(currentUserId))
  }, [currentUserId])

  useEffect(() => {
    const visible = notifications.filter((n) => !dismissedNotificationIds.includes(n.id))
    setLatestNotification(visible[0] ?? null)
  }, [notifications, dismissedNotificationIds])

  useLayoutEffect(() => {
    if (!notificationsMenuOpen) {
      setNotificationsPanelBox(null)
      return
    }
    const fallbackBox = () => ({
      top: 88,
      left: 12,
      width: Math.min(320, typeof window !== 'undefined' ? window.innerWidth - 32 : 320),
    })
    const updatePanelBox = () => {
      const el = notificationsBellAnchorRef.current ?? notificationsMenuRef.current
      if (!el) {
        setNotificationsPanelBox(fallbackBox())
        return
      }
      const rect = el.getBoundingClientRect()
      const width = Math.min(320, window.innerWidth - 32)
      if (rect.width <= 0 && rect.height <= 0) {
        setNotificationsPanelBox(fallbackBox())
        return
      }
      const left = Math.max(8, rect.right - width)
      const top = rect.bottom + 8
      setNotificationsPanelBox({ top, left, width })
    }
    updatePanelBox()
    const raf = window.requestAnimationFrame(() => {
      updatePanelBox()
    })
    window.addEventListener('resize', updatePanelBox)
    window.addEventListener('scroll', updatePanelBox, true)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', updatePanelBox)
      window.removeEventListener('scroll', updatePanelBox, true)
    }
  }, [notificationsMenuOpen])

  useEffect(() => {
    if (!notificationsMenuOpen) {
      return () => {
        // Cleanup toujours retourné pour éviter l'erreur React #310
      }
    }
    const handleClickOutside = (event: MouseEvent) => {
      const t = event.target as Node
      if (notificationsMenuRef.current?.contains(t) || notificationsPanelRef.current?.contains(t)) {
        return
      }
      setNotificationsMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [notificationsMenuOpen])

  useEffect(() => {
    const realVisible = notifications.filter((n) => !dismissedNotificationIds.includes(n.id))
    if (realVisible.length > 0) setDemoNotificationsDismissed(false)
  }, [notifications, dismissedNotificationIds])

  useEffect(() => {
    if (notificationCount === 0) {
      setSlidePillVisible(false)
      return
    }
    setSlidePillVisible(true)
    const id = window.setTimeout(() => setSlidePillVisible(false), 5000)
    return () => window.clearTimeout(id)
  }, [notificationCount])

  useEffect(() => {
    broadcastUnreadNotifications(notificationCount > 0)
  }, [notificationCount])

  const scrollToDashboardNotifications = () => {
    dashboardNotificationsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const clearSingleNotification = async (id: string) => {
    if (isDemoNotificationId(id)) {
      setDemoNotificationsDismissed(true)
      return
    }
    if (currentUserId) {
      setDismissedNotificationIds((prev) => {
        const next = [...new Set([...prev, id])]
        saveDismissedNotificationIds(currentUserId, next)
        return next
      })
    }
    await supabase.from('user_notifications').delete().eq('id', id)
    setNotifications((prev) => prev.filter((x) => x.id !== id))
  }

  const clearAllDashboardNotifications = async () => {
    const realIds = notifications.map((n) => n.id).filter((id) => !isDemoNotificationId(id))
    if (realIds.length === 0 && SHOW_DEMO_NOTIFICATIONS) {
      setDemoNotificationsDismissed(true)
      return
    }
    if (realIds.length && currentUserId) {
      setDismissedNotificationIds((prev) => {
        const next = [...new Set([...prev, ...realIds])]
        saveDismissedNotificationIds(currentUserId, next)
        return next
      })
      await supabase.from('user_notifications').delete().in('id', realIds)
    }
    setNotifications([])
  }

  const handleDashboardNotifListWheelCapture = (e: React.WheelEvent<HTMLUListElement>) => {
    const el = e.currentTarget
    const canScroll = el.scrollHeight > el.clientHeight + 1
    if (!canScroll) return

    const goingDown = e.deltaY > 0
    const goingUp = e.deltaY < 0
    const atTop = el.scrollTop <= 0
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
    const canConsume = (goingDown && !atBottom) || (goingUp && !atTop)
    if (!canConsume) return

    // Quand la liste peut absorber la molette, on évite le scroll de la page.
    e.stopPropagation()
  }

  /** Temporaire admin : fixe l’XP au seuil du tier affiché (hero / barre de progression), pas l’abonnement Ignition/Apex. */
  const persistAdminXpAtTierFloor = async (tierIndex: 1 | 2 | 3 | 4 | 5) => {
    if (userRole !== 'admin' || !currentUserId) return
    const tier = XP_TIERS.find((t) => t.index === tierIndex)
    if (!tier) return
    setAdminXpSnapSaving(true)
    try {
      const nextXp = tier.minXp
      const { error } = await supabase.from('profiles').update({ xp: nextXp }).eq('id', currentUserId)
      if (error) {
        console.error('Admin XP tier snap failed:', error)
        return
      }
      setXp(nextXp)
    } finally {
      setAdminXpSnapSaving(false)
    }
  }

  /** Temporaire admin : ajoute de l’XP au profil courant. */
  const persistAdminAddXp = async (delta: number) => {
    if (userRole !== 'admin' || !currentUserId || delta <= 0) return
    setAdminXpSnapSaving(true)
    try {
      const nextXp = Math.max(0, Math.round(xp + delta))
      const { error } = await supabase.from('profiles').update({ xp: nextXp }).eq('id', currentUserId)
      if (error) {
        console.error('Admin XP bump failed:', error)
        return
      }
      setXp(nextXp)
    } finally {
      setAdminXpSnapSaving(false)
    }
  }

  useEffect(() => {
    const checkAuthAndLoadProfile = async () => {
      try {
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
      setAccountEmail(profile?.email?.trim() ?? null)

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

      // Notifications et demandes Academy : chargés séparément pour qu’un échec sur l’un n’empêche pas l’autre
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const userId = user?.id
      if (userId) {
        setCurrentUserId(userId)
        setDismissedNotificationIds(loadDismissedNotificationIds(userId))
        const role: UserRole =
          profile && profile.role ? normalizeUserRole(profile.role) : 'member'

        try {
          const list = await fetchNotificationsForUser(userId, role, 12)
          setNotifications(list)
        } catch (error) {
          console.error('Error loading dashboard notifications:', error)
        }

        try {
          const trainings = await fetchTrainingRequestsForDashboard(userId)
          setTrainingRequests(trainings)
        } catch (error) {
          console.error('Error loading training requests:', error)
        }
      }

      // Charger les véhicules du garage depuis Supabase
      const rows = await fetchGarageVehicles()
      setVehicles(
        rows.map((row) => ({
          id: row.id,
          brand: row.brand,
          model: row.model,
          year: row.year,
          color: row.color ?? undefined,
          imageUrl: row.image_url ?? undefined,
          ceramicProtectionDate: row.ceramic_protection_date ? new Date(row.ceramic_protection_date) : undefined,
          protectionShop: row.protection_shop ?? undefined,
          protectionProduct: row.protection_product ?? undefined,
        }))
      )

      // Charger les commandes Shopify/Supabase pour la section My Orders
      try {
        const loadedOrders = await fetchCustomerOrders()
        setOrders(loadedOrders)
      } catch (ordersError) {
        console.error('Error loading dashboard orders:', ordersError)
        setOrders([])
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
      } catch (err) {
        console.error('[AccountDashboard] Error during load:', err)
        // En cas d'erreur réseau/Supabase, afficher quand même le dashboard
        // plutôt que de laisser React crasher et recharger la page en boucle
        setShowDashboard(true)
        setDashboardDataLoaded(true)
      }
    }

    checkAuthAndLoadProfile()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageState])

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
    perQueryLimit = 8,
  ): Promise<DashboardNotification[]> => {
    try {
      const [allRes, roleRes, userRes] = await Promise.all([
        supabase
          .from('user_notifications')
          .select('id,title,message,created_at,target_type')
          .eq('target_type', 'all')
          .order('created_at', { ascending: false })
          .limit(perQueryLimit),
        supabase
          .from('user_notifications')
          .select('id,title,message,created_at,target_type,target_role')
          .eq('target_type', 'role')
          .eq('target_role', role)
          .order('created_at', { ascending: false })
          .limit(perQueryLimit),
        supabase
          .from('user_notifications')
          .select('id,title,message,created_at,target_type,target_user_id')
          .eq('target_type', 'user')
          .eq('target_user_id', userId)
          .order('created_at', { ascending: false })
          .limit(perQueryLimit),
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

  const highlightedTrainingRequest = useMemo(
    () => pickPrimaryTrainingRequestForDashboard(trainingRequests),
    [trainingRequests],
  )
  const paymentDueTrainingRequest = useMemo(() => {
    const due = trainingRequests.filter((r) => r.status === 'payment_pending')
    if (!due.length) return null
    return [...due].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
  }, [trainingRequests])
  const hasActiveTrainingRequest = useMemo(
    () => trainingRequests.some((r) => ['pending', 'approved', 'payment_pending'].includes(r.status)),
    [trainingRequests],
  )

  useEffect(() => {
    if (!currentUserId) return
    const ch = supabase
      .channel(`training_requests_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'training_requests',
          filter: `user_id=eq.${currentUserId}`,
        },
        () => {
          void fetchTrainingRequestsForDashboard(currentUserId).then(setTrainingRequests)
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(ch)
    }
  }, [currentUserId])

  useEffect(() => {
    if (!currentUserId) return
    const refetchTrainings = () => {
      void fetchTrainingRequestsForDashboard(currentUserId).then(setTrainingRequests)
    }
    const onVis = () => {
      if (document.visibilityState === 'visible') refetchTrainings()
    }
    window.addEventListener('focus', refetchTrainings)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('focus', refetchTrainings)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [currentUserId])

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
          {slidePillVisible && notificationCount > 0 && (
            <div className="pointer-events-none fixed inset-x-0 top-0 z-[92] flex justify-end px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-8">
              <button
                type="button"
                onClick={scrollToDashboardNotifications}
                className="fb-dashboard-notif-slide-pill pointer-events-auto flex max-w-[min(100%,22rem)] items-center gap-2 rounded-full border border-[#0485F7]/25 bg-white px-4 py-2.5 text-left text-[13px] font-medium leading-snug text-[#171717] shadow-[0_10px_36px_rgba(4,133,247,0.2)] transition hover:border-[#0485F7]/40 hover:shadow-[0_12px_40px_rgba(4,133,247,0.28)]"
                aria-label="View notifications on dashboard"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0485F7]/10 text-[#0485F7]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={24}
                    height={24}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-bell-icon lucide-bell"
                    aria-hidden
                  >
                    <path d="M10.268 21a2 2 0 0 0 3.464 0" />
                    <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
                  </svg>
                </span>
                <span>
                  {notificationCount === 1
                    ? 'You have a new notification'
                    : `You have ${notificationCount} new notifications`}
                </span>
              </button>
            </div>
          )}
          {shopifySyncWarning && (
            <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 pt-6">
              <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-amber-200 text-sm">
                Compte Supabase cree, mais la synchronisation Shopify a echoue: {shopifySyncWarning}
              </div>
            </div>
          )}
          {/* Mobile-only dashboard */}
          <MobileDashboard
            currentXp={xp}
            xpProgressPercent={nextTier
              ? Math.min(100, Math.max(0, ((xp - currentTier.minXp) / (nextTier.minXp - currentTier.minXp)) * 100))
              : 100}
            xpToNextTier={nextTier ? Math.max(0, nextTier.minXp - xp) : 0}
            partnerStatus={partnerStatus}
            tier={currentTier.headerLabel}
            onProductsPurchasedClick={() => setProductsPurchasedOpen(true)}
            onLeaderboardClick={() => setLeaderboardOpen(true)}
            onTrophyClick={() => setTrophyOpen(true)}
          />

          {/* Desktop hero (hidden on mobile) */}
          <div className="hidden lg:block">
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
            walletBalanceLabel="0.00 $"
            headerRight={
              <div ref={notificationsMenuRef} className="flex items-center gap-5">
                <button
                  type="button"
                  className="flex items-center justify-center rounded-lg text-carbon-800 transition-colors hover:bg-black/[0.05] hover:text-carbon-900"
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
                <div ref={notificationsBellAnchorRef} className="relative flex items-center">
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
                    className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-carbon-800 transition-colors hover:bg-black/[0.06] hover:text-carbon-900"
                    aria-label={`Open notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ''}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={24}
                      height={24}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-bell-icon lucide-bell h-6 w-6 shrink-0"
                      aria-hidden
                    >
                      <path d="M10.268 21a2 2 0 0 0 3.464 0" />
                      <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
                    </svg>
                    {notificationCount > 0 ? (
                      <span className="absolute -right-1 -top-0.5 flex min-h-[16px] min-w-[16px] items-center justify-center rounded bg-[#E11D48] px-[3px] text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-white">
                        {notificationCount > 99 ? '99+' : notificationCount}
                      </span>
                    ) : null}
                  </button>
                </div>
              </div>
            }
          />
          </div>
          {notificationsMenuOpen &&
            typeof document !== 'undefined' &&
            createPortal(
              <div
                ref={notificationsPanelRef}
                className="fixed z-[200] rounded-2xl border border-[#0485F7]/20 bg-white shadow-[0_20px_50px_rgba(4,133,247,0.15)]"
                style={{
                  top: notificationsPanelBox?.top ?? 88,
                  left: notificationsPanelBox?.left ?? 12,
                  width: notificationsPanelBox?.width ?? Math.min(320, window.innerWidth - 32),
                }}
                role="dialog"
                aria-modal="true"
                aria-label="Notifications"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="border-b border-[#0485F7]/10 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-nav font-bold uppercase tracking-[0.14em] text-[#0485F7]">
                      Notifications
                    </span>
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-[#6B7280] transition hover:text-[#0485F7]"
                      onClick={async () => {
                        const realIds = notifications.map((n) => n.id).filter((id) => !isDemoNotificationId(id))
                        if (realIds.length === 0 && SHOW_DEMO_NOTIFICATIONS) {
                          setDemoNotificationsDismissed(true)
                          return
                        }
                        if (realIds.length && currentUserId) {
                          setDismissedNotificationIds((prev) => {
                            const next = [...new Set([...prev, ...realIds])]
                            saveDismissedNotificationIds(currentUserId, next)
                            return next
                          })
                          await supabase.from('user_notifications').delete().in('id', realIds)
                        }
                        setNotifications([])
                      }}
                    >
                      Clear all
                    </button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto overscroll-contain px-2 py-2" onWheel={(e) => e.stopPropagation()}>
                  {visibleNotifications.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-[#6B7280]">No notifications.</p>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {visibleNotifications.map((n) => (
                        <div
                          key={n.id}
                          className="rounded-xl border border-[#E5E7EB] bg-gradient-to-b from-[#f8fbff] to-white px-3 py-2.5 text-xs text-[#374151]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              {n.title ? (
                                <p className="truncate text-[12px] font-semibold text-[#111827]">
                                  <NotificationMessageWithStatusHighlight text={n.title} />
                                </p>
                              ) : null}
                              <p className="mt-0.5 line-clamp-3 text-[11px] leading-snug text-[#4B5563]">
                                <NotificationMessageWithStatusHighlight text={n.message} />
                              </p>
                              <p className="mt-1.5 text-[10px] font-medium text-[#9CA3AF]">
                                {formatNotificationTimeAgo(n.created_at)}
                              </p>
                            </div>
                            <button
                              type="button"
                              className="shrink-0 text-[11px] font-semibold text-[#0485F7] transition hover:text-[#0366c7]"
                              onClick={async () => {
                                if (isDemoNotificationId(n.id)) {
                                  setDemoNotificationsDismissed(true)
                                  return
                                }
                                if (currentUserId) {
                                  setDismissedNotificationIds((prev) => {
                                    const next = [...new Set([...prev, n.id])]
                                    saveDismissedNotificationIds(currentUserId, next)
                                    return next
                                  })
                                }
                                await supabase.from('user_notifications').delete().eq('id', n.id)
                                setNotifications((prev) => prev.filter((x) => x.id !== n.id))
                              }}
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>,
              document.body,
            )}

          {userRole === 'admin' && currentUserId ? (
            <div
              className="hidden lg:block pointer-events-auto fixed bottom-3 left-3 z-[95] rounded-md border border-carbon-200/90 bg-white/95 px-2 py-1.5 shadow-sm backdrop-blur-sm"
              role="region"
              aria-label="Outils XP admin : paliers de tier et +500 XP (temporaire)"
            >
              <p className="text-[9px] font-medium uppercase tracking-wide text-carbon-400">Admin · XP → tier</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {([1, 2, 3, 4, 5] as const).map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={adminXpSnapSaving}
                    onClick={() => void persistAdminXpAtTierFloor(idx)}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums transition-colors ${
                      getTierForXp(xp).current.index === idx
                        ? 'bg-carbon-900 text-white'
                        : 'bg-carbon-100 text-carbon-600 hover:bg-carbon-200'
                    } ${adminXpSnapSaving ? 'opacity-50' : ''}`}
                  >
                    T{idx}
                  </button>
                ))}
              </div>
              <div className="mt-1.5 border-t border-carbon-200/80 pt-1.5">
                <button
                  type="button"
                  disabled={adminXpSnapSaving}
                  onClick={() => void persistAdminAddXp(500)}
                  className={`w-full rounded px-1.5 py-0.5 text-[10px] font-semibold text-carbon-700 transition-colors hover:bg-[#0485F7]/15 hover:text-[#0366c7] ${
                    adminXpSnapSaving ? 'opacity-50' : ''
                  }`}
                >
                  +500 XP
                </button>
              </div>
            </div>
          ) : null}

          <section className="hidden lg:block w-full min-h-[90vh] bg-white relative z-20 px-6 md:px-12 lg:px-16 py-10 md:py-14" aria-label="Account actions section">
            <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
                <article className="min-w-0 overflow-hidden rounded-2xl bg-[#F3F3F3] px-6 py-6 md:px-8 md:py-8">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#171717]">Academy training</p>
                    {!hasActiveTrainingRequest ? (
                      <Link
                        to="/academy?joinTraining=1"
                        className="shrink-0 text-sm font-semibold text-[#0485F7] transition-colors hover:text-[#0366c7] hover:underline"
                      >
                        Request training
                      </Link>
                    ) : null}
                  </div>
                  {highlightedTrainingRequest ? (
                    <div className="mt-5 min-w-0 max-w-full">
                      {(() => {
                        const t = trainingStatusCopy(highlightedTrainingRequest.status)
                        return (
                          <>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${t.badgeClass}`}
                              >
                                {t.badge}
                              </span>
                            </div>
                            <p className="mt-3 text-sm font-semibold text-[#171717] leading-snug">
                              {highlightedTrainingRequest.session_label}
                            </p>
                            <p
                              className="mt-1 block max-w-full min-w-0 break-all font-mono text-[11px] text-[#6B6B6B] [overflow-wrap:anywhere]"
                              title={highlightedTrainingRequest.reference}
                            >
                              Ref. {highlightedTrainingRequest.reference}
                            </p>
                            <p className="mt-3 text-sm leading-relaxed text-[#4A4A4A]">{t.description}</p>
                            {highlightedTrainingRequest.status === 'payment_pending' &&
                            highlightedTrainingRequest.payment_instructions ? (
                              <div className="mt-3 rounded-xl border border-orange-200/80 bg-white/80 px-3 py-2.5">
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-orange-800/90">
                                  Instructions
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#4A4A4A]">
                                  {highlightedTrainingRequest.payment_instructions}
                                </p>
                              </div>
                            ) : null}
                            {highlightedTrainingRequest.status === 'payment_pending' ? (
                              <div className="mt-4">
                                <button
                                  type="button"
                                  onClick={() => setTrainingPaymentModalOpen(true)}
                                  className={cn(
                                    'inline-flex w-full items-center justify-center rounded-full bg-[#0485F7] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0366c7] sm:w-auto',
                                  )}
                                >
                                  Confirm your place
                                </button>
                                <p className="mt-2 text-xs text-[#6B6B6B]">
                                  Paiement sécurisé dans un nouvel onglet lorsque le lien Stripe est configuré pour le site.
                                </p>
                              </div>
                            ) : null}
                          </>
                        )
                      })()}
                    </div>
                  ) : (
                    <div className="mt-5">
                      <p className="text-sm leading-relaxed text-[#4A4A4A]">
                        You don&apos;t have a training request on file. Submit a request for a future session — no payment on the form;
                        Fireball Canada will approve or decline by email.
                      </p>
                      <div className="mt-4">
                        <Link to="/academy?joinTraining=1" className={cn('inline-flex justify-center', appleButtonClassName)}>
                          Open Academy
                        </Link>
                      </div>
                    </div>
                  )}
                </article>

                <article
                  ref={dashboardNotificationsRef}
                  id="dashboard-notifications-card"
                  className="relative overflow-hidden rounded-2xl bg-[#F3F3F3] px-6 py-6 md:px-8 md:py-8"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#171717]">Notifications</p>
                    {notificationCount > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-[#0485F7] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
                          {notificationCount} new
                        </span>
                      ) : null}
                    </div>
                    {notificationCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => void clearAllDashboardNotifications()}
                        className="shrink-0 text-xs font-semibold text-[#6B7280] transition hover:text-[#0485F7]"
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                  {notificationCount === 0 ? (
                    <p className="mt-5 text-sm leading-relaxed text-[#4A4A4A]">
                      No notifications yet. Messages from Fireball Canada (broadcasts, role updates, or personal notes) will appear here.
                    </p>
                  ) : (
                    <ul
                      className="mt-4 max-h-[min(320px,45vh)] space-y-3 overflow-y-auto overscroll-contain pr-1"
                      aria-label="Notification messages"
                      onWheelCapture={handleDashboardNotifListWheelCapture}
                    >
                      {visibleNotifications.slice(0, 12).map((n) => (
                        <li
                          key={n.id}
                          className="group rounded-xl border border-[#0485F7]/12 bg-white/90 px-3 py-2.5 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              {n.title ? (
                                <p className="text-[13px] font-semibold text-[#171717]">
                                  <NotificationMessageWithStatusHighlight text={n.title} />
                                </p>
                              ) : null}
                              <p className="mt-0.5 text-[12px] leading-snug text-[#4A4A4A] line-clamp-4">
                                <NotificationMessageWithStatusHighlight text={n.message} />
                              </p>
                              <p className="mt-1.5 text-[10px] font-medium text-[#8A8A8A]">
                                {formatNotificationTimeAgo(n.created_at)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => void clearSingleNotification(n.id)}
                              className="shrink-0 rounded-full p-1 text-[#9CA3AF] opacity-0 transition hover:bg-[#EEF2F7] hover:text-[#4B5563] group-hover:opacity-100"
                              aria-label="Clear notification"
                            >
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </div>

              <TrainingPaymentDueModal
                open={trainingPaymentModalOpen}
                onClose={() => setTrainingPaymentModalOpen(false)}
                request={
                  paymentDueTrainingRequest ??
                  (highlightedTrainingRequest?.status === 'payment_pending' ? highlightedTrainingRequest : null)
                }
                memberEmail={accountEmail}
              />

              <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
              <article className="rounded-2xl bg-[#F3F3F3] px-6 py-6 md:px-8 md:py-8">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#171717]">Orders</p>
                  <a
                    href={SHOPIFY_CUSTOMER_ORDERS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-sm font-semibold text-[#0485F7] transition-colors hover:text-[#0366c7] hover:underline"
                  >
                    See past orders
                  </a>
                </div>
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
                {/* ── My Garage ─────────────────────────────────────── */}
                <article className="rounded-[12px] bg-[#F3F3F3] px-5 py-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#171717]">My Garage</p>
                    <button
                      type="button"
                      onClick={() => setCarModalOpen(true)}
                      className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold text-white transition-all active:scale-95"
                      style={{ background: '#0071e3' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#0077ed')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#0071e3')}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Vehicle
                    </button>
                  </div>

                  {vehicles.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => setCarModalOpen(true)}
                      className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#D8D8D8] py-10 text-center transition-colors hover:border-[#BDBDBD] hover:bg-[#EBEBEB]"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E3E3E3]">
                        <svg className="h-6 w-6 text-[#8A8A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 17H5a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h8l2 3h1a2 2 0 012 2v6a2 2 0 01-2 2h-4M9 17v3m6-3v3M9 17h6" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#171717]">No vehicles yet</p>
                        <p className="mt-0.5 text-xs text-[#8A8A8A]">Add your first vehicle to track its protection</p>
                      </div>
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {vehicles.map((v) => (
                        <div key={v.id} className="rounded-xl bg-white overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
                          {/* Top row: image + info + edit button */}
                          <button
                            type="button"
                            onClick={() => setSettingsVehicle(v)}
                            className="flex w-full text-left transition-colors hover:bg-[#fafafa]"
                          >
                            <div className="flex h-[90px] w-[90px] shrink-0 items-center justify-center bg-[#F0F0F0] overflow-hidden">
                              {v.imageUrl ? (
                                <img src={v.imageUrl} alt={`${v.brand} ${v.model}`} className="h-full w-full object-cover" />
                              ) : (
                                <svg className="h-7 w-7 text-[#C8C8C8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              )}
                            </div>
                            <div className="flex flex-1 flex-col justify-center px-4 py-3 min-w-0">
                              <p className="text-[14px] font-bold text-[#171717] leading-tight truncate">
                                {v.year} {v.brand} {v.model}
                              </p>
                              {v.color && <p className="mt-0.5 text-[11px] text-[#8A8A8A]">{v.color}</p>}
                              {v.ceramicProtectionDate ? (
                                <div className="mt-2 flex flex-col gap-1">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5E9] px-2 py-0.5 text-[10px] font-semibold text-[#2E7D32] w-fit">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#4CAF50]" />
                                    Ceramic protected
                                  </span>
                                  <span className="text-[11px] text-[#8A8A8A]">
                                    <span className="font-medium text-[#555]">When </span>
                                    {v.ceramicProtectionDate.toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
                                  </span>
                                  {v.protectionShop && (
                                    <span className="text-[11px] text-[#8A8A8A] truncate">
                                      <span className="font-medium text-[#555]">Where </span>
                                      {v.protectionShop}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#FFF0EF] px-2 py-0.5 text-[10px] font-semibold text-[#D94032] w-fit">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF3B30]" />
                                  Not protected
                                </span>
                              )}
                            </div>
                            <div className="flex items-center pr-3 shrink-0">
                              <svg className="h-4 w-4 text-[#C8C8C8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </button>

                        </div>
                      ))}
                    </div>
                  )}
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
              </div>
            </div>
            </div>
          </section>
          {leaderboardOpen && createPortal(
            <div className="fixed inset-0 z-[10040] flex items-center justify-center p-4 md:p-6" role="dialog" aria-modal="true">
              <button
                type="button"
                className="absolute inset-0 bg-black/50"
                aria-label="Close leaderboard"
                onClick={() => setLeaderboardOpen(false)}
              />
              <div className="relative z-10 flex max-h-[88vh] w-full max-w-[640px] flex-col overflow-hidden rounded-[22px] bg-[#ececec] p-0 shadow-[0_10px_28px_rgba(0,0,0,0.18)]">
                <div className="p-6 sm:p-7">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#dedee0] text-[#2e2e30]">
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
                        className="h-5 w-5"
                        aria-hidden
                      >
                        <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" />
                        <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" />
                        <path d="M18 9h1.5a1 1 0 0 0 0-5H18" />
                        <path d="M4 22h16" />
                        <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
                        <path d="M6 9H4.5a1 1 0 0 1 0-5H6" />
                      </svg>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#d8d8da] text-[#6c6c71] transition-colors hover:bg-[#cfd0d3]"
                      onClick={() => setLeaderboardOpen(false)}
                      aria-label="Fermer"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-[clamp(22px,4vw,30px)] leading-[1.05] font-semibold tracking-tight text-[#252528]">
                    Leaderboard
                  </p>
                  <p className="mt-3 text-[13px] leading-[1.45] text-[#6c6c71]">
                    See the ranking of Fireball members and track your current position.
                  </p>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-24 sm:px-7">
                  {leaderboardLoading ? (
                    <p className="text-sm text-[#6c6c71]">Chargement du leaderboard...</p>
                  ) : leaderboardEntries.length === 0 ? (
                    <p className="text-sm text-[#6c6c71]">Aucun score disponible.</p>
                  ) : (
                    <div className="space-y-2">
                      {leaderboardEntries.map((entry, idx) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between rounded-2xl border border-[#dddddf] bg-[#f7f7f8] px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 text-sm font-semibold text-[#7a7a80]">#{idx + 1}</span>
                            <span className="text-sm font-semibold text-[#252528]">{entry.label}</span>
                          </div>
                          <span className="text-sm font-semibold text-[#4a4a4f]">{entry.xp.toLocaleString()} XP</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 border-t border-[#d9d9dc] bg-[#ececec]/90 px-6 py-4 backdrop-blur-md sm:px-7">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-[0.12em] text-[#7a7a80]">
                      {personalLeaderboardRank ? `#${personalLeaderboardRank}` : '--'}
                    </div>
                    <div className="truncate text-sm font-semibold text-[#252528]">{fullName || 'Member'}</div>
                    <div className="text-sm font-semibold text-[#4a4a4f]">{xp.toLocaleString()} XP</div>
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
                className="absolute inset-0 bg-black/50"
                aria-label="Close trophy"
                onClick={() => setTrophyOpen(false)}
              />
              <div className="relative z-10 flex max-h-[88vh] w-full max-w-[520px] flex-col overflow-hidden rounded-[22px] bg-[#ececec] p-0 shadow-[0_10px_28px_rgba(0,0,0,0.18)]">
                <div className="p-6 sm:p-7">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#dedee0] text-[#2e2e30]">
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
                        className="h-5 w-5"
                        aria-hidden
                      >
                        <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" />
                        <circle cx="12" cy="8" r="6" />
                      </svg>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#d8d8da] text-[#6c6c71] transition-colors hover:bg-[#cfd0d3]"
                      onClick={() => setTrophyOpen(false)}
                      aria-label="Fermer"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-[clamp(22px,4vw,30px)] leading-[1.05] font-semibold tracking-tight text-[#252528]">
                    Trophy
                  </p>
                  <p className="mt-3 text-[13px] leading-[1.45] text-[#6c6c71]">
                    See your rewards, milestones and achievements.
                  </p>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 sm:px-7">
                  <div className="rounded-2xl border border-[#dddddf] bg-[#f7f7f8] p-6 text-[#4a4a4f] md:p-8">
                    Trophy content coming soon.
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}
          <div className="hidden lg:block"><Footer /></div>
      </div>
      )}

      <AddVehicleModal
        isOpen={carModalOpen}
        onClose={() => setCarModalOpen(false)}
        onSelect={(make, model, year) => {
          setCarModalOpen(false)
          setPendingAdd({ brand: make, model, year })
        }}
      />
      {pendingAdd && (
        <VehicleAddDetailsModal
          base={pendingAdd}
          onClose={() => setPendingAdd(null)}
          onBack={() => { setPendingAdd(null); setCarModalOpen(true) }}
          onCreated={(v) => { setVehicles((prev) => [...prev, v]); setPendingAdd(null) }}
        />
      )}
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
              color: updates.color ?? null,
              imageUrl: updates.imageUrl ?? null,
              notes: updates.notes ?? null,
            })
            if (!updated) return
            setVehicles((prev) =>
              prev.map((v) =>
                v.id === settingsVehicle.id
                  ? {
                      ...v,
                      color: updates.color,
                      imageUrl: updates.imageUrl,
                      notes: updates.notes,
                      ceramicProtectionDate: updates.ceramicProtectionDate,
                      protectionShop: updates.protectionShop,
                      protectionProduct: updates.protectionProduct,
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
