import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile, isAuthenticated } from '@/utils/supabaseAuth'
import { updateShopifyCustomer } from '@/utils/shopifySync'

interface SearchSuggestion {
  section: string
  subsection: string
  description: string
}

interface UnsavedChanges {
  section: string
  field: string
  oldValue: string
  newValue: string
}

const SEARCH_SUGGESTIONS: SearchSuggestion[] = [
  { section: 'Profile', subsection: 'Name', description: 'Update your first and last name' },
  { section: 'Security', subsection: 'Email', description: 'Change your email address' },
  { section: 'Security', subsection: 'Password', description: 'Update your account password' },
  { section: 'Notifications', subsection: 'Order updates', description: 'Emails about your purchases and orders' },
  { section: 'Notifications', subsection: 'News & drops', description: 'Product launches and promotions' },
  { section: 'Notifications', subsection: 'Push notifications', description: 'Browser notifications for updates' },
  { section: 'Connected Accounts', subsection: 'Google', description: 'Manage Google account connection' },
  { section: 'Connected Accounts', subsection: 'Email', description: 'Manage email account connection' },
  { section: 'Cookie Preferences', subsection: 'Consent', description: 'Manage your cookie consent choices' },
  { section: 'Installer Status', subsection: 'Status', description: 'View your installer certification status' },
  { section: 'Installer Status', subsection: 'Company', description: 'View your company information' },
  { section: 'Danger Zone', subsection: 'Delete Account', description: 'Permanently delete your account' },
]

