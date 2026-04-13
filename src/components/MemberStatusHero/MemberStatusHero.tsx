import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { UserIdentity } from './UserIdentity'
import { ProgressBar } from './ProgressBar'

interface MemberStatusHeroProps {
  userName?: string
  currentXp?: number
  targetXp?: number
  isAdmin?: boolean
  partnerStatus?: string | null
  companyName?: string | null
  tier?: string
  benefits?: Array<{ text: string }>
  currentTierName?: string
  currentTierColorClass?: string
  memberId?: string | null
  barcodeValue?: string | null
  headerRight?: ReactNode
  onProductsPurchasedClick?: () => void
  onAdminPanelClick?: () => void
  onSettingsClick?: () => void
}

export function MemberStatusHero({
  userName = 'Anthony Bergeron',
  currentXp = 2403,
  targetXp = 3000,
  partnerStatus = null,
  tier = 'TIER 1',
  benefits = [
    { text: '5% off selected products' },
    { text: '10% off Car club subscription' },
    { text: 'Anniversary reward' },
  ],
  memberId = null,
  barcodeValue = null,
  headerRight,
  onProductsPurchasedClick,
  onSettingsClick,
}: MemberStatusHeroProps) {
  const [showIdModal, setShowIdModal] = useState(false)
  const hasIdentityData = Boolean(memberId || barcodeValue)
  const normalizedPartnerStatus = String(partnerStatus || '').trim().toLowerCase()

  return (
    <section className="relative w-full min-h-[88vh] bg-white overflow-hidden">
      {/* ── Desktop layout ── */}
      <div className="hidden lg:flex flex-col h-full relative z-10 px-16">
        {/* Header row — Name left, icons right */}
        <div className="pt-8 shrink-0 flex items-center justify-between">
          <h1
            className="text-carbon-900"
            style={{ fontSize: 40, fontWeight: 400, lineHeight: '50px' }}
          >
            {userName}
          </h1>
          {headerRight}
        </div>

        {/* 3-column content — légèrement dans la moitié basse */}
        <div className="flex-1 flex items-center pt-[22vh]">
          <div className="w-full grid grid-cols-[240px_1fr_240px] items-start gap-8">
            {/* Left: Quick Links */}
            <UserIdentity
              partnerStatus={partnerStatus}
              onProductsPurchasedClick={onProductsPurchasedClick}
              onSettingsClick={onSettingsClick}
            />

            {/* Center: XP — align "XP" label with QUICK LINKS / TIER 1 BENEFITS */}
            <div className="flex justify-center">
              <ProgressBar currentXp={currentXp} targetXp={targetXp} />
            </div>

            {/* Right: Tier Benefits — tops aligned with Quick Links */}
            <div className="flex flex-col items-end">
              <p
                className="text-carbon-600 text-[13px] leading-[16px] uppercase tracking-[0.1em] mb-3"
                style={{ fontWeight: 400 }}
              >
                {tier} BENEFITS
              </p>
              <div className="flex flex-col gap-2 items-end">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="h-[34px] text-carbon-900 font-inter text-[13px] leading-[16px] px-3 text-left flex items-center gap-2.5 w-[240px] rounded-[6px]"
                    style={{ background: 'rgba(229, 231, 235, 0.9)', fontWeight: 400 }}
                  >
                    <span className="font-inter text-[16px] leading-[20px] text-carbon-700 select-none" style={{ fontWeight: 400 }}>+</span>
                    <span>{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manage Business — desktop only */}
      <Link
        to={normalizedPartnerStatus === 'partner' ? '/business' : '/account/company'}
        className="hidden lg:flex items-center justify-between absolute z-20 text-white text-[13px] leading-[16px] px-3 h-[34px] rounded-[6px] w-[240px] transition-colors hover:brightness-110"
        style={{
          background: '#96182c',
          fontWeight: 400,
          bottom: 140,
          left: 64,
        }}
      >
        <span>Manage Business</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M9 7h8v8" />
        </svg>
      </Link>

      {/* ── Mobile / Tablet layout ── */}
      <div className="lg:hidden relative z-10 px-6 md:px-12 pt-8 pb-16 flex flex-col gap-10">
        <div className="flex items-center justify-between">
          <h1
            className="text-carbon-900"
            style={{ fontSize: 'clamp(24px, 5.5vw, 40px)', fontWeight: 400, lineHeight: '1.2' }}
          >
            {userName}
          </h1>
          {headerRight}
        </div>

        <div className="flex justify-center">
          <ProgressBar currentXp={currentXp} targetXp={targetXp} />
        </div>

        <UserIdentity
          partnerStatus={partnerStatus}
          onProductsPurchasedClick={onProductsPurchasedClick}
          onSettingsClick={onSettingsClick}
        />

        <div>
          <p className="text-carbon-600 text-[13px] leading-[16px] uppercase tracking-[0.1em] mb-3" style={{ fontWeight: 400 }}>
            {tier} BENEFITS
          </p>
          <div className="flex flex-col gap-2">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="h-[34px] text-carbon-900 font-inter text-[13px] leading-[16px] px-3 text-left flex items-center gap-2.5 w-[240px] rounded-[6px]"
                style={{ background: 'rgba(229, 231, 235, 0.9)', fontWeight: 400 }}
              >
                <span className="font-inter text-[16px] leading-[20px] text-carbon-700 select-none" style={{ fontWeight: 400 }}>+</span>
                <span>{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>

        <Link
          to={normalizedPartnerStatus === 'partner' ? '/business' : '/account/company'}
          className="flex items-center justify-between text-white text-[13px] leading-[16px] px-3 h-[34px] rounded-[6px] w-[240px] transition-colors hover:brightness-125"
          style={{ background: '#96182c', fontWeight: 400 }}
        >
          <span>Manage Business</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M9 7h8v8" />
          </svg>
        </Link>
      </div>

      {/* ── Member ID Modal ── */}
      {hasIdentityData && showIdModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center px-6">
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={() => setShowIdModal(false)}
            aria-label="Fermer la carte membre"
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/20 bg-white/[0.06] px-6 py-6 shadow-[0_22px_50px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-2xl text-white">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-nav font-bold uppercase tracking-[0.18em] text-white/70">
                Member ID & barcode
              </p>
              <button
                type="button"
                onClick={() => setShowIdModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80"
                aria-label="Fermer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {memberId && (
              <div className="mb-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/60 mb-1">Member ID</p>
                <p className="font-mono text-base text-white/90">{memberId}</p>
              </div>
            )}
            {barcodeValue && (
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/60 mb-2">Barcode</p>
                <div className="w-full bg-white rounded-lg p-3 flex flex-col items-center">
                  <div className="w-full h-16 rounded bg-[repeating-linear-gradient(to_right,#000_0,#000_2px,#fff_2px,#fff_4px)]" />
                  <p className="mt-3 font-mono text-xs tracking-[0.35em] text-black/80">{barcodeValue}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
