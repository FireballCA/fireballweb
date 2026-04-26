import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { HomeCollectionResolved } from '@/constants/homeCollection'
import { useClipRevealHover } from '@/hooks/useClipRevealHover'

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href)
}

function CtaLink({
  href,
  className,
  children,
  'aria-label': ariaLabel,
}: {
  href: string
  className?: string
  children: ReactNode
  'aria-label'?: string
}) {
  if (isExternalHref(href)) {
    return (
      <a href={href} className={className} aria-label={ariaLabel}>
        {children}
      </a>
    )
  }
  return (
    <Link to={href} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  )
}

type Props = {
  config: HomeCollectionResolved
}

export function HomeCollectionSection({ config }: Props) {
  const { eyebrow, headline, description, image, href, button1Label, button1Href, button2Label, button2Href } =
    config

  const primaryHref = (button1Href && button1Href.trim()) || href

  return (
    <section
      className="relative w-full min-h-[100dvh] overflow-hidden bg-black"
      aria-label={headline}
    >
      <CtaLink
        href={href}
        className="absolute inset-0 z-0 block outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        aria-label={`${headline} — ${eyebrow}`}
      >
        <img
          src={image}
          alt=""
          className="h-full w-full md:min-h-[100dvh] object-cover"
          loading="eager"
          decoding="async"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20"
          aria-hidden
        />
      </CtaLink>

      <div className="pointer-events-none absolute inset-0 z-10 flex min-h-[100dvh] flex-col justify-end">
        <div className="pointer-events-auto max-w-xl p-6 pb-10 sm:p-8 sm:pb-12 md:p-12 md:pb-16 lg:p-14 lg:pb-20">
          <p className="font-nav text-sm font-semibold uppercase tracking-[0.14em] text-pearl md:text-[0.95rem]">
            {eyebrow}
          </p>
          <h2 className="mt-2 font-nav text-base font-bold leading-snug tracking-tight text-pearl md:text-lg lg:text-xl">
            {headline}
          </h2>
          <p className="mt-2 max-w-md text-pretty font-light text-sm leading-relaxed text-silver/85 md:text-base">
            {description}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <CtaLink
              href={primaryHref}
              className="inline-flex items-center justify-center rounded-full border border-[#0485F7] bg-[#0485F7] px-5 py-2 text-xs font-semibold text-white hover:bg-[#3592F9] hover:border-[#3592F9] transition-colors"
              aria-label="Explore the Drop"
            >
              <span>Explore the Drop</span>
            </CtaLink>
          </div>
        </div>
      </div>
    </section>
  )
}
