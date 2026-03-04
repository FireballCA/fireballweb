import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { updateShopifyCustomer } from '@/utils/shopifySync'
import { getCurrentUserProfile } from '@/utils/supabaseAuth'

interface SettingsSheetProps {
  isOpen: boolean
  onClose: () => void
}

const SETTINGS_SECTIONS = [
  { id: 'settings-profile', label: 'Profile' },
  { id: 'settings-security', label: 'Security' },
  { id: 'settings-membership', label: 'Membership' },
  { id: 'settings-payment', label: 'Payment' },
  { id: 'settings-billing', label: 'Billing' },
  { id: 'settings-member-card', label: 'Member card' },
  { id: 'settings-communication', label: 'Communication' },
  { id: 'settings-business', label: 'Business' },
  { id: 'settings-certification', label: 'Certification' },
  { id: 'settings-warranty', label: 'Warranty' },
  { id: 'settings-notifications', label: 'Notifications' },
  { id: 'settings-danger-zone', label: 'Danger zone' },
] as const

export function SettingsSheet({ isOpen, onClose }: SettingsSheetProps) {
  const [rendered, setRendered] = useState(isOpen)
  const [isExiting, setIsExiting] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [scrolledDown, setScrolledDown] = useState(false)

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [newsletter, setNewsletter] = useState(true)
  const [ordersEmails, setOrdersEmails] = useState(true)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [memberId, setMemberId] = useState<string | null>(null)
  const [memberSince, setMemberSince] = useState<string | null>(null)
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null)

  const [activeSection, setActiveSection] = useState<string>('settings-profile')
  const sectionLinkRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [indicatorTop, setIndicatorTop] = useState(0)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<'firstName' | 'lastName' | 'email' | 'phone' | null>(null)

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || cancelled) return

      // Récupérer le profil complet (même logique que le dashboard)
      let profile = await getCurrentUserProfile().catch(() => null)

      if (cancelled) return

      if (profile) {
        const first = profile.first_name?.trim() || ''
        const last = profile.last_name?.trim() || ''
        const name =
          `${first} ${last}`.trim() || profile.email || user.email || 'Member'

        setFirstName(first)
        setLastName(last)
        setDisplayName(name)
        setEmail(profile.email || user.email || '')
        setMemberId((profile as any).external_member_id ?? null)
        setMemberSince(profile.created_at || user.created_at || null)
        setSubscriptionTier(profile.subscription_tier ?? null)
      } else {
        // Fallback sur les métadonnées Auth si le profil n'existe pas
        const metadata = (user.user_metadata || {}) as Record<string, unknown>
        const metaFirst = String(metadata.first_name || '').trim()
        const metaLast = String(metadata.last_name || '').trim()
        const fullName = String(metadata.full_name || '').trim()
        const name =
          fullName ||
          [metaFirst, metaLast].filter(Boolean).join(' ') ||
          user.email ||
          'Member'

        const parts = name.trim().split(/\s+/)
        setFirstName(parts[0] || '')
        setLastName(parts.slice(1).join(' '))
        setDisplayName(name)
        setEmail(user.email || '')
        setMemberSince(user.created_at || null)
      }

      // Charger le téléphone depuis la table profiles
      try {
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('phone_number, phone')
          .eq('id', user.id)
          .maybeSingle()

        if (!profileRow || cancelled) return
        const anyRow = profileRow as Record<string, unknown>
        const phoneValue =
          (anyRow.phone_number as string | null) ||
          (anyRow.phone as string | null) ||
          ''
        setPhone(phoneValue ? formatPhoneForDisplay(String(phoneValue)) : '')
      } catch (phoneError) {
        console.warn('Failed to load phone number for settings:', phoneError)
      }
    }

    void loadUser()

    return () => {
      cancelled = true
    }
  }, [isOpen])

  useEffect(() => {
    const current = sectionLinkRefs.current[activeSection]
    if (!current) return
    const parent = current.offsetParent as HTMLElement | null
    if (!parent) return
    const top = current.offsetTop + current.offsetHeight / 2
    setIndicatorTop(top)
  }, [activeSection])

  useEffect(() => {
    if (isOpen) {
      setRendered(true)
      setIsExiting(false)
      document.body.style.overflow = 'hidden'
      return
    }

    if (!isOpen && rendered) {
      setIsExiting(true)
      const timeout = window.setTimeout(() => {
        setRendered(false)
        setIsExiting(false)
        document.body.style.overflow = ''
      }, 400)
      return () => {
        window.clearTimeout(timeout)
        document.body.style.overflow = ''
      }
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, rendered])

  const handleCopy = async (fieldId: string, value: string | null | undefined) => {
    const trimmed = (value || '').toString().trim()
    if (!trimmed) return
    try {
      await navigator.clipboard.writeText(trimmed)
      setCopiedField(fieldId)
      window.setTimeout(() => {
        setCopiedField((current) => (current === fieldId ? null : current))
      }, 1500)
    } catch (error) {
      console.error('Failed to copy to clipboard', error)
    }
  }

  const formatPhoneForDisplay = (raw: string): string => {
    const digits = raw.replace(/\D/g, '').slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }

  const handleSaveSettings = async () => {
    if (saving) return
    setSaving(true)
    setSaveMessage(null)
    setSaveError(null)

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error || !user) {
        throw new Error('Utilisateur non authentifié')
      }

      const cleanFirst = firstName.trim()
      const cleanLast = lastName.trim()
      const cleanEmail = email.trim()
      const normalizedPhone = phone ? formatPhoneForDisplay(phone) : ''
      const fullName = `${cleanFirst} ${cleanLast}`.trim() || displayName

      // Mettre à jour le profil Supabase (table profiles)
      try {
        await supabase
          .from('profiles')
          .update({
            first_name: cleanFirst || null,
            last_name: cleanLast || null,
            email: cleanEmail || null,
            phone_number: normalizedPhone || null,
          })
          .eq('id', user.id)
      } catch (profileError) {
        console.error('Error updating profile row:', profileError)
      }

      // Mettre à jour l'auth (email + metadata)
      const { error: authError } = await supabase.auth.updateUser({
        email: cleanEmail || undefined,
        data: {
          full_name: fullName,
          first_name: cleanFirst,
          last_name: cleanLast,
          phone_number: normalizedPhone || null,
          order_emails: ordersEmails,
          marketing_emails: newsletter,
        },
      })

      if (authError) {
        console.error('Error updating auth metadata:', authError)
        throw new Error("Erreur lors de la mise à jour des paramètres.")
      }

      // Synchroniser avec Shopify quand possible
      // Synchronisation Shopify uniquement en développement local pour éviter les 500 en production
      if (cleanEmail && import.meta.env.DEV) {
        try {
          await updateShopifyCustomer({
            email: cleanEmail,
            first_name: cleanFirst,
            last_name: cleanLast,
          })
        } catch (shopifyError) {
          console.error('Shopify customer update failed:', shopifyError)
          // On ne bloque pas si Shopify échoue
        }
      }

      setSaveMessage('Settings updated.')
    } catch (e) {
      console.error('Error saving settings:', e)
      setSaveError('Impossible de sauvegarder les paramètres. Réessaie dans quelques instants.')
    } finally {
      setSaving(false)
    }
  }

  if (!rendered) return null

  return (
    <div className="fixed inset-0 z-[150] flex flex-col justify-end pointer-events-none">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity duration-300"
        onClick={onClose}
        aria-label="Close settings"
      />
      <div
        className="relative w-full h-[92vh] md:h-[88vh] overflow-hidden pointer-events-auto flex flex-col rounded-t-[28px] shadow-[0_-24px_60px_rgba(0,0,0,0.55)]"
        style={{
          backgroundColor: '#0a0a0a',
          animation: isExiting
            ? 'settingsSlideDown 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards'
            : 'settingsSlideUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        }}
      >
        {/* Header */}
        <div className="px-6 md:px-10 pt-6 pb-4 border-b border-white/[0.06] flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/45">
              Account
            </p>
            <h2 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.02em] text-white">
              Settings
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-white/65 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 md:px-10 pt-5 pb-8"
          onScroll={(event) => {
            const target = event.currentTarget
            setScrolledDown(target.scrollTop > 40)

            const containerRect = target.getBoundingClientRect()
            let closestId = activeSection
            let closestDelta = Number.POSITIVE_INFINITY

            for (const section of SETTINGS_SECTIONS) {
              const el = document.getElementById(section.id)
              if (!el) continue
              const rect = el.getBoundingClientRect()
              const delta = Math.abs(rect.top - containerRect.top - 40)
              if (delta < closestDelta) {
                closestDelta = delta
                closestId = section.id
              }
            }

            if (closestId !== activeSection) {
              setActiveSection(closestId)
            }
          }}
        >
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-10">
            {/* Left column: intro + shortcuts */}
            <div className="w-full lg:w-[32%] flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm px-5 py-5 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
                <p className="text-[13px] font-medium text-white/80 mb-2">
                  Account settings
                </p>
                <p className="text-[12px] leading-relaxed text-white/60">
                  Update how your Fireball account behaves, including contact preferences
                  and account security shortcuts.
                </p>
              </div>

              {/* Shortcuts to sections - simple text list with moving dot */}
              <div className="relative pl-5">
                <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center">
                  <div className="w-px flex-1 bg-white/[0.18]" />
                  <div
                    className="absolute w-2 h-2 rounded-full bg-white translate-x-[-3px] transition-all duration-300 ease-out"
                    style={{ top: indicatorTop }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  {SETTINGS_SECTIONS.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      ref={(el) => {
                        sectionLinkRefs.current[section.id] = el
                      }}
                      onClick={() => {
                        const el = document.getElementById(section.id)
                        if (el && scrollRef.current) {
                          const container = scrollRef.current
                          const containerRect = container.getBoundingClientRect()
                          const rect = el.getBoundingClientRect()
                          const offset = rect.top - containerRect.top - 24
                          container.scrollTo({ top: container.scrollTop + offset, behavior: 'smooth' })
                        }
                      }}
                      className={`text-left text-[12px] font-nav uppercase tracking-[0.18em] transition-colors ${
                        activeSection === section.id ? 'text-white' : 'text-white/55 hover:text-white/80'
                      }`}
                    >
                      {section.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column: full settings content */}
            <div className="w-full lg:flex-1 flex flex-col gap-4">
              {/* Profile Information */}
              <section
                id="settings-profile"
                className="py-5 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/55">
                      Profile information
                    </p>
                    <p className="mt-1 text-[12px] text-white/55">
                      Basic details used across your Fireball and Shopify experiences.
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] text-white/55 uppercase tracking-[0.14em] mb-1.5">First name</p>
                    {editingField === 'firstName' ? (
                      <input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        onBlur={() => setEditingField(null)}
                        className="w-full rounded-2xl bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/35"
                        placeholder="First name"
                        autoFocus
                      />
                    ) : (
                      <div className="group relative w-full rounded-2xl bg-black/40 px-3.5 py-2.5 text-sm text-white/90 flex items-center justify-between cursor-default">
                        <span className="truncate">{firstName || '—'}</span>
                        <button
                          type="button"
                          onClick={() => setEditingField('firstName')}
                          className="opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.06] text-white/80 hover:bg-white/[0.14]"
                          aria-label="Edit first name"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                            <path d="m15 5 4 4" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] text-white/55 uppercase tracking-[0.14em] mb-1.5">Last name</p>
                    {editingField === 'lastName' ? (
                      <input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        onBlur={() => setEditingField(null)}
                        className="w-full rounded-2xl bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/35"
                        placeholder="Last name"
                        autoFocus
                      />
                    ) : (
                      <div className="group relative w-full rounded-2xl bg-black/40 px-3.5 py-2.5 text-sm text-white/90 flex items-center justify-between cursor-default">
                        <span className="truncate">{lastName || '—'}</span>
                        <button
                          type="button"
                          onClick={() => setEditingField('lastName')}
                          className="opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.06] text-white/80 hover:bg-white/[0.14]"
                          aria-label="Edit last name"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                            <path d="m15 5 4 4" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] text-white/55 uppercase tracking-[0.14em] mb-1.5">Email</p>
                    {editingField === 'email' ? (
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setEditingField(null)}
                        className="w-full rounded-2xl bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/35"
                        placeholder="Email"
                        autoFocus
                      />
                    ) : (
                      <div className="group relative w-full rounded-2xl bg-black/40 px-3.5 py-2.5 text-sm text-white/90 flex items-center justify-between cursor-default">
                        <span className="truncate">{email || '—'}</span>
                        <button
                          type="button"
                          onClick={() => setEditingField('email')}
                          className="opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.06] text-white/80 hover:bg-white/[0.14]"
                          aria-label="Edit email"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                            <path d="m15 5 4 4" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] text-white/55 uppercase tracking-[0.14em] mb-1.5">Phone number</p>
                    {editingField === 'phone' ? (
                      <input
                        value={phone}
                        onChange={(e) => setPhone(formatPhoneForDisplay(e.target.value))}
                        onBlur={() => setEditingField(null)}
                        className="w-full rounded-2xl bg-black/30 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/35"
                        placeholder="Phone number"
                        autoFocus
                      />
                    ) : (
                      <div className="group relative w-full rounded-2xl bg-black/30 px-3.5 py-2.5 text-sm text-white/80 flex items-center justify-between cursor-default">
                        <span className="truncate">{phone || '—'}</span>
                        <button
                          type="button"
                          onClick={() => setEditingField('phone')}
                          className="opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.06] text-white/80 hover:bg-white/[0.14]"
                          aria-label="Edit phone number"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                            <path d="m15 5 4 4" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] text-white/55 uppercase tracking-[0.14em] mb-1.5">Member ID</p>
                    <div className="group relative w-full rounded-2xl bg-black/60 px-3.5 py-2.5 text-sm text-white/80 font-mono flex items-center justify-between">
                      <span className="truncate">{memberId || '—'}</span>
                      {memberId && (
                        <button
                          type="button"
                          onClick={() => handleCopy('member-id', memberId)}
                          className="opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.06] text-white/80 hover:bg-white/[0.14]"
                          aria-label="Copy member ID"
                        >
                          {copiedField === 'member-id' ? (
                            <svg
                              className="w-3.5 h-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <svg
                              className="w-3.5 h-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-white/55 uppercase tracking-[0.14em] mb-1.5">Member since</p>
                    <div className="group relative w-full rounded-2xl bg-black/60 px-3.5 py-2.5 text-sm text-white/80 flex items-center justify-between">
                      <span className="truncate">
                        {memberSince
                          ? (() => {
                              const date = new Date(memberSince)
                              return Number.isNaN(date.getTime())
                                ? memberSince
                                : date.toLocaleDateString('fr-CA', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })
                            })()
                          : '—'}
                      </span>
                      {memberSince && (
                        <button
                          type="button"
                          onClick={() => handleCopy('member-since', memberSince)}
                          className="opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.06] text-white/80 hover:bg-white/[0.14]"
                          aria-label="Copy member since"
                        >
                          {copiedField === 'member-since' ? (
                            <svg
                              className="w-3.5 h-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <svg
                              className="w-3.5 h-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col items-end gap-2">
                  {saveError && (
                    <p className="text-[11px] text-red-300 text-right max-w-xs">{saveError}</p>
                  )}
                  {saveMessage && !saveError && (
                    <p className="text-[11px] text-emerald-300 text-right max-w-xs">{saveMessage}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="group inline-flex items-center text-[12px] font-nav font-bold uppercase tracking-[0.18em] text-white/85 hover:text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span className="mr-2 h-px w-0 bg-white transition-all duration-400 ease-out group-hover:w-12" />
                    <span>{saving ? 'Saving…' : 'Save changes'}</span>
                  </button>
                </div>
              </section>

              {/* Security */}
              <section id="settings-security" className="py-5 flex flex-col gap-3 border-t border-white/[0.06]">
                <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/55">
                  Security
                </p>
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-2 text-sm text-white/85 hover:text-white hover:bg-white/[0.04] rounded-2xl px-3 transition-colors"
                >
                  <span>Change password</span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-white/45">Email flow</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-2 text-sm text-white/85 hover:text-white hover:bg-white/[0.04] rounded-2xl px-3 transition-colors"
                >
                  <span>Enable 2FA</span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-white/45">Coming soon</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-2 text-sm text-white/85 hover:text-white hover:bg-white/[0.04] rounded-2xl px-3 transition-colors"
                >
                  <span>Active sessions</span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-white/45">Logout others</span>
                </button>
                <button
                  type="button"
                  className="mt-1 flex w-full items-center justify-between py-2 text-sm text-red-300 hover:text-red-200 hover:bg-red-500/10 rounded-2xl px-3 border border-red-500/30 transition-colors"
                >
                  <span>Delete account</span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-red-300">Danger zone</span>
                </button>
              </section>

              {/* Membership Overview (simplified) */}
              <section id="settings-membership" className="py-5 flex flex-col gap-3 border-t border-white/[0.06]">
                <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/55">
                  Membership
                </p>
                {(() => {
                  const tier = (subscriptionTier || '').trim().toLowerCase()
                  const hasMembership = tier === 'ignition' || tier === 'apex'
                  if (!hasMembership) {
                    return (
                      <>
                        <p className="text-[12px] text-white/60">
                          You do not have an active membership yet. Join the Fireball Car Club to unlock benefits.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <a
                            href="/car-club"
                            className="inline-flex items-center gap-2 text-sm font-nav text-white/80 hover:text-white transition-colors"
                          >
                            <span>Go to Car Club</span>
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 17L17 7M9 7h8v8"
                              />
                            </svg>
                          </a>
                        </div>
                      </>
                    )
                  }

                  const label = tier === 'apex' ? 'Apex' : 'Ignition'
                  const sinceText =
                    memberSince && !Number.isNaN(Date.parse(memberSince))
                      ? new Date(memberSince).toLocaleDateString('fr-CA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : memberSince || '—'

                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-white/85">
                        <div>
                          <p className="text-[11px] text-white/55 uppercase tracking-[0.14em]">Active membership</p>
                          <p className="mt-1">{label}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-white/55 uppercase tracking-[0.14em]">Since</p>
                          <p className="mt-1">{sinceText}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-white/55 uppercase tracking-[0.14em]">Renewal</p>
                          <p className="mt-1 text-white/60">Managed via your billing portal</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-white/55 uppercase tracking-[0.14em]">Cost</p>
                          <p className="mt-1 text-white/60">See billing portal</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <a
                          href="/car-club"
                          className="inline-flex items-center gap-2 text-sm font-nav text-white/80 hover:text-white transition-colors"
                        >
                          <span>Manage membership</span>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 17L17 7M9 7h8v8"
                            />
                          </svg>
                        </a>
                      </div>
                    </>
                  )
                })()}
              </section>

              {/* Payment Method */}
              <section id="settings-payment" className="py-5 flex flex-col gap-3 border-t border-white/[0.06]">
                <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/55">
                  Payment method
                </p>
                <p className="text-[12px] text-white/55">
                  Manage saved cards and billing through your secure Stripe or Shopify portal.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-white/[0.2] bg-white/[0.06] px-4 py-2 text-[11px] font-nav uppercase tracking-[0.16em] text-white/85 hover:bg-white/[0.14] hover:border-white/60 transition-colors"
                  >
                    Open billing portal
                  </button>
                </div>
              </section>

              {/* Billing History */}
              <section id="settings-billing" className="py-5 flex flex-col gap-3 border-t border-white/[0.06]">
                <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/55">
                  Billing history
                </p>
                <p className="text-[12px] text-white/55 mb-2">
                  Recent orders imported from Shopify. Detailed invoices coming soon.
                </p>
                <div className="space-y-2 text-sm text-white/85">
                  <div className="flex items-center justify-between text-[11px] text-white/45 uppercase tracking-[0.16em]">
                    <span>Date</span>
                    <span className="w-24 text-right">Amount</span>
                    <span className="w-20 text-right">Status</span>
                    <span className="w-28 text-right">Invoice</span>
                  </div>
                  <div className="h-px w-full bg-white/[0.08]" />
                  <p className="text-[12px] text-white/50">No billing history available yet.</p>
                </div>
              </section>

              {/* Digital Member Card */}
              <section id="settings-member-card" className="py-5 flex flex-col gap-4 border-t border-white/[0.06]">
                <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/55">
                  Digital member card
                </p>
                <div className="rounded-2xl border border-white/[0.18] bg-gradient-to-br from-white/[0.08] to-white/[0.02] px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.6)]">
                  <p className="text-[11px] text-white/65 uppercase tracking-[0.14em] mb-1.5">Preview</p>
                  <div className="h-28 rounded-xl bg-black/40 border border-white/15 flex items-center justify-center text-white/60 text-xs">
                    Digital member card preview
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-white/[0.2] bg-white/[0.06] px-4 py-2 text-[11px] font-nav uppercase tracking-[0.16em] text-white/85 hover:bg-white/[0.14] hover:border-white/60 transition-colors"
                  >
                    Download card
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-white/[0.2] bg-transparent px-4 py-2 text-[11px] font-nav uppercase tracking-[0.16em] text-white/70 hover:bg-white/[0.06] transition-colors"
                  >
                    Share profile link
                  </button>
                </div>
              </section>

              {/* Communication Preferences */}
              <section id="settings-communication" className="py-5 flex flex-col gap-4 border-t border-white/[0.06]">
                <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/55">
                  Communication preferences
                </p>
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-sm text-white/85">Email notifications</span>
                  <button
                    type="button"
                    onClick={() => setOrdersEmails((v) => !v)}
                    className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${
                      ordersEmails ? 'bg-emerald-500' : 'bg-white/[0.20]'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${
                        ordersEmails ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </label>
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-sm text-white/85">Product launches</span>
                  <button
                    type="button"
                    onClick={() => setNewsletter((v) => !v)}
                    className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${
                      newsletter ? 'bg-emerald-500' : 'bg-white/[0.20]'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${
                        newsletter ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </label>
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-sm text-white/85">Events</span>
                  <button
                    type="button"
                    className="w-10 h-6 rounded-full flex items-center px-1 bg-white/[0.20]"
                  >
                    <span className="w-4 h-4 bg-white rounded-full shadow-sm transform translate-x-0" />
                  </button>
                </label>
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-sm text-white/85">Partner offers</span>
                  <button
                    type="button"
                    className="w-10 h-6 rounded-full flex items-center px-1 bg-white/[0.20]"
                  >
                    <span className="w-4 h-4 bg-white rounded-full shadow-sm transform translate-x-0" />
                  </button>
                </label>
              </section>

              {/* Business Information (placeholder, only for partners later) */}
              <section id="settings-business" className="py-5 flex flex-col gap-3 border-t border-white/[0.06]">
                <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/55">
                  Business information
                </p>
                <p className="text-[12px] text-white/55 mb-2">
                  Visible only for partners. Business details editing will be connected to your partner profile.
                </p>
              </section>

              {/* Certification Status */}
              <section id="settings-certification" className="py-5 flex flex-col gap-3 border-t border-white/[0.06]">
                <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/55">
                  Certification status
                </p>
                <p className="text-[12px] text-white/55">
                  Certification details will appear here when available (academy history, certified products, expiry).
                </p>
              </section>

              {/* Warranty Management */}
              <section id="settings-warranty" className="py-5 flex flex-col gap-3 border-t border-white/[0.06]">
                <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/55">
                  Warranty management
                </p>
                <p className="text-[12px] text-white/55">
                  View and export registered warranties once they are connected to your account.
                </p>
              </section>

              {/* Notifications Center */}
              <section id="settings-notifications" className="py-5 flex flex-col gap-3 border-t border-white/[0.06]">
                <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/55">
                  Notifications center
                </p>
                <p className="text-[12px] text-white/55">
                  A feed of your latest XP events, tier upgrades and membership reminders will appear here.
                </p>
              </section>

              {/* Danger Zone */}
              <section
                id="settings-danger-zone"
                className="mt-4 rounded-3xl border border-red-500/40 bg-red-500/[0.07] px-5 py-5 flex flex-col gap-3"
              >
                <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-red-200">
                  Danger zone
                </p>
                <p className="text-[12px] text-red-100/90">
                  Deactivating or deleting your account will affect access to your membership, XP and billing history.
                </p>
                <div className="mt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-xl border border-red-400/50 bg-transparent px-4 py-2.5 text-[12px] font-nav font-bold uppercase tracking-[0.16em] text-red-200 hover:bg-red-500/10 transition-colors"
                  >
                    Deactivate account
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-[12px] font-nav font-bold uppercase tracking-[0.16em] text-white hover:bg-red-500/90 transition-colors"
                  >
                    Delete account
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Mobile close button (floating) */}
        <button
          type="button"
          onClick={onClose}
          className={`lg:hidden pointer-events-auto flex items-center justify-start rounded-full border border-white/[0.18] bg-white/[0.12] backdrop-blur-md text-white/85 hover:bg-white/[0.2] hover:text-white transition-all duration-300 ease-in-out overflow-hidden absolute right-5 bottom-5 z-20 shadow-[0_12px_35px_rgba(0,0,0,0.6)] ${
            scrolledDown ? 'w-11 h-11' : 'w-[130px] h-11'
          }`}
        >
          <div
            className={`flex items-center justify-center transition-all duration-300 ease-in-out ${
              scrolledDown ? 'w-full pl-0' : 'w-[32%] pl-3'
            }`}
          >
            <svg
              className="w-[17px] h-[17px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
            >
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div
            className={`text-white text-[13px] font-semibold transition-all duration-300 ease-in-out whitespace-nowrap ${
              scrolledDown ? 'opacity-0 w-0 pr-0' : 'opacity-100 w-[68%] pr-3'
            }`}
          >
            Close
          </div>
        </button>
      </div>
      <style>{`
        @keyframes settingsSlideUp {
          from {
            transform: translateY(100%);
            opacity: 0.98;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes settingsSlideDown {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(100%);
            opacity: 0.98;
          }
        }
      `}</style>
    </div>
  )
}

