import { cn } from '@/lib/utils'

/** Rail horizontal tactile (mobile), grille à partir de md — même idée que Product Lineup. */
export function ServiceBuilderChoiceRail({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-md:-mx-6 md:grid md:grid-cols-4 md:gap-4">
      <div
        className={cn(
          'flex gap-4 overflow-x-auto overscroll-x-contain pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden',
          'max-md:pl-8 max-md:pr-6 max-md:scroll-pl-8 max-md:scroll-pr-6',
          'md:contents md:gap-0 md:overflow-visible md:p-0 md:scroll-p-0 md:snap-none',
        )}
      >
        {children}
      </div>
    </div>
  )
}

export const SB_MOBILE_CARD_ROW =
  'max-md:snap-start max-md:shrink-0 max-md:w-[min(320px,calc(100vw-4.25rem))] md:w-auto md:min-w-0'
