import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import { CATEGORIES } from '@/data/products'

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const { totalItems } = useCart()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-carbon-950/90 backdrop-blur-md border-b border-carbon-700/50">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
        <Link to="/" className="font-display text-2xl tracking-luxury text-pearl hover:text-chrome transition-colors">
          FIREBALL
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          <div
            className="relative"
            onMouseEnter={() => setShopOpen(true)}
            onMouseLeave={() => setShopOpen(false)}
          >
            <Link
              to="/boutique"
              className={`text-sm tracking-wide uppercase ${isActive('/boutique') || shopOpen ? 'text-chrome' : 'text-silver/80 hover:text-pearl'}`}
            >
              Boutique
            </Link>
            {shopOpen && (
              <div className="absolute top-full left-0 pt-4 animate-fade-in">
                <div className="bg-carbon-800 border border-carbon-600 rounded-sm py-4 min-w-[220px] shadow-2xl">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/boutique/${cat.id}`}
                      className="block px-6 py-2 text-sm text-silver hover:bg-carbon-700 hover:text-chrome transition-colors"
                      onClick={() => setShopOpen(false)}
                    >
                      {cat.name}
                    </Link>
                  ))}
                  <Link
                    to="/boutique"
                    className="block px-6 py-2 text-sm text-chrome border-t border-carbon-600 mt-2 pt-2"
                    onClick={() => setShopOpen(false)}
                  >
                    Tous les produits
                  </Link>
                </div>
              </div>
            )}
          </div>
          <Link
            to="/"
            className={`text-sm tracking-wide uppercase ${isActive('/') ? 'text-chrome' : 'text-silver/80 hover:text-pearl'}`}
          >
            Accueil
          </Link>
          <Link
            to="/panier"
            className="relative text-sm tracking-wide uppercase text-silver/80 hover:text-pearl flex items-center gap-2"
          >
            Panier
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-chrome text-carbon-950 text-xs font-semibold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </nav>

        <div className="flex items-center gap-4 md:hidden">
          <Link to="/panier" className="relative p-2 text-pearl">
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-chrome text-carbon-950 text-[10px] font-semibold flex items-center justify-center">
                {totalItems}
              </span>
            )}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-pearl"
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

      {menuOpen && (
        <div className="md:hidden border-t border-carbon-700 bg-carbon-900 py-4 px-6 animate-fade-in">
          <Link to="/" className="block py-2 text-silver hover:text-chrome" onClick={() => setMenuOpen(false)}>
            Accueil
          </Link>
          <Link to="/boutique" className="block py-2 text-silver hover:text-chrome" onClick={() => setMenuOpen(false)}>
            Boutique
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              to={`/boutique/${c.id}`}
              className="block py-2 pl-4 text-silver/80 hover:text-chrome"
              onClick={() => setMenuOpen(false)}
            >
              {c.name}
            </Link>
          ))}
          <Link to="/panier" className="block py-2 text-silver hover:text-chrome" onClick={() => setMenuOpen(false)}>
            Panier
          </Link>
        </div>
      )}
    </header>
  )
}
