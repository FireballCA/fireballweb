import { Link } from 'react-router-dom'

const linkClass =
  'relative inline-block text-sm text-carbon-500 no-underline hover:text-carbon-900 overflow-hidden pb-0.5 [&:hover_.fl]:w-full font-sans transition-colors duration-200'

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} className={linkClass}>
        {children}
        <span className="fl absolute bottom-0 left-0 h-px bg-carbon-900 w-0 transition-all duration-300 ease-out" />
      </Link>
    </li>
  )
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative z-10 bg-white border-t border-carbon-200">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">

        {/* Top: Logo + Social Icons */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center h-8 w-auto select-none">
            <img
              src="/Assets/BrandKIT/Full Logo/Full Logo/Black/RBG (For Digital)/Logo_Black.svg"
              alt="Fireball"
              className="h-6 w-auto object-contain pointer-events-none"
              draggable={false}
            />
          </Link>
          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/fireballcanada.official/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-carbon-400 hover:text-carbon-900 transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href="https://www.facebook.com/FireballCarCareCanada"
              target="_blank"
              rel="noopener noreferrer"
              className="text-carbon-400 hover:text-carbon-900 transition-colors"
              aria-label="Facebook"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-carbon-200 mb-8" />

        {/* Four Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-12">
          <div>
            <h3 className="text-xs font-nav font-bold text-carbon-900 uppercase mb-4 tracking-wider">
              Products
            </h3>
            <ul className="space-y-3">
              <FooterLink to="/coatings">Coatings</FooterLink>
              <FooterLink to="/sealants">Sealants</FooterLink>
              <FooterLink to="/waxes">Waxes</FooterLink>
              <FooterLink to="/dressings">Dressings</FooterLink>
              <FooterLink to="/washing">Washing</FooterLink>
              <FooterLink to="/cleaners">Cleaners</FooterLink>
              <FooterLink to="/towels">Towels</FooterLink>
              <FooterLink to="/accessories">Accessories</FooterLink>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-nav font-bold text-carbon-900 uppercase mb-4 tracking-wider">
              Fireball
            </h3>
            <ul className="space-y-3">
              <FooterLink to="/find-installer">Find installer</FooterLink>
              <FooterLink to="/all-coatings">All coatings</FooterLink>
              <FooterLink to="/academy">Academy</FooterLink>
              <FooterLink to="/event">Events</FooterLink>
              <FooterLink to="/join-fireball">Join Fireball</FooterLink>
              <FooterLink to="/service-builder">Service Builder</FooterLink>
              <FooterLink to="/patch-notes">Patch Notes</FooterLink>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-nav font-bold text-carbon-900 uppercase mb-4 tracking-wider">
              Company
            </h3>
            <ul className="space-y-3">
              <FooterLink to="/about">About</FooterLink>
              <FooterLink to="/press-kit">Press Kit</FooterLink>
              <FooterLink to="/contact">Contact</FooterLink>
              <FooterLink to="/apparel">Merch</FooterLink>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-nav font-bold text-carbon-900 uppercase mb-4 tracking-wider">
              Legal
            </h3>
            <ul className="space-y-3">
              <FooterLink to="/legal">Legal</FooterLink>
              <FooterLink to="/legal">Cookies</FooterLink>
              <FooterLink to="/legal">Privacy Policy</FooterLink>
              <FooterLink to="/legal">Terms of services</FooterLink>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-carbon-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-carbon-600 font-sans">
              © {currentYear} Fireball Canada. All rights reserved.
            </p>

            {/* Elevate Agency credit */}
            <img
              src="/Assets/ElevateAgency.png"
              alt="Elevate Agency"
              className="h-7 w-auto object-contain"
              draggable={false}
            />

            <p className="text-xs text-carbon-600 font-sans italic">
              Beyond Your Imagination
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
