import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import { CATEGORIES } from '@/data/products'

const SHOP_DROPDOWN = [
  ...CATEGORIES.map((c) => ({ label: c.name, to: `/boutique/${c.id}` })),
  { label: 'Tous les produits', to: '/boutique' },
]

const CERAMIC_DROPDOWN = [
  { label: 'Carrosserie', to: '/boutique/revetements' },
  { label: 'Jantes', to: '/boutique/revetements' },
  { label: 'Vitres', to: '/boutique/revetements' },
]

function FlagEN() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none" className="flex-shrink-0">
      <rect width="20" height="14" fill="#012169" />
      <path d="M0 0L20 14M20 0L0 14" stroke="white" strokeWidth="2.5" />
      <path d="M0 0L20 14M20 0L0 14" stroke="#C8102E" strokeWidth="1.5" />
      <path d="M10 0v14M0 7h20" stroke="white" strokeWidth="4" />
      <path d="M10 0v14M0 7h20" stroke="#C8102E" strokeWidth="2.5" />
    </svg>
  )
}

function FlagFR() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none" className="flex-shrink-0">
      <rect width="6.67" height="14" fill="#002395" />
      <rect width="6.67" height="14" x="6.67" fill="#fff" />
      <rect width="6.67" height="14" x="13.33" fill="#ED2939" />
    </svg>
  )
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const [ceramicOpen, setCeramicOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [lang, setLang] = useState<'EN' | 'FR'>('FR')
  const [searchOpen, setSearchOpen] = useState(false)
  const { totalItems } = useCart()
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (path: string) => location.pathname === path

  const navBg = scrolled
    ? 'bg-carbon-950/95 backdrop-blur-md border-b border-carbon-700/50'
    : 'bg-transparent border-b border-transparent'

  const navLink =
    'font-nav font-bold text-white hover:text-chrome transition-colors text-sm uppercase tracking-wide'

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
        {/* Left: Logo + links */}
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center h-12 w-auto">
            <img
              src="/LogoFull.avif"
              alt="Fireball"
              className="h-10 w-auto object-contain"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/car-club" className={navLink}>
              Car club
            </Link>

            <div
              className="relative"
              onMouseEnter={() => setShopOpen(true)}
              onMouseLeave={() => setShopOpen(false)}
            >
              <button type="button" className={`${navLink} flex items-center gap-1`}>
                Shop
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {shopOpen && (
                <div className="absolute top-full left-0 pt-3 animate-fade-in">
                  <div className="bg-carbon-800 border border-carbon-600 py-3 min-w-[200px] shadow-xl">
                    {SHOP_DROPDOWN.map((item) => (
                      <Link
                        key={item.to + item.label}
                        to={item.to}
                        className="block px-5 py-2 text-sm font-nav font-bold text-white hover:bg-carbon-700 hover:text-chrome"
                        onClick={() => setShopOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div
              className="relative"
              onMouseEnter={() => setCeramicOpen(true)}
              onMouseLeave={() => setCeramicOpen(false)}
            >
              <button type="button" className={`${navLink} flex items-center gap-1`}>
                Ceramic coating
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {ceramicOpen && (
                <div className="absolute top-full left-0 pt-3 animate-fade-in">
                  <div className="bg-carbon-800 border border-carbon-600 py-3 min-w-[200px] shadow-xl">
                    {CERAMIC_DROPDOWN.map((item) => (
                      <Link
                        key={item.to + item.label}
                        to={item.to}
                        className="block px-5 py-2 text-sm font-nav font-bold text-white hover:bg-carbon-700 hover:text-chrome"
                        onClick={() => setCeramicOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
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
          </nav>
        </div>

        {/* Right: Search, separator, lang, account, cart */}
        <div className="hidden lg:flex items-center gap-5">
          <div className="relative">
            <input
              type="search"
              placeholder="Rechercher..."
              className="w-40 py-2 px-3 bg-carbon-800/80 border border-carbon-600 text-white text-sm placeholder:text-silver/50 focus:outline-none focus:border-chrome transition-colors"
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setSearchOpen(false)}
            />
          </div>

          <div className="w-px h-6 bg-carbon-600" aria-hidden />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLang('EN')}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded transition-colors ${
                lang === 'EN' ? 'bg-carbon-700 text-white' : 'text-silver/80 hover:text-white'
              }`}
              title="English"
            >
              <FlagEN />
              <span className="text-sm font-nav font-bold">EN</span>
            </button>
            <button
              type="button"
              onClick={() => setLang('FR')}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded transition-colors ${
                lang === 'FR' ? 'bg-carbon-700 text-white' : 'text-silver/80 hover:text-white'
              }`}
              title="Français"
            >
              <FlagFR />
              <span className="text-sm font-nav font-bold">FR</span>
            </button>
          </div>

          <Link
            to="/compte"
            className="p-2 text-white hover:text-chrome transition-colors"
            aria-label="Mon compte"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>

          <Link
            to="/panier"
            className="relative p-2 text-white hover:text-chrome transition-colors"
            aria-label="Panier"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-chrome text-carbon-950 text-[10px] font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile: logo + cart + menu */}
        <div className="flex lg:hidden items-center gap-3">
          <Link to="/panier" className="relative p-2 text-white">
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-chrome text-carbon-950 text-[10px] font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-white"
            aria-label="Menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-carbon-700 bg-carbon-950/98 backdrop-blur-md py-4 px-6 animate-fade-in">
          <Link to="/car-club" className="block py-2 font-nav font-bold text-white" onClick={() => setMenuOpen(false)}>
            Car club
          </Link>
          <Link to="/boutique" className="block py-2 font-nav font-bold text-white" onClick={() => setMenuOpen(false)}>
            Shop
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              to={`/boutique/${c.id}`}
              className="block py-2 pl-4 font-nav text-silver hover:text-chrome"
              onClick={() => setMenuOpen(false)}
            >
              {c.name}
            </Link>
          ))}
          <Link to="/boutique/revetements" className="block py-2 font-nav font-bold text-white" onClick={() => setMenuOpen(false)}>
            Ceramic coating
          </Link>
          <Link to="/event" className="block py-2 font-nav font-bold text-white" onClick={() => setMenuOpen(false)}>
            Event
          </Link>
          <Link to="/academy" className="block py-2 font-nav font-bold text-white" onClick={() => setMenuOpen(false)}>
            Academy
          </Link>
          <div className="flex gap-2 mt-4 pt-4 border-t border-carbon-700">
            <button type="button" onClick={() => setLang('EN')} className="flex items-center gap-1 text-sm font-nav font-bold text-white">
              <FlagEN /> EN
            </button>
            <button type="button" onClick={() => setLang('FR')} className="flex items-center gap-1 text-sm font-nav font-bold text-white">
              <FlagFR /> FR
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
