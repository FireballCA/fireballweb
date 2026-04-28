import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { IconChevronDown, IconCheck } from '@tabler/icons-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { cn } from '@/lib/utils'
import { SecondaryClipButton } from '@/components/ui/SecondaryClipButton'
import { appleButtonVisualClassName } from '@/components/ui/AppleButton'

const GAUGE_COLOR = '#B61B1B'

function useRevealOnce<T extends Element>() {
  const ref = useRef<T | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' } as any)
  return { ref, inView }
}

// ─── Paint cross-section layers ───────────────────────────────────────────────

const PAINT_LAYERS = [
  {
    id: 'ceramic',
    label: 'Ceramic Coating',
    sublabel: 'SiO₂ + TiO₂ nano-matrix · ~1–2 µm',
    bgClass: 'bg-carbon-800',
    textClass: 'text-white',
    subClass: 'text-white/60',
    height: 'h-14',
    description: 'SiO₂ nano-particles (20–50 nm) penetrate the clear coat pores and polymerise into a crystalline 9H+ hard matrix, chemically bonded to the surface. This is the permanent protective layer.',
  },
  {
    id: 'clearcoat',
    label: 'Clear Coat',
    sublabel: 'Acrylic/urethane · ~40–60 µm',
    bgClass: 'bg-carbon-200',
    textClass: 'text-carbon-800',
    subClass: 'text-carbon-500',
    height: 'h-12',
    description: 'Factory-applied gloss and UV protection layer. Naturally porous at 3–4H hardness. The ceramic nano-particles fill and reinforce these pores — any defect sealed in becomes permanent.',
  },
  {
    id: 'basecoat',
    label: 'Base Coat',
    sublabel: 'Pigment layer · ~20–30 µm',
    bgClass: 'bg-carbon-300',
    textClass: 'text-carbon-700',
    subClass: 'text-carbon-500',
    height: 'h-11',
    description: 'The pigment that gives your vehicle its colour. Must be fully corrected and decontaminated before any ceramic application. Errors here are sealed under the coating forever.',
  },
  {
    id: 'primer',
    label: 'Primer',
    sublabel: 'Anti-corrosion adhesion · ~20 µm',
    bgClass: 'bg-carbon-400',
    textClass: 'text-white',
    subClass: 'text-white/70',
    height: 'h-10',
    description: 'Provides adhesion between metal substrate and base coat. Anti-corrosion properties protect against oxidation from below. Foundation of the entire paint system.',
  },
  {
    id: 'metal',
    label: 'Metal Substrate',
    sublabel: 'Steel, aluminium or carbon fibre',
    bgClass: 'bg-carbon-600',
    textClass: 'text-white',
    subClass: 'text-white/60',
    height: 'h-14',
    description: 'The bare substrate — susceptible to corrosion without the layers above. The entire purpose of the ceramic system is to protect from the surface inward, not just cosmetically.',
  },
]

// ─── Chemistry compounds ──────────────────────────────────────────────────────

const COMPOUNDS = [
  {
    formula: 'SiO₂',
    name: 'Silicon Dioxide',
    subname: 'Five distinct molecular variants',
    body: 'The core active ingredient. Nano-particles (20–50 nm) fill the clear coat\'s microscopic pores and crosslink into a crystalline, glass-hard matrix. Fireball uses five types of SiO₂ simultaneously — a proprietary blend that outperforms any single-variant ceramic on the market.',
    stat: '70–92%+',
    statLabel: 'Content by product',
  },
  {
    formula: 'TiO₂',
    name: 'Titanium Dioxide',
    subname: 'Photocatalytic UV protection',
    body: 'Present in most Fireball coatings. TiO₂ creates a photo-active surface that breaks down organic contaminants when exposed to UV light — sunlight literally helps keep the surface clean. It also blocks UV radiation to prevent paint oxidation and colour fade.',
    stat: 'Photocatalytic',
    statLabel: 'Self-cleaning under UV',
  },
  {
    formula: 'C₂O',
    name: 'Graphene Oxide',
    subname: 'Nobel Prize–winning material',
    body: 'Exclusive to Butterfly Graphene. A single-atom-thick carbon lattice — the strongest material ever measured by weight. Integrated as graphene oxide into the SiO₂ matrix, it dramatically increases water-spot resistance, thermal conductivity, chemical durability, and slickness.',
    stat: '200×',
    statLabel: 'Stronger than steel',
  },
]

