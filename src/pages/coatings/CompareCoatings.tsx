import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { IconCheck, IconChevronDown, IconMinus } from '@tabler/icons-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { cn } from '@/lib/utils'
import { SecondaryClipButton } from '@/components/ui/SecondaryClipButton'
import { appleButtonVisualClassName } from '@/components/ui/AppleButton'
import { SEO, breadcrumbJsonLd } from '@/components/SEO'

const GAUGE_COLOR = '#111111'

// ─── Coating data ─────────────────────────────────────────────────────────────

interface CoatingSpec {
  id: string
  name: string
  years: string
  sio2: number
  hardness: number
  gloss: number
  resistance: number
  hydrophobicity: number
  layers: number
  selfHealing: boolean
  graphene: boolean
  titanium: boolean
  proOnly: boolean
  description: string
  bestFor: string
  image: string
}

const COATINGS: CoatingSpec[] = [
  {
    id: 'dok-do',
    name: 'Dok Do',
    years: '10-Year',
    sio2: 92,
    hardness: 100,
    gloss: 100,
    resistance: 100,
    hydrophobicity: 100,
    layers: 2,
    selfHealing: false,
    graphene: false,
    titanium: true,
    proOnly: true,
    description: 'Our state-of-the-art flagship coating. Reserved for the most skilled, hand-picked certified installers in the world. Exceeds 9H hardness. Leads the industry in every category.',
    bestFor: 'Prestige & exotic vehicles',
    image: '/Assets/Coatings/DokDO.png',
  },
  {
    id: 'butterfly-graphene',
    name: 'Butterfly Graphene',
    years: '9-Year',
    sio2: 90,
    hardness: 82,
    gloss: 82,
    resistance: 82,
    hydrophobicity: 78,
    layers: 1,
    selfHealing: false,
    graphene: true,
    titanium: true,
    proOnly: false,
    description: 'Nobel Prize–winning graphene oxide technology. Enhanced water-spot resistance, increased slickness, and a faster 48–72 hour cure window.',
    bestFor: 'Maximum durability & gloss',
    image: '/Assets/Coatings/BUTTERFLY-GRAPHENE.png',
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    years: '7-Year',
    sio2: 90,
    hardness: 90,
    gloss: 88,
    resistance: 60,
    hydrophobicity: 80,
    layers: 1,
    selfHealing: false,
    graphene: false,
    titanium: true,
    proOnly: false,
    description: 'Our most popular flagship coating. Exceptional gloss and durability for any daily driven vehicle. The benchmark of professional ceramic protection.',
    bestFor: 'Daily drivers & popular choice',
    image: '/Assets/Coatings/Butterfly_50ml.png',
  },
  {
    id: 'silla',
    name: 'Silla',
    years: '5-Year',
    sio2: 88,
    hardness: 82,
    gloss: 80,
    resistance: 96,
    hydrophobicity: 58,
    layers: 1,
    selfHealing: false,
    graphene: false,
    titanium: true,
    proOnly: false,
    description: 'Highest corrosion and chemical resistance in the collection. Built for coastal, marine, and harsh industrial environments. Unrivalled protection against salt and rust.',
    bestFor: 'Coastal & marine environments',
    image: '/Assets/Coatings/Silla_50ml.png',
  },
  {
    id: 'devils-blood',
    name: "Devil's Blood",
    years: '3-Year',
    sio2: 81,
    hardness: 80,
    gloss: 80,
    resistance: 90,
    hydrophobicity: 88,
    layers: 1,
    selfHealing: true,
    graphene: false,
    titanium: true,
    proOnly: false,
    description: 'Highest hydrophobic performance in the lineup. Innovative hybrid nano-structure with self-cleaning properties unlike any coating of this nature.',
    bestFor: 'Hydrophobics & self-cleaning',
    image: "/Assets/Coatings/Devil's-Blood_50ml (1).png",
  },
  {
    id: 'aegis',
    name: 'Aegis',
    years: '2-Year',
    sio2: 76,
    hardness: 60,
    gloss: 60,
    resistance: 70,
    hydrophobicity: 86,
    layers: 1,
    selfHealing: false,
    graphene: false,
    titanium: true,
    proOnly: false,
    description: 'Outstanding versatility for exterior and interior surfaces. A groundbreaking multi-surface formula with SiO₂ concentration higher than most 5-year competitors.',
    bestFor: 'Multi-surface versatility',
    image: '/Assets/Coatings/Aegis_50ml.png',
  },
  {
    id: 'typhoon',
    name: 'Typhoon',
    years: '1-Year Topper',
    sio2: 70,
    hardness: 40,
    gloss: 96,
    resistance: 90,
    hydrophobicity: 94,
    layers: 1,
    selfHealing: false,
    graphene: false,
    titanium: false,
    proOnly: false,
    description: 'Super-hydrophobic nano-ceramic topper. Applied over any coating or glass for insane slickness and outstanding water repellency. Not a standalone base coating.',
    bestFor: 'Topper & glass treatment',
    image: '/Assets/Coatings/Typhoon_50ml.png',
  },
]

