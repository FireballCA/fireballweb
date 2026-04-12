import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/**
 * Bouton Apple (Fireball) : même apparence que « Add to calendar » sur la Home.
 * Utiliser `AppleButton`, ou `appleButtonVisualClassName` sur un `<a>` / `<Link>` / `<button>` avec le display voulu (`inline-flex`, `hidden sm:inline-flex`, etc.).
 */
export const appleButtonVisualClassName =
  'items-center justify-center gap-2.5 rounded-full border border-[#0485F7] bg-[#0485F7] px-4 py-2 text-xs font-semibold text-white transition-colors hover:border-[#3592F9] hover:bg-[#3592F9]'

export const appleButtonClassName = cn('inline-flex', appleButtonVisualClassName)

export const AppleButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function AppleButton({ className, type = 'button', ...props }, ref) {
    return (
      <button ref={ref} type={type} className={cn(appleButtonClassName, className)} {...props} />
    )
  }
)
