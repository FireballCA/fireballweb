import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { appleButtonVisualClassName } from '@/components/ui/AppleButton'
import { cn } from '@/lib/utils'
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
  onAdminPanelClick?: () => void
  onSettingsClick?: () => void
  walletBalanceLabel?: string
}

type TopupOption = 30 | 50 | 100 | 250 | 500 | 'custom'

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
  onSettingsClick,
  walletBalanceLabel = '0.00 $',
}: MemberStatusHeroProps) {
  const [showIdModal, setShowIdModal] = useState(false)
  const [addMoneyModalOpen, setAddMoneyModalOpen] = useState(false)
  const [selectedTopup, setSelectedTopup] = useState<TopupOption>(30)
  const [customAmount, setCustomAmount] = useState('0')
  const [topupIndicator, setTopupIndicator] = useState<{ left: number; width: number; visible: boolean }>({
    left: 0,
    width: 0,
    visible: false,
  })
  const topupSegmentRef = useRef<HTMLDivElement | null>(null)
  const topupButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const hasIdentityData = Boolean(memberId || barcodeValue)
  const normalizedPartnerStatus = String(partnerStatus || '').trim().toLowerCase()
  const topupOptions: readonly TopupOption[] = [30, 50, 100, 250, 500, 'custom']
  const isCustomTopup = selectedTopup === 'custom'

  useEffect(() => {
    if (!addMoneyModalOpen || isCustomTopup) {
      setTopupIndicator((prev) => (prev.visible ? { ...prev, visible: false } : prev))
      return
    }
    let rafA = 0
    let rafB = 0
    rafA = window.requestAnimationFrame(() => {
      rafB = window.requestAnimationFrame(() => {
        const container = topupSegmentRef.current
        const selectedButton = topupButtonRefs.current[String(selectedTopup)]
        if (!container || !selectedButton) return
        const containerRect = container.getBoundingClientRect()
        const selectedRect = selectedButton.getBoundingClientRect()
        setTopupIndicator({
          left: selectedRect.left - containerRect.left,
          width: selectedRect.width,
          visible: true,
        })
      })
    })
    return () => {
      window.cancelAnimationFrame(rafA)
      window.cancelAnimationFrame(rafB)
    }
  }, [addMoneyModalOpen, selectedTopup, isCustomTopup])

  const closeAddMoneyModal = () => setAddMoneyModalOpen(false)

  useEffect(() => {
    if (!addMoneyModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAddMoneyModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [addMoneyModalOpen])

  return (
    <section className="relative w-full min-h-[88vh] bg-white overflow-hidden">
      {/* ── Desktop layout ── */}
      <div className="hidden lg:flex flex-col h-full relative z-10 px-16">
        {/* Header row — Name left, icons right */}
        <div className="pt-8 shrink-0 flex items-center justify-between">
          <div className="flex flex-col gap-3">
            <h1
              className="text-carbon-900"
              style={{ fontSize: 40, fontWeight: 400, lineHeight: '50px' }}
            >
              {userName}
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-3xl font-semibold tracking-tight text-carbon-900">
                {walletBalanceLabel}
              </p>
              <button
                type="button"
                onClick={() => setAddMoneyModalOpen(true)}
                className={cn('inline-flex whitespace-nowrap', appleButtonVisualClassName)}
              >
                Add money
              </button>
            </div>
          </div>
          {headerRight}
        </div>

        {/* 3-column content — légèrement dans la moitié basse */}
        <div className="flex-1 flex items-center pt-[22vh]">
          <div className="w-full grid grid-cols-[240px_1fr_240px] items-start gap-8">
            {/* Left: Quick Links */}
            <UserIdentity
              partnerStatus={partnerStatus}
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
                    className="min-h-[52px] text-carbon-900 font-inter text-[14px] leading-[18px] px-4 py-3 text-left flex items-center gap-2.5 w-[320px] max-w-full rounded-none"
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
          <div className="flex flex-col gap-3">
            <h1
              className="text-carbon-900"
              style={{ fontSize: 'clamp(24px, 5.5vw, 40px)', fontWeight: 400, lineHeight: '1.2' }}
            >
              {userName}
            </h1>
            <div className="flex flex-col items-start gap-2">
              <p className="text-2xl font-semibold tracking-tight text-carbon-900">
                {walletBalanceLabel}
              </p>
              <button
                type="button"
                onClick={() => setAddMoneyModalOpen(true)}
                className={cn('inline-flex whitespace-nowrap', appleButtonVisualClassName)}
              >
                Add money
              </button>
            </div>
          </div>
          {headerRight}
        </div>

        <div className="flex justify-center">
          <ProgressBar currentXp={currentXp} targetXp={targetXp} />
        </div>

        <UserIdentity
          partnerStatus={partnerStatus}
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
                className="min-h-[52px] text-carbon-900 font-inter text-[14px] leading-[18px] px-4 py-3 text-left flex items-center gap-2.5 w-[320px] max-w-full rounded-none"
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

      {typeof document !== 'undefined' &&
        addMoneyModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4 sm:p-6">
            <button
              type="button"
              className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
              aria-label="Close add money popup"
              onClick={closeAddMoneyModal}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Add money"
              className="relative z-10 w-full max-w-[470px] rounded-[22px] bg-[#ececec] p-0 shadow-[0_10px_28px_rgba(0,0,0,0.18)]"
            >
              <div className="p-6 sm:p-7">
                <div className="mb-4 flex items-start justify-between">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#dedee0] text-[#2e2e30]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={closeAddMoneyModal}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#d8d8da] text-[#6c6c71] transition-colors hover:bg-[#cfd0d3]"
                    aria-label="Close add money popup"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>

                <p className="max-w-[560px] whitespace-nowrap text-[clamp(18px,3.2vw,24px)] leading-[1.1] font-semibold tracking-tight text-[#252528]">
                  Add money to your Fireball account
                </p>
                <p className="mt-3 text-[13px] leading-[1.45] text-[#6c6c71]">
                  Secure top-up with Stripe will be integrated with training and membership flows.
                </p>

                <div className="mt-5">
                  <div
                    ref={topupSegmentRef}
                    className="relative w-full rounded-full border border-carbon-200 bg-carbon-50 p-1"
                  >
                    <div
                      className={`absolute left-0 top-1 bottom-1 rounded-full bg-[#0485F7] shadow-sm transition-[transform,width,opacity] duration-300 ease-out ${
                        topupIndicator.visible && !isCustomTopup ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={{
                        width: `${topupIndicator.width}px`,
                        transform: `translate3d(${topupIndicator.left}px, 0, 0)`,
                      }}
                    />

                    <div
                      className={`relative z-10 flex items-stretch gap-1 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        isCustomTopup ? 'opacity-0 -translate-y-1 pointer-events-none' : 'opacity-100 translate-y-0'
                      }`}
                    >
                      {topupOptions.map((amount) => {
                        const selected = selectedTopup === amount
                        return (
                          <button
                            key={amount}
                            type="button"
                            ref={(el) => {
                              topupButtonRefs.current[String(amount)] = el
                            }}
                            onClick={() => {
                              if (amount === 'custom') {
                                setSelectedTopup('custom')
                                return
                              }
                              setSelectedTopup(amount)
                            }}
                            className={`relative z-10 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                              selected ? 'text-white' : 'text-carbon-700 hover:text-carbon-900'
                            }`}
                          >
                            {amount === 'custom' ? 'Custom' : `${amount}$`}
                          </button>
                        )
                      })}
                    </div>

                    <div
                      className={`absolute inset-1 z-20 flex items-center rounded-full bg-[#0485F7]/10 px-2 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        isCustomTopup ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedTopup(30)}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#0485F7] transition-colors hover:bg-[#0485F7]/15"
                        aria-label="Back to preset amounts"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                      </button>
                      <div className="relative w-full h-[42px]">
                        <div className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={customAmount === '0' ? '' : customAmount}
                            placeholder="0"
                            onChange={(event) => {
                              const digitsOnly = event.target.value.replace(/\D+/g, '')
                              setCustomAmount(digitsOnly || '0')
                            }}
                            className="bg-transparent text-right text-2xl font-semibold tracking-tight text-[#0485F7] outline-none placeholder:text-[#0485F7]/55"
                            style={{ width: `${Math.max(customAmount.length, 1)}ch`, minWidth: '2ch' }}
                            aria-label="Custom top-up amount"
                          />
                          <span className="pointer-events-none select-none text-2xl font-semibold tracking-tight text-[#0485F7]">
                            $
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={closeAddMoneyModal}
                    className={cn('inline-flex w-full justify-center', appleButtonVisualClassName)}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </section>
  )
}
