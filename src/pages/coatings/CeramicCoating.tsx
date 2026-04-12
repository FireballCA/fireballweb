import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '@/data/products'
import {
  CERAMIC_COATING_SECTIONS as SECTIONS,
  COATING_SECTION_IMAGES,
  type GaugeKey,
} from '@/data/ceramicCoatingSections'
import { SecondaryClipButton } from '@/components/ui/SecondaryClipButton'
import { fetchProductsFromShopify } from '@/utils/shopifyStorefront'
import { shopBrowseCategoryPath } from '@/constants/paths'

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
  const [products, setProducts] = useState<Product[]>([])

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
      {/* Landing — image pleine largeur (bannière), texte en bas */}
      <section className="relative border-b border-carbon-200" aria-label="Ceramic coatings">
        <div className="relative min-h-[min(72vh,760px)] w-full overflow-hidden">
          <img
            src={landingBannerSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading="eager"
            decoding="async"
            draggable={false}
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/25"
            aria-hidden
          />
          <div className="relative z-10 mx-auto flex min-h-[min(72vh,760px)] max-w-7xl flex-col justify-end px-6 pb-12 pt-28 text-left md:pb-16 md:pt-32">
            <div className="max-w-3xl">
              <h1 className="font-nav text-4xl font-black uppercase leading-[1.02] tracking-tight text-white sm:text-5xl md:text-6xl">
                WORLDS BEST CERAMIC COATING
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">
                Professional ceramic coatings engineered for long-lasting durability.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to={shopBrowseCategoryPath('coatings')}
                  className="inline-flex items-center gap-2 rounded-xl px-8 py-2.5 font-nav text-sm font-bold uppercase shadow-lg transition-all duration-300 hover:opacity-90 hover:shadow-xl"
                  style={{ backgroundColor: GAUGE_COLOR, color: 'white' }}
                >
                  Shop all coatings
                </Link>
                <SecondaryClipButton to="/coatings/compare" idleTextClass="text-white" hoverTextClass="text-black">
                  Compare
                </SecondaryClipButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
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

