import { Outlet, useLocation } from 'react-router-dom'
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
  const isCartPage = location.pathname === '/panier'
  const isContactPage = location.pathname === '/contact'
  const isShopPage = isShopPathname(location.pathname)
  /** Même logique que Header : navbar sticky dans le flux — pas de pt sur main (évite double bande noire). */
  const isStickyNavPage =
    location.pathname.startsWith('/produit') || location.pathname.startsWith('/coating')
  const showHeader = !isAccountAuthPage
  const showFooter = !isAnyAccountPage && !isCartPage && !isContactPage

  const mainHeaderPadding = !showHeader
    ? ''
    : isStickyNavPage
      ? ''
      : isShopPage
        ? 'pt-16'
        : 'pt-20'

  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <Header />}
      <main
        className={[
          'flex-1',
          mainHeaderPadding,
          isContactPage ? 'flex flex-col min-h-0 w-full' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Outlet />
      </main>
      {showFooter && <Footer />}
    </div>
  )
}
