import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '@/data/products'
import { fetchProductsFromShopify } from '@/utils/shopifyStorefront'

type GaugeKey = 'hardness' | 'gloss' | 'resistance' | 'hydrophobicity'

type CoatingSection = {
  id: string
  name: string
  years: string
  description: string
  highlights: string[]
  gauges: Record<GaugeKey, number> // 0..100
  matchNames: string[] // best-effort matching vs Shopify product names
}

const GAUGE_COLOR = '#B61B1B' // same red as free-shipping progress

const SECTIONS: CoatingSection[] = [
  {
    id: 'dok-do-10',
    name: 'DOK DO',
    years: '10-YEAR',
    description:
      'Dok Do is our state-of-the-art flagship coating suited exclusively to the most skilled, hand-picked installers in the world. This 10 year coating exceeds 9H hardness and leads the industry in the highest amount of Si02. Dok Do consists of a super hard base coat, topped with a hard chemical resistant & glossy top coat. Dok Do contains over 92% Si02 & Si glass ceramic compounds made from five different types of Si02. Dok Do also contains high levels of titanium dioxide.\n\nWe recommend Dok Do on prestige vehicles where no compromise is requested by a customer. Exceeds 9H Hardness.\n\nDok Do Ceramic Coating is an innovative, two-layer formula of the highest proprietary renown, generating maximum protection for your vehicle.',
    highlights: [
      '10 Year Durability',
      'Our strongest most durable long lasting coating',
      'Highest Levels Of Protection',
      'Highest Levels of Depth & Gloss',
      'The World’s Best Ceramic Coating',
      'Highest percentage levels of ceramic compounds',
      'Leads the industry in every category',
    ],
    gauges: { hardness: 96, gloss: 96, resistance: 96, hydrophobicity: 96 },
    matchNames: ['dok do', 'dokdo'],
  },
  {
    id: 'butterfly-graphene-9',
    name: 'BUTTERFLY GRAPHENE',
    years: '9-YEAR',
    description:
      'Butterfly Graphene- The new and improved formula contains even more chemical and water spot resistance compared to other coatings on the market. The ultra slick coating makes for an incredibly easy installation process. The surface can be washed within 8 hours of application, with full curing taking place between 48-72 hours making for a faster curing process (depending on climate). Butterfly Graphene contains over 90% Si02 & Si glass-ceramic compounds made from five different types of Si02. The formula also contains titanium along with added graphene oxide for increased durability up to 9 years. The advanced graphene technology enhances gloss, water-spot resistance, increased slickness, hydrophobicity and exceeds 9H hardness for an extremely durable coating.\n\nButterfly Graphene is the latest in single-layer coatings. This new and improved formula is designed to give you the best protection against corrosion that synthesizes Nobel-prize winning research into an efficient, hyper-protective finish.',
    highlights: [
      '9 Year Durability',
      'Advanced graphene oxide ceramic technology',
      'Extremely hard',
      'Enhances gloss',
      'The best graphene coating in the world',
      'Modern innovation',
      '1-Layer Application',
    ],
    gauges: { hardness: 82, gloss: 82, resistance: 82, hydrophobicity: 78 },
    matchNames: ['butterfly graphene', 'graphene'],
  },
  {
    id: 'butterfly-7',
    name: 'BUTTERFLY',
    years: '7-YEAR',
    description:
      'Since the inception, Butterfly has been our flagship single layer coating. Butterfly is made from high quality materials that provide an incredible look with long lasting durability. Backed by a 7 year guarantee and made from industry leading technology, Butterfly’s innovative formula continues to push forward with high quality results that deliver in all types of weather conditions. Butterfly contains over 90% Si02 & Si glass ceramic compounds made from five different types of Si02. Butterfly also contains heavy amounts of titanium dioxide for more protection.',
    highlights: [
      '7 Year Durability',
      'Advanced Ceramic Technology',
      'Extremely Hard; Enhances Gloss',
      'Perfect For Daily Driven Vehicles',
      'The Most Popular Coating Option',
      '1-Layer Application',
    ],
    gauges: { hardness: 90, gloss: 88, resistance: 60, hydrophobicity: 80 },
    matchNames: ['butterfly'],
  },
  {
    id: 'silla-5',
    name: 'SILLA',
    years: '5-YEAR',
    description:
      'Silla is the highest corrosion resistant ceramic coating in the Fireball collection specializing in assurance against harmful contaminants. It features a single layer that warrants up to a 5 year guarantee from a proven formula pushing boundaries that provides excellent chemical resistance against salt, rust, and grime. Silla contains over 88% Si02 & Si glass ceramic compounds made from five different types of Si02. Silla also contains heavy amounts of titanium dioxide for more protection.\n\nSilla is a fantastic product for those that live in harsh environments with chemical or salty conditions. It reduces the risk of water spotting on your paintwork, and it won’t scratch easily like other coatings. Furthermore, Silla protects against coastal erosion which can be quite problematic when living close to oceans.',
    highlights: [
      '5 Year Durability',
      'Added Protection From Pollution',
      'Highest Chemical Resistance',
      'Intense Surface Clarity',
      'Perfect For Marine Applications',
    ],
    gauges: { hardness: 82, gloss: 80, resistance: 96, hydrophobicity: 58 },
    matchNames: ['silla'],
  },
  {
    id: 'devils-blood-3',
    name: "DEVIL'S BLOOD",
    years: '3-YEAR',
    description:
      'Devils Blood is the next generation of car care technology, utilizing an innovative hybrid nano structure. These breakthroughs create a high gloss dense coating with advances in various attributes. not seen before; including durability against water spots, acid, solvents, ice, oil, dirt, and UV radiation. Backed by a factory guarantee for up to 3 years. The powerful and superhydrophobic qualities resist the elements from the harshest conditions. This coating has an unprecedented self-cleaning feature unlike coatings of this nature. Devil’s Blood not only cleans itself but also limits dirt within its own bounds. Devil’s Blood contains over 81% Si02 & Si glass ceramic compounds made from five different types of Si02. Devil’s Blood also contains heavy amounts of titanium dioxide.\n\nLooking for a coating that can withstand the elements? Look no further than devil’s blood. This powerful and superhydrophobic coating is perfect for those who need a durable product that can resist the harshest conditions. Plus, its self-cleaning feature is unlike anything on the market today. So if you’re looking for a high-quality, long-lasting coating, devil’s blood is the perfect choice.',
    highlights: [
      '3 Year Durability',
      'Highest Level Of Hydrophobics',
      'Great Chemical Resistance',
      'Creates Outstanding Depth',
      'Optimal Solution For Price and Quality',
    ],
    gauges: { hardness: 80, gloss: 80, resistance: 90, hydrophobicity: 88 },
    matchNames: ["devil's blood", 'devils blood'],
  },
  {
    id: 'aegis-2',
    name: 'AEGIS',
    years: '2-YEAR',
    description:
      'Aegis is a groundbreaking molecular achievement; this breakthrough contains over 76% Si02 & Si glass ceramic compounds made from five different types of pure Si02, which is higher quality and concentration in Si02 than most other coatings on the market. Aegis also contains titanium which is unseen in the industry for most coatings at this level.\nAegis is an exceptional all-round coating with amazing versatility that can also be used on exterior and interior surfaces and has a factory backed Guarantee for up to 2 years.\n\nAegis is our most versatile ceramic coating, offering outstanding protection for both exteriors and dedicated interior surfaces. This adaptable nano-technology based coating is so refined it’s an absolute marvel to behold.',
    highlights: [
      '2 Year Durability',
      'Flexible-hard Outer Shell',
      'Adds high levels of gloss',
      'High chemical resistance',
      'Versatile-multi-surface',
      'Si02 Content comparative to top tier competitor offerings that claim (5 years +)',
    ],
    gauges: { hardness: 60, gloss: 60, resistance: 70, hydrophobicity: 86 },
    matchNames: ['aegis'],
  },
  {
    id: 'typhoon-1',
    name: 'TYPHOON',
    years: '1-YEAR',
    description:
      'Typhoon coating is our Super-Hydrophobic coating topper that has a durability of up to 12 months. Typhoon contains over 70% Si & Si02. Typhoon also contains 2.5% Titanium. Typhoon can be applied to glass-work or as a topper onto any paintwork coating from our range to give a super slick and outstanding water repellent finish. Mainly used in areas with high rainfall and/or dirty water areas, where water removal is desirable to keep surfaces cleaner. The main task of Typhoon is to add to the protected surface by giving exceptional hydrophobic properties, gloss, slickness and better self-cleaning properties.\n\nFireball Typhoon is an extremely hydrophobic, chemically bonded nano-coating topper that offers unparalleled protection.',
    highlights: [
      'Up To 1+ Year Durability',
      'Super-hydrophobic Nano-ceramic ⁠Topper-Added Protection',
      'Insane Slickness Unlike anything Else ⁠',
      'Excellent Self-Cleaning',
      'Multi-layerable for added protection',
      'Alternative between wax and coating',
      'Highest levels of depth & gloss on the market',
      'Can be used to add slickness to all coatings excluding',
    ],
    gauges: { hardness: 40, gloss: 96, resistance: 90, hydrophobicity: 94 },
    matchNames: ['typhoon'],
  },
]

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
  const [secondaryHover, setSecondaryHover] = useState(false)

  const secondaryLinkCssVars = useMemo(
    () =>
      ({
        '--clip-x': '50%',
        '--clip-y': '50%',
        '--clip-r': '0px',
      }) as CSSProperties,
    [],
  )

  const setSecondaryClipVars = useCallback((el: HTMLAnchorElement, clientX: number, clientY: number) => {
    const rect = el.getBoundingClientRect()
    const w = rect.width || 1
    const h = rect.height || 1
    const localX = clientX - rect.left
    const localY = clientY - rect.top
    const x = (localX / w) * 100
    const y = (localY / h) * 100
    const r = Math.max(
      Math.hypot(localX, localY),
      Math.hypot(w - localX, localY),
      Math.hypot(localX, h - localY),
      Math.hypot(w - localX, h - localY),
    )
    el.style.setProperty('--clip-x', `${x}%`)
    el.style.setProperty('--clip-y', `${y}%`)
    el.style.setProperty('--clip-r', `${r}px`)
  }, [])

  const onSecondaryPointerEnter = useCallback(
    (e: ReactPointerEvent<HTMLAnchorElement>) => {
      setSecondaryClipVars(e.currentTarget, e.clientX, e.clientY)
      setSecondaryHover(true)
    },
    [setSecondaryClipVars],
  )
  const onSecondaryPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLAnchorElement>) => {
      setSecondaryClipVars(e.currentTarget, e.clientX, e.clientY)
    },
    [setSecondaryClipVars],
  )
  const onSecondaryPointerLeave = useCallback(
    (e: ReactPointerEvent<HTMLAnchorElement>) => {
      setSecondaryClipVars(e.currentTarget, e.clientX, e.clientY)
      setSecondaryHover(false)
    },
    [setSecondaryClipVars],
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
      const match = all.find((p) => {
        const n = normalizeName(p.name)
        return s.matchNames.some((m) => n.includes(m))
      })
      byId[s.id] = match?.image ?? null
    }
    return byId
  }, [products])

  return (
    <div className="w-full bg-white text-carbon-900">
      {/* Hero */}
      <section className="relative border-b border-carbon-200">
        <div className="mx-auto flex min-h-[72vh] max-w-7xl items-center px-6 py-16 text-center md:min-h-[78vh] md:py-20">
          <div className="mx-auto max-w-3xl">
            <h1 className="font-nav text-4xl font-black uppercase leading-[1.02] tracking-tight text-carbon-950 sm:text-5xl md:text-6xl">
              WORLDS BEST CERAMIC COATING
            </h1>
            <p className="mt-6 mx-auto max-w-2xl text-base leading-relaxed text-carbon-600 md:text-lg">
              Professional ceramic coatings engineered for long-lasting durability.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                to="/boutique/coatings"
                className="inline-flex items-center gap-2 px-8 py-2.5 font-nav font-bold text-sm uppercase rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl"
                style={{ backgroundColor: GAUGE_COLOR, color: 'white' }}
              >
                Shop all coatings
              </Link>
              <Link
                to="/coatings/compare"
                className="relative inline-flex items-center justify-center overflow-hidden rounded-xl border border-carbon-200 bg-transparent px-8 py-2.5 text-center font-nav text-sm font-bold uppercase transition-[border-color,color] duration-500 ease-out hover:border-carbon-300 motion-reduce:transition-none"
                style={secondaryLinkCssVars}
                onPointerEnter={onSecondaryPointerEnter}
                onPointerMove={onSecondaryPointerMove}
                onPointerLeave={onSecondaryPointerLeave}
              >
                <span
                  className="pointer-events-none absolute inset-0 z-0 bg-carbon-950"
                  style={{
                    clipPath: `circle(${secondaryHover ? 'var(--clip-r, 0px)' : '0px'} at var(--clip-x, 50%) var(--clip-y, 50%))`,
                    WebkitClipPath: `circle(${secondaryHover ? 'var(--clip-r, 0px)' : '0px'} at var(--clip-x, 50%) var(--clip-y, 50%))`,
                    transition:
                      'clip-path 900ms cubic-bezier(0.22,1,0.36,1), -webkit-clip-path 900ms cubic-bezier(0.22,1,0.36,1)',
                    willChange: 'clip-path',
                  }}
                  aria-hidden
                />
                <span
                  className={`relative z-10 transition-colors duration-500 motion-reduce:duration-200 ${
                    secondaryHover ? 'text-pearl' : 'text-carbon-950'
                  }`}
                >
                  Compare
                </span>
              </Link>
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
                  <div className="relative overflow-hidden rounded-3xl border border-carbon-200 bg-white">
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
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
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

