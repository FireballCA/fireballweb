import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUserProfile, isAuthenticated } from '@/utils/supabaseAuth'
import type { UserProfile } from '@/utils/supabaseAuth'
import { LenisContext } from '@/components/LenisRoot'
import { AppleButton } from '@/components/ui/AppleButton'
import { usePageTitle } from '@/hooks/usePageTitle'

const CONTACT_DRAFT_KEY = 'fireball_contact_form_draft'

export function Contact() {
  const navigate = useNavigate()
  const lenis = useContext(LenisContext)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  usePageTitle('Contact - Fireball Canada')

  useEffect(() => {
    const load = async () => {
      let p: UserProfile | null = null
      const ok = await isAuthenticated()
      if (ok) {
        p = await getCurrentUserProfile()
        setProfile(p ?? null)
      }
      try {
        const draft = sessionStorage.getItem(CONTACT_DRAFT_KEY)
        if (draft) {
          const data = JSON.parse(draft) as { name?: string; email?: string; subject?: string; message?: string }
          if (data.name != null) setName(data.name)
          if (data.email != null) setEmail(data.email)
          if (data.subject != null) setSubject(data.subject)
          if (data.message != null) setMessage(data.message)
          sessionStorage.removeItem(CONTACT_DRAFT_KEY)
        } else if (p) {
          const fullName = [p.first_name, p.last_name].filter(Boolean).join(' ').trim()
          if (fullName) setName(fullName)
        }
      } catch {
        sessionStorage.removeItem(CONTACT_DRAFT_KEY)
        if (p) {
          const fullName = [p.first_name, p.last_name].filter(Boolean).join(' ').trim()
          if (fullName) setName(fullName)
        }
      }
      setAuthChecked(true)
    }
    load()
  }, [])

  /** Mobile : pas de scroll page (viewport figé sous le header) */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const apply = () => {
      if (!mq.matches) return
      const html = document.documentElement
      const body = document.body
      html.style.overflow = 'hidden'
      body.style.overflow = 'hidden'
      html.style.overscrollBehavior = 'none'
      body.style.overscrollBehavior = 'none'
      lenis?.stop()
    }
    const clear = () => {
      const html = document.documentElement
      const body = document.body
      html.style.overflow = ''
      body.style.overflow = ''
      html.style.overscrollBehavior = ''
      body.style.overscrollBehavior = ''
      lenis?.start()
    }

    const onChange = () => {
      if (mq.matches) apply()
      else clear()
    }

    onChange()
    mq.addEventListener('change', onChange)
    return () => {
      mq.removeEventListener('change', onChange)
      clear()
    }
  }, [lenis])

  const handleSignInClick = () => {
    sessionStorage.setItem(
      CONTACT_DRAFT_KEY,
      JSON.stringify({ name, email, subject, message })
    )
    navigate('/account?returnTo=/contact')
  }

  return (
    <div
      className="flex w-full max-w-none min-w-0 flex-1 flex-col bg-white font-sans text-carbon-900 max-lg:h-full max-lg:min-h-0 max-lg:overflow-hidden lg:min-h-[calc(100dvh-5rem)] lg:overflow-y-auto"
    >
      <div className="flex min-h-0 flex-1 flex-col max-lg:overflow-hidden lg:min-h-0 lg:flex-row">
        {/* Left: Let's Talk + text + Sign in + social (social desktop only) */}
        <div className="flex max-h-[42%] min-h-0 shrink-0 flex-col justify-start overflow-hidden px-6 pb-3 pt-10 max-lg:flex-none lg:max-h-none lg:w-1/2 lg:min-w-0 lg:flex-shrink-0 lg:pb-12 lg:pt-24 lg:px-12 xl:px-16 xl:pt-28">
          <h1 className="text-3xl font-bold tracking-tight text-carbon-900 lg:text-4xl md:text-5xl xl:text-6xl">
            Let's Talk.
          </h1>
          <p className="mt-3 max-w-md text-xs leading-snug text-carbon-600 max-lg:line-clamp-3 lg:mt-5 lg:text-sm lg:leading-relaxed md:mt-6 md:text-base">
            We're here to help.
            <br className="max-lg:hidden" />
            <span className="max-lg:hidden">
              <br />
              Whether you have a question about products, partnerships or your orders, our team is ready to assist
              you.
            </span>
            <span className="lg:hidden"> Questions on products, orders or partnerships — we’re here.</span>
          </p>
          {authChecked && !profile && (
            <>
              <p className="mt-2 max-w-md text-xs leading-snug text-carbon-600 max-lg:line-clamp-2 lg:mt-6 lg:mt-8 lg:text-sm lg:leading-relaxed">
                Sign in so we can link your message to your account.
              </p>
              <button
                type="button"
                onClick={handleSignInClick}
                className="group mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-carbon-600 transition-colors duration-200 hover:text-carbon-900 lg:mt-3"
              >
                Sign in
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 640 640"
                  className="h-[14px] w-[14px] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                >
                  <path
                    fill="currentColor"
                    d="M566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L406.6 137.3C394.1 124.8 373.8 124.8 361.3 137.3C348.8 149.8 348.8 170.1 361.3 182.6L466.7 288L96 288C78.3 288 64 302.3 64 320C64 337.7 78.3 352 96 352L466.7 352L361.3 457.4C348.8 469.9 348.8 490.2 361.3 502.7C373.8 515.2 394.1 515.2 406.6 502.7L566.6 342.7z"
                  />
                </svg>
              </button>
            </>
          )}
          <div className="mt-auto hidden items-center gap-6 pt-8 lg:flex">
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-carbon-600 transition-colors hover:text-carbon-900"
              aria-label="Instagram"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[18px] w-[18px]"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-carbon-600 transition-colors hover:text-carbon-900"
              aria-label="Facebook"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[18px] w-[18px]"
              >
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Right: Contact Form */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-start overflow-hidden border-t border-carbon-900/10 px-6 py-4 max-lg:flex-1 lg:w-1/2 lg:justify-center lg:border-l lg:border-t-0 lg:px-12 lg:py-12 xl:px-16">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider text-carbon-500 lg:text-xs">
            Contact Form
          </h2>
          <h3 className="mt-0.5 text-lg font-semibold text-carbon-900 lg:mt-1 lg:text-xl">
            Send us a message
          </h3>

          <form
            className="mt-3 min-h-0 flex-1 space-y-2 overflow-hidden lg:mt-6 lg:space-y-3 md:space-y-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="grid max-lg:grid-cols-2 max-lg:gap-2 lg:block">
              <div>
                <label htmlFor="contact-name" className="mb-0.5 block text-xs font-medium text-carbon-700 lg:mb-1 lg:text-sm">
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-carbon-700/30 bg-white px-2.5 py-2 text-xs text-carbon-900 placeholder:text-carbon-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-carbon-500 lg:px-3 lg:py-2.5 lg:text-sm"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="mb-0.5 block text-xs font-medium text-carbon-700 lg:mb-1 lg:text-sm">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-carbon-700/30 bg-white px-2.5 py-2 text-xs text-carbon-900 placeholder:text-carbon-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-carbon-500 lg:px-3 lg:py-2.5 lg:text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="contact-subject" className="mb-0.5 block text-xs font-medium text-carbon-700 lg:mb-1 lg:text-sm">
                Subject
              </label>
              <input
                id="contact-subject"
                type="text"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-carbon-700/30 bg-white px-2.5 py-2 text-xs text-carbon-900 placeholder:text-carbon-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-carbon-500 lg:px-3 lg:py-2.5 lg:text-sm"
              />
            </div>
            <div className="min-h-0 flex-1 max-lg:flex max-lg:flex-col lg:block">
              <label htmlFor="contact-message" className="mb-0.5 block shrink-0 text-xs font-medium text-carbon-700 lg:mb-1 lg:text-sm">
                Message
              </label>
              <textarea
                id="contact-message"
                rows={2}
                placeholder="Your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="max-lg:min-h-0 max-lg:flex-1 w-full resize-none rounded-lg border border-carbon-700/30 bg-white px-2.5 py-2 text-xs text-carbon-900 placeholder:text-carbon-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-carbon-500 lg:min-h-[5.5rem] lg:px-3 lg:py-2.5 lg:text-sm"
              />
            </div>
            <div className="shrink-0 pt-0.5 lg:pt-0">
              <AppleButton
                type="submit"
                disabled={!name.trim() || !email.trim() || !subject.trim() || !message.trim()}
                className="disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[#0485F7] disabled:hover:bg-[#0485F7]"
              >
                Send message
              </AppleButton>
              <p className="mt-1.5 text-[10px] text-carbon-500 lg:mt-3 lg:text-xs">
                We usually reply within 24–48 hours.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
