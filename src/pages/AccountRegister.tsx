import { useId, useRef, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginAccount, registerAccount, setWelcomeMessage } from '@/utils/accountAuth'

function FlagEN() {
  const clipId = useId()
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
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
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
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

export function AccountRegister() {
  const navigate = useNavigate()
  const [langOpen, setLangOpen] = useState(false)
  const [lang, setLang] = useState<'EN' | 'FR'>('EN')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const langMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!langOpen) return
      const target = event.target as Node
      if (langMenuRef.current && !langMenuRef.current.contains(target)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [langOpen])

  const handleRegisterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = registerAccount({ fullName, email, password })
    if (!result.ok) {
      setErrorMessage('An account with this email already exists.')
      return
    }

    loginAccount({ email, password })
    setWelcomeMessage(result.account.fullName)
    navigate('/account/dashboard')
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-carbon-950">
      <div className="fixed top-5 left-5 z-30">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-carbon-700 text-silver hover:text-white hover:border-carbon-500 transition-colors"
          aria-label="Go back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="fixed top-5 right-5 z-30" ref={langMenuRef}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setLangOpen((open) => !open)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-nav font-bold text-silver hover:text-white transition-colors bg-white/[0.06] border border-white/15 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]"
            aria-expanded={langOpen}
          >
            {lang === 'EN' ? <FlagEN /> : <FlagFR />}
            {lang}
            <svg className={`w-3.5 h-3.5 transition-transform ${langOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {langOpen && (
            <div className="absolute top-full right-0 mt-2 w-36 rounded-2xl border border-white/20 bg-white/[0.08] backdrop-blur-2xl shadow-[0_18px_40px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.24)] p-1.5">
              <button
                type="button"
                onClick={() => {
                  setLang('EN')
                  setLangOpen(false)
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-nav font-bold text-silver hover:bg-white/10 hover:text-white transition-colors inline-flex items-center gap-2"
              >
                <FlagEN />
                English
              </button>
              <button
                type="button"
                onClick={() => {
                  setLang('FR')
                  setLangOpen(false)
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-nav font-bold text-silver hover:bg-white/10 hover:text-white transition-colors inline-flex items-center gap-2"
              >
                <FlagFR />
                Francais
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6 py-16 mt-10">
        <section className="rounded-3xl border border-carbon-700 bg-carbon-900/75 backdrop-blur-sm p-8 md:p-10 shadow-2xl">
          <div className="flex justify-center mb-4">
            <img
              src="/LogoFull.avif"
              alt="Fireball"
              className="h-6 w-auto object-contain opacity-90"
              style={{ filter: 'grayscale(1) brightness(5) saturate(0)' }}
              draggable={false}
            />
          </div>

          <h1 className="font-nav font-bold text-4xl text-pearl uppercase mb-8 text-center">
            Welcome to the Fireball World
          </h1>

          <form className="space-y-5" onSubmit={handleRegisterSubmit}>
            <div>
              <label htmlFor="fullName" className="block text-xs font-nav font-bold uppercase text-silver mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-carbon-950 border border-white/60 rounded-xl text-pearl focus:outline-none focus:border-white transition-colors"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-nav font-bold uppercase text-silver mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-carbon-950 border border-white/60 rounded-xl text-pearl focus:outline-none focus:border-white transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-nav font-bold uppercase text-silver mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-carbon-950 border border-white/60 rounded-xl text-pearl focus:outline-none focus:border-white transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <label className="inline-flex items-center gap-2.5 text-sm text-silver/80 select-none cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded border-carbon-500 bg-carbon-950 text-chrome focus:ring-0" />
              Remember this device
            </label>

            <button
              type="submit"
              className="w-full py-3 bg-white text-carbon-950 font-nav font-bold uppercase text-sm rounded-xl hover:bg-white/95 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-8px_14px_rgba(0,0,0,0.08),0_10px_24px_rgba(0,0,0,0.22)]"
            >
              Create Account →
            </button>

            {errorMessage && <p className="text-center text-sm text-[#E23854]">{errorMessage}</p>}

            <p className="text-center text-sm text-silver/60">
              Already registered?{' '}
              <Link to="/account" className="inline-flex items-center gap-0.5 text-sm font-nav font-bold text-blue-600 hover:text-blue-700 underline transition-colors">
                Access Portal
                <svg className="w-4 h-4 transform -rotate-45 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </p>
          </form>
        </section>
      </div>
    </section>
  )
}
