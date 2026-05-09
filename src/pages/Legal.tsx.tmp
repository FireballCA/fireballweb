import { Link } from 'react-router-dom'
import { IconFileText, IconShieldLock, IconCookie, IconScale } from '@tabler/icons-react'
import { usePageTitle } from '@/hooks/usePageTitle'

const legalCards = [
  {
    Icon: IconScale,
    title: 'Legal Notice',
    body: 'Corporate information, editorial responsibility, and general legal framework governing this website.',
    href: '/Legal-Notice',
  },
  {
    Icon: IconCookie,
    title: 'Cookies',
    body: 'How we use cookies and similar tracking technologies, and how you can manage your preferences.',
    href: '/Cookies',
  },
  {
    Icon: IconShieldLock,
    title: 'Privacy Policy',
    body: 'How we collect, use, store, and protect your personal data in accordance with applicable law.',
    href: '/Privacy',
  },
  {
    Icon: IconFileText,
    title: 'Terms of Service',
    body: 'The rules and conditions that apply when you use our website, products, and services.',
    href: '/Terms-of-Service',
  },
]

export function Legal() {
  usePageTitle('Legal - Fireball Canada')

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-20 md:py-32">
        {/* Header */}
        <div className="mb-16 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-carbon-500 mb-4">
            Legal Center
          </p>
          <h1 className="font-sans text-4xl md:text-5xl lg:text-6xl font-bold text-carbon-900 tracking-tight mb-6">
            We take compliance seriously.
          </h1>
          <p className="text-carbon-600 text-base md:text-lg leading-relaxed font-sans">
            At Fireball Canada, we operate with full transparency and strict respect for applicable
            laws and regulations. Explore the documents below to understand your rights and our
            commitments — legally and ethically.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid gap-6 sm:grid-cols-2 md:gap-8">
          {legalCards.map(({ Icon, title, body, href }) => (
            <div
              key={href}
              className="flex flex-col rounded-2xl border border-carbon-900/10 bg-pearl p-6 shadow-sm md:p-7"
            >
              <span
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-carbon-900 mb-5"
                aria-hidden
              >
                <Icon className="h-6 w-6" stroke={1.75} />
              </span>

              <h2 className="text-xl font-bold text-carbon-900 mb-3" style={{ fontFamily: "'Roboto', sans-serif" }}>
                {title}
              </h2>
              <p className="text-base leading-relaxed text-carbon-600 flex-1 mb-6" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}>
                {body}
              </p>

              <div>
                <Link
                  to={href}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-carbon-900 bg-carbon-900 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-carbon-700 hover:border-carbon-700"
                >
                  Read document
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
