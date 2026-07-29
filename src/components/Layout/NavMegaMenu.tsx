import { type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion'
import { NAV_CONTENT_INNER_CLASS } from './navShared'

export type MegaMenuId = 'shop' | 'ceramic' | 'company'

type MegaSection = {
  title: string
  description?: string
  links: Array<{ label: string; to?: string; href?: string }>
}

type NavMegaMenuProps = {
  activeMenu: MegaMenuId | null
  onClose: () => void
  onPointerEnterPanel?: () => void
  onPointerLeavePanel?: () => void
  ceramicSections: MegaSection[]
  companySections: MegaSection[]
  featuredName: string
  featuredDescription: string
  featuredImage: string | null
}

const MEGA_EASE = [0.22, 1, 0.36, 1] as const

/** Juste milieu — ajuster ici si plus grand / plus petit */
const MEGA_LINK_CLASS =
  'group inline-flex items-center gap-2 text-[1.375rem] font-semibold leading-snug tracking-[-0.01em] text-black transition-colors hover:text-black/65'
const MEGA_LINK_LIST_CLASS = 'space-y-3.5'
const MEGA_GRID_GAP_CLASS = 'gap-10 lg:gap-14'
const MEGA_PANEL_PY_CLASS = 'py-11 md:py-12'
/** Hauteur fixe du contenu — identique pour Shop, Ceramic et Company */
const MEGA_PANEL_CONTENT_MIN_H_CLASS = 'min-h-[17.5rem]'
const MEGA_MENU_GRID_CLASS = `grid grid-cols-1 ${MEGA_GRID_GAP_CLASS} md:grid-cols-2 lg:grid-cols-[1fr_1fr_minmax(200px,0.75fr)] ${MEGA_PANEL_CONTENT_MIN_H_CLASS} items-stretch`
const MEGA_SECTION_LABEL_CLASS =
  'mb-4 text-[11px] font-nav font-bold uppercase tracking-[0.14em] text-black/45'

function MegaArrowIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 translate-y-px opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12 12 4M6 4h6v6" />
    </svg>
  )
}

function MegaSectionLabel({ children }: { children: string }) {
  return <p className={MEGA_SECTION_LABEL_CLASS}>{children}</p>
}

function MegaNavLink({
  item,
  onNavigate,
}: {
  item: { label: string; to?: string; href?: string }
  onNavigate: () => void
}) {
  if (item.to) {
    return (
      <li>
        <Link to={item.to} onClick={onNavigate} className={MEGA_LINK_CLASS}>
          <span>{item.label}</span>
          <MegaArrowIcon />
        </Link>
      </li>
    )
  }

  return (
    <li>
      <a
        href={item.href ?? '#'}
        onClick={(e) => {
          if (item.href === '#') e.preventDefault()
          onNavigate()
        }}
        className={MEGA_LINK_CLASS}
      >
        <span>{item.label}</span>
        <MegaArrowIcon />
      </a>
    </li>
  )
}

function MegaMenuGrid({ children }: { children: ReactNode }) {
  return <div className={MEGA_MENU_GRID_CLASS}>{children}</div>
}

function MegaSectionColumn({
  section,
  onClose,
}: {
  section: MegaSection
  onClose: () => void
}) {
  return (
    <div className="flex h-full min-h-[inherit] flex-col">
      <MegaSectionLabel>{section.title}</MegaSectionLabel>
      <ul className={MEGA_LINK_LIST_CLASS}>
        {section.links.map((item) => (
          <MegaNavLink key={item.label} item={item} onNavigate={onClose} />
        ))}
      </ul>
      {section.description ? (
        <p className="mt-auto max-w-sm pt-5 text-[15px] leading-relaxed text-black/50">{section.description}</p>
      ) : null}
    </div>
  )
}