// ─── Gauge bar — identical to CeramicCoating page ────────────────────────────

function useRevealOnce<T extends Element>() {
  const ref = useRef<T | null>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })
  return { ref, inView }
}

function Gauge({
  label,
  value,
  reveal,
  delayMs = 0,
  color = GAUGE_COLOR,
}: {
  label: string
  value: number
  reveal: boolean
  delayMs?: number
  color?: string
}) {
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
            backgroundColor: color,
            transitionDelay: `${reveal ? delayMs : 0}ms`,
          }}
        />
      </div>
    </div>
  )
}

// ─── Coating card ─────────────────────────────────────────────────────────────

function CoatingCard({
  c,
  index,
  selected,
  onSelect,
}: {
  c: CoatingSpec
  index: number
  selected: boolean
  onSelect: () => void
}) {
  const { ref, inView } = useRevealOnce<HTMLDivElement>()

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'group h-full w-full rounded-2xl border bg-white p-5 text-left transition-all duration-200 flex flex-col',
          selected
            ? 'border-carbon-900 shadow-sm'
            : 'border-carbon-200 hover:border-carbon-400 hover:shadow-sm',
        )}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <span className="font-nav text-base font-bold leading-tight tracking-tight text-carbon-900">
              {c.name}
            </span>
            <span className="mt-0.5 block text-xs text-carbon-500">{c.years}</span>
          </div>
          <AnimatePresence>
            {selected && (
              <motion.div
                className="flex h-5 w-5 items-center justify-center rounded-full bg-carbon-900"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <IconCheck size={10} className="text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 space-y-2.5">
          <Gauge label="Hardness" value={c.hardness} reveal={inView} delayMs={0} color="#111111" />
          <Gauge label="Gloss" value={c.gloss} reveal={inView} delayMs={80} color="#111111" />
          <Gauge label="Resistance" value={c.resistance} reveal={inView} delayMs={160} color="#111111" />
          <Gauge label="Hydrophobic" value={c.hydrophobicity} reveal={inView} delayMs={240} color="#111111" />
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {c.graphene && (
            <span className="rounded-full border border-carbon-200 px-2 py-0.5 text-[9px] font-medium text-carbon-500">
              Graphene
            </span>
          )}
          {c.selfHealing && (
            <span className="rounded-full border border-carbon-200 px-2 py-0.5 text-[9px] font-medium text-carbon-500">
              Self-Healing
            </span>
          )}
          <span className="rounded-full border border-carbon-200 px-2 py-0.5 text-[9px] font-medium text-carbon-500">
            {c.sio2}%+ SiO₂
          </span>
        </div>
      </button>
    </motion.div>
  )
}

// ─── Comparison table ─────────────────────────────────────────────────────────

const GAUGE_KEYS: { key: 'hardness' | 'gloss' | 'resistance' | 'hydrophobicity'; label: string }[] = [
  { key: 'hardness', label: 'Hardness' },
  { key: 'gloss', label: 'Gloss' },
  { key: 'resistance', label: 'Chemical Resistance' },
  { key: 'hydrophobicity', label: 'Hydrophobicity' },
]

