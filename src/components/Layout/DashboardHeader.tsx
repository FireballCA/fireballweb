import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCart } from '@/context/CartContext'
import { getCurrentUserProfile, isAuthenticated, logout } from '@/utils/supabaseAuth'
import {
  NAV_BAR_INNER_CLASS,
  NAV_LOGO_GAP_CLASS,
  NAV_LINKS_GAP_CLASS,
  NAV_LINK_CLASS,
  NAV_ICON_BTN_CLASS,
  NAV_LOGO_CLASS,
  NAV_LOGO_SRC,
  NAV_AVATAR_RING_CLASS,
  NAV_AVATAR_FALLBACK_CLASS,
  navBgStyle,
} from './navShared'
import { useSiteHeaderHeight } from './useSiteHeaderHeight'

export function DashboardHeader() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { totalItems } = useCart()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userInitial, setUserInitial] = useState<string | null>(null)

  useSiteHeaderHeight()

  useEffect(() => {
    let cancelled = false
    isAuthenticated().then(async (ok) => {
      if (!ok || cancelled) {
        if (!cancelled) {
          setAvatarUrl(null)
          setUserInitial(null)
        }
        return
      }
      const profile = await getCurrentUserProfile()
      if (!cancelled && profile) {
        setAvatarUrl(profile.avatar_url || null)
        setUserInitial(profile.first_name ? profile.first_name.charAt(0).toUpperCase() : null)
      }
    })
    return () => {
      cancelled = true
    }
  }, [location.pathname])

  useEffect(() => {
    const onAvatarUpdate = (e: Event) => {
      const ce = e as CustomEvent<{ avatarUrl: string | null }>
      setAvatarUrl(ce.detail?.avatarUrl || null)
    }
    window.addEventListener('avatar-updated', onAvatarUpdate)
    return () => window.removeEventListener('avatar-updated', onAvatarUpdate)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/account')
  }

  return (
    <div id="site-header-stack" className="fixed top-0 left-0 right-0 z-[120]">
      <header className="left-0 right-0 bg-white" style={navBgStyle}>
        <div id="site-nav-chrome">
        <div className={NAV_BAR_INNER_CLASS}>
          <div className={`flex items-center ${NAV_LOGO_GAP_CLASS} h-full`}>
            <Link to="/account/dashboard" className="flex items-center h-10 w-auto select-none">
              <img
                id="navbar-logo"
                src={NAV_LOGO_SRC}
                alt="Fireball"
                className={NAV_LOGO_CLASS}
                draggable={false}
              />
            </Link>

            <nav className={`hidden lg:flex items-center ${NAV_LINKS_GAP_CLASS} h-full`}>
              <Link to="/shop" className={NAV_LINK_CLASS}>
                {t('nav.shop')}
              </Link>
              <Link to="/account/orders" className={NAV_LINK_CLASS}>
                {t('nav.orders', { defaultValue: 'Commandes' })}
              </Link>
              <Link to="/account/settings" className={NAV_LINK_CLASS}>
                {t('nav.settings', { defaultValue: 'Paramètres' })}
              </Link>
            </nav>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <Link
              to="/"
              className={`${NAV_LINK_CLASS} text-black/70 hover:!text-black`}
            >
              {t('nav.backToSite', { defaultValue: 'Retour au site' })}
            </Link>

            <Link
              to="/cart"
              className={`relative ${NAV_ICON_BTN_CLASS}`}
              aria-label="Cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 px-0.5 rounded-full bg-[#B61B1B] text-white text-[10px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            <Link
              to="/account/settings"
              className="relative flex items-center justify-center w-8 h-8 rounded-full transition-opacity hover:opacity-80"
              aria-label="Account settings"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className={`w-8 h-8 rounded-full object-cover ${NAV_AVATAR_RING_CLASS}`}
                />
              ) : (
                <div className={`w-8 h-8 rounded-full ${NAV_AVATAR_RING_CLASS} ${NAV_AVATAR_FALLBACK_CLASS}`}>
                  {userInitial || '?'}
                </div>
              )}
            </Link>
          </div>

          <div className="flex lg:hidden items-center gap-3">
            <Link to="/cart" className="relative p-2 text-black" aria-label="Cart">
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 min-w-[1rem] h-4 px-0.5 rounded-full bg-[#B61B1B] text-white text-[10px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
            </Link>
            <Link to="/account/settings" className="p-2 text-black" aria-label="Settings">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            <button
              type="button"
              onClick={() => { void handleLogout() }}
              className="p-2 text-black/70 hover:text-black"
              aria-label="Se déconnecter"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
        </div>
      </header>
    </div>
  )
}