export function AccountSettings() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [unsavedChanges, setUnsavedChanges] = useState<UnsavedChanges | null>(null)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Original values for comparison
  const [originalFirstName, setOriginalFirstName] = useState('')
  const [originalLastName, setOriginalLastName] = useState('')
  const [originalEmail, setOriginalEmail] = useState('')
  const [originalOrderEmails, setOriginalOrderEmails] = useState(true)
  const [originalMarketingEmails, setOriginalMarketingEmails] = useState(true)
  const [originalPushNotifications, setOriginalPushNotifications] = useState(false)
  const [originalGoogleConnected, setOriginalGoogleConnected] = useState(false)
  const [originalEmailConnected, setOriginalEmailConnected] = useState(true)

  // Profile state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)

  // Security state
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingSecurity, setSavingSecurity] = useState(false)
  const [securityError, setSecurityError] = useState<string | null>(null)
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null)

  // Notifications state
  const [orderEmails, setOrderEmails] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [savingNotifications, setSavingNotifications] = useState(false)
  const [notificationsError, setNotificationsError] = useState<string | null>(null)
  const [notificationsSuccess, setNotificationsSuccess] = useState<string | null>(null)
  const [performanceCookies, setPerformanceCookies] = useState(true)
  const [thirdPartyCookies, setThirdPartyCookies] = useState(false)

  // Connected Accounts state
  const [googleConnected, setGoogleConnected] = useState(false)
  const [emailConnected, setEmailConnected] = useState(true)
  const [hasPassword, setHasPassword] = useState(true)
  const [settingPassword, setSettingPassword] = useState(false)
  const [passwordForGoogleAccount, setPasswordForGoogleAccount] = useState('')
  const [confirmPasswordForGoogleAccount, setConfirmPasswordForGoogleAccount] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  // Installer Status state
  const [isInstaller, setIsInstaller] = useState(false)
  const [installerStatus, setInstallerStatus] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)

  // Check for unsaved changes
  const hasProfileChanges = firstName !== originalFirstName || lastName !== originalLastName
  const hasSecurityChanges = email !== originalEmail || (newPassword !== '' && newPassword.length >= 6 && newPassword === confirmPassword)
  const hasNotificationsChanges = orderEmails !== originalOrderEmails || marketingEmails !== originalMarketingEmails || pushNotifications !== originalPushNotifications

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = SEARCH_SUGGESTIONS.filter(
        (suggestion) =>
          suggestion.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
          suggestion.subsection.toLowerCase().includes(searchQuery.toLowerCase()) ||
          suggestion.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setSearchSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setSearchSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchQuery])

  // Block navigation if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasProfileChanges || hasSecurityChanges || hasNotificationsChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasProfileChanges, hasSecurityChanges, hasNotificationsChanges])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.subsection)
    setShowSuggestions(false)
    
    // Scroll to the section
    const sectionMap: Record<string, string> = {
      'Profile': 'profile-section',
      'Security': 'security-section',
      'Notifications': 'notifications-section',
      'Cookie Preferences': 'cookie-settings-section',
      'Connected Accounts': 'connected-accounts-section',
      'Installer Status': 'installer-status-section',
      'Danger Zone': 'danger-zone-section',
    }
    
    const sectionId = sectionMap[suggestion.section]
    if (sectionId) {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  const checkUnsavedChanges = (targetPath: string) => {
    if (hasProfileChanges) {
      const changes: UnsavedChanges = {
        section: 'Profile',
        field: firstName !== originalFirstName ? 'First name' : 'Last name',
        oldValue: firstName !== originalFirstName ? originalFirstName : originalLastName,
        newValue: firstName !== originalFirstName ? firstName : lastName,
      }
      setUnsavedChanges(changes)
      setPendingNavigation(targetPath)
      setShowUnsavedModal(true)
      return false
    }
    if (hasSecurityChanges) {
      const changes: UnsavedChanges = {
        section: 'Security',
        field: email !== originalEmail ? 'Email' : 'Password',
        oldValue: email !== originalEmail ? originalEmail : '••••••••',
        newValue: email !== originalEmail ? email : '••••••••',
      }
      setUnsavedChanges(changes)
      setPendingNavigation(targetPath)
      setShowUnsavedModal(true)
      return false
    }
    if (hasNotificationsChanges) {
      const changes: UnsavedChanges = {
        section: 'Notifications',
        field: orderEmails !== originalOrderEmails ? 'Order updates' : marketingEmails !== originalMarketingEmails ? 'News & drops' : 'Push notifications',
        oldValue: orderEmails !== originalOrderEmails ? String(originalOrderEmails) : marketingEmails !== originalMarketingEmails ? String(originalMarketingEmails) : String(originalPushNotifications),
        newValue: orderEmails !== originalOrderEmails ? String(orderEmails) : marketingEmails !== originalMarketingEmails ? String(marketingEmails) : String(pushNotifications),
      }
      setUnsavedChanges(changes)
      setPendingNavigation(targetPath)
      setShowUnsavedModal(true)
      return false
    }
    return true
  }

  const handleDiscardChanges = () => {
    // Reset to original values
    setFirstName(originalFirstName)
    setLastName(originalLastName)
    setEmail(originalEmail)
    setOrderEmails(originalOrderEmails)
    setMarketingEmails(originalMarketingEmails)
    setPushNotifications(originalPushNotifications)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    
    setShowUnsavedModal(false)
    setUnsavedChanges(null)
    if (pendingNavigation) {
      navigate(pendingNavigation)
      setPendingNavigation(null)
    }
  }


  const handleCancelNavigation = () => {
    setShowUnsavedModal(false)
    setUnsavedChanges(null)
    setPendingNavigation(null)
  }

  useEffect(() => {
    document.title = 'Account Settings | Fireball Canada'

    let cancelled = false

    const load = async () => {
      try {
        const auth = await isAuthenticated()
        if (!auth) {
          if (!cancelled) {
            navigate('/account', { replace: true })
          }
          return
        }

        const profile = await getCurrentUserProfile()
        if (!profile) {
          if (!cancelled) {
            navigate('/account', { replace: true })
          }
          return
        }

        if (cancelled) return

        const first = profile.first_name || ''
        const last = profile.last_name || ''
        const emailValue = profile.email || ''
        
        setFirstName(first)
        setLastName(last)
        setEmail(emailValue)
        setOriginalFirstName(first)
        setOriginalLastName(last)
        setOriginalEmail(emailValue)
        
        setIsInstaller(profile.role === 'partner' || profile.partner_status === 'partner')
        setInstallerStatus(profile.partner_status || null)
        setCompanyName(profile.company_name || null)

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user && !cancelled) {
          const metadata = (user.user_metadata || {}) as Record<string, unknown>
          const orderPref = (metadata.order_emails as boolean | undefined)
          const marketingPref = (metadata.marketing_emails as boolean | undefined)
          const pushPref = (metadata.push_notifications as boolean | undefined)
          
          setOrderEmails(orderPref !== false)
          setMarketingEmails(marketingPref !== false)
          setPushNotifications(pushPref === true)
          setOriginalOrderEmails(orderPref !== false)
          setOriginalMarketingEmails(marketingPref !== false)
          setOriginalPushNotifications(pushPref === true)

          // Check connected accounts
          const identities = user.identities || []
          const isGoogleConnected = identities.some((identity: any) => identity.provider === 'google')
          const hasEmailProvider = identities.some((identity: any) => identity.provider === 'email')
          
          setGoogleConnected(isGoogleConnected)
          setEmailConnected(hasEmailProvider || !isGoogleConnected) // Email is always connected if not Google-only
          
          // Check if user has password (if connected only with Google, they might not have a password)
          setHasPassword(hasEmailProvider || !isGoogleConnected)
        }
      } catch (e) {
        console.error('Error loading settings:', e)
        if (!cancelled) {
          setProfileError("Unable to load your settings at this time.")
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

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    if (savingProfile) return

    setSavingProfile(true)
    setProfileError(null)
    setProfileSuccess(null)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
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
        throw new Error('Error updating profile.')
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          first_name: cleanFirst,
          last_name: cleanLast,
        },
      })

      if (authError) {
        console.error('Error updating auth metadata:', authError)
        throw new Error("Error updating your account.")
      }

      try {
        const profile = await getCurrentUserProfile()
        if (profile?.email) {
          await updateShopifyCustomer({
            email: profile.email,
            first_name: cleanFirst,
            last_name: cleanLast,
          })
        }
      } catch (shopifyError) {
        console.error('Shopify customer update failed:', shopifyError)
      }

      setOriginalFirstName(cleanFirst)
      setOriginalLastName(cleanLast)
      setProfileSuccess('Your settings have been updated.')
    } catch (e) {
      console.error('Error saving profile:', e)
      setProfileError('Unable to save your settings. Please try again in a few moments.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSaveSecurity = async (event: React.FormEvent) => {
    event.preventDefault()
    if (savingSecurity) return

    if (newPassword && newPassword.length < 6) {
      setSecurityError('Password must be at least 6 characters long.')
      return
    }

    if (newPassword && newPassword !== confirmPassword) {
      setSecurityError('Passwords do not match.')
      return
    }

    setSavingSecurity(true)
    setSecurityError(null)
    setSecuritySuccess(null)

    try {
      if (email && email !== originalEmail) {
        const { error: emailError } = await supabase.auth.updateUser({ email })
        if (emailError) {
          throw new Error(emailError.message || 'Error updating email.')
        }
        setOriginalEmail(email)
      }

      if (newPassword) {
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) {
          throw new Error(error.message || 'Error updating password.')
        }
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }

      setSecuritySuccess('Your security settings have been updated.')
    } catch (e) {
      console.error('Error saving security:', e)
      setSecurityError(e instanceof Error ? e.message : 'Unable to save your security settings. Please try again in a few moments.')
    } finally {
      setSavingSecurity(false)
    }
  }

  const handleSaveNotifications = async () => {
    if (savingNotifications) return

    setSavingNotifications(true)
    setNotificationsError(null)
    setNotificationsSuccess(null)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          order_emails: orderEmails,
          marketing_emails: marketingEmails,
          push_notifications: pushNotifications,
        },
      })

      if (authError) {
        throw new Error("Error updating your preferences.")
      }

      setOriginalOrderEmails(orderEmails)
      setOriginalMarketingEmails(marketingEmails)
      setOriginalPushNotifications(pushNotifications)
      setNotificationsSuccess('Your preferences have been updated.')
    } catch (e) {
      console.error('Error saving notifications:', e)
      setNotificationsError('Unable to save your preferences. Please try again in a few moments.')
    } finally {
      setSavingNotifications(false)
    }
  }

  const handleGoogleConnect = async () => {
    if (googleConnected) {
      // Disconnect Google account
      if (!hasPassword) {
        setPasswordError('Please set a password before disconnecting Google account.')
        return
      }

      try {
        setPasswordError(null)
        setPasswordSuccess(null)

        // Unlink the Google identity
        const { error } = await supabase.auth.unlinkIdentity({ provider: 'google' })

        if (error) {
          setPasswordError(error.message || 'Failed to disconnect Google account.')
          return
        }

        setPasswordSuccess('Google account disconnected successfully.')
        
        // Reload user identities to reflect changes
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const identities = user.identities || []
          const isGoogleConnected = identities.some((identity: any) => identity.provider === 'google')
          const hasEmailProvider = identities.some((identity: any) => identity.provider === 'email')
          
          setGoogleConnected(isGoogleConnected)
          setEmailConnected(hasEmailProvider || !isGoogleConnected)
          setHasPassword(hasEmailProvider || !isGoogleConnected)
        }
      } catch (err) {
        setPasswordError(err instanceof Error ? err.message : 'Failed to disconnect Google account.')
      }
      return
    }

    // Connect Google account
    try {
      setPasswordError(null)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/account/settings`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      if (error) {
        setPasswordError(error.message || 'Failed to connect Google account')
      }
      // If no error, Supabase will redirect the user to Google
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to connect Google account')
    }
  }

  const handleSetPasswordForGoogleAccount = async () => {
    if (!passwordForGoogleAccount || passwordForGoogleAccount.length < 6) {
      setPasswordError('Password must be at least 6 characters long.')
      return
    }

    if (passwordForGoogleAccount !== confirmPasswordForGoogleAccount) {
      setPasswordError('Passwords do not match.')
      return
    }

    setSettingPassword(true)
    setPasswordError(null)
    setPasswordSuccess(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForGoogleAccount,
      })

      if (error) {
        throw new Error(error.message || 'Error setting password.')
      }

      setHasPassword(true)
      setPasswordForGoogleAccount('')
      setConfirmPasswordForGoogleAccount('')
      setPasswordSuccess('Password has been set successfully.')
    } catch (e) {
      console.error('Error setting password:', e)
      setPasswordError(e instanceof Error ? e.message : 'Unable to set password. Please try again.')
    } finally {
      setSettingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeletingAccount(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      alert('Account deletion must be done through support. Contact us at contact@fireball.fr')
    } catch (e) {
      console.error('Error deleting account:', e)
      alert('Error deleting account.')
    } finally {
      setDeletingAccount(false)
      setShowDeleteModal(false)
    }
  }

  if (loading) {
    return (
      <section className="relative min-h-screen bg-white text-carbon-900 flex items-center justify-center">
        <div className="text-carbon-500">Loading…</div>
      </section>
    )
  }

  return (
    <section className="relative min-h-screen bg-white text-carbon-900">

      {/* Unsaved Changes Modal */}
      {showUnsavedModal && unsavedChanges && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-white/20 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Unsaved Changes</h3>
            <p className="text-sm text-white/70 mb-4">
              You have unsaved changes in <strong>{unsavedChanges.section}</strong>.
            </p>
            <div className="bg-black/40 rounded-lg p-4 mb-4 space-y-2">
              <div>
                <p className="text-xs text-white/50 mb-1">Field: {unsavedChanges.field}</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-white/50 mb-1">Before:</p>
                    <p className="text-sm text-white/90">{unsavedChanges.oldValue || '(empty)'}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white/50 mb-1">After:</p>
                    <p className="text-sm text-white/90">{unsavedChanges.newValue || '(empty)'}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancelNavigation}
                className="px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDiscardChanges}
                className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 hover:bg-red-500/30 transition-colors"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-[500px] rounded-[24px] bg-[#ececec] p-6 shadow-[0_14px_36px_rgba(0,0,0,0.28)]">
            <div className="mb-4 flex items-start justify-between">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#f8d8dd] text-[#ff3b45]">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5" />
                  <path d="M12 16h.01" />
                </svg>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#d8d8da] text-[#6c6c71] transition-colors hover:bg-[#cfd0d3]"
                aria-label="Close delete account popup"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <h3 className="text-[28px] leading-[1.1] font-semibold tracking-tight text-[#252528]">
              Delete your account?
            </h3>
            <p className="mt-3 text-[17px] leading-[1.5] font-normal text-[#6c6c71]">
              This will permanently delete your account and remove all your data from our servers. This action is irreversible.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="inline-flex items-center justify-center rounded-full bg-[#dcdcdf] px-6 py-2.5 text-base font-medium leading-none text-[#4a4a4f] transition-colors hover:bg-[#d2d3d6]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="inline-flex items-center justify-center rounded-full bg-[#ff3b45] px-6 py-2.5 text-base font-semibold leading-none text-white transition-colors hover:bg-[#ff2d3a] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deletingAccount ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-[1000px] mx-auto px-6 md:px-10 lg:px-16 py-12">
        {/* Fixed Header Section */}
        <div className="mb-12 text-center">
          {/* Title */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl lg:text-[40px] font-semibold tracking-[-0.03em]" style={{ color: '#111111' }}>
              Account Settings
            </h1>
          </div>

          {/* Description and Search */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <p className="text-sm text-carbon-600 max-w-xl">
              Settings and preference for your application.
            </p>
            <div className="relative w-full max-w-md">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowSuggestions(true)}
                placeholder="Search settings..."
                className="w-full rounded-lg border border-carbon-200 bg-white px-4 py-2.5 text-sm text-carbon-900 placeholder:text-carbon-400 focus:outline-none focus:border-carbon-400"
              />
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-carbon-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {showSuggestions && searchSuggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-carbon-200 bg-white shadow-xl z-50 max-h-64 overflow-y-auto"
                >
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-carbon-50 transition-colors border-b border-carbon-100 last:border-b-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm text-carbon-900 font-medium">{suggestion.subsection}</p>
                          <p className="text-xs text-carbon-600 mt-0.5">{suggestion.description}</p>
                        </div>
                        <span className="text-xs text-carbon-500">{suggestion.section}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* All Settings in One Block - Centered */}
        <div className="max-w-3xl mx-auto space-y-12">
          {/* Profile Section */}
          <div id="profile-section">
            <h2 className="text-xl font-semibold text-carbon-900 mb-6 text-left">Profile</h2>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {profileError && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-[13px] text-red-100">
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[13px] text-emerald-100">
                  {profileSuccess}
                </div>
              )}
              
              <div className="space-y-6">
                {/* Name */}
                <div className="flex items-start gap-8">
                  <div className="w-48 text-left">
                    <label className="text-sm text-carbon-900 font-medium">Name</label>
                    <p className="text-[11px] text-carbon-600 mt-1">
                      Update your first and last name
                    </p>
                  </div>
                  <div className="flex-1 space-y-4">
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-lg border border-carbon-200 bg-white px-3.5 py-2.5 text-sm text-carbon-900 placeholder:text-carbon-400 focus:outline-none focus:border-carbon-400"
                      placeholder="First name"
                    />
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-lg border border-carbon-200 bg-white px-3.5 py-2.5 text-sm text-carbon-900 placeholder:text-carbon-400 focus:outline-none focus:border-carbon-400"
                      placeholder="Last name"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 h-8">
                <button
                  type="submit"
                  disabled={savingProfile || !hasProfileChanges}
                  className={`group inline-flex items-center gap-2 text-sm font-medium text-carbon-900 hover:text-[#9C1B30] transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                    !hasProfileChanges ? 'opacity-0 pointer-events-none' : 'opacity-100'
                  }`}
                >
                  Save changes
                  <svg className="w-4 h-4 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          {/* Security Section */}
          <div id="security-section">
            <h2 className="text-xl font-semibold text-carbon-900 mb-6 text-left">Security</h2>
            <form onSubmit={handleSaveSecurity} className="space-y-6">
              {securityError && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-[13px] text-red-100">
                  {securityError}
                </div>
              )}
              {securitySuccess && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[13px] text-emerald-100">
                  {securitySuccess}
                </div>
              )}
              
              <div className="space-y-6">
                {/* Email */}
                <div className="flex items-center gap-8">
                  <div className="w-48 text-left">
                    <label className="text-sm text-carbon-900 font-medium">Email</label>
                    <p className="text-[11px] text-carbon-600 mt-1">
                      Change your email address
                    </p>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 rounded-lg border border-carbon-200 bg-white px-3.5 py-2.5 text-sm text-carbon-900 placeholder:text-carbon-400 focus:outline-none focus:border-carbon-400"
                    placeholder="Email address"
                  />
                </div>

                {/* Divider */}
                <div className="h-px bg-white/10" />

                {/* Password */}
                <div className="flex items-start gap-8">
                  <div className="w-48 text-left">
                    <label className="text-sm text-carbon-900 font-medium">Password</label>
                    <p className="text-[11px] text-carbon-600 mt-1">
                      Update your account password
                    </p>
                  </div>
                  <div className="flex-1 space-y-4">
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-lg border border-carbon-200 bg-white px-3.5 py-2.5 text-sm text-carbon-900 placeholder:text-carbon-400 focus:outline-none focus:border-carbon-400"
                      placeholder="Current password"
                    />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-lg border border-carbon-200 bg-white px-3.5 py-2.5 text-sm text-carbon-900 placeholder:text-carbon-400 focus:outline-none focus:border-carbon-400"
                      placeholder="New password (min. 6 characters)"
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-lg border border-carbon-200 bg-white px-3.5 py-2.5 text-sm text-carbon-900 placeholder:text-carbon-400 focus:outline-none focus:border-carbon-400"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 h-8">
                <button
                  type="submit"
                  disabled={savingSecurity || !hasSecurityChanges}
                  className={`group inline-flex items-center gap-2 text-sm font-medium text-carbon-900 hover:text-[#9C1B30] transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                    !hasSecurityChanges ? 'opacity-0 pointer-events-none' : 'opacity-100'
                  }`}
                >
                  Update security
                  <svg className="w-4 h-4 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          {/* Notifications Section */}
          <div id="notifications-section">
            <h2 className="text-xl font-semibold text-carbon-900 mb-6 text-left">Notifications</h2>
            <div className="space-y-6">
              {notificationsError && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-[13px] text-red-100">
                  {notificationsError}
                </div>
              )}
              {notificationsSuccess && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[13px] text-emerald-100">
                  {notificationsSuccess}
                </div>
              )}
              
              <div className="space-y-6">
                {/* Order Emails */}
                <div className="flex items-center gap-8">
                  <div className="w-48 text-left">
                    <p className="text-sm text-carbon-900 font-medium">Order updates</p>
                    <p className="text-[11px] text-carbon-600 mt-1">
                      Emails about your purchases and orders
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOrderEmails((v) => !v)}
                    className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${
                      orderEmails ? 'bg-emerald-500' : 'bg-[#9CA3AF]'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${
                        orderEmails ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/10" />

                {/* Marketing Emails */}
                <div className="flex items-center gap-8">
                  <div className="w-48 text-left">
                    <p className="text-sm text-carbon-900 font-medium">News & drops</p>
                    <p className="text-[11px] text-carbon-600 mt-1">
                      Product launches and promotions
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMarketingEmails((v) => !v)}
                    className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${
                      marketingEmails ? 'bg-emerald-500' : 'bg-[#9CA3AF]'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${
                        marketingEmails ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/10" />

                {/* Push Notifications */}
                <div className="flex items-center gap-8">
                  <div className="w-48 text-left">
                    <p className="text-sm text-carbon-900 font-medium">Push notifications</p>
                    <p className="text-[11px] text-carbon-600 mt-1">
                      Browser notifications for updates
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPushNotifications((v) => !v)}
                    className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${
                      pushNotifications ? 'bg-emerald-500' : 'bg-[#9CA3AF]'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${
                        pushNotifications ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-4 h-8">
                <button
                  type="button"
                  onClick={handleSaveNotifications}
                  disabled={savingNotifications || !hasNotificationsChanges}
                  className={`group inline-flex items-center gap-2 text-sm font-medium text-carbon-900 hover:text-[#9C1B30] transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                    !hasNotificationsChanges ? 'opacity-0 pointer-events-none' : 'opacity-100'
                  }`}
                >
                  Save preferences
                  <svg className="w-4 h-4 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Cookie Preferences Section */}
          <div id="cookie-settings-section">
            <h2 className="text-xl font-semibold text-carbon-900 mb-6 text-left">Cookie Preferences</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-8">
                <div className="w-48 text-left">
                  <p className="text-sm text-carbon-900 font-medium">Strictly Necessary</p>
                  <p className="text-[11px] text-carbon-600 mt-1">
                    Required for core functionality (cannot be disabled)
                  </p>
                </div>
                <button
                  type="button"
                  disabled
                  className="w-10 h-6 rounded-full flex items-center px-1 bg-emerald-500 cursor-not-allowed opacity-80"
                  aria-label="Strictly Necessary cookies enabled"
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow-sm transform translate-x-4" />
                </button>
              </div>

              <div className="h-px bg-carbon-200" />

              <div className="flex items-center gap-8">
                <div className="w-48 text-left">
                  <p className="text-sm text-carbon-900 font-medium">Performance</p>
                  <p className="text-[11px] text-carbon-600 mt-1">
                    Help us improve speed and overall experience
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPerformanceCookies((v) => !v)}
                  className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${
                    performanceCookies ? 'bg-emerald-500' : 'bg-[#9CA3AF]'
                  }`}
                >
                  <span
                    className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${
                      performanceCookies ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="h-px bg-carbon-200" />

              <div className="flex items-center gap-8">
                <div className="w-48 text-left">
                  <p className="text-sm text-carbon-900 font-medium">Third Party Content</p>
                  <p className="text-[11px] text-carbon-600 mt-1">
                    Enable external embeds and third-party content
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setThirdPartyCookies((v) => !v)}
                  className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${
                    thirdPartyCookies ? 'bg-emerald-500' : 'bg-[#9CA3AF]'
                  }`}
                >
                  <span
                    className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${
                      thirdPartyCookies ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Connected Accounts Section */}
          <div id="connected-accounts-section">
            <h2 className="text-xl font-semibold text-carbon-900 mb-6 text-left">Connected Accounts</h2>
            <div className="space-y-6">
              {passwordError && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-[13px] text-red-100">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[13px] text-emerald-100">
                  {passwordSuccess}
                </div>
              )}
              
              <div className="space-y-6">
                {/* Google */}
                <div className="flex items-center gap-8">
                  <div className="w-48 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
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
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-carbon-900 font-medium">Google</p>
                      <p className="text-[11px] text-carbon-600 mt-0.5">
                        Manage Google account connection
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleConnect}
                    className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors ${
                      googleConnected ? 'bg-emerald-500' : 'bg-[#9CA3AF]'
                    }`}
                  >
                    <span
                      className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
                        googleConnected ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/10" />

                {/* Email */}
                <div className="flex items-start gap-8">
                  <div className="w-48 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-carbon-900 font-medium">Email</p>
                      <p className="text-[11px] text-carbon-600 mt-0.5">
                        {hasPassword ? 'Email account is connected' : 'Set a password for your account'}
                      </p>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    {!hasPassword && googleConnected && (
                      <>
                        {passwordError && (
                          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-[13px] text-red-100">
                            {passwordError}
                          </div>
                        )}
                        {passwordSuccess && (
                          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[13px] text-emerald-100">
                            {passwordSuccess}
                          </div>
                        )}
                        <input
                          type="password"
                          value={passwordForGoogleAccount}
                          onChange={(e) => setPasswordForGoogleAccount(e.target.value)}
                          className="w-full rounded-lg border border-carbon-200 bg-white px-3.5 py-2.5 text-sm text-carbon-900 placeholder:text-carbon-400 focus:outline-none focus:border-carbon-400"
                          placeholder="Set password (min. 6 characters)"
                        />
                        <input
                          type="password"
                          value={confirmPasswordForGoogleAccount}
                          onChange={(e) => setConfirmPasswordForGoogleAccount(e.target.value)}
                          className="w-full rounded-lg border border-carbon-200 bg-white px-3.5 py-2.5 text-sm text-carbon-900 placeholder:text-carbon-400 focus:outline-none focus:border-carbon-400"
                          placeholder="Confirm password"
                        />
                        <button
                          type="button"
                          onClick={handleSetPasswordForGoogleAccount}
                          disabled={settingPassword || !passwordForGoogleAccount || passwordForGoogleAccount.length < 6}
                          className="group inline-flex items-center gap-2 text-sm font-medium text-carbon-900 hover:text-[#9C1B30] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Set password
                          <svg className="w-4 h-4 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </button>
                      </>
                    )}
                    {hasPassword && (
                      <div className="flex items-center">
                        <span className="text-[11px] font-medium text-emerald-400">Connected</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Installer Status Section */}
          {isInstaller && (
            <div id="installer-status-section">
              <h2 className="text-xl font-semibold text-carbon-900 mb-6 text-left">Installer Status</h2>
              <div className="space-y-6">
                <div className="flex items-center gap-8">
                  <div className="w-48 text-left">
                    <p className="text-sm text-carbon-900 font-medium">Status</p>
                    <p className="text-[11px] text-carbon-600 mt-1">
                      View your installer certification status
                    </p>
                  </div>
                  <div className="flex-1">
                    <span className={`text-[11px] font-medium px-2 py-1 rounded-full ${
                      installerStatus === 'partner' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {installerStatus === 'partner' ? 'Active' : 'Pending'}
                    </span>
                  </div>
                </div>

                {companyName && (
                  <>
                    <div className="h-px bg-white/10" />
                    <div className="flex items-center gap-8">
                      <div className="w-48 text-left">
                        <p className="text-sm text-carbon-900 font-medium">Company</p>
                        <p className="text-[11px] text-carbon-600 mt-1">
                          View your company information
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-carbon-700">{companyName}</p>
                      </div>
                    </div>
                  </>
                )}

                <div className="h-px bg-white/10" />
              </div>
            </div>
          )}

          {/* Danger Zone Section */}
          <div id="danger-zone-section">
            <h2 className="text-xl font-semibold text-carbon-900 mb-6 text-left">Danger Zone</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-8">
                <div className="w-48 text-left">
                  <p className="text-sm text-carbon-900 font-medium">Delete Account</p>
                  <p className="text-[11px] text-carbon-600 mt-1">
                    Permanently delete your account
                  </p>
                </div>
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="inline-flex items-center justify-center rounded-full bg-[#ff3b45] px-6 py-2.5 text-sm font-semibold leading-none text-white transition-colors hover:bg-[#ff2d3a]"
                    >
                      Delete Account
                    </button>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
