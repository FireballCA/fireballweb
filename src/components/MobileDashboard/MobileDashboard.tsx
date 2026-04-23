import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { SHOPIFY_CUSTOMER_ORDERS_URL } from '@/constants/shopifyShopApp'

interface MobileDashboardProps {
  currentXp: number
  partnerStatus?: string | null
  onProductsPurchasedClick?: () => void
  onSettingsClick?: () => void
}

function IconPackage() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
    </svg>
  )
}

function IconShoppingBag() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function IconBadge() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /><path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconBuilding() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" />
    </svg>
  )
}

export function MobileDashboard({
  currentXp,
  partnerStatus,
  onProductsPurchasedClick,
  onSettingsClick,
}: MobileDashboardProps) {
  const imgRef = useRef<HTMLDivElement>(null)
  const xpRef = useRef<HTMLSpanElement>(null)
  const xpLabelRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const maxScroll = 180

      const progress = Math.min(scrollY / maxScroll, 1)

      if (imgRef.current) {
        const scale = 1 + progress * 0.18
        imgRef.current.style.transform = `scale(${scale})`
      }

      if (xpRef.current) {
        const fontSize = 96 - progress * 48
        xpRef.current.style.fontSize = `${fontSize}px`
        xpRef.current.style.opacity = `${1 - progress * 0.5}`
      }

      if (xpLabelRef.current) {
        xpLabelRef.current.style.opacity = `${1 - progress * 0.5}`
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const normalizedPartnerStatus = String(partnerStatus || '').trim().toLowerCase()

  const navButtonClass =
    'flex w-full items-center justify-center gap-3 rounded-2xl bg-white/[0.07] px-5 py-4 text-white active:bg-white/[0.13] transition-colors'

  return (
    <div className="lg:hidden w-full">
      {/* ── Hero: 40vh ── */}
      <div className="relative h-[40vh] overflow-hidden bg-neutral-900">
        {/* Placeholder image */}
        <div
          ref={imgRef}
          className="absolute inset-0 origin-center"
          style={{ willChange: 'transform' }}
        >
          <div className="w-full h-full bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-900 flex items-center justify-center">
            <span className="text-white/20 text-xs font-mono uppercase tracking-widest select-none">
              Image placeholder
            </span>
          </div>
        </div>

        {/* XP overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
          <div className="flex items-start leading-none">
            <span
              ref={xpRef}
              className="text-white font-inter font-light leading-none"
              style={{ fontSize: 96, willChange: 'font-size, opacity' }}
            >
              {currentXp.toLocaleString()}
            </span>
            <span
              ref={xpLabelRef}
              className="text-white/60 font-inter mt-2 ml-1.5"
              style={{ fontSize: 20, lineHeight: '24px', willChange: 'opacity' }}
            >
              XP
            </span>
          </div>
        </div>
      </div>

      {/* ── Section 2: dark card overlapping hero ── */}
      <div className="relative z-20 -mt-7 rounded-t-[28px] bg-[#111111] px-5 pt-7 pb-20 min-h-[60vh]">
        <div className="flex flex-col gap-3">
          {/* Track your order */}
          <a
            href={SHOPIFY_CUSTOMER_ORDERS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={navButtonClass}
          >
            <span className="text-white/60 shrink-0"><IconPackage /></span>
            <span className="font-nav font-semibold text-[15px]">Track your order</span>
          </a>

          {/* Products purchased */}
          {onProductsPurchasedClick ? (
            <button type="button" onClick={onProductsPurchasedClick} className={navButtonClass}>
              <span className="text-white/60 shrink-0"><IconShoppingBag /></span>
              <span className="font-nav font-semibold text-[15px]">Products purchased</span>
            </button>
          ) : (
            <a
              href={SHOPIFY_CUSTOMER_ORDERS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={navButtonClass}
            >
              <span className="text-white/60 shrink-0"><IconShoppingBag /></span>
              <span className="font-nav font-semibold text-[15px]">Products purchased</span>
            </a>
          )}

          {/* Become certified */}
          <Link to="/account/company" className={navButtonClass}>
            <span className="text-white/60 shrink-0"><IconBadge /></span>
            <span className="font-nav font-semibold text-[15px]">Become certified</span>
          </Link>

          {/* Settings */}
          <button
            type="button"
            onClick={onSettingsClick}
            className={navButtonClass}
          >
            <span className="text-white/60 shrink-0"><IconSettings /></span>
            <span className="font-nav font-semibold text-[15px]">Settings</span>
          </button>

          {/* Manage Business */}
          <Link
            to={normalizedPartnerStatus === 'partner' ? '/business' : '/account/company'}
            className={navButtonClass}
          >
            <span className="text-white/60 shrink-0"><IconBuilding /></span>
            <span className="font-nav font-semibold text-[15px]">Manage Business</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
