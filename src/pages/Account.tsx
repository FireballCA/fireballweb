import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { setRememberDevice, supabase } from '@/lib/supabase'
import { getSafeReturnToPath } from '@/utils/safeReturnTo'
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
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | null>(null)
  const [rememberDevice, setRememberDevice] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const lang = i18n.language === 'fr' ? 'FR' : 'EN'

  const returnToParam = new URLSearchParams(location.search).get('returnTo')
  const returnToPath = getSafeReturnToPath(returnToParam)

  useEffect(() => {
    document.title = 'Account - Fireball Canada'

    const previousBodyOverflow = document.body.style.overflow
    const previousBodyHeight = document.body.style.height
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousHtmlHeight = document.documentElement.style.height

    document.body.style.overflow = 'hidden'
    document.body.style.height = '100dvh'
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.height = '100dvh'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.body.style.height = previousBodyHeight
      document.documentElement.style.overflow = previousHtmlOverflow
      document.documentElement.style.height = previousHtmlHeight
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      if (!session) return
      // Évite un navigate() à chaque TOKEN_REFRESHED (sinon re-render / historique inutiles).
      if (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN') return
      navigate(returnToPath ?? '/account/dashboard', { replace: true })
    })
    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [returnToPath, navigate])

  const getRedirectTo = () => {
    const base = `${window.location.origin}/account`
    return returnToPath ? `${base}?returnTo=${encodeURIComponent(returnToPath)}` : base
  }

  const handleOAuthSignIn = async (provider: 'google') => {
    setErrorMessage('')
    setOauthLoading(provider)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: getRedirectTo() },
      })
      if (error) {
        setErrorMessage(error.message || 'Sign in failed')
        setOauthLoading(null)
      }
      // If no error, Supabase will redirect the user to the provider
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Sign in failed')
      setOauthLoading(null)
    }
  }

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setLoading(true)

    try {
      setRememberDevice(rememberDevice)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (error) {
        setErrorMessage(error.message || t('auth.signInDesc'))
        setLoading(false)
        return
      }

      if (data.user) {
        const languageCode = i18n.language === 'fr' ? 'fr' : 'en'
        try {
          await supabase.from('profiles').update({ language: languageCode }).eq('id', data.user.id)
        } catch (e) {
          console.error('Error saving language preference:', e)
        }

        navigate(returnToPath ?? '/account/dashboard', { replace: true })
      }
    } catch (error) {
      console.error('Login error:', error)
      setErrorMessage(t('common.error'))
      setLoading(false)
    }
  }

  return (
    <section className="relative h-screen w-screen max-w-full overflow-hidden bg-black flex flex-col md:items-center md:justify-center select-none">
      {/* Background */}
      <div className="absolute inset-0 bg-black pointer-events-none" />
      <div className="absolute -top-40 -right-32 w-80 h-80 bg-red-500/18 blur-3xl rounded-full opacity-70 pointer-events-none" aria-hidden />
      <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-white/8 blur-3xl rounded-full opacity-60 pointer-events-none" aria-hidden />

      {/* Top bar: logo left, language dropdown right */}
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
            onClick={() => setLangMenuOpen((open) => !open)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-black/40 text-xs font-nav font-bold uppercase tracking-[0.16em] text-white/80 hover:text-white hover:bg-white/[0.08] transition-colors backdrop-blur-md"
          >
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full overflow-hidden">
              {lang === 'EN' ? <FlagEN /> : <FlagFR />}
            </span>
            <span>{lang}</span>
            <svg
              className={`w-3 h-3 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M19 9l-7 7-7-7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 mt-2 w-40 rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl shadow-xl py-1">
              <button
                type="button"
                onClick={() => {
                  i18n.changeLanguage('en')
                  setLangMenuOpen(false)
                }}
                className="w-full px-3 py-2.5 flex items-center gap-2 text-xs text-white/85 hover:bg-white/5"
              >
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full overflow-hidden">
                  <FlagEN />
                </span>
                <span className="font-medium">English</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  i18n.changeLanguage('fr')
                  setLangMenuOpen(false)
                }}
                className="w-full px-3 py-2.5 flex items-center gap-2 text-xs text-white/70 hover:bg-white/5"
              >
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full overflow-hidden">
                  <FlagFR />
                </span>
                <span className="font-medium">Français</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 flex-1 min-h-0 w-full overflow-hidden flex flex-col items-center justify-center px-4 py-4 md:py-8">
        <div className="w-full max-w-md flex-shrink-0">
          <div className="flex flex-col bg-black rounded-xl border border-white/10 shadow-[0_22px_55px_rgba(0,0,0,0.7)] overflow-hidden md:rounded-xl">
            {/* Form */}
            <div className="w-full bg-black px-6 sm:px-10 py-6 sm:py-10 flex items-center">
            <div className="w-full max-w-md mx-auto">
              <div className="mb-7">
                <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-1">
                  {t('auth.signIn')}
                </h1>
                <p className="text-sm text-white/60">
                  {t('auth.signInDesc')}
                </p>
              </div>

              {/* OAuth: Google uniquement — libellé explicite pour éviter la confusion avec "Sign in" */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={!!oauthLoading}
                  className="w-full rounded-lg px-4 py-3 text-sm font-medium text-white bg-[#121212] border border-[#1a1a1a] hover:bg-[#1a1a1a] focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {oauthLoading === 'google' ? (
                    <span className="text-white/70">{t('auth.signingIn')}</span>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      {t('auth.continueWithGoogle')}
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <span className="flex-1 h-px bg-white/20" aria-hidden />
                <span className="text-xs text-white/50">OR</span>
                <span className="flex-1 h-px bg-white/20" aria-hidden />
              </div>

              <form className="space-y-5" onSubmit={handleLoginSubmit}>
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-white/70 text-xs mb-2 font-medium">
                    {t('auth.email')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all bg-[#121212] border border-[#1a1a1a] focus:bg-[#1a1a1a] focus:border-[#444]"
                    placeholder={t('auth.emailPlaceholder')}
                    required
                    disabled={loading}
                  />
                </div>

                {/* Password with eye icon (press & hold) */}
                <div>
                  <label htmlFor="password" className="block text-white/70 text-xs mb-2 font-medium">
                    {t('auth.password')}
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all bg-[#121212] border border-[#1a1a1a] focus:bg-[#1a1a1a] focus:border-[#444]"
                      placeholder={t('auth.passwordPlaceholder')}
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
                  <span>{t('auth.rememberDevice')}</span>
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
                  {loading ? t('auth.signingIn') : t('auth.signIn')}
                </button>

                {/* Register link */}
                <p className="text-center text-sm text-white/60 mt-5">
                  {t('auth.newHere')}{' '}
                  <Link
                    to={returnToPath ? `/account/register?returnTo=${encodeURIComponent(returnToPath)}` : '/account/register'}
                    className="inline-flex items-center gap-1 text-sm font-medium text-white hover:text-white/80 underline transition-colors"
                  >
                    {t('auth.createAccount')}
                    <svg className="w-4 h-4 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </p>

                {/* Help link — inline on mobile, hidden on md+ (shown via absolute below) */}
                <p className="md:hidden text-center text-sm mt-4">
                  <span className="text-white/45">{t('auth.needHelp')} </span>
                  <a href="mailto:contact@fireball.fr" className="text-white hover:text-white/80 underline">
                    {t('auth.contactUs')}
                  </a>
                </p>
              </form>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global help link at bottom of page — desktop only */}
      <div className="hidden md:block absolute inset-x-0 bottom-6 z-10 text-center text-sm flex-shrink-0">
        <span className="text-white/45">{t('auth.needHelp')} </span>
        <a
          href="mailto:contact@fireball.fr"
          className="text-white hover:text-white/80 underline"
        >
          {t('auth.contactUs')}
        </a>
      </div>
    </section>
  )
}
