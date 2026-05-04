import { useCallback, useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProductCategoryLineup } from '@/components/ProductCategoryLineup'
import { HomeCollectionSection } from '@/components/HomeCollectionSection'
import { VoyagerWorldwideScrollSection } from '@/components/VoyagerWorldwideScroll/VoyagerWorldwideScrollSection'
import { LenisContext } from '@/components/LenisRoot'
import { supabase } from '@/lib/supabase'
import { resolveHomeCollection } from '@/utils/homeCollectionSettings'
import type { HomeCollectionResolved } from '@/constants/homeCollection'
import { appleButtonVisualClassName } from '@/components/ui/AppleButton'
import { cn } from '@/lib/utils'
import { FIREBALL_COUNTRY_SLIDES } from '@/data/fireballCountriesSlider'
import { usePageTitle } from '@/hooks/usePageTitle'

/** Landing incrémentale : hero + sections réactivées une par une (debug refresh). */
export function Home() {
  const lenis = useContext(LenisContext)
  usePageTitle('Fireball Canada')

  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [homeCollection, setHomeCollection] = useState<HomeCollectionResolved>(() =>
    resolveHomeCollection(null),
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const sync = () => setIsMobileViewport(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

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

  const heroLite = isMobileViewport

  const scrollToProductLineup = useCallback(() => {
    const el = document.getElementById('product-lineup')
    if (!el) return
    if (lenis) {
      lenis.scrollTo(el, { offset: -96, duration: 1.15 })
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [lenis])

  return (
    <main className="relative min-h-0 overflow-x-hidden bg-carbon-950 text-white">
      <section
        className="relative flex h-[var(--app-hero-h)] min-h-[var(--app-hero-h)] flex-col overflow-hidden bg-black"
        aria-label="Hero"
      >
        {heroLite ? (
          <img
            src="/Assets/Carclub Hero.png"
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <video
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/videoplayback.mp4" type="video/mp4" />
          </video>
        )}
        <div className="pointer-events-none absolute inset-0 bg-black/45" aria-hidden />

        <div
          className={cn(
            'relative z-10 flex min-h-0 w-full flex-1 flex-col justify-center px-5 pb-24 pt-20 sm:px-6 md:justify-end md:pb-28 md:pt-16',
            !heroLite && 'animate-slide-up',
          )}
        >
          <div className="mx-auto flex w-full max-w-[90rem] flex-col items-center gap-8 text-center md:flex-row md:items-end md:justify-between md:gap-12 md:text-left">
            <h1 className="max-w-xl font-nav text-4xl font-bold leading-[1.05] tracking-tight text-pearl sm:text-5xl md:max-w-lg md:self-start md:text-6xl lg:text-7xl">
              <span className={heroLite ? '' : 'hero-ground-line hero-ground-line--clean'}>
                <span className={heroLite ? '' : 'hero-ground-text'}>From Detail</span>
              </span>
              <span className={cn('mt-1.5 sm:mt-2', heroLite ? '' : 'hero-ground-line hero-ground-line--clean')}>
                <span className={heroLite ? '' : 'hero-ground-text hero-ground-text--delay'}>To Perfection.</span>
              </span>
            </h1>
            <div className="flex w-full max-w-lg shrink-0 flex-col items-center gap-6 text-center md:max-w-none md:w-auto md:items-end md:text-right">
              <span className={heroLite ? '' : 'hero-ground-line hero-ground-line--clean'}>
                <p
                  className={cn(
                    'mx-auto max-w-md text-pretty text-sm font-light leading-relaxed text-silver/80 md:mx-0 md:text-base lg:text-lg',
                    heroLite ? '' : 'hero-ground-text hero-ground-text--delay-2',
                  )}
                >
                  Crafted for those who demand precision, performance, and flawless results.
                </p>
              </span>
              <span className={heroLite ? '' : 'hero-ground-line hero-ground-line--clean'}>
                <span
                  className={cn(
                    'inline-flex w-full max-w-sm flex-col gap-3 md:max-w-none md:items-end',
                    heroLite ? '' : 'hero-ground-text hero-ground-text--delay-3',
                  )}
                >
                  <button
                    type="button"
                    onClick={scrollToProductLineup}
                    className={cn(
                      'inline-flex w-full cursor-pointer items-center justify-center whitespace-nowrap max-md:min-h-[48px] max-md:px-6 max-md:py-3 max-md:text-sm md:w-auto',
                      appleButtonVisualClassName,
                    )}
                  >
                    Explore Products
                  </button>
                  <Link
                    to="/event"
                    className="inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/15 md:w-auto"
                  >
                    See events
                  </Link>
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-silver/40 md:bottom-8">
          <span className="mx-auto block h-12 w-px animate-pulse bg-current" />
        </div>
      </section>

      <div className="bg-carbon-950">
        <ProductCategoryLineup />
        <HomeCollectionSection config={homeCollection} />

        <VoyagerWorldwideScrollSection
          slides={FIREBALL_COUNTRY_SLIDES}
          eyebrow="Countries we serve"
          heading="Trusted Worldwide"
          description="A global network of professionals and enthusiasts using Fireball every day."
        />
      </div>
    </main>
  )
}
