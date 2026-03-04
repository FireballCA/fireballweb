import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile } from '@/utils/supabaseAuth'
import { updateShopifyCustomer } from '@/utils/shopifySync'

export function AccountSettings() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [orderEmails, setOrderEmails] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(true)

  useEffect(() => {
    document.title = 'Account settings | Fireball Canada'

    let cancelled = false

    const load = async () => {
      try {
        const profile = await getCurrentUserProfile()
        if (!profile) {
          if (!cancelled) {
            navigate('/account', { replace: true })
          }
          return
        }

        if (cancelled) return

        setFirstName(profile.first_name || '')
        setLastName(profile.last_name || '')
        setEmail(profile.email || '')

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user && !cancelled) {
          const metadata = (user.user_metadata || {}) as Record<string, unknown>
          const orderPref = (metadata.order_emails as boolean | undefined)
          const marketingPref = (metadata.marketing_emails as boolean | undefined)
          setOrderEmails(orderPref !== false)
          setMarketingEmails(marketingPref !== false)
        }
      } catch (e) {
        console.error('Error loading settings:', e)
        if (!cancelled) {
          setError("Impossible de charger tes paramètres pour l'instant.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [navigate])

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (saving) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('Utilisateur non authentifié')
      }

      const cleanFirst = firstName.trim()
      const cleanLast = lastName.trim()
      const fullName = `${cleanFirst} ${cleanLast}`.trim()

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: cleanFirst,
          last_name: cleanLast,
        })
        .eq('id', user.id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
        throw new Error('Erreur lors de la mise à jour du profil.')
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          first_name: cleanFirst,
          last_name: cleanLast,
          order_emails: orderEmails,
          marketing_emails: marketingEmails,
        },
      })

      if (authError) {
        console.error('Error updating auth metadata:', authError)
        throw new Error("Erreur lors de la mise à jour de ton compte.")
      }

      try {
        if (email) {
          await updateShopifyCustomer({
            email,
            first_name: cleanFirst,
            last_name: cleanLast,
          })
        }
      } catch (shopifyError) {
        console.error('Shopify customer update failed:', shopifyError)
        // Ne bloque pas l'enregistrement si Shopify échoue
      }

      setSuccess('Tes paramètres ont été mis à jour.')
    } catch (e) {
      console.error('Error saving settings:', e)
      setError('Impossible de sauvegarder tes paramètres. Réessaie dans quelques instants.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="relative min-h-screen bg-[#0a0a0a] text-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16 py-16">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-10"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="uppercase tracking-[0.18em] text-[11px] font-nav">Back to dashboard</span>
        </button>

        <div className="mb-10 flex flex-col gap-4">
          <p className="text-[11px] font-nav font-bold uppercase tracking-[0.18em] text-white/50">
            Account
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-[40px] font-semibold tracking-[-0.03em] text-white">
            Settings
          </h1>
          <p className="max-w-xl text-sm text-white/65">
            Gère ton identité, la façon dont on te contacte et les informations synchronisées avec Shopify
            pour tes commandes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] gap-8 lg:gap-12 items-start">
          <div className="space-y-4">
            <div
              className="rounded-3xl border border-white/15 bg-white/[0.05] px-5 py-5 shadow-[0_18px_45px_rgba(0,0,0,0.45)]"
              style={{
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <p className="text-[13px] font-medium text-white/90 mb-1.5">Profile & contact</p>
              <p className="text-[12px] leading-relaxed text-white/65">
                Modifie ton nom affiché et confirme l’adresse email utilisée pour ta
                connexion, tes points et tes factures Shopify.
              </p>
            </div>

            <div
              className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
              style={{
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
              }}
            >
              <p className="text-[13px] font-medium text-white/90 mb-1.5">Notifications</p>
              <p className="text-[12px] leading-relaxed text-white/65">
                Choisis comment on te contacte pour les mises à jour de commandes et les
                nouveautés Fireball.
              </p>
              <ul className="mt-3 space-y-1.5 text-[12px] text-white/55">
                <li>- Email de suivi de commandes et factures Shopify</li>
                <li>- Emails d’actualités, drops et promotions</li>
              </ul>
            </div>
          </div>

          <div>
            <form
              onSubmit={handleSave}
              className="rounded-3xl border border-white/15 bg-white/[0.04] px-5 md:px-7 py-6 md:py-7 shadow-[0_22px_55px_rgba(0,0,0,0.6)]"
              style={{
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
              }}
            >
              {loading ? (
                <div className="py-10 text-sm text-white/60">Chargement de tes paramètres…</div>
              ) : (
                <>
                  {error && (
                    <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-[13px] text-red-100">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[13px] text-emerald-100">
                      {success}
                    </div>
                  )}

                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/60 mb-2">
                          First name
                        </label>
                        <input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full rounded-2xl border border-white/18 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/70"
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/60 mb-2">
                          Last name
                        </label>
                        <input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full rounded-2xl border border-white/18 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/70"
                          placeholder="Last name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/60 mb-2">
                        Email (Shopify & Fireball)
                      </label>
                      <input
                        value={email}
                        disabled
                        className="w-full rounded-2xl border border-white/18 bg-black/40 px-3.5 py-2.5 text-sm text-white/70 cursor-not-allowed"
                      />
                      <p className="mt-1.5 text-[11px] text-white/45">
                        Utilisée pour te connecter, suivre tes points et lier tes commandes Shopify.
                      </p>
                    </div>

                    <div className="pt-1.5 space-y-3">
                      <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/60">
                        Email preferences
                      </p>
                      <label className="flex items-center justify-between gap-3 cursor-pointer">
                        <div>
                          <p className="text-sm text-white/90">Order updates & receipts</p>
                          <p className="text-[11px] text-white/55">
                            Emails liés à tes achats, commandes Shopify et factures.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOrderEmails((v) => !v)}
                          className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${
                            orderEmails ? 'bg-emerald-500' : 'bg-white/[0.25]'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${
                              orderEmails ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </label>

                      <label className="flex items-center justify-between gap-3 cursor-pointer">
                        <div>
                          <p className="text-sm text-white/90">News & drops</p>
                          <p className="text-[11px] text-white/55">
                            Lancements de produits, promos et contenu exclusif Fireball.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMarketingEmails((v) => !v)}
                          className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${
                            marketingEmails ? 'bg-emerald-500' : 'bg-white/[0.25]'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${
                              marketingEmails ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </label>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <p className="text-[11px] text-white/45 max-w-xs">
                      Certaines modifications peuvent prendre quelques minutes avant d’être visibles
                      sur Shopify et dans tes emails.
                    </p>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center rounded-2xl bg-white text-black px-5 py-2.5 text-[12px] font-nav font-bold uppercase tracking-[0.18em] hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

