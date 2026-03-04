import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface SettingsSheetProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsSheet({ isOpen, onClose }: SettingsSheetProps) {
  const [rendered, setRendered] = useState(isOpen)
  const [isExiting, setIsExiting] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [scrolledDown, setScrolledDown] = useState(false)

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [newsletter, setNewsletter] = useState(true)
  const [ordersEmails, setOrdersEmails] = useState(true)

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false

    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const metadata = (user.user_metadata || {}) as Record<string, unknown>
      const firstName = String(metadata.first_name || '').trim()
      const lastName = String(metadata.last_name || '').trim()
      const fullName = String(metadata.full_name || '').trim()
      const name =
        fullName ||
        [firstName, lastName].filter(Boolean).join(' ') ||
        user.email ||
        'Member'

      setDisplayName(name)
      setEmail(user.email || '')
    }

    void loadUser()

    return () => {
      cancelled = true
    }
  }, [isOpen])

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
          }}
        >
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-10">
            {/* Left column: summary */}
            <div className="w-full lg:w-[32%] flex flex-col gap-4">
              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm px-5 py-5 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
                <p className="text-[13px] font-medium text-white/80 mb-2">
                  Account settings
                </p>
                <p className="text-[12px] leading-relaxed text-white/60">
                  Update how your Fireball account behaves, including contact preferences
                  and account security shortcuts.
                </p>
              </div>
            </div>

            {/* Right column: controls */}
            <div className="w-full lg:flex-1 flex flex-col gap-4">
              <div className="rounded-3xl border border-white/[0.12] bg-white/[0.02] px-5 py-5 flex flex-col gap-4">
                <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/55">
                  Profile
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] text-white/55 uppercase tracking-[0.14em]">Display name</p>
                    <p className="mt-1 text-sm text-white">{displayName || 'Member'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-white/55 uppercase tracking-[0.14em]">Email</p>
                    <p className="mt-1 text-sm text-white">{email || '—'}</p>
                  </div>
                  <div className="mt-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-white/[0.2] bg-white/[0.06] px-4 py-2 text-[11px] font-nav uppercase tracking-[0.16em] text-white/85 hover:bg-white/[0.14] hover:border-white/60 transition-colors"
                      onClick={onClose}
                    >
                      <span>Manage profile</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/[0.12] bg-white/[0.02] px-5 py-5 flex flex-col gap-4">
                <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/55">
                  Notifications
                </p>
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-sm text-white/80">Order updates</span>
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
                  <span className="text-sm text-white/80">News & announcements</span>
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
              </div>
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

