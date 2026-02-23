import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'

export function Layout() {
  const location = useLocation()
  const isAccountPage = location.pathname === '/account' || location.pathname === '/compte'

  return (
    <div className="min-h-screen flex flex-col">
      {!isAccountPage && <Header />}
      <main className={isAccountPage ? 'flex-1' : 'flex-1 pt-20'}>
        <Outlet />
      </main>
      {!isAccountPage && <Footer />}
    </div>
  )
}
