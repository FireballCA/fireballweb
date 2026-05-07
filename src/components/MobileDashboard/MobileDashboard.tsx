import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SHOPIFY_CUSTOMER_ORDERS_URL } from '@/constants/shopifyShopApp'
import { lockScroll, unlockScroll } from '@/utils/scrollLock'
import { MobilePageSheet } from '@/components/MobilePageSheet/MobilePageSheet'
import { MobileSettingsContent } from '@/components/MobileSettingsContent/MobileSettingsContent'
import { AppleSheet } from '@/components/ui/AppleSheet'
import {
  AcademyTrainingRequestCard,
  AcademyTrainingRequestsEmpty,
} from '@/components/AcademyTrainingRequestViews'
import type { TrainingRequestRow } from '@/utils/trainingRequests'
import { formatOrderRef } from '@/utils/customerOrders'
import { NotificationMessageWithStatusHighlight } from '@/utils/notificationTextHighlight'

// ── Minimal shared types (kept local to avoid circular deps) ──────────────────

interface VehicleItem {
  id: string
  brand: string
  model: string
  year: number
  color?: string
  imageUrl?: string
  ceramicProtectionDate?: Date
  protectionShop?: string
  protectionProduct?: string
  notes?: string
}

interface OrderLineItem {
  title: string
  price: number
  quantity: number
  imageUrl?: string
}

interface OrderItem {
  id: string
  name: string
  date?: string
  orderNumber?: string
  totalPrice?: number
  currency?: string
  lineItems?: OrderLineItem[]
  imageUrl?: string
  pointsEarned?: number
}

interface NotificationItem {
  id: string
  title: string | null
  message: string
  created_at: string
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface MobileDashboardProps {
  currentXp: number
  xpProgressPercent: number
  xpToNextTier?: number
  partnerStatus?: string | null
  tier?: string | null
  onLeaderboardClick?: () => void
  trainingRequests?: TrainingRequestRow[]
  onAcademyPaymentRequest?: (row: TrainingRequestRow) => void
  // Pages data
  vehicles?: VehicleItem[]
  orders?: OrderItem[]
  notifications?: NotificationItem[]
  notificationCount?: number
  onAddVehicle?: () => void
  onEditVehicle?: (v: VehicleItem) => void
  onClearNotification?: (id: string) => void
  onClearAllNotifications?: () => void
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconPackage() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
    </svg>
  )
}

function IconOrders() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  )
}

function IconNotification() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
  )
}

function IconSettings() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconBuilding() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" />
    </svg>
  )
}

function IconAcademy() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
  )
}

function IconGarage() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" />
    </svg>
  )
}

function IconLeaderboard() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="18" y="3" width="4" height="18" rx="1" />
      <rect x="10" y="8" width="4" height="13" rx="1" />
      <rect x="2" y="13" width="4" height="8" rx="1" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BADGE_SIZE_EXPANDED = 170
const BADGE_SIZE_COLLAPSED = 290
const SHEET_TOP = 324
const PEEK_PX = 72
const SNAP_THRESHOLD = 60
const STICKY_BAR_TOP = 14
const SIDE_PADDING = 20
const TIER_BADGES_PRELOAD_COOKIE = 'fb_tier_badges_preloaded'
const TIER_BADGES_PRELOAD_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

const MOBILE_TIERS = [
  {
    index: 1,
    label: 'Tier 1',
    headerLabel: 'TIER 1',
    badgeSrc: '/Account/Level Badge/Tier 1.png',
    benefits: [
      'Base access to Fireball ecosystem',
      'Earn XP on every eligible purchase',
      'Unlock higher tiers with continued activity',
    ],
  },
  {
    index: 2,
    label: 'Tier 2',
    headerLabel: 'TIER 2',
    badgeSrc: '/Account/Level Badge/Tier 2.png',
    benefits: [
      '10$ Rewards',
      'Early access to select offers',
      'Priority email support',
    ],
  },
  {
    index: 3,
    label: 'Tier 3',
    headerLabel: 'TIER 3',
    badgeSrc: '/Account/Level Badge/Tier 3.png',
    benefits: [
      '15$ Rewards',
      'Access to exclusive products',
      'Early access to new releases',
      'Occasional bonus rewards',
      'Fireball Partnership',
    ],
  },
  {
    index: 4,
    label: 'Tier 4',
    headerLabel: 'TIER 4',
    badgeSrc: '/Account/Level Badge/Tier 4.png',
    benefits: [
      '20$ Rewards',
      'Priority access to limited drops',
      'Exclusive member offers',
      'Special event access',
    ],
  },
  {
    index: 5,
    label: 'Tier 5',
    headerLabel: 'TIER 5',
    badgeSrc: '/Account/Level Badge/Tier 5.png',
    benefits: [
      '30$ Rewards',
      'VIP-only products & drops',
      'Maximum priority access',
      'Annual exclusive reward',
      'Top-tier member status',
    ],
  },
] as const

