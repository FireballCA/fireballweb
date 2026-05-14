import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type AppleInfoPillTone = 'info' | 'success' | 'warning' | 'error' | 'neutral'

interface AppleInfoPillProps {
  label: string
  tone?: AppleInfoPillTone
  className?: string
}

/** Pastille type Réglages iOS : fond gris clair, icône système à gauche, libellé à droite. */
export function AppleInfoPill({ label, tone = 'info', className }: AppleInfoPillProps) {
  const iconColorClass =
    tone === 'success'
      ? 'text-[#12b161]'
      : tone === 'warning'
        ? 'text-[#f59e0b]'
        : tone === 'error'
          ? 'text-[#FF3B30]'
          : tone === 'neutral'
            ? 'text-[#86868b]'
            : 'text-[#0485F7]'

  const icon: ReactNode =
    tone === 'success'
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
        : tone === 'error'
          ? (
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" aria-hidden>
                <circle cx="10" cy="10" r="7.25" />
                <path d="M7.2 7.2l5.6 5.6M12.8 7.2l-5.6 5.6" />
              </svg>
            )
          : tone === 'neutral'
            ? (
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" aria-hidden>
                  <circle cx="10" cy="10" r="7.25" />
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
    <span
      className={cn(
        'inline-flex select-none items-center gap-2 rounded-full bg-[#e9e9eb] px-3 py-1.5 text-xs font-semibold leading-none text-[#1d1d1f]',
        className,
      )}
    >
      <span className={cn('inline-flex items-center justify-center', iconColorClass)} aria-hidden>
        {icon}
      </span>
      <span>{label}</span>
    </span>
  )
}

/** Pastille promo : fond rouge, icône % blanche, texte blanc. Utilisée sur les cards produits en solde. */
export function SaleDiscountPill({ discount, className }: { discount: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex select-none items-center gap-1.5 rounded-full bg-[#FF3B30] px-2.5 py-1 text-[11px] font-semibold leading-none text-white shadow-sm',
        className,
      )}
    >
      <svg viewBox="0 0 16 16" className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden>
        <circle cx="5.5" cy="5.5" r="1.5" />
        <circle cx="10.5" cy="10.5" r="1.5" />
        <line x1="3" y1="13" x2="13" y2="3" />
      </svg>
      <span>-{discount}%</span>
    </span>
  )
}

/** Pastille sold out : fond gris foncé, icône X, texte blanc. Utilisée sur les cards produits épuisés. */
export function SoldOutPill({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex select-none items-center gap-1.5 rounded-full bg-[#3a3a3c] px-2.5 py-1 text-[11px] font-semibold leading-none text-white shadow-sm',
        className,
      )}
    >
      <svg viewBox="0 0 16 16" className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <line x1="4" y1="4" x2="12" y2="12" />
        <line x1="12" y1="4" x2="4" y2="12" />
      </svg>
      <span>Sold Out</span>
    </span>
  )
}

/** Capsule texte seul (ex. « 3 new »), même surface que la pastille Apple sans icône. */
export function AppleCapsuleLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex select-none items-center rounded-full bg-[#e9e9eb] px-2.5 py-1 text-[11px] font-semibold leading-none text-[#3a3a3c]',
        className,
      )}
    >
      {children}
    </span>
  )
}
