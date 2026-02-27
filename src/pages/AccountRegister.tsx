import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { isAuthenticated } from '@/utils/supabaseAuth'
import { createShopifyCustomer } from '@/utils/shopifySync'

export function AccountRegister() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.title = 'Create Account | Fireball Canada'
    
    // Vérifier si l'utilisateur est déjà connecté
    const checkAuth = async () => {
      const authenticated = await isAuthenticated()
      if (authenticated) {
        navigate('/account/dashboard', { replace: true })
      }
    }
    checkAuth()
  }, [navigate])

  const handleRegisterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setLoading(true)

    try {
      // Étape 1: Créer l'utilisateur avec Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
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

      // Étape 2: Extraire first_name et last_name du fullName
      const nameParts = fullName.trim().split(/\s+/).filter(Boolean)
      const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0] || ''
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''

      // Étape 3: Insérer le profil dans la table profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          email: email.trim(),
          created_at: new Date().toISOString(),
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
        // Ne pas bloquer l'inscription si le profil échoue, mais loguer l'erreur
        // L'utilisateur peut toujours se connecter, le profil pourra être créé plus tard
      }

      // Étape 4: Créer le client Shopify (sync en arrière-plan côté métier, mais appel vérifié ici)
      const shopifySync = await createShopifyCustomer({
        email: email.trim(),
        first_name: firstName || 'Member',
        last_name: lastName || '',
      })
      if (!shopifySync.success) {
        // On ne bloque pas l'inscription Supabase, mais on trace l'erreur pour diagnostic.
        console.error('Shopify customer sync failed:', shopifySync.error)
      }

      // Étape 5: Rediriger vers le dashboard avec le nom pour l'écran de bienvenue
      navigate('/account/dashboard', {
        replace: true,
        state: {
          fromRegister: true,
          welcomeName: fullName.trim(),
        },
      })
    } catch (error) {
      console.error('Registration error:', error)
      setErrorMessage('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#0B0B0B] flex items-center justify-center px-6 py-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B0B0B] via-[#1a1a1a] to-[#0B0B0B]" />
      
      {/* Back button */}
      <div className="fixed top-6 left-6 z-30">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/15 text-white/80 hover:text-white hover:border-white/25 transition-all bg-white/[0.06] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]"
          aria-label="Go back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/LogoFull.avif"
            alt="Fireball"
            className="h-8 w-auto object-contain opacity-90"
            draggable={false}
          />
        </div>

        {/* Register Card - Liquid Glass Style */}
        <div className="rounded-2xl border border-white/20 shadow-[0_18px_40px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.24)] p-8 md:p-10"
          style={{
            background: 'rgba(20, 20, 20, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <h1 className="font-nav font-bold text-3xl md:text-4xl text-white uppercase mb-2 text-center tracking-wide">
            CREATE ACCOUNT
          </h1>
          <p className="text-center text-white/60 text-sm mb-8">Join the Fireball community</p>

          <form className="space-y-5" onSubmit={handleRegisterSubmit}>
            {/* Full Name Input - Liquid Glass Style */}
            <div>
              <label htmlFor="fullName" className="block text-white/80 text-sm mb-2 font-medium">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-left text-white placeholder:text-white/40 focus:outline-none transition-all bg-white/[0.06] border border-white/15 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] focus:border-white/30 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.1)]"
                placeholder="John Doe"
                required
                disabled={loading}
              />
            </div>

            {/* Email Input - Liquid Glass Style */}
            <div>
              <label htmlFor="email" className="block text-white/80 text-sm mb-2 font-medium">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-left text-white placeholder:text-white/40 focus:outline-none transition-all bg-white/[0.06] border border-white/15 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] focus:border-white/30 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.1)]"
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>

            {/* Password Input - Liquid Glass Style */}
            <div>
              <label htmlFor="password" className="block text-white/80 text-sm mb-2 font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-left text-white placeholder:text-white/40 focus:outline-none transition-all bg-white/[0.06] border border-white/15 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] focus:border-white/30 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.1)]"
                placeholder="••••••••"
                required
                minLength={6}
                disabled={loading}
              />
              <p className="text-xs text-white/50 mt-1">Minimum 6 characters</p>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {errorMessage}
              </div>
            )}

            {/* Submit Button - Liquid Glass Style */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-white text-[#0B0B0B] font-nav font-bold uppercase text-sm rounded-xl hover:bg-white/95 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-8px_14px_rgba(0,0,0,0.08),0_10px_24px_rgba(0,0,0,0.22)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>

            {/* Login link */}
            <p className="text-center text-sm text-white/60 pt-4 border-t border-white/10">
              Already have an account?{' '}
              <Link 
                to="/account" 
                className="inline-flex items-center gap-1 text-sm font-medium text-white hover:text-white/80 underline transition-colors"
              >
                Sign in
                <svg className="w-4 h-4 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  )
}
