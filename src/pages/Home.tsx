import { useCallback, useContext, useEffect, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ProductCategoryLineup } from '@/components/ProductCategoryLineup'
import { HomeCollectionSection } from '@/components/HomeCollectionSection'
import { VoyagerWorldwideScrollSection } from '@/components/VoyagerWorldwideScroll/VoyagerWorldwideScrollSection'
import { LenisContext } from '@/components/LenisRoot'
import { FIREBALL_COUNTRY_SLIDES } from '@/data/fireballCountriesSlider'
import { supabase } from '@/lib/supabase'
import { resolveHomeCollection } from '@/utils/homeCollectionSettings'
import type { HomeCollectionResolved } from '@/constants/homeCollection'

function setClipRevealVars(el: HTMLElement, clientX: number, clientY: number) {
  const rect = el.getBoundingClientRect()
  const w = rect.width || 1
  const h = rect.height || 1
  const localX = clientX - rect.left
  const localY = clientY - rect.top
  const x = (localX / w) * 100
  const y = (localY / h) * 100
  const d1 = Math.hypot(localX, localY)
  const d2 = Math.hypot(w - localX, localY)
  const d3 = Math.hypot(localX, h - localY)
  const d4 = Math.hypot(w - localX, h - localY)
  const r = Math.max(d1, d2, d3, d4)
  el.style.setProperty('--clip-x', `${x}%`)
  el.style.setProperty('--clip-y', `${y}%`)
  el.style.setProperty('--clip-r', `${r}px`)
}

const exploreClipCssVars = {
  '--clip-x': '50%',
  '--clip-y': '50%',
  '--clip-r': '0px',
} as CSSProperties

export function Home() {
  const { t } = useTranslation()
  const lenis = useContext(LenisContext)
  const [homeCollection, setHomeCollection] = useState<HomeCollectionResolved>(() =>
    resolveHomeCollection(null),
  )
  const [exploreHover, setExploreHover] = useState(false)
  const [exploreFocus, setExploreFocus] = useState(false)
  const exploreActive = exploreHover || exploreFocus

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'announcements')
          .maybeSingle()
        if (data?.value) {
          setHomeCollection(resolveHomeCollection(data.value as Record<string, unknown>))
        }
      } catch {
        /* ignore */
      }
    }
    void load()
    const channel = supabase
      .channel('home-announcements')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings', filter: 'key=eq.announcements' },
        () => {
          void load()
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  const scrollToProductLineup = useCallback(() => {
    const el = document.getElementById('product-lineup')
    if (!el) return
    if (lenis) {
      lenis.scrollTo(el, { offset: -96, duration: 1.15 })
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [lenis])

  const onExplorePointerEnter = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    setClipRevealVars(e.currentTarget, e.clientX, e.clientY)
    setExploreHover(true)
  }, [])

  const onExplorePointerMove = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    setClipRevealVars(e.currentTarget, e.clientX, e.clientY)
  }, [])

  const onExplorePointerLeave = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    setClipRevealVars(e.currentTarget, e.clientX, e.clientY)
    setExploreHover(false)
  }, [])

  return (
    <div className="relative">
      {/* Hero pinned: video + hero content stay fixed, only lower sections scroll over it */}
      <section
        className="fixed inset-0 z-0 flex min-h-[100dvh] flex-col overflow-hidden bg-black"
        aria-label="Hero"
      >
        <video
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/videoplayback.mp4" type="video/mp4" />
        </video>
        <div className="pointer-events-none absolute inset-0 bg-black/45" aria-hidden />

        <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col justify-end px-5 pb-24 pt-16 animate-slide-up sm:px-6 md:pb-28">
          <div className="mx-auto flex w-full max-w-[90rem] flex-col-reverse gap-10 md:flex-row md:items-end md:justify-between md:gap-12">
            <h1 className="max-w-xl self-start text-left font-nav text-4xl font-bold leading-[1.05] tracking-tight text-pearl sm:text-5xl md:max-w-lg md:text-6xl lg:text-7xl">
              From Detail
              <br />
              To Perfection.
            </h1>
            <div className="flex w-full shrink-0 flex-col items-end gap-6 text-right md:w-auto">
              <p className="max-w-md text-pretty font-light text-silver/80 text-sm leading-relaxed md:text-base lg:text-lg">
                Crafted for those who demand precision, performance, and flawless results.
              </p>
              <button
                type="button"
                onClick={scrollToProductLineup}
                onPointerEnter={onExplorePointerEnter}
                onPointerMove={onExplorePointerMove}
                onPointerLeave={onExplorePointerLeave}
                onFocus={() => setExploreFocus(true)}
                onBlur={() => setExploreFocus(false)}
                className="relative inline-flex min-w-[12rem] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-white/[0.12] bg-transparent px-8 py-2.5 text-center font-nav text-sm font-bold uppercase outline-none [-webkit-tap-highlight-color:transparent] transition-[border-color,color] duration-500 ease-out hover:border-white/25 focus:outline-none focus-visible:outline-none motion-reduce:transition-none"
                style={exploreClipCssVars}
              >
                <span
                  className="pointer-events-none absolute inset-0 z-0 bg-white"
                  style={{
                    clipPath: `circle(${exploreActive ? 'var(--clip-r, 0px)' : '0px'} at var(--clip-x, 50%) var(--clip-y, 50%))`,
                    WebkitClipPath: `circle(${exploreActive ? 'var(--clip-r, 0px)' : '0px'} at var(--clip-x, 50%) var(--clip-y, 50%))`,
                    transition:
                      'clip-path 900ms cubic-bezier(0.22,1,0.36,1), -webkit-clip-path 900ms cubic-bezier(0.22,1,0.36,1)',
                    willChange: 'clip-path',
                  }}
                  aria-hidden
                />
                <span
                  className={`relative z-10 transition-colors duration-500 motion-reduce:duration-200 ${
                    exploreActive ? 'text-black' : 'text-pearl'
                  }`}
                >
                  Explore Products
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-silver/40">
          <span className="block w-px h-12 bg-current mx-auto animate-pulse" />
        </div>
      </section>

      {/* Content stack: starts 1 viewport below (minus main padding), then scrolls over the pinned hero */}
      <div className="relative z-10 pointer-events-none">
        {/* Spacer (transparent) MUST NOT block interactions with the pinned hero */}
        <div className="h-[calc(100dvh-5rem)] pointer-events-none select-none" aria-hidden />
        <div className="bg-carbon-950 pointer-events-auto">
          <ProductCategoryLineup />

          <HomeCollectionSection config={homeCollection} />

          <VoyagerWorldwideScrollSection
            slides={FIREBALL_COUNTRY_SLIDES}
            eyebrow="Countries we serve"
            heading="Trusted Worldwide"
            description="A global network of professionals and enthusiasts using Fireball every day."
          />

          {/* CTA */}
          <section className="py-24">
            <div className="max-w-3xl mx-auto px-6 text-center">
              <h2 className="font-display text-4xl md:text-5xl text-pearl tracking-tight mb-6">
                {t('home.ctaTitle')}
              </h2>
              <p className="text-silver/80 mb-10">{t('home.ctaSubtitle')}</p>
              <Link
                to="/boutique"
                className="inline-block px-8 py-4 border border-chrome text-chrome text-sm uppercase hover:bg-chrome hover:text-carbon-950 transition-colors"
              >
                {t('home.ctaButton')}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