function TableGauge({ value, inView, delay }: { value: number; inView: boolean; delay: number }) {
  const pct = Math.round(value)
  return (
    <div className="mx-auto flex w-[92px] items-center gap-2">
      <div className="relative h-1.5 w-14 overflow-hidden rounded-full bg-[#d9d9de]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[#111111] transition-[width] duration-700 ease-out"
          style={{
            width: inView ? `${pct}%` : '0%',
            transitionDelay: inView ? `${delay}ms` : '0ms',
          }}
        />
      </div>
      <span className="w-7 text-right font-mono text-[10px] tabular-nums text-carbon-500">{pct}</span>
    </div>
  )
}

function SiO2TableCell({ value, inView, delay }: { value: number; inView: boolean; delay: number }) {
  const pct = Math.round(value)
  return (
    <div className="mx-auto flex w-[92px] items-center gap-2">
      <span className="w-9 text-right font-mono text-xs font-bold tabular-nums text-carbon-900">{pct}%</span>
      <div className="relative h-1.5 w-14 overflow-hidden rounded-full bg-[#d9d9de]" aria-hidden>
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[#111111] transition-[width] duration-700 ease-out"
          style={{
            width: inView ? `${pct}%` : '0%',
            transitionDelay: inView ? `${delay}ms` : '0ms',
          }}
        />
      </div>
    </div>
  )
}

function ComparisonTable() {
  const { ref, inView } = useRevealOnce<HTMLElement>()

  return (
    <section ref={ref} className="bg-[#f5f5f7] py-20 md:py-28">
      <div className="mx-auto w-full max-w-7xl px-6">
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-carbon-900 md:text-4xl">
            Full specification sheet
          </h2>
          <p className="mt-2 text-base text-carbon-500">Every metric, side by side.</p>
        </motion.div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr>
                <th className="w-44 pb-4 pr-6 text-left text-[11px] font-semibold uppercase tracking-wider text-carbon-400">
                  Specification
                </th>
                {COATINGS.map((c, ci) => (
                  <th key={c.id} className="pb-4 text-center">
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={inView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.45, delay: ci * 0.05 }}
                    >
                      <span className="block text-xs font-bold tracking-tight text-carbon-900">
                        {c.name}
                      </span>
                      <span className="block text-[10px] text-carbon-400">{c.years}</span>
                    </motion.div>
                  </th>
                ))}
              </tr>
              <tr>
                <td colSpan={COATINGS.length + 1}>
                  <div className="h-px bg-carbon-200" />
                </td>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td className="py-3 pr-6 text-xs text-carbon-500">SiO₂ Content</td>
                {COATINGS.map((c, ci) => (
                  <td key={c.id} className="px-2 py-3.5">
                    <SiO2TableCell
                      value={c.sio2}
                      inView={inView}
                      delay={140 + ci * 40}
                    />
                  </td>
                ))}
              </tr>

              {GAUGE_KEYS.map(({ key, label }, ri) => (
                <tr key={key} className="border-t border-carbon-100">
                  <td className="py-3.5 pr-6 text-xs text-carbon-500">{label}</td>
                  {COATINGS.map((c, ci) => (
                    <td key={c.id} className="px-2 py-3.5">
                      <TableGauge
                        value={c[key]}
                        inView={inView}
                        delay={180 + ri * 70 + ci * 30}
                      />
                    </td>
                  ))}
                </tr>
              ))}

              <tr className="border-t border-carbon-100">
                <td className="py-3.5 pr-6 text-xs text-carbon-500">Layers</td>
                {COATINGS.map((c) => (
                  <td key={c.id} className="py-3.5 text-center text-xs text-carbon-600">
                    {c.layers === 2 ? '2-layer' : '1-layer'}
                  </td>
                ))}
              </tr>

              <tr className="border-t border-carbon-100">
                <td className="py-3.5 pr-6 text-xs text-carbon-500">Self-Healing</td>
                {COATINGS.map((c) => (
                  <td key={c.id} className="py-3.5 text-center">
                    {c.selfHealing
                      ? <IconCheck size={13} className="mx-auto text-carbon-900" />
                      : <IconMinus size={13} className="mx-auto text-carbon-300" />}
                  </td>
                ))}
              </tr>

              <tr className="border-t border-carbon-100">
                <td className="py-3.5 pr-6 text-xs text-carbon-500">Graphene oxide</td>
                {COATINGS.map((c) => (
                  <td key={c.id} className="py-3.5 text-center">
                    {c.graphene
                      ? <IconCheck size={13} className="mx-auto text-carbon-900" />
                      : <IconMinus size={13} className="mx-auto text-carbon-300" />}
                  </td>
                ))}
              </tr>

              <tr className="border-t border-carbon-100">
                <td className="py-3.5 pr-6 text-xs text-carbon-500">TiO₂ (UV shield)</td>
                {COATINGS.map((c) => (
                  <td key={c.id} className="py-3.5 text-center">
                    {c.titanium
                      ? <IconCheck size={13} className="mx-auto text-carbon-900" />
                      : <IconMinus size={13} className="mx-auto text-carbon-300" />}
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

// ─── Product detail section ───────────────────────────────────────────────────

function ProductDetail({ c, reverse = false }: { c: CoatingSpec; reverse?: boolean }) {
  const { ref, inView } = useRevealOnce<HTMLElement>()

  return (
    <motion.article
      ref={ref}
      className={cn(
        'grid items-center gap-12 border-b border-carbon-100 py-20 md:py-24',
        reverse ? 'md:grid-cols-[1fr_1fr]' : 'md:grid-cols-[1fr_1fr]',
      )}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className={cn('flex items-center justify-center', reverse && 'md:order-2')}
        initial={{ opacity: 0, x: reverse ? 28 : -28 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative w-full max-w-sm">
          <img
            src={c.image}
            alt={c.name}
            className="w-full object-contain drop-shadow-xl"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0' }}
          />
        </div>
      </motion.div>

      <motion.div
        className={cn(reverse && 'md:order-1')}
        initial={{ opacity: 0, x: reverse ? -28 : 28 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.07, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="text-xs font-medium text-carbon-400">{c.years} warranty</span>
        <h3 className="mt-1 text-3xl font-bold tracking-tight text-carbon-900 md:text-4xl">
          {c.name}
        </h3>
        <p className="mt-3 text-sm font-medium text-carbon-500">{c.bestFor}</p>
        <p className="mt-4 text-base leading-relaxed text-carbon-600">{c.description}</p>

        <div className="mt-7 space-y-3">
          {GAUGE_KEYS.map(({ key, label }, gi) => (
            <Gauge key={key} label={label} value={c[key]} reveal={inView} delayMs={gi * 80} />
          ))}
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/coatings/find-installer" className={cn('inline-flex', appleButtonVisualClassName)}>
            Find an Installer
          </Link>
        </div>
      </motion.div>
    </motion.article>
  )
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'What makes Dok Do exclusive to elite installers?',
    a: 'Dok Do contains over 92% SiO₂ in a two-layer formula with a highly sensitive flash-off window and layer timing. Incorrect application creates permanent high spots and hazing that cannot be corrected without full removal. Fireball reserves it exclusively for their most skilled, hand-picked certified partners.',
  },
  {
    q: 'What is the difference between Butterfly and Butterfly Graphene?',
    a: 'Butterfly Graphene adds graphene oxide — a Nobel Prize–winning material — to the proven Butterfly formula. This enhances water-spot resistance, chemical durability, slickness, and hydrophobicity. The graphene matrix also allows a faster curing window of 48–72 hours.',
  },
  {
    q: 'Is Typhoon a standalone ceramic coating?',
    a: 'No. Typhoon is a super-hydrophobic nano-ceramic topper. It is designed to be layered over any existing coating or applied to glass surfaces for maximum slickness and water repellency. It can serve as an entry-level alternative between wax and a full base coating.',
  },
  {
    q: 'Which coating offers the best chemical resistance?',
    a: 'Silla leads the lineup with a chemical resistance score of 96/100. It was specifically engineered for coastal and marine environments where vehicles face constant exposure to salt, rust, and industrial fallout.',
  },
  {
    q: 'How long does professional application take?',
    a: 'A professional ceramic coating application takes 1–3 days. This includes paint decontamination, multi-stage machine polishing, panel wipe, ceramic application, and initial curing. Full chemical cure takes 14–30 days. Butterfly Graphene has an accelerated 48–72 hour cure.',
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
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="shrink-0"
        >
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

export function CompareCoatings() {
  usePageTitle('Compare Coatings — Fireball Canada')
  const [selected, setSelected] = useState<string[]>([])

  const toggle = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  return (
    <>
      <SEO
        title="Compare Fireball Ceramic Coatings — 9H+ Paint Protection Lineup"
        description="Compare Fireball ceramic coatings side by side: SiO₂ content, hardness, gloss, durability and warranty. Find the right coating system for your vehicle in seconds."
        canonicalPath="/coatings/compare"
        keywords="compare ceramic coatings, Fireball coating comparison, 9H ceramic coating, SiO2 content, ceramic coating durability, best ceramic coating Canada"
        jsonLd={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Ceramic Coatings', path: '/all-coatings' }, { name: 'Compare Coatings', path: '/coatings/compare' }])}
      />
      <div className="bg-white text-carbon-900">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="bg-white px-6 pb-16 pt-24 text-center md:pb-20 md:pt-32">
        <motion.div
          className="mx-auto max-w-3xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-bold tracking-tight text-carbon-900">
            Find the right coating
            <br />
            for your vehicle.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-carbon-500">
            Seven professional-grade ceramic formulas — from super-hydrophobic toppers
            to elite two-layer flagship coatings. Every specification, side by side.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/coatings/find-installer" className={cn('inline-flex', appleButtonVisualClassName)}>
              Find an Installer
            </Link>
            <SecondaryClipButton to="/coatings/how-it-works" className="!border-carbon-900 !bg-carbon-900" idleTextClass="text-white" hoverTextClass="text-carbon-900">
              How It Works
            </SecondaryClipButton>
          </div>
        </motion.div>
      </section>

      {/* ── COATING CARDS ────────────────────────────────────────────────── */}
      <section className="border-t border-carbon-100 bg-white py-16">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-carbon-900">
              The lineup
              {selected.length > 0 && (
                <span className="ml-2 text-base font-normal text-carbon-400">
                  — {selected.length} selected
                </span>
              )}
            </h2>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => setSelected([])}
                className="text-sm text-carbon-400 underline-offset-2 hover:text-carbon-700"
              >
                Clear
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {COATINGS.map((c, i) => (
              <CoatingCard
                key={c.id}
                c={c}
                index={i}
                selected={selected.includes(c.id)}
                onSelect={() => toggle(c.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── FULL COMPARISON TABLE ─────────────────────────────────────────── */}
      <ComparisonTable />

      {/* ── PRODUCT SPOTLIGHTS ────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-6">
        <div className="pt-8">
          <h2 className="text-2xl font-bold tracking-tight text-carbon-900 md:text-3xl">
            A closer look
          </h2>
          <p className="mt-2 text-base text-carbon-500">The coatings worth knowing in detail.</p>
        </div>
        {COATINGS.slice(0, 4).map((c, i) => (
          <ProductDetail key={c.id} c={c} reverse={i % 2 !== 0} />
        ))}
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="border-t border-carbon-100 bg-[#f5f5f7] py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-[280px_1fr]">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-carbon-900 md:text-3xl">
                Common questions
              </h2>
              <p className="mt-2 text-sm text-carbon-500">
                Everything you need before choosing.
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
      <section className="border-t border-carbon-100 bg-white py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-carbon-900 md:text-4xl">
              Ready to protect
              your investment?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-carbon-500">
              Connect with a certified Fireball installer near you. Professional application,
              factory-backed warranty, and permanent ceramic protection.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link to="/coatings/find-installer" className={cn('inline-flex', appleButtonVisualClassName)}>
                Find an Installer
              </Link>
              <SecondaryClipButton to="/coatings/how-it-works" className="!border-carbon-900 !bg-carbon-900" idleTextClass="text-white" hoverTextClass="text-carbon-900">
                How It Works
              </SecondaryClipButton>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
    </>
  )
}
