import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { LineupImageTransitionProvider } from '@/context/LineupImageTransitionContext'
import { CookieConsentModal } from '@/components/CookieConsentModal'
import { Header } from './Header'
import { Footer } from './Footer'
import { isShopPathname } from '@/utils/shopRoutes'

export function Layout() {
  const location = useLocation()
  const reduceMotion = useReducedMotion()

  const isAccountAuthPage =
    location.pathname === '/account' ||
    location.pathname === '/account/register'
  const isAnyAccountPage =
    location.pathname.startsWith('/account') ||
    location.pathname.startsWith('/business')
  const isContactPage = location.pathname === '/contact'
  const isCompanyInfoPage =
    location.pathname === '/contact' ||
    location.pathname === '/press-kit' ||
    location.pathname === '/about' ||
    location.pathname === '/legal' ||
    location.pathname === '/cart' ||
    location.pathname === '/academy/training-thank-you'
  const isJoinClubPage = location.pathname === '/join-club'
  const isShopPage = isShopPathname(location.pathname)

  /** Même logique que Header : navbar sticky dans le flux — pas de pt sur main (évite double bande noire). */
  const isStickyNavPage =
    location.pathname.startsWith('/products/') ||
    location.pathname.startsWith('/product/') ||
    location.pathname.startsWith('/coating/') ||
    location.pathname.startsWith('/coatings/') ||
    location.pathname === '/all-coatings'

  const showHeader = !isAccountAuthPage
  const showFooter = !isAnyAccountPage && !isContactPage

  const mainHeaderPadding =
    !showHeader
      ? ''
      : isStickyNavPage
        ? ''
        : isAnyAccountPage
          ? ''
        : isJoinClubPage || isCompanyInfoPage
          ? ''
          : isShopPage
            ? 'pt-16'
            : isContactPage
              ? 'lg:pt-20'
              : 'pt-20'

  return (
    <div
      className={[
        'flex min-h-screen flex-col',
        isContactPage ? 'max-lg:h-[100dvh] max-lg:max-h-[100dvh] max-lg:overflow-hidden' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {showHeader && <Header />}
      <main
        className={[
          'flex-1',
          mainHeaderPadding,
          isContactPage
            ? 'flex min-h-0 w-full flex-col max-lg:mt-20 max-lg:h-[calc(100dvh-5rem)] max-lg:max-h-[calc(100dvh-5rem)] max-lg:overflow-hidden max-lg:flex-shrink-0'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <LineupImageTransitionProvider>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.key}
              initial={
                !reduceMotion && (location.state as { pageTransition?: string } | null | undefined)?.pageTransition === 'slideUp'
                  ? { y: 64, opacity: 0 }
                  : { y: 0, opacity: 1 }
              }
              animate={{ y: 0, opacity: 1 }}
              exit={
                !reduceMotion && (location.state as { pageTransition?: string } | null | undefined)?.pageTransition === 'slideUp'
                  ? { y: -16, opacity: 0 }
                  : { y: 0, opacity: 1 }
              }
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </LineupImageTransitionProvider>
      </main>
      {showFooter && <Footer />}
      <CookieConsentModal />
    </div>
  )
}
