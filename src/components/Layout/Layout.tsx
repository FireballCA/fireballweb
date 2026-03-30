import { Outlet, useLocation } from 'react-router-dom'
import { LineupImageTransitionProvider } from '@/context/LineupImageTransitionContext'
import { Header } from './Header'
import { Footer } from './Footer'
import { isShopPathname } from '@/utils/shopRoutes'

export function Layout() {
  const location = useLocation()
  const isAccountAuthPage =
    location.pathname === '/compte' ||
    location.pathname === '/account' ||
    location.pathname === '/account/register'
  const isAnyAccountPage =
    location.pathname === '/compte' ||
    location.pathname.startsWith('/account') ||
    location.pathname.startsWith('/business')
  const isContactPage = location.pathname === '/contact'
  const isEventDriven26Page = location.pathname === '/event/driven26'
  const isShopPage = isShopPathname(location.pathname)

  /** Même logique que Header : navbar sticky dans le flux — pas de pt sur main (évite double bande noire). */
  const isStickyNavPage =
    location.pathname.startsWith('/product/') ||
    location.pathname.startsWith('/produit/') ||
    location.pathname.startsWith('/coating')

  const showHeader = !isAccountAuthPage
  const showFooter = !isAnyAccountPage && !isContactPage && !isEventDriven26Page

  const mainHeaderPadding =
    isEventDriven26Page || !showHeader
      ? ''
      : isStickyNavPage
        ? ''
        : isShopPage
          ? 'pt-16'
          : isContactPage
            ? 'lg:pt-20'
            : 'pt-20'

  return (
    <div
      className={[
        isEventDriven26Page
          ? 'flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden'
          : 'flex min-h-screen flex-col',
        isContactPage ? 'max-lg:h-[100dvh] max-lg:max-h-[100dvh] max-lg:overflow-hidden' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {showHeader && <Header />}
      <main
        className={[
          isEventDriven26Page ? '' : 'flex-1',
          mainHeaderPadding,
          isContactPage
            ? 'flex min-h-0 w-full flex-col max-lg:mt-20 max-lg:h-[calc(100dvh-5rem)] max-lg:max-h-[calc(100dvh-5rem)] max-lg:overflow-hidden max-lg:flex-shrink-0'
            : '',
          isEventDriven26Page
            ? 'mt-20 flex h-[calc(100dvh-5rem)] min-h-0 flex-shrink-0 flex-col overflow-hidden'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <LineupImageTransitionProvider>
          <Outlet />
        </LineupImageTransitionProvider>
      </main>
      {showFooter && <Footer />}
    </div>
  )
}
