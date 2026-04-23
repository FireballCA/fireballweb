import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SHOPIFY_CUSTOMER_ORDERS_URL } from '@/constants/shopifyShopApp'

interface MobileDashboardProps {
  currentXp: number
  xpProgressPercent: number
  xpToNextTier?: number
  partnerStatus?: string | null
  tier?: string | null
  onProductsPurchasedClick?: () => void
  onSettingsClick?: () => void
  onGarageClick?: () => void
  onLeaderboardClick?: () => void
  onTrophyClick?: () => void
}

function IconPackage() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
    </svg>
  )
}

function IconShoppingBag() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function IconBadge() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /><path d="m9 12 2 2 4-4" />
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

function IconGarage() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" />
    </svg>
  )
}

function IconTrophy() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" />
      <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" />
      <path d="M18 9h1.5a1 1 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
      <path d="M6 9H4.5a1 1 0 0 1 0-5H6" />
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

const BADGE_SIZE_EXPANDED = 170
const BADGE_SIZE_COLLAPSED = 290
const SHEET_TOP = 330              // increased to give more room for impact tier text
const PEEK_PX = 72
const SNAP_THRESHOLD = 60
const STICKY_BAR_TOP = 60         // px from top — just under the navbar
const SIDE_PADDING = 20           // matches px-5 on buttons

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