function getTierIndexFromLabel(tier?: string | null): number {
  const t = String(tier || '').toUpperCase().trim()
  if (t === 'TIER 2') return 1
  if (t === 'TIER 3') return 2
  if (t === 'TIER 4') return 3
  if (t === 'TIER 5') return 4
  return 0
}

function formatTimeAgo(isoDate: string): string {
  if (!isoDate) return ''
  try {
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return isoDate
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MobileDashboard({
  currentXp,
  xpProgressPercent,
  xpToNextTier,
  partnerStatus,
  tier,
  onLeaderboardClick,
  trainingRequests = [],
  onAcademyPaymentRequest,
  vehicles = [],
  orders = [],
  notifications = [],
  notificationCount = 0,
  onAddVehicle,
  onEditVehicle,
  onClearNotification,
  onClearAllNotifications,
}: MobileDashboardProps) {
  const currentTierIndex = getTierIndexFromLabel(tier)
  const [viewingTierIndex, setViewingTierIndex] = useState(currentTierIndex)
  const [activeSheet, setActiveSheet] = useState<'garage' | 'settings' | 'notifications' | 'orders' | null>(null)
  const [academySheetOpen, setAcademySheetOpen] = useState(false)

  const isPartner = String(partnerStatus || '').trim().toLowerCase() === 'partner'

  const sheetRef = useRef<HTMLDivElement>(null)
  const xpContainerRef = useRef<HTMLDivElement>(null)
  const progressBarWrapperRef = useRef<HTMLDivElement>(null)
  const stickyBarRef = useRef<HTMLDivElement>(null)
  const stickyBarFillRef = useRef<HTMLDivElement>(null)
  const stickyLabelsRef = useRef<HTMLDivElement>(null)
  const badgeContainerRef = useRef<HTMLDivElement>(null)
  const currentBadgeImgRef = useRef<HTMLImageElement>(null)
  const viewingBadgeImgRef = useRef<HTMLImageElement>(null)
  const impactTierRef = useRef<HTMLDivElement>(null)
  const benefitsContainerRef = useRef<HTMLDivElement>(null)
  const arrowsContainerRef = useRef<HTMLDivElement>(null)
  const lockOverlayRef = useRef<HTMLDivElement>(null)

  const isExpandedRef = useRef(true)
  const maxSheetYRef = useRef(0)
  const touchStartYRef = useRef(0)
  const sheetYAtDragStartRef = useRef(0)
  const progressRef = useRef(0)

  const viewingTierIndexRef = useRef(viewingTierIndex)
  viewingTierIndexRef.current = viewingTierIndex

  const computeMaxY = () => window.innerHeight - SHEET_TOP - PEEK_PX

  const applySheetTransform = (y: number, animate: boolean) => {
    const maxY = maxSheetYRef.current
    const progress = maxY > 0 ? Math.max(0, Math.min(1, y / maxY)) : 0
    progressRef.current = progress
    const EASE = 'cubic-bezier(0.4,0,0.2,1)'
    const DUR = '0.35s'
    const sheetTrans = animate ? `transform ${DUR} ${EASE}` : 'none'
    const allTrans = animate ? `all ${DUR} ${EASE}` : 'none'

    if (sheetRef.current) {
      sheetRef.current.style.transition = sheetTrans
      sheetRef.current.style.transform = `translateY(${y}px)`
    }

    const badgeSize = BADGE_SIZE_EXPANDED + (BADGE_SIZE_COLLAPSED - BADGE_SIZE_EXPANDED) * progress
    const section2VisualTop = SHEET_TOP + y
    const screenCenter = (window.innerHeight - PEEK_PX) / 2
    const breakpoint = 0.65
    let imageCenterY: number
    if (progress <= breakpoint) {
      imageCenterY = section2VisualTop
    } else {
      const t = (progress - breakpoint) / (1 - breakpoint)
      const tEased = t * t * (3 - 2 * t)
      imageCenterY = section2VisualTop + (screenCenter - section2VisualTop) * tEased
    }

    if (badgeContainerRef.current) {
      badgeContainerRef.current.style.transition = allTrans
      badgeContainerRef.current.style.width = `${badgeSize}px`
      badgeContainerRef.current.style.height = `${badgeSize}px`
      badgeContainerRef.current.style.top = `${imageCenterY - badgeSize / 2}px`
    }

    const viewingBadgeOpacity = Math.min(1, progress * 2.5)
    const currentBadgeOpacity = Math.max(0, 1 - progress * 2.5)
    if (currentBadgeImgRef.current) {
      currentBadgeImgRef.current.style.transition = allTrans
      currentBadgeImgRef.current.style.opacity = `${currentBadgeOpacity}`
    }
    if (viewingBadgeImgRef.current) {
      viewingBadgeImgRef.current.style.transition = allTrans
      viewingBadgeImgRef.current.style.opacity = `${viewingBadgeOpacity}`
    }

    const xpOpacity = Math.max(0, 1 - progress * 2.2)
    const xpSlideY = -progress * 70
    if (xpContainerRef.current) {
      xpContainerRef.current.style.transition = allTrans
      xpContainerRef.current.style.opacity = `${xpOpacity}`
      xpContainerRef.current.style.transform = `translateY(${xpSlideY}px)`
    }

    if (progressBarWrapperRef.current) {
      progressBarWrapperRef.current.style.transition = allTrans
      progressBarWrapperRef.current.style.opacity = `${Math.max(0, 1 - progress * 2.5)}`
    }

    const stickyOpacity = Math.min(1, Math.max(0, (progress - 0.45) / 0.35))
    if (stickyBarRef.current) {
      stickyBarRef.current.style.transition = allTrans
      stickyBarRef.current.style.opacity = `${stickyOpacity}`
    }
    if (stickyLabelsRef.current) {
      stickyLabelsRef.current.style.transition = allTrans
      stickyLabelsRef.current.style.opacity = `${stickyOpacity}`
    }

    const impactOpacity = Math.min(1, Math.max(0, (progress - 0.3) / 0.45))
    const impactFontSize = 90 + 65 * progress
    const peekPx = 55
    const impactTop = imageCenterY - badgeSize / 2 - peekPx
    if (impactTierRef.current) {
      impactTierRef.current.style.transition = allTrans
      impactTierRef.current.style.opacity = `${impactOpacity}`
      impactTierRef.current.style.fontSize = `${impactFontSize}px`
      impactTierRef.current.style.top = `${impactTop}px`
    }

    const benefitsOpacity = Math.max(0, (progress - 0.6) / 0.4)
    const benefitsTop = imageCenterY + badgeSize / 2 + 16
    const benefitsMaxH = Math.max(80, window.innerHeight - PEEK_PX - benefitsTop - 8)
    if (benefitsContainerRef.current) {
      benefitsContainerRef.current.style.transition = allTrans
      benefitsContainerRef.current.style.opacity = `${benefitsOpacity}`
      benefitsContainerRef.current.style.top = `${benefitsTop}px`
      benefitsContainerRef.current.style.maxHeight = `${benefitsMaxH}px`
      benefitsContainerRef.current.style.overflowY = 'auto'
      benefitsContainerRef.current.style.touchAction = 'pan-y'
      benefitsContainerRef.current.style.pointerEvents = progress > 0.8 ? 'auto' : 'none'
    }

    if (arrowsContainerRef.current) {
      arrowsContainerRef.current.style.transition = allTrans
      arrowsContainerRef.current.style.opacity = `${benefitsOpacity}`
      arrowsContainerRef.current.style.top = `${imageCenterY}px`
      arrowsContainerRef.current.style.pointerEvents = progress > 0.8 ? 'auto' : 'none'
    }

    if (lockOverlayRef.current) {
      lockOverlayRef.current.style.transition = allTrans
      lockOverlayRef.current.style.opacity = `${benefitsOpacity}`
    }
  }

  useEffect(() => {
    maxSheetYRef.current = computeMaxY()
    applySheetTransform(0, false)

    if (window.innerWidth >= 1024) return

    lockScroll()
    return () => {
      unlockScroll()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const preload = async () => {
      const tasks = MOBILE_TIERS.map(
        (tierItem) =>
          new Promise<void>((resolve) => {
            const img = new Image()
            img.decoding = 'async'
            img.onload = () => resolve()
            img.onerror = () => resolve()
            img.src = tierItem.badgeSrc
            if (img.complete) resolve()
          }),
      )
      await Promise.all(tasks)
      if (cancelled) return
      document.cookie = `${TIER_BADGES_PRELOAD_COOKIE}=1; max-age=${TIER_BADGES_PRELOAD_COOKIE_MAX_AGE}; path=/; samesite=lax`
    }

    const hasPreloadedCookie = document.cookie.includes(`${TIER_BADGES_PRELOAD_COOKIE}=1`)
    if (hasPreloadedCookie) {
      void preload()
      return () => { cancelled = true }
    }
    void preload()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const onResize = () => {
      maxSheetYRef.current = computeMaxY()
      applySheetTransform(isExpandedRef.current ? 0 : maxSheetYRef.current, false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const currentY = isExpandedRef.current ? 0 : maxSheetYRef.current
    applySheetTransform(currentY, false)
  }, [viewingTierIndex])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY
    sheetYAtDragStartRef.current = isExpandedRef.current ? 0 : maxSheetYRef.current
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const dy = e.touches[0].clientY - touchStartYRef.current
    const rawY = sheetYAtDragStartRef.current + dy
    const clampedY = Math.max(0, Math.min(maxSheetYRef.current, rawY))
    applySheetTransform(clampedY, false)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - touchStartYRef.current
    const wasExpanded = isExpandedRef.current

    if (Math.abs(dy) < 10) {
      isExpandedRef.current = !wasExpanded
      applySheetTransform(isExpandedRef.current ? 0 : maxSheetYRef.current, true)
      return
    }

    if (wasExpanded && dy > SNAP_THRESHOLD) {
      isExpandedRef.current = false
      applySheetTransform(maxSheetYRef.current, true)
    } else if (!wasExpanded && dy < -SNAP_THRESHOLD) {
      isExpandedRef.current = true
      applySheetTransform(0, true)
    } else {
      applySheetTransform(wasExpanded ? 0 : maxSheetYRef.current, true)
    }
  }

  const navButtonClass =
    'flex w-full items-center rounded-2xl bg-white/[0.07] px-4 py-3 text-white active:bg-white/[0.13] transition-colors'

  const viewingTier = MOBILE_TIERS[viewingTierIndex]
  const isLocked = viewingTierIndex > currentTierIndex

  const handlePrevTier = () => setViewingTierIndex((i) => Math.max(0, i - 1))
  const handleNextTier = () => setViewingTierIndex((i) => Math.min(MOBILE_TIERS.length - 1, i + 1))

  const xpLabel = currentXp.toLocaleString() + ' XP'
  const nextTierLabel = xpToNextTier != null && xpToNextTier > 0
    ? `${xpToNextTier.toLocaleString()} XP to next tier`
    : 'Max tier reached'

  return (
    <div
      className="lg:hidden w-full relative"
      style={{ height: '100dvh', overflow: 'hidden', touchAction: 'none' }}
    >
      {/* ── Section 1: white hero ── */}
      <div
        className="absolute inset-0 bg-white overflow-hidden"
        onClick={() => {
          if (isExpandedRef.current) {
            isExpandedRef.current = false
            applySheetTransform(maxSheetYRef.current, true)
          }
        }}
      >
        <div
          ref={xpContainerRef}
          className="absolute inset-x-0 top-0 flex flex-col items-center justify-center pointer-events-none px-4"
          style={{
            height: SHEET_TOP,
            paddingTop: 'max(12px, env(safe-area-inset-top, 0px))',
            boxSizing: 'border-box',
          }}
        >
          <div className="flex items-start leading-none">
            <span
              className="text-neutral-900 font-inter font-light leading-none"
              style={{ fontSize: 56 }}
            >
              {currentXp.toLocaleString()}
            </span>
            <span
              className="text-neutral-500 font-inter mt-1 ml-1"
              style={{ fontSize: 14, lineHeight: '18px' }}
            >
              XP
            </span>
          </div>
          <div ref={progressBarWrapperRef} className="mt-2.5 w-28" style={{ transformOrigin: 'center' }}>
            <div className="h-1 rounded-full bg-neutral-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-neutral-800 transition-none"
                style={{ width: `${Math.min(Math.max(xpProgressPercent, 0), 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky progress bar ── */}
      <div
        ref={stickyBarRef}
        className="absolute z-[8] pointer-events-none"
        style={{ top: STICKY_BAR_TOP, left: SIDE_PADDING, right: SIDE_PADDING, opacity: 0 }}
      >
        <div className="h-[3px] rounded-full bg-neutral-200 overflow-hidden">
          <div
            ref={stickyBarFillRef}
            className="h-full rounded-full bg-neutral-800"
            style={{ width: `${Math.min(Math.max(xpProgressPercent, 0), 100)}%` }}
          />
        </div>
      </div>
      <div
        ref={stickyLabelsRef}
        className="absolute z-[8] pointer-events-none flex justify-between"
        style={{ top: STICKY_BAR_TOP + 7, left: SIDE_PADDING, right: SIDE_PADDING, opacity: 0 }}
      >
        <span style={{ fontSize: 10, color: '#737373', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
          {xpLabel}
        </span>
        <span style={{ fontSize: 10, color: '#737373', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
          {nextTierLabel}
        </span>
      </div>

      {/* ── Impact tier text ── */}
      <div
        ref={impactTierRef}
        className="absolute pointer-events-none z-[3]"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: 0,
          color: 'rgba(23,23,23,0.13)',
          fontFamily: "Impact, 'Haettenschweiler', 'Arial Narrow Bold', 'Arial Black', sans-serif",
          fontWeight: 900,
          lineHeight: 1,
          whiteSpace: 'nowrap',
          letterSpacing: '-0.01em',
          textTransform: 'uppercase',
          fontSize: 90,
          top: SHEET_TOP - BADGE_SIZE_COLLAPSED / 2 - 55,
        }}
      >
        {viewingTier.headerLabel}
      </div>

      {/* ── Badge image ── */}
      <div
        ref={badgeContainerRef}
        className="absolute z-[5] pointer-events-none"
        style={{
          top: SHEET_TOP - BADGE_SIZE_EXPANDED / 2,
          left: '50%',
          transform: 'translateX(-50%)',
          width: BADGE_SIZE_EXPANDED,
          height: BADGE_SIZE_EXPANDED,
        }}
      >
        <img
          ref={currentBadgeImgRef}
          src={MOBILE_TIERS[currentTierIndex].badgeSrc}
          alt={MOBILE_TIERS[currentTierIndex].label}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 1 }}
        />
        <img
          ref={viewingBadgeImgRef}
          src={viewingTier.badgeSrc}
          alt={viewingTier.label}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0, filter: isLocked ? 'brightness(0.35)' : undefined }}
        />
        {isLocked && (
          <div
            ref={lockOverlayRef}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ opacity: 0 }}
          >
            <IconLock />
          </div>
        )}
      </div>

      {/* ── Arrow buttons ── */}
      <div
        ref={arrowsContainerRef}
        className="absolute z-[6] flex items-center justify-between pointer-events-none"
        style={{
          left: '50%',
          transform: 'translateX(-50%) translateY(-50%)',
          width: BADGE_SIZE_COLLAPSED + 80,
          top: SHEET_TOP,
          opacity: 0,
        }}
      >
        <button
          type="button"
          onClick={handlePrevTier}
          disabled={viewingTierIndex === 0}
          className="flex items-center justify-center rounded-full bg-black/10 active:bg-black/20 transition-colors disabled:opacity-20"
          style={{ width: 36, height: 36 }}
          aria-label="Tier précédent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#171717" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleNextTier}
          disabled={viewingTierIndex === MOBILE_TIERS.length - 1}
          className="flex items-center justify-center rounded-full bg-black/10 active:bg-black/20 transition-colors disabled:opacity-20"
          style={{ width: 36, height: 36 }}
          aria-label="Tier suivant"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#171717" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* ── Benefits rectangles ── */}
      <div
        ref={benefitsContainerRef}
        className="absolute z-[6] pointer-events-none mobile-no-scrollbar"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          width: BADGE_SIZE_COLLAPSED,
          top: SHEET_TOP + BADGE_SIZE_COLLAPSED / 2 + 16,
          opacity: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {viewingTier.benefits.map((benefit, i) => {
          const isRewardBenefit = benefit.includes('$')
          const hidden = isLocked && !isRewardBenefit
          return (
            <div
              key={i}
              className="flex items-center gap-2.5 px-4"
              style={{
                minHeight: 44,
                background: 'rgba(229, 231, 235, 0.85)',
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                fontWeight: 400,
                color: '#171717',
              }}
            >
              <span style={{ color: '#6b7280', fontWeight: 400, fontSize: 15, flexShrink: 0 }}>+</span>
              <span style={hidden ? { color: '#9ca3af', fontStyle: 'italic' } : undefined}>
                {hidden ? 'Unlock to see' : benefit}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── Section 2: dark bottom sheet ── */}
      <div
        ref={sheetRef}
        className="absolute left-0 right-0 z-10 bg-[#111111] rounded-t-[28px]"
        style={{
          top: SHEET_TOP,
          minHeight: `calc(100dvh - ${SHEET_TOP}px)`,
          willChange: 'transform',
        }}
      >
        {/* Handle bar */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="rounded-full bg-white/30" style={{ width: 96, height: 6 }} />
        </div>

        {/* Scrollable menu */}
        <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: `calc(100dvh - ${SHEET_TOP + 44}px)`, touchAction: 'pan-y' }}>
          <div className="px-5 pb-8 flex flex-col gap-2.5" style={{ paddingTop: 8 }}>

            {/* Track your order — external */}
            <a
              href={SHOPIFY_CUSTOMER_ORDERS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={navButtonClass}
            >
              <span className="w-8 flex justify-start text-white/50 shrink-0"><IconPackage /></span>
              <span className="flex-1 text-center font-nav font-semibold text-[13px]">Track your order</span>
              <span className="w-8" />
            </a>

            {/* My Orders */}
            <button type="button" onClick={() => setActiveSheet('orders')} className={navButtonClass}>
              <span className="w-8 flex justify-start text-white/50 shrink-0"><IconOrders /></span>
              <span className="flex-1 text-center font-nav font-semibold text-[13px]">My Orders</span>
              {orders.length > 0 ? (
                <span className="w-8 flex justify-end">
                  <span className="text-[11px] font-semibold text-white/40">{orders.length}</span>
                </span>
              ) : (
                <span className="w-8" />
              )}
            </button>

            {/* Notifications */}
            <button type="button" onClick={() => setActiveSheet('notifications')} className={navButtonClass}>
              <span className="w-8 flex justify-start text-white/50 shrink-0"><IconNotification /></span>
              <span className="flex-1 text-center font-nav font-semibold text-[13px]">Notifications</span>
              {notificationCount > 0 ? (
                <span className="w-8 flex justify-end">
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0485F7] px-1.5 text-[10px] font-bold text-white leading-none">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                </span>
              ) : (
                <span className="w-8" />
              )}
            </button>

            {/* Academy training */}
            <button type="button" onClick={() => setAcademySheetOpen(true)} className={navButtonClass}>
              <span className="w-8 flex justify-start text-white/50 shrink-0"><IconAcademy /></span>
              <span className="flex-1 text-center font-nav font-semibold text-[13px]">Academy training</span>
              <span className="w-8" />
            </button>

            {/* My Garage */}
            <button type="button" onClick={() => setActiveSheet('garage')} className={navButtonClass}>
              <span className="w-8 flex justify-start text-white/50 shrink-0"><IconGarage /></span>
              <span className="flex-1 text-center font-nav font-semibold text-[13px]">My Garage</span>
              {vehicles.length > 0 ? (
                <span className="w-8 flex justify-end">
                  <span className="text-[11px] font-semibold text-white/40">{vehicles.length}</span>
                </span>
              ) : (
                <span className="w-8" />
              )}
            </button>

            {/* Leaderboard */}
            <button type="button" onClick={onLeaderboardClick} className={navButtonClass}>
              <span className="w-8 flex justify-start text-white/50 shrink-0"><IconLeaderboard /></span>
              <span className="flex-1 text-center font-nav font-semibold text-[13px]">Leaderboard</span>
              <span className="w-8" />
            </button>

            {/* Settings */}
            <button type="button" onClick={() => setActiveSheet('settings')} className={navButtonClass}>
              <span className="w-8 flex justify-start text-white/50 shrink-0"><IconSettings /></span>
              <span className="flex-1 text-center font-nav font-semibold text-[13px]">Settings</span>
              <span className="w-8" />
            </button>

            {/* Manage Business — navigates based on partner status */}
            <Link to={isPartner ? '/business' : '/account/company'} className={navButtonClass}>
              <span className="w-8 flex justify-start text-white/50 shrink-0"><IconBuilding /></span>
              <span className="flex-1 text-center font-nav font-semibold text-[13px]">Manage Business</span>
              <span className="w-8" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Academy AppleSheet ── */}
      <AppleSheet
        open={academySheetOpen}
        onOpenChange={setAcademySheetOpen}
        title="Academy training"
        zIndex={100_040}
        desktopWidthClassName="max-w-lg"
      >
        <div className="px-3 pb-5 pt-1 sm:px-4">
          {trainingRequests.length === 0 ? (
            <AcademyTrainingRequestsEmpty />
          ) : (
            <div className="flex max-h-[min(70dvh,520px)] flex-col gap-3 overflow-y-auto overscroll-contain pr-0.5 [touch-action:pan-y]">
              {trainingRequests.map((row) => (
                <AcademyTrainingRequestCard
                  key={row.id}
                  row={row}
                  onPaymentClick={
                    onAcademyPaymentRequest
                      ? (r) => {
                          onAcademyPaymentRequest(r)
                          setAcademySheetOpen(false)
                        }
                      : undefined
                  }
                />
              ))}
              <div className="pt-2">
                <Link
                  to="/academy?joinTraining=1"
                  onClick={() => setAcademySheetOpen(false)}
                  className="flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/[0.08] py-3 text-center font-nav font-semibold text-[13px] text-white transition hover:bg-white/[0.12]"
                >
                  Add another session
                </Link>
              </div>
            </div>
          )}
        </div>
      </AppleSheet>

      {/* ── My Garage page ── */}
      <MobilePageSheet isOpen={activeSheet === 'garage'} onClose={() => setActiveSheet(null)} title="My Garage">
        <div className="px-5 pb-8 pt-2">
          <button
            type="button"
            onClick={() => { setActiveSheet(null); onAddVehicle?.() }}
            className="mb-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white transition-colors active:opacity-80"
            style={{ background: '#0071e3' }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Vehicle
          </button>
          {vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                <svg className="h-8 w-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-800">No vehicles yet</p>
                <p className="mt-1 text-xs text-neutral-500">Add your first vehicle to track its protection</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => { setActiveSheet(null); onEditVehicle?.(v) }}
                  className="flex w-full items-center overflow-hidden rounded-2xl bg-neutral-100 text-left transition-colors active:bg-neutral-200"
                >
                  <div className="flex h-[80px] w-[80px] shrink-0 items-center justify-center overflow-hidden bg-neutral-200">
                    {v.imageUrl ? (
                      <img src={v.imageUrl} alt={`${v.brand} ${v.model}`} className="h-full w-full object-cover" />
                    ) : (
                      <svg className="h-7 w-7 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" />
                      </svg>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3">
                    <p className="truncate text-[14px] font-bold text-neutral-900">
                      {v.year} {v.brand} {v.model}
                    </p>
                    {v.color && <p className="mt-0.5 text-[11px] text-neutral-500">{v.color}</p>}
                    {v.ceramicProtectionDate ? (
                      <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-[#E8F5E9] px-2 py-0.5 text-[10px] font-semibold text-[#2E7D32]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#4CAF50]" />
                        Ceramic protected
                      </span>
                    ) : (
                      <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-[#FFF0EF] px-2 py-0.5 text-[10px] font-semibold text-[#D94032]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#FF3B30]" />
                        Not protected
                      </span>
                    )}
                  </div>
                  <div className="flex items-center pr-4 shrink-0">
                    <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </MobilePageSheet>

      {/* ── Notifications page ── */}
      <MobilePageSheet isOpen={activeSheet === 'notifications'} onClose={() => setActiveSheet(null)} title="Notifications">
        <div className="px-5 pb-8 pt-2">
          {notifications.length > 0 && (
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={onClearAllNotifications}
                className="text-xs font-semibold text-[#6B7280] transition hover:text-[#0485F7]"
              >
                Clear all
              </button>
            </div>
          )}
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                <svg className="h-8 w-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-800">No notifications</p>
                <p className="mt-1 text-xs text-neutral-500">Messages from Fireball will appear here</p>
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className="group rounded-2xl border border-[#0485F7]/10 bg-[#F7F9FF] px-4 py-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {n.title ? (
                        <p className="text-[13px] font-semibold text-neutral-900">
                          <NotificationMessageWithStatusHighlight text={n.title} />
                        </p>
                      ) : null}
                      <p className="mt-0.5 text-[12px] leading-snug text-neutral-600 line-clamp-4">
                        <NotificationMessageWithStatusHighlight text={n.message} />
                      </p>
                      <p className="mt-1.5 text-[10px] font-medium text-neutral-400">
                        {formatTimeAgo(n.created_at)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onClearNotification?.(n.id)}
                      className="shrink-0 rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-200 hover:text-neutral-600"
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
        </div>
      </MobilePageSheet>

      {/* ── My Orders page ── */}
      <MobilePageSheet isOpen={activeSheet === 'orders'} onClose={() => setActiveSheet(null)} title="My Orders">
        <div className="px-5 pb-8 pt-2">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                <svg className="h-8 w-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-800">No orders yet</p>
                <p className="mt-1 text-xs text-neutral-500">Your orders will appear here once placed</p>
              </div>
              <a
                href={SHOPIFY_CUSTOMER_ORDERS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 rounded-2xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors active:opacity-80"
              >
                Shop now
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {orders.map((order) => {
                const firstItem = order.lineItems?.[0]
                const thumb = firstItem?.imageUrl || order.imageUrl
                const title = firstItem?.title || order.name
                const qty = firstItem?.quantity ?? 1
                const price = typeof firstItem?.price === 'number'
                  ? `${firstItem.price.toFixed(2)}$`
                  : undefined
                const total = typeof order.totalPrice === 'number'
                  ? `${order.totalPrice.toFixed(2)}$ ${order.currency || 'CAD'}`
                  : null
                return (
                  <div
                    key={order.id}
                    className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"
                  >
                    <div className="flex items-center justify-between px-4 pt-4 pb-2">
                      <div>
                        <p className="text-[13px] font-semibold text-neutral-900">
                          Order {formatOrderRef(order.orderNumber)}
                        </p>
                        {order.date && (
                          <p className="mt-0.5 text-[11px] text-neutral-500">{order.date}</p>
                        )}
                      </div>
                      <span className="rounded-full bg-[#E8F5EC] px-2.5 py-1 text-[10px] font-semibold text-[#1F7A3E]">
                        Completed
                      </span>
                    </div>
                    <div className="mx-4 mb-4 flex items-center gap-3 rounded-xl bg-neutral-50 p-3">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt=""
                          className="h-14 w-14 shrink-0 rounded-xl object-cover"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-neutral-200">
                          <svg className="h-6 w-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                          </svg>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-neutral-900">{title}</p>
                        <p className="mt-0.5 text-[11px] text-neutral-500">
                          Qty {qty}{price ? ` · ${price}` : ''}
                        </p>
                        {total && (
                          <p className="mt-1 text-[12px] font-semibold text-neutral-800">Total {total}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              <a
                href={SHOPIFY_CUSTOMER_ORDERS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex w-full items-center justify-center rounded-2xl border border-neutral-200 py-3 text-sm font-semibold text-neutral-600 transition-colors active:bg-neutral-100"
              >
                See all orders on Shopify
              </a>
            </div>
          )}
        </div>
      </MobilePageSheet>

      {/* ── Settings page ── */}
      <MobilePageSheet isOpen={activeSheet === 'settings'} onClose={() => setActiveSheet(null)} title="Settings">
        <MobileSettingsContent />
      </MobilePageSheet>
    </div>
  )
}
