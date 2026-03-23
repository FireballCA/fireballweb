import { useContext, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LenisContext } from '@/components/LenisRoot'

const DRIVEN_OFFICIAL = 'https://www.drivenshow.ca/sainthyacinthe/'
const PASSION_DETAILING = 'https://passiondetailing.ca'

export function EventDriven26() {
  const lenis = useContext(LenisContext)

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverscroll: body.style.overscrollBehavior,
    }
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    html.style.overscrollBehavior = 'none'
    body.style.overscrollBehavior = 'none'
    lenis?.stop()

    return () => {
      html.style.overflow = prev.htmlOverflow
      body.style.overflow = prev.bodyOverflow
      html.style.overscrollBehavior = prev.htmlOverscroll
      body.style.overscrollBehavior = prev.bodyOverscroll
      lenis?.start()
    }
  }, [lenis])

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-black text-white">
      <nav
        className="z-[35] shrink-0 border-b border-black/10 bg-white text-carbon-900 shadow-sm"
        aria-label="The Driven Show"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 sm:px-6">
          <Link
            to="/event"
            className="justify-self-start font-nav text-[11px] font-bold uppercase tracking-[0.22em] text-carbon-700 transition-colors hover:text-carbon-900"
          >
            ← Events
          </Link>
          <p className="text-center font-nav text-sm font-bold text-carbon-900">The Driven Show</p>
          <span className="justify-self-end" aria-hidden />
        </div>
      </nav>

      <section
        className="relative min-h-0 flex-1 basis-0 overflow-hidden"
        aria-labelledby="driven-hero-title"
      >
        {/* Pleine surface sous la barre : l’image occupe la résolution disponible (évite le sur-zoom pixelisé) */}
        <img
          src="/Assets/Driven.webp"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          sizes="100vw"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/45 to-black/80"
          aria-hidden
        />

        <div className="relative z-10 flex h-full min-h-0 flex-col justify-start px-4 pb-6 pt-6 sm:px-8 sm:pt-8 md:px-12 md:pt-10 lg:px-16">
          <div className="max-w-2xl">
            <p className="font-nav text-[11px] font-bold uppercase tracking-[0.28em] text-white/90">
              May 16, 2026 · 1PM–6PM · Saint-Hyacinthe, QC
            </p>
            <h1
              id="driven-hero-title"
              className="mt-3 font-nav text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl"
            >
              The Driven Show
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/90 sm:text-base md:max-w-xl">
              Presented by eBay Motors at{' '}
              <span className="font-semibold text-white">Centre BMO</span>, 2730 Av. Beauparlant — Canada’s
              aftermarket performance showcase.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/88 sm:text-base md:max-w-xl">
              <span className="font-semibold text-white">Fireball Canada</span> will be on site with{' '}
              <span className="font-semibold text-white">Passion Dynamique</span> and{' '}
              <a
                href={PASSION_DETAILING}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white underline decoration-white/0 underline-offset-2 transition-colors hover:decoration-white"
              >
                Passion Detailing
              </a>
              — stop by and see us at the event.
            </p>

            <a
              href={DRIVEN_OFFICIAL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-center font-nav text-xs font-bold uppercase tracking-[0.14em] text-carbon-900 transition-opacity hover:opacity-90 sm:mt-6"
            >
              Official site
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