// ─── Application steps ────────────────────────────────────────────────────────

const APP_STEPS = [
  {
    step: '01',
    title: 'Decontamination',
    body: 'Iron fallout, tar, mineral deposits and oxidation are chemically dissolved. Clay bar treatment strips every bonded surface contaminant. This step cannot be skipped — contamination sealed under ceramic becomes permanent.',
    duration: '2–4 h',
  },
  {
    step: '02',
    title: 'Paint correction',
    body: 'Multi-stage machine polishing removes swirl marks, scratches, buffer trails and holograms down to the clear coat. A geometrically uniform surface bonds more completely and produces a deeper final gloss.',
    duration: '4–12 h',
  },
  {
    step: '03',
    title: 'Panel preparation',
    body: 'IPA and a dedicated panel wipe solvent remove every trace of polish oils, silicones, and fingerprints. Inspected under high-intensity LED at multiple angles before any coating is opened.',
    duration: '30–90 min',
  },
  {
    step: '04',
    title: 'Ceramic application',
    body: 'Applied panel by panel with a specialized suede applicator. Each pass deposits a thin, even film within a precise flash-off window. Timing is critical — buffing must occur before the coating reaches its gel point.',
    duration: '2–6 h',
  },
  {
    step: '05',
    title: 'Curing',
    body: 'Initial surface cure within 12–24 hours. Full chemical crosslinking takes 14–30 days depending on temperature and humidity. Infrared lamps accelerate initial cure. No water contact during the cure window.',
    duration: '14–30 days',
  },
  {
    step: '06',
    title: 'Warranty registration',
    body: 'Your certified Fireball installer registers the coating in the partner portal. Warranty documentation is issued. Annual inspection is recommended to maintain full coverage.',
    duration: 'Ongoing',
  },
]

// ─── SiO₂ chart ───────────────────────────────────────────────────────────────

const SIO2_DATA = [
  { name: 'Dok Do', value: 92, label: '92%+', years: '10-Year' },
  { name: 'Butterfly Graphene', value: 90, label: '90%+', years: '9-Year' },
  { name: 'Butterfly', value: 90, label: '90%+', years: '7-Year' },
  { name: 'Silla', value: 88, label: '88%+', years: '5-Year' },
  { name: "Devil's Blood", value: 81, label: '81%+', years: '3-Year' },
  { name: 'Aegis', value: 76, label: '76%+', years: '2-Year' },
  { name: 'Typhoon', value: 70, label: '70%+', years: '1-Year' },
]

// ─── Interactive cross-section ────────────────────────────────────────────────