export function MobileDashboard({
  currentXp,
  xpProgressPercent,
  xpToNextTier,
  partnerStatus,
  tier,
  onProductsPurchasedClick,
  onSettingsClick,
  onGarageClick,
  onLeaderboardClick,
  onTrophyClick,
}: MobileDashboardProps) {
  const currentTierIndex = getTierIndexFromLabel(tier)
  const [viewingTierIndex, setViewingTierIndex] = useState(currentTierIndex)

  const sheetRef = useRef<HTMLDivElement>(null)
  // XP display in hero — slides up + fades
  const xpContainerRef = useRef<HTMLDivElement>(null)
  // Original small progress bar in hero — fades out
  const progressBarWrapperRef = useRef<HTMLDivElement>(null)
  // Sticky progress bar that slides into place below navbar
  const stickyBarRef = useRef<HTMLDivElement>(null)
  const stickyBarFillRef = useRef<HTMLDivElement>(null)
  const stickyLabelsRef = useRef<HTMLDivElement>(null)
  // Badge
  const badgeContainerRef = useRef<HTMLDivElement>(null)
  const currentBadgeImgRef = useRef<HTMLImageElement>(null)
  const viewingBadgeImgRef = useRef<HTMLImageElement>(null)
  // Impact tier text — behind badge, peeks above
  const impactTierRef = useRef<HTMLDivElement>(null)
  // Section 2 content
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

    // ── Sheet ──
    if (sheetRef.current) {
      sheetRef.current.style.transition = sheetTrans
      sheetRef.current.style.transform = `translateY(${y}px)`
    }

    // ── Badge size ──
    const badgeSize = BADGE_SIZE_EXPANDED + (BADGE_SIZE_COLLAPSED - BADGE_SIZE_EXPANDED) * progress

    // ── Badge center Y ──
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

    // ── Badge crossfade: current tier ↔ viewing tier ──
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

    // ── XP container: slide up + fade out ──
    const xpOpacity = Math.max(0, 1 - progress * 2.2)
    const xpSlideY = -progress * 70
    if (xpContainerRef.current) {
      xpContainerRef.current.style.transition = allTrans
      xpContainerRef.current.style.opacity = `${xpOpacity}`
      xpContainerRef.current.style.transform = `translateY(${xpSlideY}px)`
    }

    // ── Original small progress bar: fade out ──
    if (progressBarWrapperRef.current) {
      progressBarWrapperRef.current.style.transition = allTrans
      progressBarWrapperRef.current.style.opacity = `${Math.max(0, 1 - progress * 2.5)}`
    }

    // ── Sticky progress bar (near navbar) ──
    const stickyOpacity = Math.min(1, Math.max(0, (progress - 0.45) / 0.35))
    if (stickyBarRef.current) {
      stickyBarRef.current.style.transition = allTrans
      stickyBarRef.current.style.opacity = `${stickyOpacity}`
    }
    if (stickyLabelsRef.current) {
      stickyLabelsRef.current.style.transition = allTrans
      stickyLabelsRef.current.style.opacity = `${stickyOpacity}`
    }

    // ── Impact tier text: behind badge, peeks above ──
    const impactOpacity = Math.min(1, Math.max(0, (progress - 0.3) / 0.45))
    // Font size grows as section collapses
    const impactFontSize = 90 + 65 * progress
    // Position so the text peeks ~55px above badge top
    const peekPx = 55
    const impactTop = imageCenterY - badgeSize / 2 - peekPx
    if (impactTierRef.current) {
      impactTierRef.current.style.transition = allTrans
      impactTierRef.current.style.opacity = `${impactOpacity}`
      impactTierRef.current.style.fontSize = `${impactFontSize}px`
      impactTierRef.current.style.top = `${impactTop}px`
    }

    // ── Benefits container ──
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

    // ── Arrows ──
    if (arrowsContainerRef.current) {
      arrowsContainerRef.current.style.transition = allTrans
      arrowsContainerRef.current.style.opacity = `${benefitsOpacity}`
      arrowsContainerRef.current.style.top = `${imageCenterY}px`
      arrowsContainerRef.current.style.pointerEvents = progress > 0.8 ? 'auto' : 'none'
    }

    // ── Lock overlay ──
    if (lockOverlayRef.current) {
      lockOverlayRef.current.style.transition = allTrans
      lockOverlayRef.current.style.opacity = `${benefitsOpacity}`
    }
  }

  useEffect(() => {
    maxSheetYRef.current = computeMaxY()
    applySheetTransform(0, false)

    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
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

  const normalizedPartnerStatus = String(partnerStatus || '').trim().toLowerCase()

  const navButtonClass =
    'flex w-full items-center rounded-2xl bg-white/[0.07] px-4 py-3 text-white active:bg-white/[0.13] transition-colors'

  const viewingTier = MOBILE_TIERS[viewingTierIndex]
  const isLocked = viewingTierIndex > currentTierIndex

  const handlePrevTier = () => {
    setViewingTierIndex((i) => Math.max(0, i - 1))
  }

  const handleNextTier = () => {
    setViewingTierIndex((i) => Math.min(MOBILE_TIERS.length - 1, i + 1))
  }

  const xpLabel = currentXp.toLocaleString() + ' XP'
  const nextTierLabel = xpToNextTier != null && xpToNextTier > 0
    ? `${xpToNextTier.toLocaleString()} XP to next tier`
    : 'Max tier reached'

  return (
    <div
      className="lg:hidden w-full -mt-20 relative"
      style={{ height: '100dvh', overflow: 'hidden', touchAction: 'none' }}
    >
      {/* ── Section 1: white hero — click collapses section 2 ── */}
      <div
        className="absolute inset-0 bg-white overflow-hidden"
        onClick={() => {
          if (isExpandedRef.current) {
            isExpandedRef.current = false
            applySheetTransform(maxSheetYRef.current, true)
          }
        }}
      >
        {/* XP display — slides up + fades out on collapse */}
        <div
          ref={xpContainerRef}
          className="absolute inset-x-0 top-0 flex flex-col items-center justify-center pointer-events-none"
          style={{ height: SHEET_TOP }}
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

      {/* ── Sticky progress bar — appears just below navbar when collapsed ── */}
      <div
        ref={stickyBarRef}
        className="absolute z-[8] pointer-events-none"
        style={{
          top: STICKY_BAR_TOP,
          left: SIDE_PADDING,
          right: SIDE_PADDING,
          opacity: 0,
        }}
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
        style={{
          top: STICKY_BAR_TOP + 7,
          left: SIDE_PADDING,
          right: SIDE_PADDING,
          opacity: 0,
        }}
      >
        <span style={{ fontSize: 10, color: '#737373', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
          {xpLabel}
        </span>
        <span style={{ fontSize: 10, color: '#737373', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
          {nextTierLabel}
        </span>
      </div>

      {/* ── Impact tier text — behind badge, peeks above ── */}
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
        {/* Current tier badge — visible in expanded (small) state */}
        <img
          ref={currentBadgeImgRef}
          src={MOBILE_TIERS[currentTierIndex].badgeSrc}
          alt={MOBILE_TIERS[currentTierIndex].label}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 1 }}
        />
        {/* Viewing tier badge — fades in when collapsed */}
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
        {/* Gray handle bar */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="rounded-full bg-white/30" style={{ width: 96, height: 6 }} />
        </div>

        {/* Scrollable nav content */}
        <div className="overflow-y-auto" style={{ maxHeight: `calc(100dvh - ${SHEET_TOP + 44}px)`, touchAction: 'pan-y' }}>
          <div className="px-5 pb-20 flex flex-col gap-2.5" style={{ paddingTop: 16 }}>
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

            {onProductsPurchasedClick ? (
              <button type="button" onClick={onProductsPurchasedClick} className={navButtonClass}>
                <span className="w-8 flex justify-start text-white/50 shrink-0"><IconShoppingBag /></span>
                <span className="flex-1 text-center font-nav font-semibold text-[13px]">Products purchased</span>
                <span className="w-8" />
              </button>
            ) : (
              <a
                href={SHOPIFY_CUSTOMER_ORDERS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={navButtonClass}
              >
                <span className="w-8 flex justify-start text-white/50 shrink-0"><IconShoppingBag /></span>
                <span className="flex-1 text-center font-nav font-semibold text-[13px]">Products purchased</span>
                <span className="w-8" />
              </a>
            )}

            <Link to="/account/company" className={navButtonClass}>
              <span className="w-8 flex justify-start text-white/50 shrink-0"><IconBadge /></span>
              <span className="flex-1 text-center font-nav font-semibold text-[13px]">Become certified</span>
              <span className="w-8" />
            </Link>

            <button type="button" onClick={onGarageClick} className={navButtonClass}>
              <span className="w-8 flex justify-start text-white/50 shrink-0"><IconGarage /></span>
              <span className="flex-1 text-center font-nav font-semibold text-[13px]">My Garage</span>
              <span className="w-8" />
            </button>

            <button type="button" onClick={onLeaderboardClick} className={navButtonClass}>
              <span className="w-8 flex justify-start text-white/50 shrink-0"><IconLeaderboard /></span>
              <span className="flex-1 text-center font-nav font-semibold text-[13px]">Leaderboard</span>
              <span className="w-8" />
            </button>

            <button type="button" onClick={onTrophyClick} className={navButtonClass}>
              <span className="w-8 flex justify-start text-white/50 shrink-0"><IconTrophy /></span>
              <span className="flex-1 text-center font-nav font-semibold text-[13px]">Trophy</span>
              <span className="w-8" />
            </button>

            <button type="button" onClick={onSettingsClick} className={navButtonClass}>
              <span className="w-8 flex justify-start text-white/50 shrink-0"><IconSettings /></span>
              <span className="flex-1 text-center font-nav font-semibold text-[13px]">Settings</span>
              <span className="w-8" />
            </button>

            <Link
              to={normalizedPartnerStatus === 'partner' ? '/business' : '/account/company'}
              className={navButtonClass}
            >
              <span className="w-8 flex justify-start text-white/50 shrink-0"><IconBuilding /></span>
              <span className="flex-1 text-center font-nav font-semibold text-[13px]">Manage Business</span>
              <span className="w-8" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