function ShopFeaturedColumn({
  onClose,
  featuredName,
  featuredDescription,
  featuredImage,
}: {
  onClose: () => void
  featuredName: string
  featuredDescription: string
  featuredImage: string | null
}) {
  const { t } = useTranslation()

  return (
    <div className="flex h-full min-h-[inherit] flex-col">
      <MegaSectionLabel>{t('nav.featuredLabel')}</MegaSectionLabel>
      <div className="mb-4 max-w-[220px] overflow-hidden rounded-lg bg-black/[0.04]">
        <div className="relative w-full pb-[56.25%]">
          {featuredImage ? (
            <img
              src={featuredImage}
              alt={featuredName}
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.classList.remove('hidden')
              }}
            />
          ) : null}
          <div className={`absolute inset-0 flex items-center justify-center text-black/25 ${featuredImage ? 'hidden' : ''}`}>
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>
      <p className="max-w-sm text-[15px] font-semibold leading-relaxed text-black">{featuredName}</p>
      <p className="mt-1 max-w-sm text-[15px] leading-relaxed text-black/50">{featuredDescription}</p>
      <ul className={`${MEGA_LINK_LIST_CLASS} mt-auto pt-5`}>
        <MegaNavLink item={{ label: t('nav.exploreNow'), to: '/shop' }} onNavigate={onClose} />
      </ul>
    </div>
  )
}
function ShopMegaMenu({
  onClose,
  featuredName,
  featuredDescription,
  featuredImage,
}: {
  onClose: () => void
  featuredName: string
  featuredDescription: string
  featuredImage: string | null
}) {
  const { t } = useTranslation()

  const shopSections: MegaSection[] = [
    {
      title: t('nav.protectionSystems'),
      links: [
        { label: t('nav.coatings'), to: '/coatings' },
        { label: t('nav.sealants'), to: '/sealants' },
        { label: t('nav.waxes'), to: '/waxes' },
        { label: t('nav.dressings'), to: '/dressings' },
      ],
    },
    {
      title: t('nav.maintenancePrep'),
      links: [
        { label: t('nav.washing'), to: '/washing' },
        { label: t('nav.cleaners'), to: '/cleaners' },
        { label: t('nav.towels'), to: '/towels' },
        { label: t('nav.accessories'), to: '/accessories' },
      ],
    },
  ]

  return (
    <MegaMenuGrid>
      {shopSections.map((section) => (
        <MegaSectionColumn key={section.title} section={section} onClose={onClose} />
      ))}
      <ShopFeaturedColumn
        onClose={onClose}
        featuredName={featuredName}
        featuredDescription={featuredDescription}
        featuredImage={featuredImage}
      />
    </MegaMenuGrid>
  )
}

function SectionsMegaMenu({
  sections,
  onClose,
}: {
  sections: MegaSection[]
  onClose: () => void
}) {
  return (
    <MegaMenuGrid>
      {sections.map((section) => (
        <MegaSectionColumn key={section.title} section={section} onClose={onClose} />
      ))}
      <div className="hidden lg:block" aria-hidden />
    </MegaMenuGrid>
  )
}

export function NavMegaMenu({
  activeMenu,
  onClose,
  onPointerEnterPanel,
  onPointerLeavePanel,
  ceramicSections,
  companySections,
  featuredName,
  featuredDescription,
  featuredImage,
}: NavMegaMenuProps) {
  const reduceMotion = useEffectiveReducedMotion()
  const isOpen = activeMenu != null

  const shellMotion = reduceMotion
    ? { initial: false, animate: { height: isOpen ? 'auto' : 0 }, exit: { height: 0 } }
    : {
        initial: false,
        animate: { height: isOpen ? 'auto' : 0 },
        transition: { duration: 0.42, ease: MEGA_EASE },
      }

  const backdrop =
    typeof document !== 'undefined' && isOpen
      ? createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.button
                type="button"
                aria-label="Fermer le menu"
                className="fixed inset-x-0 bottom-0 z-[119] bg-black/15 backdrop-blur-[2px]"
                style={{ top: 'var(--header-stack-bottom, var(--nav-chrome-h, 4rem))' }}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: MEGA_EASE }}
                onClick={onClose}
              />
            )}
          </AnimatePresence>,
          document.body,
        )
      : null

  return (
    <>
      {backdrop}
      <motion.div
        className="w-full overflow-hidden bg-white shadow-[0_20px_40px_rgba(0,0,0,0.06)]"
        onMouseEnter={onPointerEnterPanel}
        onMouseLeave={onPointerLeavePanel}
        {...shellMotion}
      >
        <div className={`${NAV_CONTENT_INNER_CLASS} border-t border-black/[0.06] ${MEGA_PANEL_PY_CLASS}`}>
          <AnimatePresence mode="wait" initial={false}>
            {isOpen && activeMenu && (
              <motion.div
                key={activeMenu}
                className={MEGA_PANEL_CONTENT_MIN_H_CLASS}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: MEGA_EASE }}
              >
                {activeMenu === 'shop' && (
                  <ShopMegaMenu
                    onClose={onClose}
                    featuredName={featuredName}
                    featuredDescription={featuredDescription}
                    featuredImage={featuredImage}
                  />
                )}
                {activeMenu === 'ceramic' && (
                  <SectionsMegaMenu sections={ceramicSections} onClose={onClose} />
                )}
                {activeMenu === 'company' && (
                  <SectionsMegaMenu sections={companySections} onClose={onClose} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  )
}
