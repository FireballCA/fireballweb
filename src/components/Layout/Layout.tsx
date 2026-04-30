import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion'
import { useEffect, useState, type CSSProperties } from 'react'
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
    <div
      className="flex h-[100dvh] flex-col overflow-hidden bg-black"
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
            height: 'calc(var(--mobile-header-h, 3.5rem) + 12px)',
          }}
          aria-hidden
        />
      )}

      <div
        id="app-scroll-root"
        {...(isMobile ? { 'data-lenis-prevent': true } : {})}
        style={
          {
            '--app-hero-h': 'calc(100dvh - var(--mobile-header-h, 3.5rem) - 12px)',
          } as CSSProperties
        }
        className={[
          'flex flex-1 flex-col bg-[#111111]',
          'relative z-[1] -mt-2 rounded-t-[30px] shadow-[0_-12px_26px_rgba(0,0,0,0.42)]',
          'min-h-0 overflow-y-auto overflow-x-hidden',
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
