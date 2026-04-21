import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CERAMIC_COATING_SECTIONS as SECTIONS,
  COATING_SECTION_IMAGES,
  type GaugeKey,
} from '@/data/ceramicCoatingSections'
import { SecondaryClipButton } from '@/components/ui/SecondaryClipButton'
import { shopBrowseCategoryPath } from '@/constants/paths'

const GAUGE_COLOR = '#B61B1B'

const GAUGE_KEYS: GaugeKey[] = ['hardness', 'gloss', 'resistance', 'hydrophobicity']
const GAUGE_LABELS: Record<GaugeKey, string> = {
  hardness: 'Hardness',
  gloss: 'Gloss',
  resistance: 'Resistance',
  hydrophobicity: 'Hydrophobicity',
}

const BEST_FOR: Record<string, string> = {
  'dok-do-10': 'Prestige Vehicles',
  'butterfly-graphene-9': 'Max Innovation',
  'butterfly-7': 'Daily Drivers',
  'silla-5': 'Harsh Environments',
  'devils-blood-3': 'Water Repellency',
  'aegis-2': 'Multi-Surface',
  'typhoon-1': 'Topper / Glass',
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
      { threshold: 0.2 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [inView])
  return { ref, inView }
}

function MiniGauge({ value, reveal, delayMs }: { value: number; reveal: boolean; delayMs: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className="flex items-center gap-1.5">
      <div className="meter meter--sm flex-1" style={{ gridTemplateAreas: '"track track"' }}>
        <div className="meter__track">
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
      <span className="w-7 shrink-0 text-right font-inter text-[10px] tabular-nums text-carbon-500">{pct}</span>
    </div>
  )
}

function GaugeRow({ gaugeKey, label }: { gaugeKey: GaugeKey; label: string }) {
  const { ref, inView } = useInViewOnce<HTMLTableRowElement>()
  return (
    <tr ref={ref} className="border-t border-carbon-200">
      <td className="sticky left-0 z-10 bg-white py-3 pr-3 align-middle">
        <span className="font-nav text-[10px] font-bold uppercase tracking-[0.2em] text-carbon-600 whitespace-nowrap">
          {label}
        </span>
      </td>
      {SECTIONS.map((s, colIdx) => (
        <td key={s.id} className="px-2 py-3 align-middle">
          <MiniGauge value={s.gauges[gaugeKey]} reveal={inView} delayMs={colIdx * 35} />
        </td>
      ))}
    </tr>
  )
}

