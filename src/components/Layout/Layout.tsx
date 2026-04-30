import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion'
import { useEffect, useState } from 'react'
import { LineupImageTransitionProvider } from '@/context/LineupImageTransitionContext'
import { CookieConsentModal } from '@/components/CookieConsentModal'
import { FloatingAdminFab } from '@/components/FloatingAdminFab'
import { Header } from './Header'
import { Footer } from './Footer'
import { isShopPathname } from '@/utils/shopRoutes'

export function Layout() {
  const location = useLocation()
  const reduceMotion = useEffectiveReducedMotion()

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
    location.pathname === '/Legal-Notice' ||
    location.pathname === '/Cookies' ||
    location.pathname === '/Privacy' ||
    location.pathname === '/Terms-of-Service' ||
    location.pathname === '/cart' ||
    location.pathname === '/academy/training-thank-you'
  const isJoinClubPage = location.pathname === '/join-club' || location.pathname === '/join'
  const isShopPage = isShopPathname(location.pathname)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false,
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', h)
    setIsMobile(mq.matches)
    return () => mq.removeEventListener('change', h)
  }, [])

  /** Même logique que Header : navbar sticky dans le flux — pas de pt sur main (évite double bande noire). */
  const isStickyNavPage =
    location.pathname.startsWith('/products/') ||
    location.pathname.startsWith('/product/') ||
    location.pathname.startsWith('/coating/') ||
    location.pathname.startsWith('/coatings/') ||
    location.pathname === '/all-coatings' ||
    location.pathname === '/event' ||
    location.pathname.startsWith('/event/')

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
            ? 'lg:pt-16'
            : isContactPage
              ? 'lg:pt-20'
              : 'lg:pt-20'

  return (
    <div
      className="flex min-h-screen flex-col max-lg:h-[100dvh] max-lg:overflow-hidden max-lg:bg-[#111111]"
    >
      {showHeader && <Header />}
      {/*
        Mobile: single scrollable column (main + footer) sitting below the fixed navbar.
        The -mt-3 + rounded-t-2xl creates the "card peeking behind navbar" effect.
        Desktop: transparent flex-col wrapper preserving the existing sticky-footer layout.
      */}
      <div
        {...(isMobile ? { 'data-lenis-prevent': true } : {})}
        className="flex flex-1 flex-col max-lg:overflow-y-auto max-lg:rounded-t-3xl max-lg:min-h-0 max-lg:-mt-6"
        style={isMobile && showHeader ? { paddingTop: 'var(--mobile-header-h, 3rem)' } : undefined}
      >
        <main
          className={[
            'flex-1',
            mainHeaderPadding,
            isContactPage
              ? 'flex min-h-0 w-full flex-col'
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
      </div>
      <CookieConsentModal />
      <FloatingAdminFab />
    </div>
  )
}
