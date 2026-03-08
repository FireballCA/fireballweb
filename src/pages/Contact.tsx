import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUserProfile, isAuthenticated } from '@/utils/supabaseAuth'
import type { UserProfile } from '@/utils/supabaseAuth'

const CONTACT_DRAFT_KEY = 'fireball_contact_form_draft'

export function Contact() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

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

  const handleSignInClick = () => {
    sessionStorage.setItem(
      CONTACT_DRAFT_KEY,
      JSON.stringify({ name, email, subject, message })
    )
    navigate('/account?returnTo=/contact')
  }

  return (
    <div
      className="min-h-0 overflow-hidden bg-white font-sans text-carbon-900 flex flex-col"
      style={{ height: 'calc(100vh - 5rem)' }}
    >
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* Left: Let's Talk + text + Sign in + social icons bottom */}
        <div className="flex-shrink-0 lg:w-1/2 lg:min-w-0 flex flex-col justify-start pt-16 lg:pt-24 xl:pt-28 px-6 lg:px-12 xl:px-16 pb-10 lg:pb-12">
          <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold tracking-tight text-carbon-900">
            Let's Talk.
          </h1>
          <p className="mt-5 md:mt-6 text-carbon-600 text-sm md:text-base leading-relaxed max-w-md">
            We're here to help.
            <br />
            Whether you have a question about products, partnerships or your orders, our team is ready to assist you.
          </p>
          {authChecked && !profile && (
            <>
              <p className="mt-6 md:mt-8 text-sm text-carbon-600 leading-relaxed max-w-md">
                We recommend signing in so we can link your message to your account and get back to you more easily.
              </p>
              <button
                type="button"
                onClick={handleSignInClick}
                className="group mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-carbon-600 hover:text-carbon-900 transition-colors duration-200"
              >
                Sign in
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 640 640"
                  className="shrink-0 h-[14px] w-[14px] transition-transform duration-200 group-hover:translate-x-0.5"
                >
                  <path
                    fill="currentColor"
                    d="M566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L406.6 137.3C394.1 124.8 373.8 124.8 361.3 137.3C348.8 149.8 348.8 170.1 361.3 182.6L466.7 288L96 288C78.3 288 64 302.3 64 320C64 337.7 78.3 352 96 352L466.7 352L361.3 457.4C348.8 469.9 348.8 490.2 361.3 502.7C373.8 515.2 394.1 515.2 406.6 502.7L566.6 342.7z"
                  />
                </svg>
              </button>
            </>
          )}
          <div className="mt-auto pt-8 flex items-center gap-4">
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-carbon-600 hover:text-carbon-900 transition-colors"
              aria-label="Instagram"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-carbon-600 hover:text-carbon-900 transition-colors"
              aria-label="Facebook"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Right: Contact Form */}
        <div className="flex-shrink-0 lg:w-1/2 lg:min-w-0 flex flex-col justify-center px-6 lg:px-12 xl:px-16 py-8 lg:py-12 border-t lg:border-t-0 lg:border-l border-carbon-900/10">
          <h2 className="text-xs font-semibold text-carbon-500 uppercase tracking-wider">
            Contact Form
          </h2>
          <h3 className="mt-1 text-xl font-semibold text-carbon-900">
            Send us a message
          </h3>

          <form className="mt-6 space-y-3 md:space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label htmlFor="contact-name" className="block text-sm font-medium text-carbon-700 mb-1">
                Name
              </label>
              <input
                id="contact-name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-carbon-700/30 bg-white text-carbon-900 placeholder:text-carbon-500 focus:outline-none focus:ring-2 focus:ring-carbon-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-carbon-700 mb-1">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-carbon-700/30 bg-white text-carbon-900 placeholder:text-carbon-500 focus:outline-none focus:ring-2 focus:ring-carbon-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label htmlFor="contact-subject" className="block text-sm font-medium text-carbon-700 mb-1">
                Subject
              </label>
              <input
                id="contact-subject"
                type="text"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-carbon-700/30 bg-white text-carbon-900 placeholder:text-carbon-500 focus:outline-none focus:ring-2 focus:ring-carbon-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label htmlFor="contact-message" className="block text-sm font-medium text-carbon-700 mb-1">
                Message
              </label>
              <textarea
                id="contact-message"
                rows={3}
                placeholder="Your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-carbon-700/30 bg-white text-carbon-900 placeholder:text-carbon-500 focus:outline-none focus:ring-2 focus:ring-carbon-500 focus:border-transparent resize-none text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#B61B1B' }}
            >
              Send message
            </button>
          </form>

          <p className="mt-3 text-xs text-carbon-500">
            We usually reply within 24–48 hours.
          </p>
        </div>
      </div>
    </div>
  )
}
