import type { CSSProperties } from 'react'

export const SOLID_NAV_COLOR = '#ffffff'

export const NAV_LOGO_SRC = '/Fireball Logo Noir.png'

/** Espace logo → premier lien */
export const NAV_LOGO_GAP_CLASS = 'gap-4'

/** Espace entre les liens de navigation */
export const NAV_LINKS_GAP_CLASS = 'gap-1'

export const NAV_CONTENT_INNER_CLASS = 'w-full max-w-[90rem] mx-auto px-4 sm:px-5 lg:px-6'

export const NAV_BAR_INNER_CLASS =
  `${NAV_CONTENT_INNER_CLASS} flex items-center justify-between h-16 max-lg:h-14`

export const NAV_BANNER_INNER_CLASS = 'w-full max-w-[90rem] mx-auto px-4 sm:px-5 lg:px-6 py-2'

export const NAV_BANNER_CLASS = 'border-b border-black/[0.08] bg-white text-black'

export const NAV_LOGO_CLASS = 'h-5 w-auto object-contain pointer-events-none'

export const NAV_LINK_CLASS =
  'font-nav font-bold text-black transition-colors text-[11px] uppercase px-3 py-1.5 rounded-md hover:bg-black/5 group-hover:text-black/70 hover:!text-black'

export const NAV_LINK_ACTIVE_CLASS = '!bg-black/5 !text-black'

export const NAV_ICON_BTN_CLASS =
  'px-2 py-1.5 rounded-md text-black transition-colors hover:bg-black/5'

export const NAV_AVATAR_RING_CLASS = 'ring-2 ring-black/10'

export const NAV_AVATAR_FALLBACK_CLASS =
  'bg-carbon-200 flex items-center justify-center text-[13px] font-semibold text-black select-none'

export const NAV_MOBILE_BORDER_CLASS = 'border-black/[0.08]'

export const NAV_MOBILE_ROW_CLASS =
  'flex w-[96%] mx-auto items-center justify-between py-3 px-2 font-nav font-bold text-black'

export const NAV_MOBILE_SECTION_OPEN_CLASS = 'bg-black/[0.03]'

export const navBgStyle: CSSProperties = {
  backgroundColor: SOLID_NAV_COLOR,
  backdropFilter: 'none',
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
  transition:
    'background-color 0.12s ease-out, backdrop-filter 0.12s ease-out, border-bottom-color 0.12s ease-out',
}
