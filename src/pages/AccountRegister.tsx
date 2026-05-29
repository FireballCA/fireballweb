import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { setRememberDevice as persistRememberDevice, supabase } from '@/lib/supabase'
import { getSafeReturnToPath } from '@/utils/safeReturnTo'
import { createShopifyCustomer } from '@/utils/shopifySync'
import { IOSCheckbox } from '@/components/IOSCheckbox'

function FlagEN() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
      <defs>
        <clipPath id="flag-en-circle">
          <circle cx="10" cy="10" r="10" />
        </clipPath>
      </defs>
      <g clipPath="url(#flag-en-circle)">
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
        <clipPath id="flag-fr-circle">
          <circle cx="10" cy="10" r="10" />
        </clipPath>
      </defs>
      <g clipPath="url(#flag-fr-circle)">
        <rect width="6.67" height="20" fill="#002395" />
        <rect width="6.67" height="20" x="6.67" fill="#fff" />
        <rect width="6.67" height="20" x="13.33" fill="#ED2939" />
      </g>
    </svg>
  )
}

function generateExternalMemberId(): string {
  // ID numérique court, lisible et scannable (8 chiffres)
  const value = Math.floor(10000000 + Math.random() * 90000000)
  return String(value)
}

export function AccountRegister() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | null>(null)
  const [rememberDevice, setRememberDevice] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [frWarningOpen, setFrWarningOpen] = useState(false)
  const lang = i18n.language === 'fr' ? 'FR' : 'EN'
  const languageCode = i18n.language === 'fr' ? 'fr' : 'en'

  const returnToParam = new URLSearchParams(location.search).get('returnTo')
  const returnToPath = getSafeReturnToPath(returnToParam)

  useEffect(() => {
    document.title = 'Create Account - Fireball Canada'
  }, [])

  useEffect(() => {
    let cancelled = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      if (!session) return
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
        setErrorMessage(error.message || t('auth.signInDesc'))
        setOauthLoading(null)
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t('common.error'))
      setOauthLoading(null)
    }
  }

  const handleRegisterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setOauthLoading(null)

    try {
      const trimmedFirst = firstName.trim()
      const trimmedLast = lastName.trim()
      const trimmedName = `${trimmedFirst} ${trimmedLast}`.trim()
      const trimmedEmail = email.trim()
      const trimmedPassword = password.trim()

      // Client-side validation: all fields required
      if (!trimmedFirst || !trimmedLast || !trimmedEmail || !trimmedPassword) {
        setErrorMessage(t('auth.allFieldsRequired'))
        return
      }

      // Extraire first_name et last_name à partir des champs séparés
      setLoading(true)
      persistRememberDevice(rememberDevice)

      // Étape 1: Créer l'utilisateur avec Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: {
          data: {
            full_name: trimmedName,
            first_name: trimmedFirst || '',
            last_name: trimmedLast || '',
            language: languageCode,
          },
        },
      })

      if (authError) {
        setErrorMessage(authError.message || 'Failed to create account. Please try again.')
        setLoading(false)
        return
      }

      if (!authData.user) {
        setErrorMessage('Account creation failed. Please try again.')
        setLoading(false)
        return
      }

      // Étape 3: Insérer le profil dans la table profiles
      const externalMemberId = generateExternalMemberId()
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          first_name: trimmedFirst,
          last_name: trimmedLast,
          email: trimmedEmail,
          created_at: new Date().toISOString(),
          xp: 0,
          external_member_id: externalMemberId,
          barcode_value: externalMemberId,
          language: languageCode,
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
        // Ne pas bloquer l'inscription si le profil échoue, mais loguer l'erreur
        // L'utilisateur peut toujours se connecter, le profil pourra être créé plus tard
      }

      // Étape 4: Créer le client Shopify (sync en arrière-plan côté métier, mais appel vérifié ici)
      const shopifySync = await createShopifyCustomer({
        email: trimmedEmail,
        password: trimmedPassword,
        first_name: trimmedFirst || 'Member',
        last_name: trimmedLast || '',
      })
      const shopifySyncError = shopifySync.success ? null : (shopifySync.error || 'Unknown Shopify sync error')
      if (shopifySyncError) {
        // On ne bloque pas l'inscription Supabase, mais on trace l'erreur pour diagnostic.
        console.error('Shopify customer sync failed:', shopifySyncError)
      }
      // Sauvegarder l'ID client Shopify dans le profil (utile pour les commandes, etc.)
      if (shopifySync.success && shopifySync.shopifyCustomerId) {
        await supabase
          .from('profiles')
          .update({ shopify_customer_id: shopifySync.shopifyCustomerId })
          .eq('id', authData.user.id)
      }

      if (
        returnToPath?.startsWith('/products/') ||
        returnToPath?.startsWith('/product/')
      ) {
        navigate('/account/dashboard', {
          replace: true,
          state: {
            fromRegister: true,
            welcomeName: trimmedName,
            shopifySyncError,
            redirectAfterWelcome: returnToPath,
          },
        })
      } else if (returnToPath) {
        navigate(returnToPath, { replace: true })
      } else {
        navigate('/account/dashboard', {
          replace: true,
          state: {
            fromRegister: true,
            welcomeName: trimmedName,
            shopifySyncError,
          },
        })
      }
    } catch (error) {
      console.error('Registration error:', error)
      setErrorMessage('An unexpected error occurred. Please try again.')
      setLoading(false)
    } finally {
      // Si la navigation a été faite, ce setLoading est sans effet
      setLoading(false)
    }
  }

  return (
    <section className="relative min-h-screen w-screen max-w-full overflow-x-hidden bg-black flex flex-col md:items-center md:justify-center md:py-12 md:px-6 select-none">
      {/* Background */}
      <div className="absolute inset-0 bg-black pointer-events-none" />
      <div className="absolute -top-40 -right-32 w-80 h-80 bg-red-500/18 blur-3xl rounded-full opacity-70 pointer-events-none" aria-hidden />
      <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-white/8 blur-3xl rounded-full opacity-60 pointer-events-none" aria-hidden />

      {/* Top bar: on mobile show logo left + language right; on md+ language only (logo in left panel) */}
      <div className="absolute top-4 left-4 z-30 md:hidden">
        <Link to="/" className="inline-flex items-center gap-2">
          <img src="/LogoFull.avif" alt="Fireball" className="h-6 w-auto object-contain opacity-95" draggable={false} />
        </Link>
      </div>
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-30">
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
                  setFrWarningOpen(true)
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

      {/* Main card: on mobile only form (full width), on md+ left panel + form with fixed max height */}
      <div className="relative z-10 pt-16 md:pt-0 flex-1 min-h-0 md:flex-initial w-full flex flex-col md:flex-row md:max-w-5xl md:w-full md:max-h-[90vh] md:mx-auto">
        <div className="flex flex-1 min-h-0 md:flex-initial md:max-h-[90vh] w-full flex-col md:flex-row bg-black shadow-[0_0_40px_rgba(0,0,0,0.6)] overflow-hidden md:rounded-2xl">
          {/* Left panel: logo + advantages (hidden on mobile) */}
          <div
            className="hidden md:flex relative flex-1 min-h-0 min-w-0 flex-col justify-between p-8 md:p-10"
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 0%, rgba(248,113,113,0.9) 0%, rgba(185,28,28,0.85) 30%, #000 80%)',
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-60 mix-blend-overlay"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E\")",
              }}
            />

            <div className="relative z-10 flex items-center gap-3 font-semibold text-white text-base sm:text-lg">
              <img
                src="/LogoFull.avif"
                alt="Fireball"
                className="h-7 w-auto object-contain filter brightness-0 invert drop-shadow-[0_0_12px_rgba(0,0,0,0.4)]"
                draggable={false}
              />
            </div>

            <div className="relative z-10 mt-10 mb-6">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-4 leading-tight">
                {t('auth.getStarted')}
              </h2>
              <p className="text-sm text-white/80 max-w-md mb-6">
                {t('auth.getStartedDesc')}
              </p>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="w-6 h-6 rounded-full bg-white/15 text-white flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <span className="text-sm text-white/90">
                    {t('auth.benefit1')}
                  </span>
                </div>
                <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="w-6 h-6 rounded-full bg-white/15 text-white flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <span className="text-sm text-white/90">
                    {t('auth.benefit2')}
                  </span>
                </div>
                <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="w-6 h-6 rounded-full bg-white/15 text-white flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <span className="text-sm text-white/90">
                    {t('auth.benefit3')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: form (full width on mobile, with subtle right divider on md+) */}
          <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-y-auto overscroll-contain bg-black px-4 sm:px-10 py-6 sm:py-10 md:py-8 border-r border-white/10">
            <div className="w-full max-w-md mx-auto flex-shrink-0 my-auto py-2">
              <div className="mb-7">
                <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-1">
                  {t('auth.signUpTitle')}
                </h1>
                <p className="text-sm text-white/60">
                  {t('auth.signUpDesc')}
                </p>
              </div>

              {errorMessage && (
                <div className="rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                  {errorMessage}
                </div>
              )}

              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={!!oauthLoading || loading}
                  className="w-full rounded-lg px-4 py-3 text-sm font-medium text-white bg-[#121212] border border-[#1a1a1a] hover:bg-[#1a1a1a] focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {oauthLoading === 'google' ? (
                    <span className="text-white/70">{t('auth.signingIn')}</span>
                  ) : (
                    <>
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
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

              <form className="space-y-5" onSubmit={handleRegisterSubmit}>
                {/* Name row */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="block text-white/70 text-xs mb-2 font-medium">
                      {t('auth.firstName')}
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="auth-field-input w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all bg-[#121212] border border-[#1a1a1a] focus:bg-[#1a1a1a] focus:border-[#444]"
                      placeholder={t('auth.firstNamePlaceholder')}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-white/70 text-xs mb-2 font-medium">
                      {t('auth.lastName')}
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="auth-field-input w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all bg-[#121212] border border-[#1a1a1a] focus:bg-[#1a1a1a] focus:border-[#444]"
                      placeholder={t('auth.lastNamePlaceholder')}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-white/70 text-xs mb-2 font-medium">
                    {t('auth.email')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="auth-field-input w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all bg-[#121212] border border-[#1a1a1a] focus:bg-[#1a1a1a] focus:border-[#444]"
                    placeholder={t('auth.emailExPlaceholder')}
                    required
                    disabled={loading}
                  />
                </div>

                {/* Password with eye icon (press & hold) */}
                <div>
                  <label className="block text-white/70 text-xs mb-2 font-medium">
                    {t('auth.password')}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="auth-field-input w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all bg-[#121212] border border-[#1a1a1a] focus:bg-[#1a1a1a] focus:border-[#444]"
                      placeholder={t('auth.passwordPlaceholder')}
                      required
                      minLength={6}
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
                  <p className="text-[11px] text-white/45 mt-1">
                    {t('auth.passwordHint')}
                  </p>
                </div>

                {/* Remember device */}
                <div className="inline-flex items-center gap-2.5 text-sm text-white/70 select-none cursor-pointer">
                  <IOSCheckbox
                    id="register-remember-device"
                    checked={rememberDevice}
                    onChange={setRememberDevice}
                    color="red"
                    sizeEm={0.88}
                  />
                  <span>{t('auth.rememberDevice')}</span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black border-none py-4 rounded-lg font-semibold text-sm cursor-pointer transition-colors hover:bg-[#e5e5e5] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('auth.creatingAccount') : t('auth.signUp')}
                </button>

                {/* Login link */}
                <p className="text-center text-sm text-white/60 mt-5">
                  {t('auth.alreadyHaveAccount')}{' '}
                  <Link
                    to={returnToPath ? `/account?returnTo=${encodeURIComponent(returnToPath)}` : '/account'}
                    className="inline-flex items-center gap-1 text-sm font-medium text-white hover:text-white/80 underline transition-colors"
                  >
                    {t('auth.logIn')}
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

      {/* FR beta warning popup */}
      {frWarningOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setFrWarningOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl">
            <div className="mb-1 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                <FlagFR />
              </span>
              <h2 className="text-base font-semibold text-white">{t('auth.frBetaTitle')}</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/65">{t('auth.frBetaBody')}</p>
            <button
              type="button"
              onClick={() => setFrWarningOpen(false)}
              className="mt-5 w-full rounded-lg bg-white py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/90"
            >
              {t('auth.frBetaConfirm')}
            </button>
          </div>
        </div>
      )}

      {/* Global help link at bottom of page */}
      <div className="absolute inset-x-0 bottom-4 md:bottom-6 z-10 text-center text-sm">
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
