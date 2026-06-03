import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { setRememberDevice as persistRememberDevice, supabase } from '@/lib/supabase'
import { getSafeReturnToPath } from '@/utils/safeReturnTo'
import { IOSCheckbox } from '@/components/IOSCheckbox'
import { SEO } from '@/components/SEO'

export function Account() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberDevice, setRememberDevice] = useState(false)

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

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setLoading(true)

    try {
      persistRememberDevice(rememberDevice)
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
        const languageCode = 'en'
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
    <>
      <SEO title="Sign in — Fireball Canada" rawTitle description="Sign in to your Fireball Canada account." canonicalPath="/account" noindex />
      <section className="relative h-screen w-screen max-w-full overflow-hidden bg-black flex flex-col md:items-center md:justify-center select-none">
      {/* Background */}
      <div className="absolute inset-0 bg-black pointer-events-none" />
      <div className="absolute -top-40 -right-32 w-80 h-80 bg-red-500/18 blur-3xl rounded-full opacity-70 pointer-events-none" aria-hidden />
      <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-white/8 blur-3xl rounded-full opacity-60 pointer-events-none" aria-hidden />

      {/* Top bar: logo left */}
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
                    className="auth-field-input w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all bg-[#121212] border border-[#1a1a1a] focus:bg-[#1a1a1a] focus:border-[#444]"
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
                      className="auth-field-input w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all bg-[#121212] border border-[#1a1a1a] focus:bg-[#1a1a1a] focus:border-[#444]"
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
    </>
  )
}
