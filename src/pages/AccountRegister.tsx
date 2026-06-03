import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { setRememberDevice as persistRememberDevice, supabase } from '@/lib/supabase'
import { getSafeReturnToPath } from '@/utils/safeReturnTo'
import { createShopifyCustomer } from '@/utils/shopifySync'
import { IOSCheckbox } from '@/components/IOSCheckbox'
import { SEO } from '@/components/SEO'

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
  const [frWarningOpen, setFrWarningOpen] = useState(false)
  const lang = i18n.language === 'fr' ? 'FR' : 'EN'
  const languageCode = i18n.language === 'fr' ? 'fr' : 'en'

  const returnToParam = new URLSearchParams(location.search).get('returnTo')
  const returnToPath = getSafeReturnToPath(returnToParam)
  const accountHref = returnToPath
    ? `/account?returnTo=${encodeURIComponent(returnToPath)}`
    : '/account'

  useEffect(() => {
    document.title = 'Create Account - Fireball Canada'

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
      if (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN') return
      navigate(returnToPath ?? '/account/dashboard', { replace: true })
    })
    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [returnToPath, navigate])

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
    <>
      <SEO
        title="Create account — Fireball Canada"
        rawTitle
        description="Create your Fireball Canada account."
        canonicalPath="/account/register"
        noindex
      />
      <section className="relative h-screen w-screen max-w-full overflow-hidden bg-black flex flex-col md:items-center md:justify-center select-none">
        <div className="absolute inset-0 bg-black pointer-events-none" />
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-red-500/18 blur-3xl rounded-full opacity-70 pointer-events-none" aria-hidden />
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-white/8 blur-3xl rounded-full opacity-60 pointer-events-none" aria-hidden />

        <div className="absolute top-6 left-6 z-30">
          <Link
            to={accountHref}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-xs font-nav font-semibold text-white/85 backdrop-blur-md transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>{t('auth.backToSignIn')}</span>
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

        <div className="relative z-10 flex-1 min-h-0 w-full overflow-y-auto overscroll-contain flex flex-col items-center justify-center px-4 py-20 md:py-8">
          <div className="w-full max-w-md flex-shrink-0">
            <div className="flex flex-col bg-black rounded-xl border border-white/10 shadow-[0_22px_55px_rgba(0,0,0,0.7)] overflow-hidden md:rounded-xl">
              <div className="w-full bg-black px-6 sm:px-10 py-6 sm:py-10">
                <div className="w-full max-w-md mx-auto">
                  <div className="mb-7">
                    <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-1">
                      {t('auth.signUpTitle')}
                    </h1>
                    <p className="text-sm text-white/60">{t('auth.signUpDesc')}</p>
                  </div>

                  {errorMessage && (
                    <div className="rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                      {errorMessage}
                    </div>
                  )}

                  <form className="space-y-5" onSubmit={handleRegisterSubmit}>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <label htmlFor="register-first-name" className="block text-white/70 text-xs mb-2 font-medium">
                          {t('auth.firstName')}
                        </label>
                        <input
                          id="register-first-name"
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
                        <label htmlFor="register-last-name" className="block text-white/70 text-xs mb-2 font-medium">
                          {t('auth.lastName')}
                        </label>
                        <input
                          id="register-last-name"
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

                    <div>
                      <label htmlFor="register-email" className="block text-white/70 text-xs mb-2 font-medium">
                        {t('auth.email')}
                      </label>
                      <input
                        id="register-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="auth-field-input w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all bg-[#121212] border border-[#1a1a1a] focus:bg-[#1a1a1a] focus:border-[#444]"
                        placeholder={t('auth.emailExPlaceholder')}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label htmlFor="register-password" className="block text-white/70 text-xs mb-2 font-medium">
                        {t('auth.password')}
                      </label>
                      <div className="relative">
                        <input
                          id="register-password"
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
                            const input = e.currentTarget.previousSibling as HTMLInputElement | null
                            if (input) input.type = 'text'
                            e.currentTarget.style.stroke = '#fff'
                            e.currentTarget.setAttribute('data-eye', 'open')
                          }}
                          onMouseUp={(e) => {
                            const input = e.currentTarget.previousSibling as HTMLInputElement | null
                            if (input) input.type = 'password'
                            e.currentTarget.style.stroke = '#666'
                            e.currentTarget.removeAttribute('data-eye')
                          }}
                          onMouseLeave={(e) => {
                            if (e.currentTarget.getAttribute('data-eye')) {
                              const input = e.currentTarget.previousSibling as HTMLInputElement | null
                              if (input) input.type = 'password'
                              e.currentTarget.style.stroke = '#666'
                              e.currentTarget.removeAttribute('data-eye')
                            }
                          }}
                          onTouchStart={(e) => {
                            const input = e.currentTarget.previousSibling as HTMLInputElement | null
                            if (input) input.type = 'text'
                            e.currentTarget.style.stroke = '#fff'
                            e.currentTarget.setAttribute('data-eye', 'open')
                          }}
                          onTouchEnd={(e) => {
                            const input = e.currentTarget.previousSibling as HTMLInputElement | null
                            if (input) input.type = 'password'
                            e.currentTarget.style.stroke = '#666'
                            e.currentTarget.removeAttribute('data-eye')
                          }}
                        >
                          <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </div>
                      <p className="text-[11px] text-white/45 mt-1">{t('auth.passwordHint')}</p>
                    </div>

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

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-white text-black border-none py-4 rounded-lg font-semibold text-sm cursor-pointer transition-colors hover:bg-[#e5e5e5] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? t('auth.creatingAccount') : t('auth.signUp')}
                    </button>

                    <p className="text-center text-sm text-white/60 mt-5">
                      {t('auth.alreadyHaveAccount')}{' '}
                      <Link
                        to={accountHref}
                        className="inline-flex items-center gap-1 text-sm font-medium text-white hover:text-white/80 underline transition-colors"
                      >
                        {t('auth.logIn')}
                        <svg className="w-4 h-4 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                    </p>

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

        <div className="hidden md:block absolute inset-x-0 bottom-6 z-10 text-center text-sm flex-shrink-0">
          <span className="text-white/45">{t('auth.needHelp')} </span>
          <a href="mailto:contact@fireball.fr" className="text-white hover:text-white/80 underline">
            {t('auth.contactUs')}
          </a>
        </div>

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
      </section>
    </>
  )
}
