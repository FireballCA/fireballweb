import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion'
import { useEffect, useState } from 'react'
import { LineupImageTransitionProvider } from '@/context/LineupImageTransitionContext'
import { CookieConsentModal } from '@/components/CookieConsentModal'
import { FloatingAdminFab } from '@/components/FloatingAdminFab'
import { Header } from './Header'
import { Footer } from './Footer'

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
  const isHomePage = location.pathname === '/'

  const showHeader = !isAccountAuthPage
  const showFooter = !isAnyAccountPage && !isContactPage

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

  return (
    /*
     * iOS Shopify-style layout — BOTH mobile and desktop:
     *
     * MOBILE (< lg):
     *   • Outer shell : pure black, fixed 100dvh, clips overflow
     *   • Fixed navbar on top (z-120)
     *   • Spacer = navbar height + 16 px chin
     *   • Content card = bg-[#111111] + rounded-t-3xl, scrolls via overflow-y-auto
     *
     * DESKTOP (≥ lg):
     *   • Outer shell : pure black, min-h-screen, normal document scroll (Lenis)
     *   • Fixed navbar on top (z-120)
     *   • Spacer = navbar height + 16 px chin
     *   • Content card = bg-[#111111] + rounded-t-3xl visible at top of page
     *   • Rounded corners visible on load; scroll is handled by Lenis/window
     */
    <div
      className={[
        'flex flex-col bg-black',
        isHomePage ? 'max-lg:h-[100dvh] max-lg:overflow-hidden lg:min-h-screen' : 'h-[100dvh] overflow-hidden',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {showHeader && <Header />}

      {/*
       * Spacer — pushes the card below the fixed navbar AND leaves a visible
       * black "chin" between the navbar bottom edge and the card's rounded corners.
       * Active on both mobile and desktop (header is fixed on both).
       */}
      {showHeader && (
        <div
          className="shrink-0"
          style={{
            height: isHomePage
              ? 'calc(var(--mobile-header-h, 3.5rem) + 16px)'
              : 'calc(var(--mobile-header-h, 3.5rem) + 12px)',
          }}
          aria-hidden
        />
      )}

      {/*
       * Content card — rounded top corners visible against outer bg-black.
       * Mobile : overflow-y-auto + min-h-0 → card is the scroll container.
       * Desktop : no overflow constraint → Lenis/window scroll works normally.
       */}
      <div
        id="app-scroll-root"
        {...(isMobile ? { 'data-lenis-prevent': true } : {})}
        className={[
          'flex flex-1 flex-col bg-[#111111]',
          isHomePage
            ? 'rounded-t-3xl'
            : 'relative z-[1] -mt-2 min-h-0 overflow-y-auto overflow-x-hidden rounded-t-[30px] shadow-[0_-12px_26px_rgba(0,0,0,0.42)]',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div id="app-scroll-content" className="flex min-h-full flex-col">
          <main
            className={[
              'flex-1',
              isContactPage ? 'flex min-h-0 w-full flex-col' : '',
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
      </div>

      <CookieConsentModal />
      <FloatingAdminFab />
    </div>
  )
}
