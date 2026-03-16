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
  const showHeader = !isAccountAuthPage
  const showFooter = !isAnyAccountPage

  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <Header />}
      <main className={showHeader ? 'flex-1 pt-20' : 'flex-1'}>
        <Outlet />
      </main>
      {showFooter && <Footer />}
    </div>
  )
}
