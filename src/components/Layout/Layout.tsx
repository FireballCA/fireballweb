import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'

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
  const isCartPage = location.pathname === '/cart' || location.pathname === '/panier'
  const showHeader = !isAccountAuthPage
  const showFooter = !isAnyAccountPage && !isCartPage
  /** Header sticky (dans le flux) : pas de pt-20 sur le main, sinon doublon avec le header fixe */
  const isStickyHeaderRoute =
    location.pathname.startsWith('/product/') ||
    location.pathname.startsWith('/produit/') ||
    location.pathname.startsWith('/coating')

  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <Header />}
      <main
        className={
          showHeader
            ? isStickyHeaderRoute
              ? 'flex-1'
              : 'flex-1 pt-20'
            : 'flex-1'
        }
      >
        <Outlet />
      </main>
      {showFooter && <Footer />}
    </div>
  )
}
