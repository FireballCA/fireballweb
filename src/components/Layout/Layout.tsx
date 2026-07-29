import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion'
import { useEffect, useState, Suspense, type CSSProperties } from 'react'
import { LineupImageTransitionProvider } from '@/context/LineupImageTransitionContext'
import { CookieConsentModal } from '@/components/CookieConsentModal'
import { FloatingAdminFab } from '@/components/FloatingAdminFab'
import { RouteChunkErrorBoundary } from '@/components/RouteChunkErrorBoundary'
import { bootstrapPublicSiteRoutePrefetch, prefetchSiteRoute } from '@/routes/lazyPages'
import { prefetchProductBySlug } from '@/utils/shopifyStorefront'
import { resolveSiteShell } from '@/config/siteShell'
import { Header } from './Header'
import { DashboardHeader } from './DashboardHeader'
import { Footer } from './Footer'

const CONTENT_BG_CLASS: Record<ReturnType<typeof resolveSiteShell>['contentBg'], string> = {
  dark: 'bg-[#111111]',
  black: 'bg-black',
  white: 'bg-white',
}

export function Layout() {
  const location = useLocation()
  const reduceMotion = useEffectiveReducedMotion()

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

  const shell = resolveSiteShell(location.pathname, isMobile)
  const showHeader = shell.headerVariant !== 'none'
  const usePageScrollLayout = shell.scrollMode === 'page'
  const contactDesktopNoScroll = shell.scrollMode === 'contact-desktop'

  useEffect(() => {
    bootstrapPublicSiteRoutePrefetch()
  }, [])

  useEffect(() => {
    const onPointerOver = (e: PointerEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest?.('a[href]')
      if (!(anchor instanceof HTMLAnchorElement)) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:'))
        return
      if (href.startsWith('/')) {
        prefetchSiteRoute(href)
        const productMatch = href.match(/^\/products\/([^/?#]+)/)
        if (productMatch?.[1]) void prefetchProductBySlug(productMatch[1])
      }
    }
    document.addEventListener('pointerover', onPointerOver, { passive: true })
    return () => document.removeEventListener('pointerover', onPointerOver)
  }, [])

  return (
    <div
      className={[
        'flex flex-col bg-black',
        usePageScrollLayout ? 'min-h-screen' : 'h-[100dvh] overflow-hidden',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {shell.headerVariant === 'public' && <Header showAnnouncementBanner={shell.showAnnouncementBanner} />}
      {shell.headerVariant === 'dashboard' && <DashboardHeader />}

      {showHeader && (
        <div
          className="shrink-0"
          style={{ height: 'var(--mobile-header-h, 4rem)' }}
          aria-hidden
        />
      )}

      <div
        id="app-scroll-root"
        style={{ '--app-hero-h': 'calc(100dvh - var(--mobile-header-h, 4rem))' } as CSSProperties}
        className={[
          'flex flex-1 flex-col min-h-0 overflow-x-hidden relative z-[1]',
          usePageScrollLayout ? 'overflow-visible' : contactDesktopNoScroll ? 'overflow-hidden' : 'overflow-y-auto',
          CONTENT_BG_CLASS[shell.contentBg],
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div
          id="app-scroll-content"
          className={[
            'flex flex-col',
            contactDesktopNoScroll ? 'min-h-0 flex-1' : 'min-h-full',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <main
            className={[
              'flex-1',
              shell.contentBg === 'white' ? 'flex min-h-0 w-full flex-col' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <LineupImageTransitionProvider>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={location.key}
                  className={shell.contentBg === 'white' ? 'flex min-h-0 w-full flex-1 flex-col' : undefined}
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
                  <RouteChunkErrorBoundary>
                    <Suspense fallback={null}>
                      <Outlet />
                    </Suspense>
                  </RouteChunkErrorBoundary>
                </motion.div>
              </AnimatePresence>
            </LineupImageTransitionProvider>
          </main>
          {shell.showFooter && <Footer />}
        </div>
      </div>

      <CookieConsentModal />
      <FloatingAdminFab />
    </div>
  )
}
