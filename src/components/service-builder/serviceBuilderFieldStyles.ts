import { cn } from '@/lib/utils'

/** Champs sur fond blanc (AppleSheet) : autofill lisible sur fond blanc. */
export const SB_REVIEW_FIELD_BASE = cn(
  'border border-black/10 bg-white text-sm !text-[#1d1d1f] caret-[#1d1d1f] placeholder:text-[#86868b] outline-none focus:border-[#0485F7]',
  '[&:-webkit-autofill]:[-webkit-text-fill-color:#1d1d1f]',
  '[&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_rgb(255,255,255)]',
  '[&:-webkit-autofill]:[transition:background-color_99999s_ease-out_0s]',
)
