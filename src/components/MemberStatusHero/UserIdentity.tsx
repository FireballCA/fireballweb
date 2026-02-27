interface UserIdentityProps {
  userName?: string
}

export function UserIdentity({ userName = 'Anthony Bergeron' }: UserIdentityProps) {
  const nameParts = userName.split(' ')
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''

  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <h1 className="text-white text-[32px] font-normal leading-tight">{firstName}</h1>
        {lastName && <h1 className="text-white text-[32px] font-normal leading-tight">{lastName}</h1>}
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
        <button className="bg-[#1a1a1a] text-white px-3.5 py-2.5 rounded-[6px] text-left text-xs font-normal hover:bg-[#252525] transition-colors w-[200px] flex items-center justify-between">
          <span>Become certified</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: 'rotate(45deg)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
        <button className="bg-[#1a1a1a] text-white px-3.5 py-2.5 rounded-[6px] text-left text-xs font-normal hover:bg-[#252525] transition-colors w-[200px] flex items-center justify-between">
          <span>Settings</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: 'rotate(45deg)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>
    </div>
  )
}
