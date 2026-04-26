import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile, isAuthenticated } from '@/utils/supabaseAuth'
import { updateShopifyCustomer } from '@/utils/shopifySync'

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors shrink-0 ${
        checked ? 'bg-emerald-500' : 'bg-[#9CA3AF]'
      } ${disabled ? 'cursor-not-allowed opacity-80' : ''}`}
    >
      <span
        className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[13px] font-semibold text-neutral-400 uppercase tracking-widest px-5 mb-2">
      {children}
    </h3>
  )
}

function Row({ label, description, right }: { label: string; description?: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5 bg-white border-b border-neutral-100 last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-neutral-900 leading-tight">{label}</p>
        {description && <p className="text-[11px] text-neutral-500 mt-0.5 leading-tight">{description}</p>}
      </div>
      <div className="shrink-0">{right}</div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-5 rounded-2xl overflow-hidden border border-neutral-100 bg-white">
      {children}
    </div>
  )
}

function SuccessBanner({ msg }: { msg: string }) {
  return (
    <div className="mx-5 rounded-xl border border-emerald-500/40 bg-emerald-50 px-4 py-2.5 text-[12px] text-emerald-700">
      {msg}
    </div>
  )
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="mx-5 rounded-xl border border-red-400/40 bg-red-50 px-4 py-2.5 text-[12px] text-red-600">
      {msg}
    </div>
  )
}

function InputField({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder: string; type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
    />
  )
}

function SaveButton({ label, onClick, disabled }: { label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <div className="px-5">
      <button
        type={onClick ? 'button' : 'submit'}
        onClick={onClick}
        disabled={disabled}
        className="w-full rounded-2xl bg-neutral-900 py-3 text-[13px] font-semibold text-white transition-opacity disabled:opacity-40 active:opacity-70"
      >
        {label}
      </button>
    </div>
  )
}

export function MobileSettingsContent() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [originalFirstName, setOriginalFirstName] = useState('')
  const [originalLastName, setOriginalLastName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [originalEmail, setOriginalEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingSecurity, setSavingSecurity] = useState(false)
  const [securityError, setSecurityError] = useState<string | null>(null)
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null)

  const [orderEmails, setOrderEmails] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [originalOrderEmails, setOriginalOrderEmails] = useState(true)
  const [originalMarketingEmails, setOriginalMarketingEmails] = useState(true)
  const [originalPushNotifications, setOriginalPushNotifications] = useState(false)
  const [savingNotifications, setSavingNotifications] = useState(false)
  const [notificationsError, setNotificationsError] = useState<string | null>(null)
  const [notificationsSuccess, setNotificationsSuccess] = useState<string | null>(null)

  const [performanceCookies, setPerformanceCookies] = useState(true)
  const [thirdPartyCookies, setThirdPartyCookies] = useState(false)

  const [googleConnected, setGoogleConnected] = useState(false)
  const [hasPassword, setHasPassword] = useState(true)
  const [settingPassword, setSettingPassword] = useState(false)
  const [passwordForGoogleAccount, setPasswordForGoogleAccount] = useState('')
  const [confirmPasswordForGoogleAccount, setConfirmPasswordForGoogleAccount] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  const [isInstaller, setIsInstaller] = useState(false)
  const [installerStatus, setInstallerStatus] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  const hasProfileChanges = firstName !== originalFirstName || lastName !== originalLastName
  const hasSecurityChanges = email !== originalEmail || (newPassword !== '' && newPassword.length >= 6 && newPassword === confirmPassword)
  const hasNotificationsChanges = orderEmails !== originalOrderEmails || marketingEmails !== originalMarketingEmails || pushNotifications !== originalPushNotifications

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const auth = await isAuthenticated()
        if (!auth) { if (!cancelled) navigate('/account', { replace: true }); return }
        const profile = await getCurrentUserProfile()
        if (!profile) { if (!cancelled) navigate('/account', { replace: true }); return }
        if (cancelled) return

        const first = profile.first_name || ''
        const last = profile.last_name || ''
        const emailValue = profile.email || ''
        setFirstName(first); setLastName(last); setEmail(emailValue)
        setAvatarUrl(profile.avatar_url || null)
        setOriginalFirstName(first); setOriginalLastName(last); setOriginalEmail(emailValue)
        setIsInstaller(profile.role === 'partner' || profile.partner_status === 'partner')
        setInstallerStatus(profile.partner_status || null)
        setCompanyName(profile.company_name || null)

        const { data: { user } } = await supabase.auth.getUser()
        if (user && !cancelled) {
          const meta = (user.user_metadata || {}) as Record<string, unknown>
          const op = meta.order_emails as boolean | undefined
          const mp = meta.marketing_emails as boolean | undefined
          const pp = meta.push_notifications as boolean | undefined
          setOrderEmails(op !== false); setMarketingEmails(mp !== false); setPushNotifications(pp === true)
          setOriginalOrderEmails(op !== false); setOriginalMarketingEmails(mp !== false); setOriginalPushNotifications(pp === true)
          const identities = user.identities || []
          const isGoogle = identities.some((i: any) => i.provider === 'google')
          const hasEmail = identities.some((i: any) => i.provider === 'email')
          setGoogleConnected(isGoogle)
          setHasPassword(hasEmail || !isGoogle)
        }
      } catch (e) {
        console.error('Error loading settings:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [navigate])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setAvatarError('Please select an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { setAvatarError('Image must be under 5 MB.'); return }
    setUploadingAvatar(true); setAvatarError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const ext = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`
      const { error: profileErr } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
      if (profileErr) throw profileErr
      setAvatarUrl(urlWithCacheBust)
      window.dispatchEvent(new CustomEvent('avatar-updated', { detail: { avatarUrl: urlWithCacheBust } }))
    } catch (err) {
      console.error(err); setAvatarError('Failed to upload photo.')
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true); setAvatarError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error: profileErr } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id)
      if (profileErr) throw profileErr
      setAvatarUrl(null)
      window.dispatchEvent(new CustomEvent('avatar-updated', { detail: { avatarUrl: null } }))
    } catch (err) {
      console.error(err); setAvatarError('Failed to remove photo.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (savingProfile) return
    setSavingProfile(true); setProfileError(null); setProfileSuccess(null)
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('User not authenticated')
      const cleanFirst = firstName.trim(); const cleanLast = lastName.trim()
      const fullName = `${cleanFirst} ${cleanLast}`.trim()
      const { error: pErr } = await supabase.from('profiles').update({ first_name: cleanFirst, last_name: cleanLast }).eq('id', user.id)
      if (pErr) throw new Error('Error updating profile.')
      const { error: aErr } = await supabase.auth.updateUser({ data: { full_name: fullName, first_name: cleanFirst, last_name: cleanLast } })
      if (aErr) throw new Error('Error updating your account.')
      try {
        const profile = await getCurrentUserProfile()
        if (profile?.email) await updateShopifyCustomer({ email: profile.email, first_name: cleanFirst, last_name: cleanLast })
      } catch {}
      setOriginalFirstName(cleanFirst); setOriginalLastName(cleanLast)
      setProfileSuccess('Settings updated.')
    } catch (e) {
      console.error(e); setProfileError('Unable to save. Please try again.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (savingSecurity) return
    if (newPassword && newPassword.length < 6) { setSecurityError('Password must be at least 6 characters.'); return }
    if (newPassword && newPassword !== confirmPassword) { setSecurityError('Passwords do not match.'); return }
    setSavingSecurity(true); setSecurityError(null); setSecuritySuccess(null)
    try {
      if (email && email !== originalEmail) {
        const { error: emailError } = await supabase.auth.updateUser({ email })
        if (emailError) throw new Error(emailError.message || 'Error updating email.')
        setOriginalEmail(email)
      }
      if (newPassword) {
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) throw new Error(error.message || 'Error updating password.')
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      }
      setSecuritySuccess('Security settings updated.')
    } catch (e) {
      setSecurityError(e instanceof Error ? e.message : 'Unable to save. Please try again.')
    } finally {
      setSavingSecurity(false)
    }
  }

  const handleSaveNotifications = async () => {
    if (savingNotifications) return
    setSavingNotifications(true); setNotificationsError(null); setNotificationsSuccess(null)
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('User not authenticated')
      const { error: aErr } = await supabase.auth.updateUser({ data: { order_emails: orderEmails, marketing_emails: marketingEmails, push_notifications: pushNotifications } })
      if (aErr) throw new Error('Error updating preferences.')
      setOriginalOrderEmails(orderEmails); setOriginalMarketingEmails(marketingEmails); setOriginalPushNotifications(pushNotifications)
      setNotificationsSuccess('Preferences updated.')
    } catch (e) {
      setNotificationsError('Unable to save. Please try again.')
    } finally {
      setSavingNotifications(false)
    }
  }

  const handleGoogleConnect = async () => {
    if (googleConnected) {
      if (!hasPassword) { setPasswordError('Set a password before disconnecting Google.'); return }
      try {
        setPasswordError(null); setPasswordSuccess(null)
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        const googleIdentity = currentUser?.identities?.find((i: any) => i.provider === 'google')
        if (!googleIdentity) { setPasswordError('Google identity not found.'); return }
        const { error } = await supabase.auth.unlinkIdentity(googleIdentity as any)
        if (error) { setPasswordError(error.message || 'Failed to disconnect Google.'); return }
        setPasswordSuccess('Google disconnected.')
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const identities = user.identities || []
          const isGoogle = identities.some((i: any) => i.provider === 'google')
          const hasEmail = identities.some((i: any) => i.provider === 'email')
          setGoogleConnected(isGoogle); setHasPassword(hasEmail || !isGoogle)
        }
      } catch (err) {
        setPasswordError(err instanceof Error ? err.message : 'Failed to disconnect Google.')
      }
      return
    }
    try {
      setPasswordError(null)
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/account/settings`, queryParams: { access_type: 'offline', prompt: 'consent' } } })
      if (error) setPasswordError(error.message || 'Failed to connect Google.')
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to connect Google.')
    }
  }

  const handleSetPasswordForGoogleAccount = async () => {
    if (!passwordForGoogleAccount || passwordForGoogleAccount.length < 6) { setPasswordError('Password must be at least 6 characters.'); return }
    if (passwordForGoogleAccount !== confirmPasswordForGoogleAccount) { setPasswordError('Passwords do not match.'); return }
    setSettingPassword(true); setPasswordError(null); setPasswordSuccess(null)
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForGoogleAccount })
      if (error) throw new Error(error.message || 'Error setting password.')
      setHasPassword(true); setPasswordForGoogleAccount(''); setConfirmPasswordForGoogleAccount('')
      setPasswordSuccess('Password set successfully.')
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : 'Unable to set password.')
    } finally {
      setSettingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeletingAccount(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      alert('Account deletion must be done through support. Contact us at contact@fireball.fr')
    } catch (e) {
      console.error(e); alert('Error deleting account.')
    } finally {
      setDeletingAccount(false); setShowDeleteModal(false)
    }
  }

  if (loading) {
    return (
      <div className="pb-10 flex flex-col gap-6 pt-2" style={{ background: '#f5f5f5' }}>
        {/* Profile skeleton */}
        <div className="flex flex-col gap-3">
          <div className="mx-5 h-3 w-16 rounded-full bg-neutral-200 animate-pulse" />
          <div className="mx-5 rounded-2xl overflow-hidden border border-neutral-100 bg-white">
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-14 h-14 rounded-full bg-neutral-200 animate-pulse shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-3.5 w-24 rounded-full bg-neutral-200 animate-pulse" />
                <div className="h-2.5 w-36 rounded-full bg-neutral-200 animate-pulse" />
              </div>
            </div>
          </div>
          <div className="mx-5 flex flex-col gap-2">
            <div className="h-11 rounded-xl bg-neutral-200 animate-pulse" />
            <div className="h-11 rounded-xl bg-neutral-200 animate-pulse" />
          </div>
        </div>

        {/* Security skeleton */}
        <div className="flex flex-col gap-3">
          <div className="mx-5 h-3 w-16 rounded-full bg-neutral-200 animate-pulse" />
          <div className="mx-5 flex flex-col gap-2">
            <div className="h-11 rounded-xl bg-neutral-200 animate-pulse" />
            <div className="h-11 rounded-xl bg-neutral-200 animate-pulse" />
            <div className="h-11 rounded-xl bg-neutral-200 animate-pulse" />
          </div>
        </div>

        {/* Notifications skeleton */}
        <div className="flex flex-col gap-3">
          <div className="mx-5 h-3 w-24 rounded-full bg-neutral-200 animate-pulse" />
          <div className="mx-5 rounded-2xl overflow-hidden border border-neutral-100 bg-white">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 last:border-b-0">
                <div className="flex flex-col gap-1.5">
                  <div className="h-3.5 w-28 rounded-full bg-neutral-200 animate-pulse" />
                  <div className="h-2.5 w-40 rounded-full bg-neutral-200 animate-pulse" />
                </div>
                <div className="w-11 h-6 rounded-full bg-neutral-200 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Cookie skeleton */}
        <div className="flex flex-col gap-3">
          <div className="mx-5 h-3 w-32 rounded-full bg-neutral-200 animate-pulse" />
          <div className="mx-5 rounded-2xl overflow-hidden border border-neutral-100 bg-white">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 last:border-b-0">
                <div className="flex flex-col gap-1.5">
                  <div className="h-3.5 w-32 rounded-full bg-neutral-200 animate-pulse" />
                  <div className="h-2.5 w-44 rounded-full bg-neutral-200 animate-pulse" />
                </div>
                <div className="w-11 h-6 rounded-full bg-neutral-200 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Connected accounts skeleton */}
        <div className="flex flex-col gap-3">
          <div className="mx-5 h-3 w-36 rounded-full bg-neutral-200 animate-pulse" />
          <div className="mx-5 rounded-2xl overflow-hidden border border-neutral-100 bg-white">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 last:border-b-0">
                <div className="flex flex-col gap-1.5">
                  <div className="h-3.5 w-16 rounded-full bg-neutral-200 animate-pulse" />
                  <div className="h-2.5 w-40 rounded-full bg-neutral-200 animate-pulse" />
                </div>
                <div className="w-11 h-6 rounded-full bg-neutral-200 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone skeleton */}
        <div className="flex flex-col gap-3">
          <div className="mx-5 h-3 w-24 rounded-full bg-neutral-200 animate-pulse" />
          <div className="mx-5 h-12 rounded-2xl bg-neutral-200 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="pb-10 flex flex-col gap-6 pt-2" style={{ background: '#f5f5f5' }}>

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg rounded-t-3xl bg-[#ececec] p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#f8d8dd] text-[#ff3b45]">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" />
                </svg>
              </div>
              <button type="button" onClick={() => setShowDeleteModal(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#d8d8da] text-[#6c6c71]">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <h3 className="text-2xl font-semibold tracking-tight text-[#252528]">Delete your account?</h3>
            <p className="mt-3 text-base leading-relaxed text-[#6c6c71]">This will permanently delete your account and remove all your data. This action is irreversible.</p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setShowDeleteModal(false)} className="inline-flex items-center justify-center rounded-full bg-[#dcdcdf] px-6 py-2.5 text-sm font-medium text-[#4a4a4f]">Cancel</button>
              <button type="button" onClick={handleDeleteAccount} disabled={deletingAccount} className="inline-flex items-center justify-center rounded-full bg-[#ff3b45] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {deletingAccount ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Profile ── */}
      <div className="flex flex-col gap-3">
        <SectionTitle>Profile</SectionTitle>
        {profileError && <ErrorBanner msg={profileError} />}
        {profileSuccess && <SuccessBanner msg={profileSuccess} />}
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
          {/* Avatar */}
          <Card>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-14 h-14 rounded-full object-cover border border-neutral-200" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xl font-semibold text-neutral-500 select-none">
                    {firstName ? firstName.charAt(0).toUpperCase() : '?'}
                  </div>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-neutral-900">Profile photo</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">JPG, PNG or WebP · max 5 MB</p>
                {avatarError && <p className="text-[11px] text-red-500 mt-1">{avatarError}</p>}
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
                <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[12px] font-medium text-neutral-900 active:bg-neutral-50 disabled:opacity-50">
                  {avatarUrl ? 'Change' : 'Upload'}
                </button>
                {avatarUrl && (
                  <button type="button" onClick={handleRemoveAvatar} disabled={uploadingAvatar} className="text-[12px] font-medium text-neutral-400 active:text-red-500 disabled:opacity-50">Remove</button>
                )}
              </div>
            </div>
          </Card>

          {/* Name fields */}
          <div className="flex flex-col gap-2 px-5">
            <InputField value={firstName} onChange={setFirstName} placeholder="First name" />
            <InputField value={lastName} onChange={setLastName} placeholder="Last name" />
          </div>

          {hasProfileChanges && (
            <SaveButton label={savingProfile ? 'Saving…' : 'Save changes'} disabled={savingProfile} />
          )}
        </form>
      </div>

      {/* ── Security ── */}
      <div className="flex flex-col gap-3">
        <SectionTitle>Security</SectionTitle>
        {securityError && <ErrorBanner msg={securityError} />}
        {securitySuccess && <SuccessBanner msg={securitySuccess} />}
        <form onSubmit={handleSaveSecurity} className="flex flex-col gap-2 px-5">
          <InputField value={email} onChange={setEmail} placeholder="Email address" type="email" />
          <InputField value={currentPassword} onChange={setCurrentPassword} placeholder="Current password" type="password" />
          <InputField value={newPassword} onChange={setNewPassword} placeholder="New password (min. 6 characters)" type="password" />
          <InputField value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm new password" type="password" />
          {hasSecurityChanges && (
            <div className="mt-1">
              <button type="submit" disabled={savingSecurity} className="w-full rounded-2xl bg-neutral-900 py-3 text-[13px] font-semibold text-white transition-opacity disabled:opacity-40 active:opacity-70">
                {savingSecurity ? 'Saving…' : 'Update security'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* ── Notifications ── */}
      <div className="flex flex-col gap-3">
        <SectionTitle>Notifications</SectionTitle>
        {notificationsError && <ErrorBanner msg={notificationsError} />}
        {notificationsSuccess && <SuccessBanner msg={notificationsSuccess} />}
        <Card>
          <Row label="Order updates" description="Emails about your purchases and orders" right={<Toggle checked={orderEmails} onChange={() => setOrderEmails(v => !v)} />} />
          <Row label="News & drops" description="Product launches and promotions" right={<Toggle checked={marketingEmails} onChange={() => setMarketingEmails(v => !v)} />} />
          <Row label="Push notifications" description="Browser notifications for updates" right={<Toggle checked={pushNotifications} onChange={() => setPushNotifications(v => !v)} />} />
        </Card>
        {hasNotificationsChanges && (
          <SaveButton label={savingNotifications ? 'Saving…' : 'Save preferences'} onClick={handleSaveNotifications} disabled={savingNotifications} />
        )}
      </div>

      {/* ── Cookie Preferences ── */}
      <div className="flex flex-col gap-3">
        <SectionTitle>Cookie Preferences</SectionTitle>
        <Card>
          <Row label="Strictly Necessary" description="Required for core functionality" right={<Toggle checked disabled />} />
          <Row label="Performance" description="Help us improve speed and experience" right={<Toggle checked={performanceCookies} onChange={() => setPerformanceCookies(v => !v)} />} />
          <Row label="Third Party Content" description="Enable external embeds" right={<Toggle checked={thirdPartyCookies} onChange={() => setThirdPartyCookies(v => !v)} />} />
        </Card>
      </div>

      {/* ── Connected Accounts ── */}
      <div className="flex flex-col gap-3">
        <SectionTitle>Connected Accounts</SectionTitle>
        {passwordError && <ErrorBanner msg={passwordError} />}
        {passwordSuccess && <SuccessBanner msg={passwordSuccess} />}
        <Card>
          {/* Google */}
          <Row
            label="Google"
            description="Manage Google account connection"
            right={
              <button
                type="button"
                onClick={handleGoogleConnect}
                className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors ${googleConnected ? 'bg-emerald-500' : 'bg-[#9CA3AF]'}`}
              >
                <span className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${googleConnected ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            }
          />
          {/* Email */}
          <div className="px-5 py-3.5 border-t border-neutral-100">
            <p className="text-[14px] font-medium text-neutral-900 leading-tight">Email</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">{hasPassword ? 'Email account is connected' : 'Set a password for your account'}</p>
            {hasPassword && (
              <span className="mt-1.5 inline-block text-[11px] font-medium text-emerald-500">Connected</span>
            )}
            {!hasPassword && googleConnected && (
              <div className="mt-3 flex flex-col gap-2">
                <InputField value={passwordForGoogleAccount} onChange={setPasswordForGoogleAccount} placeholder="Set password (min. 6 characters)" type="password" />
                <InputField value={confirmPasswordForGoogleAccount} onChange={setConfirmPasswordForGoogleAccount} placeholder="Confirm password" type="password" />
                <button
                  type="button"
                  onClick={handleSetPasswordForGoogleAccount}
                  disabled={settingPassword || !passwordForGoogleAccount || passwordForGoogleAccount.length < 6}
                  className="rounded-2xl bg-neutral-900 py-3 text-[13px] font-semibold text-white disabled:opacity-40"
                >
                  {settingPassword ? 'Setting…' : 'Set password'}
                </button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Installer Status ── */}
      {isInstaller && (
        <div className="flex flex-col gap-3">
          <SectionTitle>Installer Status</SectionTitle>
          <Card>
            <Row
              label="Status"
              description="Your installer certification status"
              right={
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${installerStatus === 'partner' ? 'bg-emerald-100 text-emerald-600' : 'bg-yellow-100 text-yellow-600'}`}>
                  {installerStatus === 'partner' ? 'Active' : 'Pending'}
                </span>
              }
            />
            {companyName && (
              <Row label="Company" description="Your company information" right={<span className="text-[13px] text-neutral-600">{companyName}</span>} />
            )}
          </Card>
        </div>
      )}

      {/* ── Danger Zone ── */}
      <div className="flex flex-col gap-3">
        <SectionTitle>Danger Zone</SectionTitle>
        <div className="px-5">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-full rounded-2xl bg-[#ff3b45] py-3 text-[13px] font-semibold text-white active:opacity-80"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}
