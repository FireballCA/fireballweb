import { useId, useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCart } from '@/context/CartContext'
import { CATEGORIES } from '@/data/products'
import { isAuthenticated } from '@/utils/supabaseAuth'

const CERAMIC_SECTIONS = [
  {
    title: 'CARROSSERIE',
    description: 'Protection complète de la carrosserie',
    links: [
      { label: 'Coatings', to: '/boutique/revetements' },
      { label: 'Sealants', to: '/boutique/revetements' },
    ],
  },
  {
    title: 'SURFACES SPÉCIALES',
    description: 'Jantes, vitres et plastiques',
    links: [
      { label: 'Jantes', to: '/boutique/revetements' },
      { label: 'Vitres', to: '/boutique/revetements' },
    ],
  },
]

const COMPANY_SECTIONS: Array<{
  title: string
  description: string
  links: Array<{ label: string; to?: string; href?: string }>
}> = [
  {
    title: 'COMPANY',
    description: 'Brand, recognition & story',
    links: [
      { label: 'Open FIREBALL Center', to: '/join-fireball' },
      { label: 'Merch', to: '/boutique' },
      { label: 'Awards', href: '#' },
      { label: 'About us', to: '/about' },
    ],
  },
  {
    title: 'CONNECT',
    description: 'Media & direct contact',
    links: [
      { label: 'Contact us', to: '/contact' },
      { label: 'Press kit', href: '#' },
      { label: 'Legal', to: '/legal' },
    ],
  },
]

function FlagEN() {
  const clipId = useId()
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
      <defs>
        <clipPath id={clipId}>
          <circle cx="10" cy="10" r="10" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="20" height="20" fill="#012169" />
        <path d="M0 0L20 20M20 0L0 20" stroke="white" strokeWidth="3" />
        <path d="M0 0L20 20M20 0L0 20" stroke="#C8102E" strokeWidth="1.8" />
        <path d="M10 0v20M0 10h20" stroke="white" strokeWidth="5" />
        <path d="M10 0v20M0 10h20" stroke="#C8102E" strokeWidth="3" />
      </g>
    </svg>
  )
}

function FlagFR() {
  const clipId = useId()
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
      <defs>
        <clipPath id={clipId}>
          <circle cx="10" cy="10" r="10" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="6.67" height="20" fill="#002395" />
        <rect width="6.67" height="20" x="6.67" fill="#fff" />
        <rect width="6.67" height="20" x="13.33" fill="#ED2939" />
      </g>
    </svg>
  )
}