export function CompareCoatings() {
  return (
    <div className="w-full bg-white text-carbon-900">
      {/* Hero */}
      <section className="relative border-b border-carbon-200" aria-label="Compare coatings">
        <div className="relative min-h-[min(52vh,560px)] w-full overflow-hidden">
          <img
            src="/Assets/Coatings/Coatings%20Banner.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading="eager"
            decoding="async"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" aria-hidden />
          <div className="relative z-10 mx-auto flex min-h-[min(52vh,560px)] max-w-7xl flex-col justify-end px-6 pb-12 pt-28 md:pb-16">
            <div className="max-w-2xl">
              <p className="font-nav text-[11px] font-bold uppercase tracking-[0.28em] text-white/50">
                Fireball Ceramic
              </p>
              <h1 className="mt-3 font-nav text-4xl font-black uppercase leading-[1.02] tracking-tight text-white sm:text-5xl md:text-6xl">
                Compare Coatings
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75">
                Find the right ceramic coating for your vehicle — compare our full 7-product lineup side by side.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to={shopBrowseCategoryPath('coatings')}
                  className="inline-flex items-center gap-2 rounded-xl px-8 py-2.5 font-nav text-sm font-bold uppercase shadow-lg transition-all duration-300 hover:opacity-90 hover:shadow-xl"
                  style={{ backgroundColor: GAUGE_COLOR, color: 'white' }}
                >
                  Shop All Coatings
                </Link>
                <SecondaryClipButton to="/coatings/find-installer" idleTextClass="text-white" hoverTextClass="text-black">
                  Find Installer
                </SecondaryClipButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="mb-10">
          <h2 className="text-2xl font-black uppercase tracking-tight text-carbon-950 md:text-3xl">
            Full Lineup
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-carbon-600">
            All 7 coatings ranked by warranty — from our flagship Dok Do down to Typhoon.
          </p>
        </div>

        <div className="-mx-6 overflow-x-auto px-6 md:mx-0 md:px-0">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr>
                {/* Row label column */}
                <th className="sticky left-0 z-20 bg-white pb-6 pr-3 align-bottom">
                  <span className="font-nav text-[10px] font-bold uppercase tracking-[0.28em] text-carbon-400">
                    Metric
                  </span>
                </th>
                {SECTIONS.map((s) => (
                  <th key={s.id} className="min-w-[110px] pb-6 align-bottom">
                    <div className="flex flex-col items-center gap-2 px-1">
                      <div className="h-[72px] w-14 flex-shrink-0">
                        {COATING_SECTION_IMAGES[s.id] ? (
                          <img
                            src={COATING_SECTION_IMAGES[s.id]}
                            alt={s.name}
                            className="h-full w-full object-contain"
                            draggable={false}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded-xl bg-carbon-950/5">
                            <img
                              src="/Assets/BrandKIT/Icon/RBG%20(for%20Digital)/Icon_Black.svg"
                              alt=""
                              className="h-7 w-7 opacity-50"
                              draggable={false}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-nav text-[10px] font-black uppercase leading-tight tracking-[0.08em] text-carbon-950 text-center">
                          {s.name}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 font-nav text-[8px] font-bold uppercase tracking-wide text-white whitespace-nowrap"
                          style={{ backgroundColor: GAUGE_COLOR }}
                        >
                          {s.years}
                        </span>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* Best For */}
              <tr className="border-t border-carbon-200">
                <td className="sticky left-0 z-10 bg-white py-3 pr-3 align-middle">
                  <span className="font-nav text-[10px] font-bold uppercase tracking-[0.2em] text-carbon-600 whitespace-nowrap">
                    Best For
                  </span>
                </td>
                {SECTIONS.map((s) => (
                  <td key={s.id} className="px-1 py-3 text-center align-middle">
                    <span className="inline-block rounded-full bg-carbon-950/5 px-2 py-1 font-inter text-[9px] leading-snug text-carbon-700">
                      {BEST_FOR[s.id]}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Gauge rows */}
              {GAUGE_KEYS.map((key) => (
                <GaugeRow key={key} gaugeKey={key} label={GAUGE_LABELS[key]} />
              ))}

              {/* Highlights count */}
              <tr className="border-t border-carbon-200">
                <td className="sticky left-0 z-10 bg-white py-3 pr-3 align-middle">
                  <span className="font-nav text-[10px] font-bold uppercase tracking-[0.2em] text-carbon-600 whitespace-nowrap">
                    Key Features
                  </span>
                </td>
                {SECTIONS.map((s) => (
                  <td key={s.id} className="px-2 py-3 text-center align-middle">
                    <span className="font-inter text-sm font-bold text-carbon-900">{s.highlights.length}</span>
                    <span className="ml-0.5 font-inter text-[10px] text-carbon-400">pts</span>
                  </td>
                ))}
              </tr>

              {/* CTA row */}
              <tr className="border-t border-carbon-200">
                <td className="sticky left-0 z-10 bg-white py-5 pr-3 align-middle">
                  <span className="font-nav text-[10px] font-bold uppercase tracking-[0.2em] text-carbon-600 whitespace-nowrap">
                    Details
                  </span>
                </td>
                {SECTIONS.map((s) => (
                  <td key={s.id} className="px-2 py-5 text-center align-middle">
                    <Link
                      to={`/all-coatings#${s.id}`}
                      className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 font-nav text-[10px] font-bold uppercase tracking-wide text-white transition-opacity duration-300 hover:opacity-75"
                      style={{ backgroundColor: GAUGE_COLOR }}
                    >
                      View
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Performance legend */}
      <section className="border-t border-carbon-200">
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {GAUGE_KEYS.map((key) => (
              <div key={key}>
                <p className="font-nav text-[11px] font-bold uppercase tracking-[0.2em] text-carbon-600">
                  {GAUGE_LABELS[key]}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-carbon-700">
                  {key === 'hardness' && 'Scratch and swirl resistance. Higher scores mean tougher protection against physical abrasion.'}
                  {key === 'gloss' && 'Depth, clarity and mirror-like shine. Higher scores deliver a showroom-quality finish.'}
                  {key === 'resistance' && 'Defence against chemical attack — acids, bird droppings, UV rays, and environmental fallout.'}
                  {key === 'hydrophobicity' && 'Water-beading and self-cleaning ability. Higher scores keep your paint cleaner between washes.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-carbon-950 py-20 text-center">
        <p className="font-nav text-[11px] font-bold uppercase tracking-[0.28em] text-white/30">
          Professional Grade
        </p>
        <h2 className="mt-4 font-nav text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
          Not Sure Which Coating?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/55">
          Our certified installers will recommend the right coating for your vehicle, lifestyle, and budget.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/coatings/find-installer"
            className="inline-flex items-center gap-2 rounded-xl px-8 py-3 font-nav text-sm font-bold uppercase shadow-lg transition-all duration-300 hover:opacity-90 hover:shadow-xl"
            style={{ backgroundColor: GAUGE_COLOR, color: 'white' }}
          >
            Find an Installer
          </Link>
          <SecondaryClipButton to="/all-coatings" idleTextClass="text-white" hoverTextClass="text-black">
            View All Coatings
          </SecondaryClipButton>
        </div>
      </section>
    </div>
  )
}
