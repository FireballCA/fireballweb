import { useCallback, useContext, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import type { Product } from '@/data/products'
import {
  CERAMIC_COATING_SECTIONS as SECTIONS,
  COATING_SECTION_IMAGES,
  type GaugeKey,
} from '@/data/ceramicCoatingSections'
import { fetchProductsFromShopify } from '@/utils/shopifyStorefront'
import { LenisContext } from '@/components/LenisRoot'
import { appleButtonVisualClassName } from '@/components/ui/AppleButton'
import { cn } from '@/lib/utils'

const GAUGE_COLOR = '#B61B1B' // same red as free-shipping progress

function normalizeName(s: string) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

function useInViewOnce<T extends Element>() {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          obs.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [inView])

  return { ref, inView }
}

function Gauge({ label, value, reveal, delayMs }: { label: string; value: number; reveal: boolean; delayMs: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className="meter">
      <div className="flex items-center justify-between gap-4 text-[11px] font-bold uppercase tracking-normal text-carbon-600">
        <span>{label}</span>
        <span className="tabular-nums text-carbon-500">{pct}%</span>
      </div>
      <div className="meter__track" aria-hidden>
        <div
          className="meter__fill transition-[width] duration-700 ease-out"
          style={{
            width: reveal ? `${pct}%` : '0%',
            backgroundColor: GAUGE_COLOR,
            transitionDelay: `${reveal ? delayMs : 0}ms`,
          }}
        />
      </div>
    </div>
  )
}

function HighlightsAccordion({ title, items }: { title: string; items: string[] }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-t border-carbon-200 pt-4">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-4">
        <span className="text-sm font-semibold text-carbon-900">{title}</span>
        <svg
          className={`h-4 w-4 text-carbon-600 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0 mt-0'
        }`}
      >
        <div className="overflow-hidden">
          <ul className="space-y-2 text-sm text-carbon-700">
            {items.map((it) => (
              <li key={it} className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: GAUGE_COLOR }} />
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function PerformanceBlock({ gauges }: { gauges: Record<GaugeKey, number> }) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>()
  return (
    <div ref={ref} className="pt-2">
      <div className="border-t border-carbon-200 pt-4">
        <div className="flex w-full items-center justify-between gap-4">
          <span className="text-sm font-semibold text-carbon-900">Performance</span>
        </div>
        <div className="mt-4 grid gap-5">
          <Gauge label="Hardness" value={gauges.hardness} reveal={inView} delayMs={0} />
          <Gauge label="Gloss" value={gauges.gloss} reveal={inView} delayMs={90} />
          <Gauge label="Resistance" value={gauges.resistance} reveal={inView} delayMs={180} />
          <Gauge label="Hydrophobicity" value={gauges.hydrophobicity} reveal={inView} delayMs={270} />
        </div>
      </div>
    </div>
  )
}

export function CeramicCoating() {
  const lenis = useContext(LenisContext)
  const [products, setProducts] = useState<Product[]>([])

  const scrollToLineup = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      const el = document.getElementById('coatings-lineup')
      if (!el) return
      if (lenis) {
        lenis.scrollTo(el, { offset: -96, duration: 1.15 })
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    },
    [lenis],
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const all = await fetchProductsFromShopify()
        if (!cancelled) setProducts(all)
      } catch {
        if (!cancelled) setProducts([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const imageBySectionId = useMemo(() => {
    const byId: Record<string, string | null> = {}
    const all = products
    for (const s of SECTIONS) {
      const local = COATING_SECTION_IMAGES[s.id]
      if (local) {
        byId[s.id] = local
        continue
      }
      const match = all.find((p) => {
        const n = normalizeName(p.name)
        return s.matchNames.some((m) => n.includes(m))
      })
      byId[s.id] = match?.image ?? null
    }
    return byId
  }, [products])

  const landingBannerSrc = '/Assets/Coatings/Coatings%20Banner.png'

  return (
    <div className="w-full bg-white text-carbon-900">
      {/* Hero — fond image (comme avant) + disposition type Car Club */}
      <section
        className="relative flex h-[min(88vh,920px)] min-h-[560px] max-h-[980px] flex-col overflow-hidden border-b border-carbon-200 bg-black"
        style={{
          height: 'min(88vh, var(--app-hero-h))',
          minHeight: 'min(560px, var(--app-hero-h))',
          maxHeight: 'var(--app-hero-h)',
        }}
        aria-label="Ceramic coatings"
      >
        <img
          src={landingBannerSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="eager"
          decoding="async"
          draggable={false}
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/82 via-black/45 to-black/25"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(to_bottom,#000_0%,rgba(0,0,0,0.55)_55%,transparent_100%)]" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(to_right,#000_0%,#000_55%,transparent_100%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[linear-gradient(to_left,#000_0%,#000_45%,transparent_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,0.5)_55%,#000_100%)]" />

        <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col justify-end px-5 pb-28 pt-20 sm:px-6 md:pb-32 md:pt-24">
          <div className="mx-auto flex w-full max-w-[90rem] flex-col-reverse gap-10 md:flex-row md:items-end md:justify-between md:gap-12">
            <h1 className="max-w-xl shrink-0 self-start pb-[0.15em] text-left font-nav text-4xl font-bold leading-[1.2] tracking-tight sm:text-5xl sm:leading-[1.18] md:max-w-lg md:text-6xl md:leading-[1.16] lg:text-7xl lg:leading-[1.14] bg-gradient-to-r from-[#d4d4d4] via-[#7a7a7a] to-[#1a1a1a] bg-clip-text text-transparent [-webkit-text-fill-color:transparent]">
              World&apos;s best ceramic coating
            </h1>
            <div className="flex w-full shrink-0 flex-col items-end gap-6 text-right md:w-auto">
              <p className="max-w-md text-pretty text-sm font-light leading-relaxed text-silver/80 md:text-base lg:text-lg">
                Professional ceramic coatings engineered for long-lasting durability.
              </p>
              <div className="flex flex-col items-end gap-1.5">
                <a
                  href="#coatings-lineup"
                  onClick={scrollToLineup}
                  className={cn('inline-flex whitespace-nowrap', appleButtonVisualClassName)}
                >
                  Explore
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sections */}
      <section id="coatings-lineup" className="scroll-mt-24 mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="space-y-16 md:space-y-24">
          {SECTIONS.map((s, idx) => {
            const img = imageBySectionId[s.id]
            const imageRight = idx % 2 === 1
            return (
              <article
                key={s.id}
                className="grid items-start gap-10 border-b border-carbon-200 pb-16 md:grid-cols-2 md:gap-14 md:pb-24"
              >
                {/* Sticky image */}
                <div className={`md:sticky md:top-24 ${imageRight ? 'md:order-2' : ''}`}>
                  <div className="relative overflow-hidden rounded-3xl">
                    <div className="aspect-[4/5] w-full">
                      {img ? (
                        <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <img
                            src="/Assets/BrandKIT/Icon/RBG%20(for%20Digital)/Icon_Black.svg"
                            alt=""
                            className="h-16 w-16 opacity-80"
                            draggable={false}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className={`min-w-0 ${imageRight ? 'md:order-1' : ''}`}>
                  <p className="font-nav text-[11px] font-bold uppercase tracking-[0.28em] text-carbon-600">{s.years}</p>
                  <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-carbon-950 sm:text-4xl">
                    {s.name}
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-relaxed text-carbon-700 sm:text-base">{s.description}</p>

                  <div className="mt-8">
                    <HighlightsAccordion title="Highlights" items={s.highlights} />
                    <div className="mt-6">
                      <PerformanceBlock gauges={s.gauges} />
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