export function Header() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const [ceramicOpen, setCeramicOpen] = useState(false)
  const [companyOpen, setCompanyOpen] = useState(false)
  const [mobileShopOpen, setMobileShopOpen] = useState(false)
  const [mobileCompanyOpen, setMobileCompanyOpen] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const lang = i18n.language === 'fr' ? 'FR' : 'EN'
  const [langOpen, setLangOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const langMenuDesktopRef = useRef<HTMLDivElement | null>(null)
  const langMenuMobileRef = useRef<HTMLDivElement | null>(null)
  const searchMenuRef = useRef<HTMLDivElement | null>(null)
  const { totalItems } = useCart()
  const isDashboardPage = location.pathname === '/account/dashboard' || location.pathname === '/dashboard'
  const isProductPage = location.pathname.startsWith('/produit')
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const lastScrollYRef = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0
      const maxScroll = 200
      const progress = Math.min(scrollY / maxScroll, 1)
      setScrollProgress(progress)

      // Sur la page produit, cacher/afficher la navbar selon la direction du scroll
      if (isProductPage) {
        const lastScrollY = lastScrollYRef.current
        if (scrollY < 100) {
          // Toujours visible en haut de page
          setIsHeaderVisible(true)
        } else {
          // Cacher quand on scroll vers le bas, afficher quand on scroll vers le haut
          if (scrollY > lastScrollY && scrollY > 100) {
            setIsHeaderVisible(false)
          } else if (scrollY < lastScrollY) {
            setIsHeaderVisible(true)
          }
        }
        lastScrollYRef.current = scrollY
      } else {
        setIsHeaderVisible(true)
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isProductPage])

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (langOpen) {
        const inDesktop = langMenuDesktopRef.current?.contains(target)
        const inMobile = langMenuMobileRef.current?.contains(target)
        if (!inDesktop && !inMobile) {
          setLangOpen(false)
        }
      }

      if (searchOpen && searchMenuRef.current && !searchMenuRef.current.contains(target)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [langOpen, searchOpen])

  // Bloquer le scroll de la page quand le menu mobile est ouvert
  useEffect(() => {
    if (!menuOpen) {
      return () => {
        // Cleanup toujours retourné pour éviter l'erreur React #310
      }
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [menuOpen])

  const opacity = isDashboardPage ? 1 : scrollProgress * 0.95
  const borderOpacity = isDashboardPage ? 0.45 : 0.15 + (scrollProgress * 0.35) // Toujours au moins 0.15 visible
  const solidNavColor = '#0a0a0a'
  
  const navBgStyle: React.CSSProperties = isDashboardPage
    ? {
        backgroundColor: solidNavColor,
        backdropFilter: 'none',
        borderBottom: `1px solid rgba(37, 37, 37, ${borderOpacity})`,
        transition: 'background-color 0.12s ease-out, backdrop-filter 0.12s ease-out, border-bottom-color 0.12s ease-out',
      }
    : {
        backgroundColor: `rgba(10, 10, 10, ${opacity})`,
        backdropFilter: opacity > 0.01 ? 'blur(12px)' : 'none',
        borderBottom: `1px solid rgba(37, 37, 37, ${borderOpacity})`,
        transition: 'background-color 0.12s ease-out, backdrop-filter 0.12s ease-out, border-bottom-color 0.12s ease-out',
      }

  const navLink =
    'font-nav font-bold text-white transition-colors text-xs uppercase px-4 py-2 rounded-md hover:bg-carbon-700/20 group-hover:text-silver/70 hover:!text-white'
  const anyMenuOpen = shopOpen || ceramicOpen || companyOpen || searchOpen || langOpen || menuOpen

  const handleAccountClick = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    const authenticated = await isAuthenticated()
    if (authenticated) {
      navigate('/account/dashboard')
    } else {
      sessionStorage.setItem('accountIntroFromNav', '1')
      navigate('/account')
    }
  }

  return (
    <header
      className={`${isProductPage ? 'sticky' : 'fixed'} top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isProductPage && !isHeaderVisible ? '-translate-y-full' : ''
      }`}
      style={
        menuOpen
          ? {
              ...(navBgStyle || {}),
              backgroundColor: solidNavColor,
              backdropFilter: 'none',
            }
          : navBgStyle
      }
    >
      {anyMenuOpen && !menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/15 pointer-events-none" aria-hidden />
      )}
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
        {/* Left: Logo + links */}
        <div className="flex items-center gap-10 h-full">
          <Link to="/" className="flex items-center h-12 w-auto select-none">
            <img src="/LogoFull.avif" alt="Fireball" className="h-6 w-auto object-contain pointer-events-none" draggable={false} />
          </Link>

          <nav className="hidden lg:flex items-center gap-1 pt-0.5 group h-full">
            <Link to="/car-club" className={navLink}>
              Car club
            </Link>

            <div
              className="relative h-full flex items-center"
              onMouseEnter={() => setShopOpen(true)}
              onMouseLeave={() => setShopOpen(false)}
            >
              <button type="button" className={`${navLink} flex items-center gap-1 ${shopOpen ? '!bg-carbon-700/20 !text-white' : ''}`}>
                Shop
                <svg
                  className={`w-4 h-4 transition-transform ${shopOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {shopOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-0 animate-fade-in z-50">
                  <div className="relative bg-white shadow-2xl rounded-2xl pt-4">
                    <svg className="absolute -top-2 left-1/2 w-4 h-2 -translate-x-1/2 fill-white z-10 pointer-events-none" viewBox="0 0 16 8" preserveAspectRatio="none">
                      <path d="M 0 8 L 5 1.5 Q 8 0 11 1.5 L 16 8 Z" />
                    </svg>
                    <div className="overflow-hidden rounded-b-2xl">
                      <div className="flex gap-12 px-8 py-5">
                        {/* PROTECTION SYSTEMS */}
                        <div className="min-w-[200px]">
                          <h3 className="font-nav font-bold text-carbon-900 text-sm mb-1.5">
                            PROTECTION SYSTEMS
                          </h3>
                          <p className="text-sm text-carbon-600 mb-10">
                            Surface durability & coating technologies
                          </p>
                          <ul className="space-y-1.5">
                            <li>
                              <Link
                                to="/boutique/revetements"
                                className="relative inline-block text-sm text-carbon-700 no-underline hover:text-carbon-900 overflow-hidden pb-0.5 [&:hover_.dropdown-link-line]:w-full"
                                onClick={() => setShopOpen(false)}
                              >
                                Coatings
                                <span className="dropdown-link-line absolute bottom-0 left-0 h-px bg-carbon-900 w-0 transition-all duration-300 ease-out" />
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="/boutique"
                                className="relative inline-block text-sm text-carbon-700 no-underline hover:text-carbon-900 overflow-hidden pb-0.5 [&:hover_.dropdown-link-line]:w-full"
                                onClick={() => setShopOpen(false)}
                              >
                                Sealants
                                <span className="dropdown-link-line absolute bottom-0 left-0 h-px bg-carbon-900 w-0 transition-all duration-300 ease-out" />
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="/boutique"
                                className="relative inline-block text-sm text-carbon-700 no-underline hover:text-carbon-900 overflow-hidden pb-0.5 [&:hover_.dropdown-link-line]:w-full"
                                onClick={() => setShopOpen(false)}
                              >
                                Waxes
                                <span className="dropdown-link-line absolute bottom-0 left-0 h-px bg-carbon-900 w-0 transition-all duration-300 ease-out" />
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="/boutique"
                                className="relative inline-block text-sm text-carbon-700 no-underline hover:text-carbon-900 overflow-hidden pb-0.5 [&:hover_.dropdown-link-line]:w-full"
                                onClick={() => setShopOpen(false)}
                              >
                                Dressings
                                <span className="dropdown-link-line absolute bottom-0 left-0 h-px bg-carbon-900 w-0 transition-all duration-300 ease-out" />
                              </Link>
                            </li>
                          </ul>
                        </div>

                        {/* MAINTENANCE & PREPARATION */}
                        <div className="min-w-[220px]">
                          <h3 className="font-nav font-bold text-carbon-900 text-sm mb-1.5">
                            MAINTENANCE & PREPARATION
                          </h3>
                          <p className="text-sm text-carbon-600 mb-10">
                            Preparation, cleaning & system care
                          </p>
                          <ul className="space-y-1.5">
                            <li>
                              <Link
                                to="/boutique"
                                className="relative inline-block text-sm text-carbon-700 no-underline hover:text-carbon-900 overflow-hidden pb-0.5 [&:hover_.dropdown-link-line]:w-full"
                                onClick={() => setShopOpen(false)}
                              >
                                Washing
                                <span className="dropdown-link-line absolute bottom-0 left-0 h-px bg-carbon-900 w-0 transition-all duration-300 ease-out" />
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="/boutique"
                                className="relative inline-block text-sm text-carbon-700 no-underline hover:text-carbon-900 overflow-hidden pb-0.5 [&:hover_.dropdown-link-line]:w-full"
                                onClick={() => setShopOpen(false)}
                              >
                                Cleaners
                                <span className="dropdown-link-line absolute bottom-0 left-0 h-px bg-carbon-900 w-0 transition-all duration-300 ease-out" />
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="/boutique"
                                className="relative inline-block text-sm text-carbon-700 no-underline hover:text-carbon-900 overflow-hidden pb-0.5 [&:hover_.dropdown-link-line]:w-full"
                                onClick={() => setShopOpen(false)}
                              >
                                Towels
                                <span className="dropdown-link-line absolute bottom-0 left-0 h-px bg-carbon-900 w-0 transition-all duration-300 ease-out" />
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="/boutique"
                                className="relative inline-block text-sm text-carbon-700 no-underline hover:text-carbon-900 overflow-hidden pb-0.5 [&:hover_.dropdown-link-line]:w-full"
                                onClick={() => setShopOpen(false)}
                              >
                                Accessories
                                <span className="dropdown-link-line absolute bottom-0 left-0 h-px bg-carbon-900 w-0 transition-all duration-300 ease-out" />
                              </Link>
                            </li>
                          </ul>
                        </div>

                        {/* Section Image */}
                        <div className="min-w-[160px]">
                          <div className="h-24 w-20 bg-carbon-200 rounded mb-2.5 overflow-hidden">
                            <div className="w-full h-full flex items-center justify-center text-carbon-400">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                          <h4 className="font-nav font-bold text-carbon-900 text-sm mb-1.5">
                            Featured Collection
                          </h4>
                          <p className="text-sm text-carbon-600 mb-2.5">
                            Découvrez notre sélection premium de produits haut de gamme
                          </p>
                          <Link
                            to="/boutique"
                            className="inline-flex items-center gap-0.5 text-sm font-nav font-bold text-blue-600 hover:text-blue-700 underline transition-colors"
                            onClick={() => setShopOpen(false)}
                          >
                            Explore now
                            <svg className="w-4 h-4 transform -rotate-45 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div
              className="relative h-full flex items-center"
              onMouseEnter={() => setCeramicOpen(true)}
              onMouseLeave={() => setCeramicOpen(false)}
            >
              <button type="button" className={`${navLink} flex items-center gap-1 ${ceramicOpen ? '!bg-carbon-700/20 !text-white' : ''}`}>
                Ceramic coating
                <svg
                  className={`w-4 h-4 transition-transform ${ceramicOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {ceramicOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-0 animate-fade-in z-50">
                  <div className="relative bg-white shadow-2xl rounded-2xl pt-4">
                    <svg className="absolute -top-2 left-1/2 w-4 h-2 -translate-x-1/2 fill-white z-10 pointer-events-none" viewBox="0 0 16 8" preserveAspectRatio="none">
                      <path d="M 0 8 L 5 1.5 Q 8 0 11 1.5 L 16 8 Z" />
                    </svg>
                    <div className="flex gap-12 px-8 py-5 rounded-b-2xl">
                        {CERAMIC_SECTIONS.map((section) => (
                          <div key={section.title} className="min-w-[200px]">
                            <h3 className="font-nav font-bold text-carbon-900 text-sm mb-1.5">{section.title}</h3>
                            <p className="text-sm text-carbon-600 mb-10">{section.description}</p>
                            <ul className="space-y-1.5">
                              {section.links.map((item) => (
                                <li key={item.label}>
                                  <Link
                                    to={item.to}
                                    className="relative inline-block text-sm text-carbon-700 no-underline hover:text-carbon-900 overflow-hidden pb-0.5 [&:hover_.dropdown-link-line]:w-full"
                                    onClick={() => setCeramicOpen(false)}
                                  >
                                    {item.label}
                                    <span className="dropdown-link-line absolute bottom-0 left-0 h-px bg-carbon-900 w-0 transition-all duration-300 ease-out" />
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                  </div>
                </div>
              )}
            </div>

            <Link to="/event" className={navLink}>
              Event
            </Link>
            <Link to="/academy" className={navLink}>
              Academy
            </Link>

            <div
              className="relative h-full flex items-center"
              onMouseEnter={() => setCompanyOpen(true)}
              onMouseLeave={() => setCompanyOpen(false)}
            >
              <button type="button" className={`${navLink} flex items-center gap-1 ${companyOpen ? '!bg-carbon-700/20 !text-white' : ''}`}>
                Company
                <svg
                  className={`w-4 h-4 transition-transform ${companyOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {companyOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-0 animate-fade-in z-50">
                  <div className="relative bg-white shadow-2xl rounded-2xl pt-4">
                    <svg className="absolute -top-2 left-1/2 w-4 h-2 -translate-x-1/2 fill-white z-10 pointer-events-none" viewBox="0 0 16 8" preserveAspectRatio="none">
                      <path d="M 0 8 L 5 1.5 Q 8 0 11 1.5 L 16 8 Z" />
                    </svg>
                    <div className="flex gap-12 px-8 py-5 rounded-b-2xl">
                        {COMPANY_SECTIONS.map((section) => (
                          <div key={section.title} className="min-w-[200px]">
                            <h3 className="font-nav font-bold text-carbon-900 text-sm mb-1.5">{section.title}</h3>
                            <p className="text-sm text-carbon-600 mb-10">{section.description}</p>
                            <ul className="space-y-1.5">
                              {section.links.map((item) => (
                                <li key={item.label}>
                                  {'to' in item && item.to ? (
                                    <Link
                                      to={item.to}
                                      className="relative inline-block text-sm text-carbon-700 no-underline hover:text-carbon-900 overflow-hidden pb-0.5 [&:hover_.dropdown-link-line]:w-full"
                                      onClick={() => setCompanyOpen(false)}
                                    >
                                      {item.label}
                                      <span className="dropdown-link-line absolute bottom-0 left-0 h-px bg-carbon-900 w-0 transition-all duration-300 ease-out" />
                                    </Link>
                                  ) : (
                                    <a
                                      href={item.href ?? '#'}
                                      className="relative inline-block text-sm text-carbon-700 no-underline hover:text-carbon-900 overflow-hidden pb-0.5 [&:hover_.dropdown-link-line]:w-full"
                                      onClick={(e) => {
                                        if (item.href === '#') e.preventDefault()
                                        setCompanyOpen(false)
                                      }}
                                    >
                                      {item.label}
                                      <span className="dropdown-link-line absolute bottom-0 left-0 h-px bg-carbon-900 w-0 transition-all duration-300 ease-out" />
                                    </a>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right: Search, separator, lang, account, cart */}
        <div className="hidden lg:flex items-center gap-2 h-full">
          <div className="relative h-full flex items-center" ref={searchMenuRef}>
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              className="px-2 py-1.5 rounded-md text-white transition-colors hover:bg-carbon-700/30"
              aria-label="Recherche"
              aria-expanded={searchOpen}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" />
              </svg>
            </button>
            {searchOpen && (
              <div className="absolute top-full right-0 pt-0 animate-fade-in">
                <div className="relative bg-white p-4 min-w-[320px] w-[380px] rounded-2xl shadow-xl pt-6">
                  <svg className="absolute -top-2 right-6 w-4 h-2 fill-white z-10" viewBox="0 0 16 8" preserveAspectRatio="none">
                    <path d="M 0 8 L 5 1.5 Q 8 0 11 1.5 L 16 8 Z" />
                  </svg>
                  <div>
                    <input
                      type="search"
                      placeholder="Search..."
                      className="w-full py-2.5 px-3 rounded-xl bg-transparent border border-black text-carbon-950 text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-0"
                      autoFocus
                    />
                    <p className="text-carbon-500 text-xs font-nav font-bold uppercase mt-4 mb-2">
                      Popular searches
                    </p>
                    <ul className="space-y-0.5">
                      {['Ceramic coating', 'Car club', 'Events', 'Academy'].map((label) => (
                        <li key={label}>
                          <button
                            type="button"
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm font-nav font-bold text-carbon-900 rounded-2xl hover:bg-black/10 transition-colors"
                          >
                            <svg className="w-4 h-4 text-carbon-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" />
                            </svg>
                            {label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-carbon-600" aria-hidden />

          <div className="relative h-full flex items-center" ref={langMenuDesktopRef}>
            <button
              type="button"
              onClick={() => setLangOpen((open) => !open)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md text-silver/80 hover:text-white transition-colors hover:bg-carbon-700/30"
              aria-haspopup="menu"
              aria-expanded={langOpen}
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full overflow-hidden">
                {lang === 'EN' ? <FlagEN /> : <FlagFR />}
              </span>
              <span className="text-sm font-nav font-bold">{lang}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {langOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-0 animate-fade-in">
                <div className="relative bg-white p-2 min-w-[160px] rounded-2xl shadow-xl pt-5">
                  <svg className="absolute -top-2 left-1/2 w-4 h-2 -translate-x-1/2 fill-white z-10" viewBox="0 0 16 8" preserveAspectRatio="none">
                    <path d="M 0 8 L 5 1.5 Q 8 0 11 1.5 L 16 8 Z" />
                  </svg>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        i18n.changeLanguage('en')
                        setLangOpen(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-nav font-bold text-carbon-900 transition-colors rounded-2xl hover:bg-black/10"
                    >
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full overflow-hidden">
                        <FlagEN />
                      </span>
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        i18n.changeLanguage('fr')
                        setLangOpen(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-nav font-bold text-carbon-900 transition-colors rounded-2xl hover:bg-black/10"
                    >
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full overflow-hidden">
                        <FlagFR />
                      </span>
                      Français
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/account"
              onClick={handleAccountClick}
              className="px-2 py-1.5 rounded-md text-white transition-colors hover:bg-carbon-700/30"
              aria-label="My account"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>

            <Link
              to="/panier"
              className="relative px-2 py-1.5 rounded-md text-white transition-colors hover:bg-carbon-700/30"
              aria-label="Panier"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-chrome text-carbon-950 text-[10px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile: logo + cart + menu */}
        <div className="flex lg:hidden items-center gap-3">
          <Link to="/panier" className="relative p-2 text-white">
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-chrome text-carbon-950 text-[10px] font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
          </Link>
          <label className="fb-burger" aria-label="Menu">
            <input
              type="checkbox"
              checked={menuOpen}
              onChange={() => setMenuOpen(!menuOpen)}
              aria-hidden="true"
            />
            <span />
            <span />
            <span />
          </label>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="lg:hidden fixed inset-x-0 top-20 bottom-0 border-t border-carbon-800 px-6 py-4 animate-fade-in z-[60] overflow-x-hidden"
          style={{ backgroundColor: solidNavColor }}
        >
          <div className="h-full flex flex-col">
            <nav className="-mx-6 space-y-0 pb-4 flex-1 overflow-y-auto overflow-x-hidden">
              <Link
                to="/car-club"
                className="flex w-[96%] mx-auto items-center justify-between py-3 px-2 font-nav font-bold text-white border-b border-white/[0.06]"
                onClick={() => setMenuOpen(false)}
              >
                <span>Car club</span>
              </Link>

            {/* Shop + catégories (dropdown mobile) */}
            <div className={`border-b border-white/[0.06] ${mobileShopOpen ? 'bg-white/[0.03]' : ''}`}>
              <button
                type="button"
                className="flex w-[96%] mx-auto items-center justify-between py-3 px-2 font-nav font-bold text-white"
                onClick={() => setMobileShopOpen((open) => !open)}
              >
                <span>Shop</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform mr-1 ${mobileShopOpen ? '-rotate-180' : ''}`}
                >
                  <path d="m19 12-7 7-7-7" />
                </svg>
              </button>
              {mobileShopOpen && (
                <div className="pl-10 pb-2 space-y-1 animate-fade-in">
                  <Link
                    to="/boutique"
                    className="block py-1 font-nav text-silver hover:text-chrome"
                    onClick={() => setMenuOpen(false)}
                  >
                    Tous les produits
                  </Link>
                  {CATEGORIES.map((c) => (
                    <Link
                      key={c.id}
                      to={`/boutique/${c.id}`}
                      className="block py-1 font-nav text-silver hover:text-chrome"
                      onClick={() => setMenuOpen(false)}
                    >
                      {c.name}
                    </Link>
                  ))}
                  <Link
                    to="/boutique/revetements"
                    className="block py-1 font-nav text-silver hover:text-chrome"
                    onClick={() => setMenuOpen(false)}
                  >
                    Ceramic coating
                  </Link>
                </div>
              )}
            </div>

            <Link
              to="/event"
              className="flex w-[96%] mx-auto items-center justify-between py-3 px-2 font-nav font-bold text-white border-b border-white/[0.06]"
              onClick={() => setMenuOpen(false)}
            >
              <span>Event</span>
            </Link>
            <Link
              to="/academy"
              className="flex w-[96%] mx-auto items-center justify-between py-3 px-2 font-nav font-bold text-white border-b border-white/[0.06]"
              onClick={() => setMenuOpen(false)}
            >
              <span>Academy</span>
            </Link>

            {/* Company (dropdown mobile) */}
            <div className={`border-b border-white/[0.06] ${mobileCompanyOpen ? 'bg-white/[0.03]' : ''}`}>
              <button
                type="button"
                className="flex w-[96%] mx-auto items-center justify-between py-3 px-2 font-nav font-bold text-white"
                onClick={() => setMobileCompanyOpen((open) => !open)}
              >
                <span>Company</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform mr-1 ${mobileCompanyOpen ? '-rotate-180' : ''}`}
                >
                  <path d="m19 12-7 7-7-7" />
                </svg>
              </button>
              {mobileCompanyOpen && (
                <div className="pl-4 pb-1 space-y-4 animate-fade-in">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-silver/60">
                      Company
                    </p>
                    <div className="mt-1 space-y-1.5 pl-3">
                      <Link
                        to="/join-fireball"
                        className="flex items-center gap-2 py-1.5 font-nav text-silver hover:text-chrome"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M10 12h4" />
                            <path d="M10 8h4" />
                            <path d="M14 21v-3a2 2 0 0 0-4 0v3" />
                            <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
                            <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
                          </svg>
                        </span>
                        <span>Open FIREBALL Center</span>
                      </Link>
                      <Link
                        to="/boutique"
                        className="flex items-center gap-2 py-1.5 font-nav text-silver hover:text-chrome"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
                          </svg>
                        </span>
                        <span>Merch</span>
                      </Link>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 py-1.5 font-nav text-silver hover:text-chrome"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="8" r="6" />
                            <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" />
                          </svg>
                        </span>
                        <span>Awards</span>
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 py-1.5 font-nav text-silver hover:text-chrome"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <path d="M16 3.128a4 4 0 0 1 0 7.744" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <circle cx="9" cy="7" r="4" />
                          </svg>
                        </span>
                        <span>About us</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] space-y-1.5">
                    <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-silver/60">
                      Connect
                    </p>
                    <div className="mt-1 space-y-1.5 pl-3">
                      <Link
                        to="/contact"
                        className="flex items-center gap-2 py-1.5 font-nav text-silver hover:text-chrome"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12.5" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                            <path d="M18 15.28c.2-.4.5-.8.9-1a2.1 2.1 0 0 1 2.6.4c.3.4.5.8.5 1.3 0 1.3-2 2-2 2" />
                            <path d="M20 22v.01" />
                          </svg>
                        </span>
                        <span>Contact us</span>
                      </Link>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 py-1.5 font-nav text-silver hover:text-chrome"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                            <circle cx="12" cy="13" r="2" />
                            <path d="M12 15v5" />
                          </svg>
                        </span>
                        <span>Press kit</span>
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 py-1.5 font-nav text-silver hover:text-chrome"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m14 13-8.381 8.38a1 1 0 0 1-3.001-3l8.384-8.381" />
                            <path d="m16 16 6-6" />
                            <path d="m21.5 10.5-8-8" />
                            <path d="m8 8 6-6" />
                            <path d="m8.5 7.5 8 8" />
                          </svg>
                        </span>
                        <span>Legal</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

              {/* Search */}
              <div className="mt-4">
                <button
                  type="button"
                  className="flex w-[96%] mx-auto items-center gap-2 py-3 px-2 text-sm font-nav font-bold text-white"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <path d="m21 21-4.34-4.34" />
                    <circle cx="11" cy="11" r="8" />
                  </svg>
                  <span>Search</span>
                </button>
              </div>

              {/* Langue */}
              <div className="mt-4 pt-1 relative" ref={langMenuMobileRef}>
                <button
                  type="button"
                  onClick={() => setLangOpen((open) => !open)}
                  className="flex w-[96%] mx-auto items-center gap-2 py-3 px-2 text-sm font-nav font-bold text-white"
                  aria-haspopup="menu"
                  aria-expanded={langOpen}
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full overflow-hidden">
                      {lang === 'EN' ? <FlagEN /> : <FlagFR />}
                    </span>
                    <span>{lang === 'EN' ? 'English' : 'Français'}</span>
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${langOpen ? '-rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 12-7 7-7-7" />
                  </svg>
                </button>
                {langOpen && (
                  <div className="absolute left-0 right-0 top-full mt-0 rounded-b-lg bg-inherit shadow-none animate-fade-in">
                    {lang === 'EN' ? (
                      <button
                        type="button"
                        onClick={() => {
                          i18n.changeLanguage('fr')
                          setLangOpen(false)
                        }}
                        className="flex w-[96%] mx-auto items-center gap-2 py-2 px-2 text-sm font-nav font-bold text-silver hover:text-white"
                      >
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full overflow-hidden">
                          <FlagFR />
                        </span>
                        Français
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          i18n.changeLanguage('en')
                          setLangOpen(false)
                        }}
                        className="flex w-[96%] mx-auto items-center gap-2 py-2 px-2 text-sm font-nav font-bold text-silver hover:text-white"
                      >
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full overflow-hidden">
                          <FlagEN />
                        </span>
                        English
                      </button>
                    )}
                  </div>
                )}
              </div>

            </nav>

            {/* Boutons d'action (tout en bas, hors zone scrollable) */}
            <div className="shrink-0 -mx-6 px-6 pt-3 pb-3 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  navigate('/account')
                }}
                className="w-[95vw] max-w-[520px] py-3 rounded-xl text-sm font-nav font-bold uppercase tracking-[0.14em] text-white bg-[#B61B1B] shadow-[0_14px_30px_rgba(0,0,0,0.55)] hover:bg-[#b61b1bcc] transition-colors"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  navigate('/join-fireball')
                }}
                className="w-[95vw] max-w-[520px] py-3 rounded-xl text-sm font-nav font-bold uppercase tracking-[0.14em] text-white border border-white/[0.16] bg-transparent hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors"
              >
                Join Fireball
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
