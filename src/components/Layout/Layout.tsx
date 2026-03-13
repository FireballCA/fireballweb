import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'

export function Layout() {
  const location = useLocation()
  const isAccountAuthPage =
    location.pathname === '/compte' ||
    location.pathname === '/account' ||
    location.pathname === '/account/register'
  const isOverlayHeaderPage = location.pathname === '/account/company' || location.pathname === '/join-fireball'
  const isAnyAccountPage = location.pathname === '/compte' || location.pathname.startsWith('/account')
  const isContactPage = location.pathname === '/contact'
  const isProductPage = location.pathname.startsWith('/produit')
  const showHeader = !isAccountAuthPage
  const showFooter = !isAnyAccountPage && !isContactPage
  // Sur la page produit, le header est sticky donc pas besoin de padding-top
  // Sur les autres pages, le header est fixed donc besoin de padding-top
  const mainClassName = showHeader && !isOverlayHeaderPage && !isProductPage ? 'flex-1 pt-20' : 'flex-1'

  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <Header />}
      <main className={mainClassName}>
        <Outlet />
      </main>
      {showFooter && <Footer />}
    </div>
  )
}
