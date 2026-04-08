import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="relative overflow-hidden bg-carbon-950 min-h-screen flex items-center justify-center px-6">
      <div
        className="pointer-events-none absolute inset-x-0 -top-[0.04em] select-none font-nav font-bold leading-none text-white/[0.025] text-center tracking-[-0.02em]"
        aria-hidden
        style={{ fontSize: '55vw' }}
      >
        <span className="inline-block w-screen">404</span>
      </div>
      <div className="relative z-10 w-full max-w-xl text-center">
        <img
          src="/LogoFull.avif"
          alt="Fireball"
          className="mx-auto h-8 w-auto object-contain invert brightness-0 mb-8"
          draggable={false}
        />
        <h1 className="text-3xl sm:text-4xl font-semibold text-white mb-3">
          Sorry, this page was not found
        </h1>
        <p className="text-white/70 mb-8">
          The page you requested does not exist or has been moved.
        </p>
        <div className="flex flex-col items-center justify-center gap-3">
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-apex hover:text-[#ff5a75] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              className="h-4 w-4"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16v12H4z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 6 8-6" />
            </svg>
            Need help? Contact our team
          </Link>
          <Link
            to="/"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white transition-colors duration-500"
          >
            <span
              className="pointer-events-none absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              aria-hidden
            />
            <span className="relative z-10 transition-colors duration-500 group-hover:text-black">
              Return home
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}

