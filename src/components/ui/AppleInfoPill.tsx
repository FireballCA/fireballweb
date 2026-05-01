type AppleInfoPillTone = 'info' | 'success' | 'warning'

interface AppleInfoPillProps {
  label: string
  tone?: AppleInfoPillTone
  className?: string
}

export function AppleInfoPill({ label, tone = 'info', className = '' }: AppleInfoPillProps) {
  const iconColorClass =
    tone === 'success'
      ? 'text-[#12b161]'
      : tone === 'warning'
        ? 'text-[#f59e0b]'
        : 'text-[#0485F7]'

  /* Cercle dessiné dans le SVG uniquement (pas de bordure HTML autour). */
  const icon = tone === 'success'
    ? (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="10" cy="10" r="7.25" />
        <path d="M6.3 10.2 8.8 12.7 13.8 7.8" />
      </svg>
    )
    : tone === 'warning'
      ? (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" aria-hidden>
          <circle cx="10" cy="10" r="7.25" />
          <path d="M10 6.3v4.6" />
          <circle cx="10" cy="13.55" r="0.85" fill="currentColor" stroke="none" />
        </svg>
      )
      : (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" aria-hidden>
          <circle cx="10" cy="10" r="7.25" />
          <path d="M10 8.25v5" />
          <circle cx="10" cy="5.55" r="0.85" fill="currentColor" stroke="none" />
        </svg>
      )

  return (
    <span className={`inline-flex select-none items-center gap-2 rounded-full bg-[#e9e9eb] px-3 py-1.5 text-xs font-semibold leading-none text-[#1d1d1f] ${className}`}>
      <span className={`inline-flex items-center justify-center ${iconColorClass}`} aria-hidden>
        {icon}
      </span>
      <span>{label}</span>
    </span>
  )
}
