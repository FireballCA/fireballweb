import { Link } from 'react-router-dom'

interface UserIdentityProps {
  userName?: string
  isAdmin?: boolean
  partnerStatus?: string | null
  companyName?: string | null
  memberId?: string | null
  barcodeValue?: string | null
}

export function UserIdentity({
  userName = 'Anthony Bergeron',
  isAdmin = false,
  partnerStatus = null,
  companyName = null,
  memberId = null,
  barcodeValue = null,
}: UserIdentityProps) {
  const nameParts = userName.split(' ')
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''
  const normalizedPartnerStatus = String(partnerStatus || '').trim().toLowerCase()
  const shouldShowPartnerStatus = ['pending', 'partner'].includes(normalizedPartnerStatus)

  const partnerStatusLabel = (() => {
    if (normalizedPartnerStatus === 'partner') return 'Partner'
    if (normalizedPartnerStatus === 'pending') return 'Pending'
    return null
  })()

  const partnerStatusColor = (() => {
    if (normalizedPartnerStatus === 'partner') return 'text-emerald-300'
    if (normalizedPartnerStatus === 'pending') return 'text-amber-300'
    return 'text-white/60'
  })()

  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <h1 className="text-white text-[32px] font-normal leading-tight">
          {firstName}
          {!lastName && isAdmin && <span className="ml-2 text-red-400 text-[20px]">(Admin)</span>}
        </h1>
        {lastName && (
          <h1 className="text-white text-[32px] font-normal leading-tight">
            {lastName}
            {isAdmin && <span className="ml-2 text-red-400 text-[20px]">(Admin)</span>}
          </h1>
        )}
        {shouldShowPartnerStatus && (
          <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-white/55">
            Partner Status : <span className={`font-semibold ${partnerStatusColor}`}>{partnerStatusLabel || 'Pending'}</span>
          </p>
        )}
        {memberId && (
          <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-white/60">
            Member ID : <span className="font-mono text-white/90">{memberId}</span>
          </p>
        )}
        {barcodeValue && (
          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/60">
            Barcode : <span className="font-mono text-white/90">{barcodeValue}</span>
          </p>
        )}
      </div>
      
      <div className="flex flex-col gap-2.5">
        <button className="bg-[#1a1a1a] text-white px-3.5 py-2.5 rounded-[6px] text-left text-xs font-normal hover:bg-[#252525] transition-colors w-[200px] flex items-center justify-between">
          <span>Track your order</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: 'rotate(45deg)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
        <button className="bg-[#1a1a1a] text-white px-3.5 py-2.5 rounded-[6px] text-left text-xs font-normal hover:bg-[#252525] transition-colors w-[200px] flex items-center justify-between">
          <span>Products purchased</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: 'rotate(45deg)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
        <Link
          to="/account/company"
          className="bg-[#1a1a1a] text-white px-3.5 py-2.5 rounded-[6px] text-left text-xs font-normal hover:bg-[#252525] transition-colors w-[200px] flex items-center justify-between"
        >
          <span>Become certified</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: 'rotate(45deg)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </Link>
        <button className="bg-[#1a1a1a] text-white px-3.5 py-2.5 rounded-[6px] text-left text-xs font-normal hover:bg-[#252525] transition-colors w-[200px] flex items-center justify-between">
          <span>Settings</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: 'rotate(45deg)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
        {isAdmin && (
          <Link
            to="/account/manage-partners#global-statistics"
            className="bg-[#3a171a] border border-red-400/25 text-red-100 px-3.5 py-2.5 rounded-[6px] text-left text-xs font-normal hover:bg-[#4a1d21] transition-colors w-[200px] flex items-center justify-between"
          >
            <span>Global statistics</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: 'rotate(45deg)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </Link>
        )}
        {isAdmin && (
          <Link
            to="/account/manage-partners"
            className="bg-[#3a171a] border border-red-400/25 text-red-100 px-3.5 py-2.5 rounded-[6px] text-left text-xs font-normal hover:bg-[#4a1d21] transition-colors w-[200px] flex items-center justify-between"
          >
            <span>Manage Partner</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: 'rotate(45deg)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  )
}
