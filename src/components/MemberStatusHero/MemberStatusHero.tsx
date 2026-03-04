import { useState } from 'react'
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
  onProductsPurchasedClick?: () => void
  onAdminPanelClick?: () => void
}

export function MemberStatusHero({
  userName = 'Anthony Bergeron',
  currentXp = 2403,
  targetXp = 3000,
  isAdmin = false,
  partnerStatus = null,
  companyName = null,
  tier = 'TIER 1',
  benefits = [
    { text: '5% off selected products' },
    { text: '10% off Car club subscription' },
    { text: 'Anniversary reward' },
  ],
  currentTierName = 'Brushed Silver',
  currentTierColorClass = 'text-white/90',
  memberId = null,
  barcodeValue = null,
  onProductsPurchasedClick,
  onAdminPanelClick,
}: MemberStatusHeroProps) {
  const [showIdModal, setShowIdModal] = useState(false)
  const hasIdentityData = Boolean(memberId || barcodeValue)

  return (
    <section className="relative w-full bg-[#0a0a0a] pt-[180px] pb-[220px] px-6 md:px-12 lg:px-16">
      {hasIdentityData && (
        <button
          type="button"
          onClick={() => setShowIdModal(true)}
          className="hidden md:flex items-center justify-center absolute right-8 top-[130px] z-30 w-10 h-10 rounded-full border border-white/25 bg-white/[0.06] text-white/85 shadow-[0_12px_28px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-xl hover:bg-white/[0.14] hover:border-white/60 transition-all"
          aria-label="Afficher le code membre et le code-barres"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
      )}
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16 items-start">
          {/* Left: User Identity */}
          <div className="flex flex-col">
            <UserIdentity
              userName={userName}
              isAdmin={isAdmin}
              partnerStatus={partnerStatus}
              companyName={companyName}
              memberId={memberId}
              onProductsPurchasedClick={onProductsPurchasedClick}
              onAdminPanelClick={onAdminPanelClick}
            />
          </div>

          {/* Center: XP Progress */}
          <div className="flex flex-col items-center justify-center">
            <ProgressBar currentXp={currentXp} targetXp={targetXp} />
          </div>

          {/* Right: Tier Benefits */}
          <div className="flex flex-col items-end">
            <h2 className="text-white text-[11px] font-bold uppercase tracking-wide">{tier} BENEFITS</h2>
            <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/60">
              Current tier : <span className={`font-semibold ${currentTierColorClass}`}>{currentTierName}</span>
            </p>
            <div className="h-4" />
            <div className="flex flex-col gap-2.5 items-end">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="bg-[#252525] text-white px-3.5 py-2.5 rounded-[6px] text-left text-xs flex items-center gap-2 w-[200px]"
                >
                  <span className="text-white text-sm select-none">+</span>
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {hasIdentityData && showIdModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center px-6">
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={() => setShowIdModal(false)}
            aria-label="Fermer la carte membre"
          />
          <div
            className="relative w-full max-w-sm rounded-2xl border border-white/20 bg-white/[0.06] px-6 py-6 shadow-[0_22px_50px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-2xl text-white"
          >
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
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