function CrossSectionDiagram() {
  const [active, setActive] = useState<string>('ceramic')
  const { ref, inView } = useRevealOnce<HTMLDivElement>()

  const activeLayer = PAINT_LAYERS.find((l) => l.id === active)

  return (
    <div ref={ref} className="grid items-start gap-10 md:grid-cols-[1fr_1fr] lg:grid-cols-[480px_1fr]">
      {/* Stack */}
      <div>
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-carbon-400">
          Click a layer to explore
        </p>
        <div className="space-y-1">
          {PAINT_LAYERS.map((layer, i) => (
            <motion.button
              key={layer.id}
              type="button"
              onClick={() => setActive(layer.id)}
              className={cn(
                'relative w-full overflow-hidden rounded-xl border-2 text-left transition-all duration-200',
                layer.height,
                layer.bgClass,
                active === layer.id
                  ? 'border-carbon-900 shadow-md'
                  : 'border-transparent opacity-75 hover:opacity-100',
              )}
              initial={{ opacity: 0, x: -16 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.45, delay: i * 0.07 }}
            >
              <div className="flex h-full items-center px-4">
                <span className={cn('text-xs font-bold tracking-tight', layer.textClass)}>
                  {layer.label}
                </span>
                <span className={cn('ml-2 hidden text-[10px] sm:block', layer.subClass)}>
                  {layer.sublabel}
                </span>
              </div>
              {/* animated nano dots on ceramic */}
              {layer.id === 'ceramic' && (
                <div className="pointer-events-none absolute inset-0">
                  {[...Array(10)].map((_, ni) => (
                    <motion.div
                      key={ni}
                      className="absolute h-1.5 w-1.5 rounded-full bg-white/30"
                      style={{ left: `${6 + ni * 10}%`, top: '50%', y: '-50%' }}
                      animate={{ opacity: [0.2, 0.6, 0.2], scale: [0.8, 1.2, 0.8] }}
                      transition={{
                        duration: 2 + (ni % 3) * 0.5,
                        repeat: Infinity,
                        delay: ni * 0.2,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.button>
          ))}
        </div>

        {/* Contact angle row */}
        <motion.div
          className="mt-6 rounded-xl border border-carbon-200 bg-[#f5f5f7] p-4"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.55 }}
        >
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-carbon-400">
            Water contact angle
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Bare paint', angle: 40 },
              { label: 'Wax', angle: 75 },
              { label: 'Ceramic', angle: 110 },
            ].map(({ label, angle }) => (
              <div key={label}>
                <div className="mx-auto mb-2 flex h-9 items-end justify-center">
                  <div
                    className="rounded-t-full bg-carbon-300"
                    style={{
                      width: Math.max(10, 36 - angle * 0.18),
                      height: Math.max(8, 24 - angle * 0.12),
                    }}
                  />
                </div>
                <div className="font-mono text-sm font-bold text-carbon-900">{angle}°</div>
                <div className="text-[10px] text-carbon-400">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Info panel */}
      <div className="sticky top-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border border-carbon-200 bg-[#f5f5f7] p-7"
          >
            <span className="text-xs font-medium text-carbon-400">
              {activeLayer?.sublabel}
            </span>
            <h4 className="mt-2 text-2xl font-bold tracking-tight text-carbon-900">
              {activeLayer?.label}
            </h4>
            <p className="mt-4 text-base leading-relaxed text-carbon-600">
              {activeLayer?.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Compound card ────────────────────────────────────────────────────────────

function CompoundCard({ c, index, inView }: { c: (typeof COMPOUNDS)[0]; index: number; inView: boolean }) {
  return (
    <motion.div
      className="rounded-2xl border border-carbon-200 bg-white p-7"
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="font-mono text-4xl font-bold tracking-tight text-carbon-900">
        {c.formula}
      </div>
      <h4 className="mt-3 text-lg font-bold tracking-tight text-carbon-900">{c.name}</h4>
      <p className="mt-0.5 text-xs text-carbon-400">{c.subname}</p>
      <p className="mt-4 text-sm leading-relaxed text-carbon-600">{c.body}</p>
      <div className="mt-5 border-t border-carbon-100 pt-4">
        <div className="text-xl font-bold text-carbon-900">{c.stat}</div>
        <div className="text-xs text-carbon-400">{c.statLabel}</div>
      </div>
    </motion.div>
  )
}

// ─── Application step ─────────────────────────────────────────────────────────

function AppStep({ s, index, inView }: { s: (typeof APP_STEPS)[0]; index: number; inView: boolean }) {
  return (
    <motion.div
      className="relative grid grid-cols-[1px_1fr] gap-6"
      initial={{ opacity: 0, x: -12 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Vertical line + dot */}
      <div className="relative flex flex-col items-center">
        <div className="mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 border-carbon-900 bg-white" />
        {index < APP_STEPS.length - 1 && (
          <div className="mt-1 w-px flex-1 bg-carbon-200" />
        )}
      </div>

      <div className="pb-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-medium text-carbon-400">{s.step}</span>
            <h4 className="mt-0.5 text-base font-bold tracking-tight text-carbon-900">{s.title}</h4>
          </div>
          <span className="shrink-0 rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[11px] font-medium text-carbon-500">
            {s.duration}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-carbon-600">{s.body}</p>
      </div>
    </motion.div>
  )
}

// ─── SiO₂ chart ───────────────────────────────────────────────────────────────

function SiO2Chart() {
  const { ref, inView } = useRevealOnce<HTMLDivElement>()

  return (
    <div ref={ref} className="space-y-4">
      {SIO2_DATA.map((d, i) => (
        <motion.div
          key={d.name}
          initial={{ opacity: 0, x: -10 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.4, delay: i * 0.07 }}
        >
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <div>
              <span className="font-bold text-carbon-900">{d.name}</span>
              <span className="ml-2 text-carbon-400">{d.years}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[#d9d9de]">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#111111] transition-[width] duration-700 ease-out"
                style={{
                  width: inView ? `${d.value}%` : '0%',
                  transitionDelay: inView ? `${i * 70}ms` : '0ms',
                }}
              />
            </div>
            <span className="w-14 text-right font-mono font-bold text-carbon-900">{d.label}</span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'How is ceramic coating different from wax or paint sealant?',
    a: 'Wax sits on top of paint and lasts 1–3 months. Paint sealants form a polymer bond lasting 6–12 months. Ceramic coating forms a true covalent chemical bond with the clear coat — it does not sit on top, it becomes part of the surface. The result is 9H hardness, chemical resistance, and 1–10 year durability depending on product.',
  },
  {
    q: 'What does "five types of SiO₂" mean in practice?',
    a: 'Silicon dioxide exists in multiple molecular forms: amorphous, colloidal, fumed, spherical, and organosilica. Each has different particle sizes, surface chemistry, and bonding properties. Fireball blends all five in a single formula to maximise both hardness and adhesion depth — no single variant achieves this alone.',
  },
  {
    q: 'Does ceramic coating prevent rock chips?',
    a: 'No. Ceramic adds 9H hardness against light abrasion, swirl marks, and chemical attack — not impact energy. For rock chip protection, paint protection film (PPF) is the correct product. Many enthusiasts apply both: PPF for impact zones, ceramic coating on top for hydrophobics and gloss.',
  },
  {
    q: 'Why does Dok Do require elite-certified installers?',
    a: 'Dok Do has over 92% SiO₂ in a two-layer formula with a highly sensitive flash-off window and layer timing. Incorrect application creates permanent high spots and hazing. Fireball reserves this product exclusively for their most skilled, hand-picked certified partners.',
  },
  {
    q: 'Can I apply ceramic coating on a new car?',
    a: 'Yes — and it is the optimal time. New vehicles often arrive with transport scratches and dealer polishing residue. A light decontamination and polish before ceramic application ensures a perfect, sealed result. The paint is at its most pristine, and the investment protects it from day one.',
  },
]

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false)
  const { ref, inView } = useRevealOnce<HTMLDivElement>()

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: index * 0.05 }}
      className="border-b border-carbon-200"
    >
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="pr-6 text-sm font-semibold text-carbon-900 md:text-base">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className="shrink-0">
          <IconChevronDown size={16} className="text-carbon-400" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-carbon-600">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function HowItWorks() {
  usePageTitle('How It Works — Fireball Canada')

  const compoundsRef = useRef<HTMLDivElement>(null)
  const compoundsInView = useInView(compoundsRef, { once: true })

  const processRef = useRef<HTMLDivElement>(null)
  const processInView = useInView(processRef, { once: true })

  const sio2Ref = useRef<HTMLDivElement>(null)
  const sio2InView = useInView(sio2Ref, { once: true })

  const benefitsRef = useRef<HTMLDivElement>(null)
  const benefitsInView = useInView(benefitsRef, { once: true })

  const BENEFITS = [
    { title: 'Permanent gloss', sub: 'Deeper and wetter than wax or sealant. Lasts years, not months.' },
    { title: 'Self-cleaning surface', sub: 'Water beads at 110°+ contact angle, carrying dirt away as it runs off.' },
    { title: '9H scratch resistance', sub: 'Harder than factory clear coat (3–4H). Resists swirl marks and light abrasion.' },
    { title: 'pH and chemical shield', sub: 'Repels bird droppings, acid rain, tar, and industrial fallout.' },
    { title: 'UV protection', sub: 'TiO₂ blocks UV radiation and prevents paint oxidation and colour fade.' },
    { title: 'Factory-backed warranty', sub: 'Up to 10 years with Dok Do. Registered and documented by your installer.' },
  ]

  return (
    <div className="bg-white text-carbon-900">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white px-6 pb-16 pt-24 md:pb-24 md:pt-36">
        <motion.div
          className="relative mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-bold tracking-tight text-carbon-900">
            The science of ceramic protection.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-carbon-500">
            From SiO₂ nano-particles to a 9H crystalline armour — a complete breakdown
            of how Fireball ceramic coatings permanently transform your vehicle's surface.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/coatings/find-installer" className={cn('inline-flex', appleButtonVisualClassName)}>
              Find an Installer
            </Link>
            <SecondaryClipButton to="/coatings/compare" className="!border-carbon-900 !bg-carbon-900" idleTextClass="text-white" hoverTextClass="text-carbon-900">
              Compare Coatings
            </SecondaryClipButton>
          </div>
        </motion.div>
      </section>

      {/* ── STATS BAND ───────────────────────────────────────────────────── */}
      <div className="border-y border-carbon-100 bg-[#f5f5f7]">
        <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-carbon-200 md:grid-cols-4">
          {[
            { val: '9H+', sub: 'Hardness (Dok Do)' },
            { val: '110°+', sub: 'Water contact angle' },
            { val: '92%+', sub: 'Peak SiO₂ content' },
            { val: '10 yr', sub: 'Max warranty' },
          ].map(({ val, sub }, i) => (
            <motion.div
              key={sub}
              className="flex flex-col items-center justify-center py-8 text-center"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <span className="font-nav text-3xl font-black text-carbon-900 md:text-4xl">{val}</span>
              <span className="mt-1.5 text-[11px] uppercase tracking-wider text-carbon-400">{sub}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── INTERACTIVE CROSS-SECTION ─────────────────────────────────────── */}
      <section className="border-b border-carbon-100 bg-white py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl px-6">
          <motion.div
            className="mb-12 max-w-lg"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-carbon-900 md:text-4xl">
              Inside your paint.
            </h2>
            <p className="mt-3 text-base leading-relaxed text-carbon-500">
              A cross-section of your vehicle from bare metal to ceramic matrix.
              Click each layer to understand what's happening molecularly.
            </p>
          </motion.div>

          <CrossSectionDiagram />
        </div>
      </section>

      {/* ── CHEMISTRY ─────────────────────────────────────────────────────── */}
      <section ref={compoundsRef} className="border-b border-carbon-100 bg-[#f5f5f7] py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl px-6">
          <motion.div
            className="mb-12 max-w-lg"
            initial={{ opacity: 0, y: 16 }}
            animate={compoundsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-carbon-900 md:text-4xl">
              What's actually inside.
            </h2>
            <p className="mt-3 text-base leading-relaxed text-carbon-500">
              Three foundational compounds. Each plays a distinct molecular role.
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-3">
            {COMPOUNDS.map((c, i) => (
              <CompoundCard key={c.name} c={c} index={i} inView={compoundsInView} />
            ))}
          </div>
        </div>
      </section>

      {/* ── SiO₂ BY PRODUCT ──────────────────────────────────────────────── */}
      <section ref={sio2Ref} className="border-b border-carbon-100 bg-white py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="grid items-start gap-14 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={sio2InView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="text-3xl font-bold tracking-tight text-carbon-900 md:text-4xl">
                SiO₂ content,
                <br />across the lineup.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-carbon-500">
                A higher SiO₂ concentration means a denser matrix, harder film, and
                greater chemical resistance. Fireball coatings range from 70% to 92%+ —
                each built from five types of silicon dioxide.
              </p>
              <p className="mt-3 text-sm text-carbon-400">
                Industry average: 50–70% SiO₂.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={sio2InView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <SiO2Chart />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── APPLICATION PROCESS ───────────────────────────────────────────── */}
      <section ref={processRef} className="border-b border-carbon-100 bg-[#f5f5f7] py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="grid gap-14 md:grid-cols-[320px_1fr]">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={processInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold tracking-tight text-carbon-900 md:text-4xl">
                Application,
                <br />step by step.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-carbon-500">
                Professional ceramic application is a 2–3 day process.
                Here is exactly what your certified installer does — and why
                none of these steps can be skipped.
              </p>
            </motion.div>

            <div>
              {APP_STEPS.map((s, i) => (
                <AppStep key={s.step} s={s} index={i} inView={processInView} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ──────────────────────────────────────────────────────── */}
      <section ref={benefitsRef} className="border-b border-carbon-100 bg-white py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="grid items-start gap-14 md:grid-cols-[1fr_1.2fr]">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={benefitsInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl font-bold tracking-tight text-carbon-900 md:text-4xl">
                What changes
                <br />after coating.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-carbon-500">
                The ceramic matrix permanently changes how your vehicle interacts
                with the environment — from molecular chemistry to daily maintenance.
              </p>
              <div className="mt-7">
                <Link to="/coatings/compare" className={cn('inline-flex', appleButtonVisualClassName)}>
                  Compare Coatings
                </Link>
              </div>
            </motion.div>

            <div className="grid gap-3 sm:grid-cols-2">
              {BENEFITS.map((b, i) => (
                <motion.div
                  key={b.title}
                  className="rounded-xl border border-carbon-100 bg-[#f5f5f7] p-4"
                  initial={{ opacity: 0, y: 14 }}
                  animate={benefitsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.45, delay: 0.08 + i * 0.07 }}
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <IconCheck size={13} className="shrink-0 text-carbon-900" />
                    <span className="text-sm font-semibold text-carbon-900">{b.title}</span>
                  </div>
                  <p className="pl-5 text-xs leading-relaxed text-carbon-500">{b.sub}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="border-b border-carbon-100 bg-[#f5f5f7] py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-[300px_1fr]">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-carbon-900 md:text-3xl">
                Common questions
              </h2>
              <p className="mt-2 text-sm text-carbon-500">
                Technical answers to what people ask most.
              </p>
            </div>
            <div className="border-t border-carbon-200">
              {FAQS.map((f, i) => (
                <FAQItem key={i} q={f.q} a={f.a} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="bg-white py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-carbon-900 md:text-4xl">
              Ready to protect
              your vehicle?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-carbon-500">
              Connect with a certified Fireball installer near you. Professional application,
              factory-backed warranty, and permanent molecular protection.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link to="/coatings/find-installer" className={cn('inline-flex', appleButtonVisualClassName)}>
                Find an Installer
              </Link>
              <SecondaryClipButton to="/coatings/compare" className="!border-carbon-900 !bg-carbon-900" idleTextClass="text-white" hoverTextClass="text-carbon-900">
                Compare Coatings
              </SecondaryClipButton>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
