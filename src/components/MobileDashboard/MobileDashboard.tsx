import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { SHOPIFY_CUSTOMER_ORDERS_URL } from '@/constants/shopifyShopApp'

interface MobileDashboardProps {
  currentXp: number
  xpProgressPercent: number
  partnerStatus?: string | null
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

const PEEK_PX = 90       // px of section 2 visible when collapsed
const SHEET_TOP = 64     // px from top of wrapper when fully expanded
const SNAP_THRESHOLD = 70 // px of drag before snapping to new state

export function MobileDashboard({
  currentXp,
  xpProgressPercent,
  partnerStatus,
  onProductsPurchasedClick,
  onSettingsClick,
  onGarageClick,
  onLeaderboardClick,
  onTrophyClick,
}: MobileDashboardProps) {
  const imgRef = useRef<HTMLDivElement>(null)
  const xpRef = useRef<HTMLSpanElement>(null)
  const xpLabelRef = useRef<HTMLSpanElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  const isExpandedRef = useRef(false)
  const maxSheetYRef = useRef(0)
  const touchStartYRef = useRef(0)
  const sheetYAtDragStartRef = useRef(0)

  // Compute max translateY (collapsed position)
  const computeMaxY = () => window.innerHeight - SHEET_TOP - PEEK_PX

  const applySheetTransform = (y: number, animate: boolean) => {
    const el = sheetRef.current
    if (!el) return
    el.style.transition = animate ? 'transform 0.35s cubic-bezier(0.4,0,0.2,1)' : 'none'
    el.style.transform = `translateY(${y}px)`

    // Scale image based on sheet position: collapsed (y big) → image large
    if (imgRef.current) {
      const progress = y / maxSheetYRef.current
      const scale = 1 + progress * 0.45
      imgRef.current.style.transform = `scale(${scale})`
    }
  }

  useEffect(() => {
    maxSheetYRef.current = computeMaxY()
    // Start collapsed
    applySheetTransform(maxSheetYRef.current, false)
  }, [])

  useEffect(() => {
    const onResize = () => {
      maxSheetYRef.current = computeMaxY()
      applySheetTransform(isExpandedRef.current ? 0 : maxSheetYRef.current, false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

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

    if (wasExpanded && dy > SNAP_THRESHOLD) {
      isExpandedRef.current = false
      applySheetTransform(maxSheetYRef.current, true)
    } else if (!wasExpanded && dy < -SNAP_THRESHOLD) {
      isExpandedRef.current = true
      applySheetTransform(0, true)
    } else {
      // Snap back to current state
      applySheetTransform(wasExpanded ? 0 : maxSheetYRef.current, true)
    }
  }

  const normalizedPartnerStatus = String(partnerStatus || '').trim().toLowerCase()

  const navButtonClass =
    'flex w-full items-center rounded-2xl bg-white/[0.07] px-4 py-3 text-white active:bg-white/[0.13] transition-colors'

  return (
    <div className="lg:hidden w-full -mt-20 relative overflow-hidden" style={{ height: '100dvh' }}>

      {/* ── Section 1: white hero fills entire container ── */}
      <div className="absolute inset-0 bg-white">
        {/* XP overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pb-32 pointer-events-none">
          <div className="flex items-start leading-none">
            <span
              ref={xpRef}
              className="text-neutral-900 font-inter font-light leading-none"
              style={{ fontSize: 72 }}
            >
              {currentXp.toLocaleString()}
            </span>
            <span
              ref={xpLabelRef}
              className="text-neutral-500 font-inter mt-1.5 ml-1"
              style={{ fontSize: 16, lineHeight: '20px' }}
            >
              XP
            </span>
          </div>

          {/* XP Progress bar */}
          <div className="mt-3 w-32">
            <div className="h-1 rounded-full bg-neutral-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-neutral-800 transition-none"
                style={{ width: `${Math.min(Math.max(xpProgressPercent, 0), 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Profile image — sits in section 1, partially visible at bottom (under section 2) */}
        <div
          ref={imgRef}
          className="absolute bottom-[52px] left-1/2 -translate-x-1/2 z-10 origin-bottom"
          style={{ willChange: 'transform' }}
        >
          <div className="w-36 h-36 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center overflow-hidden shadow-md">
            <span className="text-neutral-300 text-[10px] font-mono uppercase tracking-widest select-none">img</span>
          </div>
        </div>
      </div>

      {/* ── Section 2: dark bottom sheet ── */}
      <div
        ref={sheetRef}
        className="absolute left-0 right-0 bg-[#111111] rounded-t-[28px] overflow-hidden"
        style={{
          top: SHEET_TOP,
          minHeight: `calc(100dvh - ${SHEET_TOP}px)`,
          // initial transform applied via useEffect
          willChange: 'transform',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Apple-style drag handle */}
        <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing select-none">
          <div className="w-9 h-[4px] rounded-full bg-white/25" />
        </div>

        {/* Content — scrollable inside the sheet */}
        <div className="overflow-y-auto" style={{ maxHeight: `calc(100dvh - ${SHEET_TOP + 36}px)` }}>
          <div className="px-5 pt-12 pb-20 flex flex-col gap-2.5">
            {/* Track your order */}
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

            {/* Products purchased */}
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

            {/* Become certified */}
            <Link to="/account/company" className={navButtonClass}>
              <span className="w-8 flex justify-start text-white/50 shrink-0"><IconBadge /></span>
              <span className="flex-1 text-center font-nav font-semibold text-[13px]">Become certified</span>
              <span className="w-8" />
            </Link>

            {/* My Garage */}
            <button type="button" onClick={onGarageClick} className={navButtonClass}>
              <span className="w-8 flex justify-start text-white/50 shrink-0"><IconGarage /></span>
              <span className="flex-1 text-center font-nav font-semibold text-[13px]">My Garage</span>
              <span className="w-8" />
            </button>

            {/* Leaderboard */}
            <button type="button" onClick={onLeaderboardClick} className={navButtonClass}>
              <span className="w-8 flex justify-start text-white/50 shrink-0"><IconLeaderboard /></span>
              <span className="flex-1 text-center font-nav font-semibold text-[13px]">Leaderboard</span>
              <span className="w-8" />
            </button>

            {/* Trophy */}
            <button type="button" onClick={onTrophyClick} className={navButtonClass}>
              <span className="w-8 flex justify-start text-white/50 shrink-0"><IconTrophy /></span>
              <span className="flex-1 text-center font-nav font-semibold text-[13px]">Trophy</span>
              <span className="w-8" />
            </button>

            {/* Settings */}
            <button type="button" onClick={onSettingsClick} className={navButtonClass}>
              <span className="w-8 flex justify-start text-white/50 shrink-0"><IconSettings /></span>
              <span className="flex-1 text-center font-nav font-semibold text-[13px]">Settings</span>
              <span className="w-8" />
            </button>

            {/* Manage Business */}
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
