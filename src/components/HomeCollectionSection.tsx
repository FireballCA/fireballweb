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

/** Même pattern que « Explore Products » (hero) : `button` + clip pour que le cercle suive la souris. */
function SecondaryClipButton({ href, label }: { href: string; label: string }) {
  const navigate = useNavigate()
  const clip = useClipRevealHover()
  const active = clip.active

  const handleClick = () => {
    if (isExternalHref(href)) {
      window.location.assign(href)
    } else {
      navigate(href)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      onPointerEnter={clip.onPointerEnter}
      onPointerMove={clip.onPointerMove}
      onPointerLeave={clip.onPointerLeave}
      onFocus={clip.onFocus}
      onBlur={clip.onBlur}
      style={clip.cssVars}
      className="relative inline-flex min-w-[12rem] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-white/[0.12] bg-transparent px-8 py-2.5 text-center font-nav text-sm font-bold uppercase outline-none [-webkit-tap-highlight-color:transparent] transition-[border-color,color] duration-500 ease-out hover:border-white/25 focus:outline-none focus-visible:outline-none motion-reduce:transition-none"
    >
      <span
        className="pointer-events-none absolute inset-0 z-0 bg-white"
        style={{
          clipPath: `circle(${active ? 'var(--clip-r, 0px)' : '0px'} at var(--clip-x, 50%) var(--clip-y, 50%))`,
          WebkitClipPath: `circle(${active ? 'var(--clip-r, 0px)' : '0px'} at var(--clip-x, 50%) var(--clip-y, 50%))`,
          transition:
            'clip-path 900ms cubic-bezier(0.22,1,0.36,1), -webkit-clip-path 900ms cubic-bezier(0.22,1,0.36,1)',
          willChange: 'clip-path',
        }}
        aria-hidden
      />
      <span
        className={`relative z-10 transition-colors duration-500 motion-reduce:duration-200 ${
          active ? 'text-black' : 'text-pearl'
        }`}
      >
        {label}
      </span>
    </button>
  )
}

type Props = {
  config: HomeCollectionResolved
}

export function HomeCollectionSection({ config }: Props) {
  const { eyebrow, headline, description, image, href, button1Label, button1Href, button2Label, button2Href } =
    config

  const showButton2 = Boolean(button2Label?.trim())

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
          className="h-full w-full min-h-[100dvh] object-cover"
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
            <SecondaryClipButton href={button1Href} label={button1Label} />
            {showButton2 ? <SecondaryClipButton href={button2Href} label={button2Label} /> : null}
          </div>
        </div>
      </div>
    </section>
  )
}
