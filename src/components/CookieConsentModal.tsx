import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type CookieConsentStatus = 'accepted' | 'rejected'

const COOKIE_CONSENT_STORAGE_KEY = 'fireball_cookie_consent_v1'
const COOKIE_SETTINGS_EVENT = 'fireball:open-cookie-settings'

function readStoredConsent(): CookieConsentStatus | null {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)
  if (value === 'accepted' || value === 'rejected') return value
  return null
}

export function openCookieSettings() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))
}

export function CookieConsentModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const stored = readStoredConsent()
    setIsOpen(stored === null)
  }, [])

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onOpenSettings = () => {
      setIsOpen(true)
    }
    window.addEventListener(COOKIE_SETTINGS_EVENT, onOpenSettings)
    return () => {
      window.removeEventListener(COOKIE_SETTINGS_EVENT, onOpenSettings)
    }
  }, [])

  const handleDecision = (value: CookieConsentStatus) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, value)
    }
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/55 backdrop-blur-[1px] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Cookie consent"
    >
      <div className="w-full max-w-xl rounded-xl bg-[#ececec] p-4 md:p-5 shadow-2xl">
        <p className="text-sm md:text-[15px] leading-[1.45] text-neutral-700">
          This website uses technically necessary cookies.
          <br />
          With your consent, this website shall use additional cookies (including third party cookies) or similar technologies to make our site work, for marketing purposes and to improve your
          online experience.
          <br />
          You can revoke your consent via your account settings at any time. Further information can be found in our <Link to="/legal" className="underline">Privacy Policy</Link>.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            className="h-10 rounded-lg bg-[#dfe1e5] px-3 text-sm font-semibold text-[#1b2430] transition hover:bg-[#d5d8dd]"
            onClick={() => handleDecision('rejected')}
          >
            Reject All
          </button>
          <button
            type="button"
            className="h-10 rounded-lg bg-[#dfe1e5] px-3 text-sm font-semibold text-[#1b2430] transition hover:bg-[#d5d8dd]"
            onClick={() => handleDecision('accepted')}
          >
            Accept All Cookies
          </button>
        </div>
      </div>
    </div>
  )
}
