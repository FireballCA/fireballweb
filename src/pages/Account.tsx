import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { isAuthenticated } from '@/utils/supabaseAuth'
import { IOSCheckbox } from '@/components/IOSCheckbox'

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
    <section className="relative min-h-screen overflow-hidden bg-[#0B0B0B] flex items-center justify-center px-6 py-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B0B0B] via-[#1a1a1a] to-[#0B0B0B]" />

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
        <button
          type="button"
          onClick={() => setLang((prev) => (prev === 'EN' ? 'FR' : 'EN'))}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-black/40 text-xs font-nav font-bold uppercase tracking-[0.16em] text-white/80 hover:text-white hover:bg-white/[0.08] transition-colors backdrop-blur-md"
        >
          <span>{lang}</span>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M19 9l-7 7-7-7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        <div className="flex flex-col md:flex-row bg-black/80 rounded-3xl border border-white/12 shadow-[0_22px_55px_rgba(0,0,0,0.7)] overflow-hidden">
          {/* Left panel (visual) */}
          <div className="hidden md:flex md:w-1/2 relative items-center justify-center bg-gradient-to-br from-black via-[#111] to-black">
            <div className="absolute inset-0 opacity-[0.18] pointer-events-none" />
            <div className="relative px-10 py-12">
              <p className="text-xs font-nav font-bold uppercase tracking-[0.28em] text-white/40 mb-4">
                FIREBALL ACCESS
              </p>
              <h2 className="text-3xl lg:text-[34px] leading-tight font-semibold text-white mb-4">
                Sign in to
                <br />
                your Fireball account.
              </h2>
              <p className="text-[13px] text-white/60 max-w-sm">
                Access your dashboard, XP, orders and membership in one place.
              </p>
            </div>
          </div>

          {/* Right panel: form */}
          <div className="w-full md:w-1/2 bg-black px-6 sm:px-10 py-8 sm:py-10 flex items-center">
            <div className="w-full max-w-md mx-auto">
              <div className="mb-7">
                <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-1">
                  Sign in
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

                {/* Password */}
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
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
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
                    className="text-white hover:text-white/80 underline"
                  >
                    Create an account
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
