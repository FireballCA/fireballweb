import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { isAuthenticated } from '@/utils/supabaseAuth'
import { IOSCheckbox } from '@/components/IOSCheckbox'

function FlagEN() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
      <defs>
        <clipPath id="flag-en-circle-auth">
          <circle cx="10" cy="10" r="10" />
        </clipPath>
      </defs>
      <g clipPath="url(#flag-en-circle-auth)">
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
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
      <defs>
        <clipPath id="flag-fr-circle-auth">
          <circle cx="10" cy="10" r="10" />
        </clipPath>
      </defs>
      <g clipPath="url(#flag-fr-circle-auth)">
        <rect width="6.67" height="20" fill="#002395" />
        <rect width="6.67" height="20" x="6.67" fill="#fff" />
        <rect width="6.67" height="20" x="13.33" fill="#ED2939" />
      </g>
    </svg>
  )
}

export function Account() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberDevice, setRememberDevice] = useState(false)
  const [lang, setLang] = useState<'EN' | 'FR'>('EN')

  const returnToParam = new URLSearchParams(location.search).get('returnTo')
  const returnToPath = returnToParam === '/account/company' ? returnToParam : null

  useEffect(() => {
    document.title = 'Account | Fireball Canada'
    
    // Vérifier si l'utilisateur est déjà connecté
    const checkAuth = async () => {
      const authenticated = await isAuthenticated()
      if (authenticated) {
        navigate(returnToPath ?? '/account/dashboard', { replace: true })
      }
    }
    checkAuth()
  }, [navigate, returnToPath])

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (error) {
        setErrorMessage(error.message || 'Invalid email or password.')
        setLoading(false)
        return
      }

      if (data.user) {
        navigate(returnToPath ?? '/account/dashboard', { replace: true })
      }
    } catch (error) {
      console.error('Login error:', error)
      setErrorMessage('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-black flex items-center justify-center px-6 py-16">
      {/* Background */}
      <div className="absolute inset-0 bg-black" />
      <div className="absolute -top-40 -right-32 w-80 h-80 bg-red-500/18 blur-3xl rounded-full opacity-70 pointer-events-none" />
      <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-white/8 blur-3xl rounded-full opacity-60 pointer-events-none" />

      {/* Top bar: logo left, language right */}
      <div className="absolute top-6 left-6 z-30">
        <Link to="/" className="inline-flex items-center gap-2">
          <img
            src="/LogoFull.avif"
            alt="Fireball"
            className="h-7 w-auto object-contain opacity-95"
            draggable={false}
          />
        </Link>
      </div>
      <div className="absolute top-6 right-6 z-30">
        <div className="relative">
          <button
            type="button"
            onClick={() => setLang((prev) => (prev === 'EN' ? 'FR' : 'EN'))}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-black/40 text-xs font-nav font-bold uppercase tracking-[0.16em] text-white/80 hover:text-white hover:bg-white/[0.08] transition-colors backdrop-blur-md"
          >
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full overflow-hidden">
              {lang === 'EN' ? <FlagEN /> : <FlagFR />}
            </span>
            <span>{lang}</span>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 9l-7 7-7-7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col bg-black rounded-xl border border-white/10 shadow-[0_22px_55px_rgba(0,0,0,0.7)] overflow-hidden">
          {/* Form */}
          <div className="w-full bg-black px-6 sm:px-10 py-8 sm:py-10 flex items-center">
            <div className="w-full max-w-md mx-auto">
              <div className="mb-7">
                <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-1">
                  Sign in to your Fireball account
                </h1>
                <p className="text-sm text-white/60">
                  Enter your credentials to access your account.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleLoginSubmit}>
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-white/70 text-xs mb-2 font-medium">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all bg-[#121212] border border-[#1a1a1a] focus:bg-[#1a1a1a] focus:border-[#444]"
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Password with eye icon (press & hold) */}
                <div>
                  <label htmlFor="password" className="block text-white/70 text-xs mb-2 font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all bg-[#121212] border border-[#1a1a1a] focus:bg-[#1a1a1a] focus:border-[#444]"
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                    />
                    <svg
                      className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                      viewBox="0 0 24 24"
                      width="20"
                      fill="none"
                      stroke="#666"
                      strokeWidth="2"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        const input = (e.currentTarget.previousSibling as HTMLInputElement | null)
                        if (input) input.type = 'text'
                        e.currentTarget.style.stroke = '#fff'
                        e.currentTarget.setAttribute('data-eye', 'open')
                      }}
                      onMouseUp={(e) => {
                        const input = (e.currentTarget.previousSibling as HTMLInputElement | null)
                        if (input) input.type = 'password'
                        e.currentTarget.style.stroke = '#666'
                        e.currentTarget.removeAttribute('data-eye')
                      }}
                      onMouseLeave={(e) => {
                        if (e.currentTarget.getAttribute('data-eye')) {
                          const input = (e.currentTarget.previousSibling as HTMLInputElement | null)
                          if (input) input.type = 'password'
                          e.currentTarget.style.stroke = '#666'
                          e.currentTarget.removeAttribute('data-eye')
                        }
                      }}
                      onTouchStart={(e) => {
                        const input = (e.currentTarget.previousSibling as HTMLInputElement | null)
                        if (input) input.type = 'text'
                        e.currentTarget.style.stroke = '#fff'
                        e.currentTarget.setAttribute('data-eye', 'open')
                      }}
                      onTouchEnd={(e) => {
                        const input = (e.currentTarget.previousSibling as HTMLInputElement | null)
                        if (input) input.type = 'password'
                        e.currentTarget.style.stroke = '#666'
                        e.currentTarget.removeAttribute('data-eye')
                      }}
                    >
                      <path
                        d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
                      />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                </div>

                {/* Remember me */}
                <div className="inline-flex items-center gap-2.5 text-sm text-white/70 select-none cursor-pointer">
                  <IOSCheckbox
                    id="account-remember-device"
                    checked={rememberDevice}
                    onChange={setRememberDevice}
                    color="red"
                    sizeEm={0.88}
                  />
                  <span>Remember this device</span>
                </div>

                {/* Error message */}
                {errorMessage && (
                  <div className="rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {errorMessage}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black border-none py-4 rounded-lg font-semibold text-sm cursor-pointer transition-colors hover:bg-[#e5e5e5] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>

                {/* Register link */}
                <p className="text-center text-sm text-white/60 mt-5">
                  New here?{' '}
                  <Link
                    to={returnToPath ? `/account/register?returnTo=${encodeURIComponent(returnToPath)}` : '/account/register'}
                    className="inline-flex items-center gap-1 text-sm font-medium text-white hover:text-white/80 underline transition-colors"
                  >
                    Create an account
                    <svg className="w-4 h-4 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Global help link at bottom of page */}
      <div className="absolute inset-x-0 bottom-6 z-10 text-center text-sm">
        <span className="text-white/45">Need help? </span>
        <a
          href="mailto:contact@fireball.fr"
          className="text-white hover:text-white/80 underline"
        >
          Contact Us
        </a>
      </div>
    </section>
  )
}
