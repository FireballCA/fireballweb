import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { isAuthenticated } from '@/utils/supabaseAuth'
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
  const [rememberDevice, setRememberDevice] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const lang = i18n.language === 'fr' ? 'FR' : 'EN'
  const languageCode = i18n.language === 'fr' ? 'fr' : 'en'

  const returnToParam = new URLSearchParams(location.search).get('returnTo')
  const returnToPath = returnToParam === '/account/company' ? returnToParam : null

  useEffect(() => {
    document.title = 'Create Account | Fireball Canada'
    const mq = window.matchMedia('(max-width: 767px)')
    const apply = () => {
      if (mq.matches) {
        document.body.style.overflow = 'hidden'
        document.body.style.height = '100vh'
      } else {
        document.body.style.overflow = ''
        document.body.style.height = ''
      }
    }
    apply()
    mq.addEventListener('change', apply)
    return () => {
      mq.removeEventListener('change', apply)
      document.body.style.overflow = ''
      document.body.style.height = ''
    }
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated()
      if (authenticated) {
        navigate(returnToPath ?? '/account/dashboard', { replace: true })
      }
    }
    checkAuth()
  }, [navigate, returnToPath])

  const handleRegisterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

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

      if (returnToPath) {
        navigate(returnToPath, { replace: true })
      } else {
        // Étape 5: Rediriger vers le dashboard avec le nom pour l'écran de bienvenue
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
    <section className="relative h-screen md:min-h-screen w-screen max-w-full overflow-hidden md:overflow-visible bg-black flex flex-col md:items-center md:justify-center md:py-12 md:px-6">
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
      <div className="relative z-10 flex-1 min-h-0 md:flex-initial w-full flex flex-col md:flex-row md:max-w-5xl md:w-full md:max-h-[85vh] md:mx-auto">
        <div className="flex flex-1 min-h-0 md:flex-initial md:max-h-[85vh] w-full flex-col md:flex-row bg-black shadow-[0_0_40px_rgba(0,0,0,0.6)] overflow-hidden">
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
          <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-y-auto bg-black px-4 sm:px-10 py-6 sm:py-10 md:py-8 md:flex md:items-center border-r border-white/10">
            <div className="w-full max-w-md mx-auto flex-shrink-0">
              <div className="mb-7">
                <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-1">
                  {t('auth.signUpTitle')}
                </h1>
                <p className="text-sm text-white/60">
                  {t('auth.signUpDesc')}
                </p>
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
                      className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all bg-[#121212] border border-[#1a1a1a] focus:bg-[#1a1a1a] focus:border-[#444]"
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
                      className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all bg-[#121212] border border-[#1a1a1a] focus:bg-[#1a1a1a] focus:border-[#444]"
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
                    className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all bg-[#121212] border border-[#1a1a1a] focus:bg-[#1a1a1a] focus:border-[#444]"
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
                      className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all bg-[#121212] border border-[#1a1a1a] focus:bg-[#1a1a1a] focus:border-[#444]"
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
