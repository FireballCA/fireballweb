import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SecondaryClipButton } from '@/components/ui/SecondaryClipButton'
import { shopBrowseCategoryPath } from '@/constants/paths'

const GAUGE_COLOR = '#B61B1B'

const STEPS = [
  {
    number: '01',
    title: 'Wash & Decontamination',
    description:
      'The vehicle receives a thorough two-bucket wash, followed by an iron fallout remover to dissolve embedded metallic particles. A clay bar treatment extracts surface-bonded contaminants, leaving the paint perfectly clean and ready for preparation.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Paint Correction',
    description:
      'A machine polisher with professional-grade compounds removes swirl marks, light scratches, and oxidation. This critical step ensures the ceramic coating bonds to a flawless surface, maximising gloss and eliminating trapped imperfections beneath the coating.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'IPA Panel Wipe',
    description:
      'Each panel is wiped down with an isopropyl alcohol solution to strip away any remaining polish residue, oils, or wax. This step reveals the true paint condition and creates a chemically clean surface so the ceramic coating achieves maximum adhesion.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
  {
    number: '04',
    title: 'Coating Application',
    description:
      'The ceramic coating is applied panel by panel using a professional applicator block. The installer works in a controlled environment, carefully levelling the product to ensure an even, uniform layer. Multi-layer formulas like Dok Do require precise timing between coats.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
  },
  {
    number: '05',
    title: 'Curing & Inspection',
    description:
      'The coating cures for 48–72 hours (depending on product and climate). During this time the vehicle must be kept dry. Once cured, the installer inspects each panel under specialist lighting to confirm perfect coverage and a flawless, high-gloss finish.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
]

const BENEFITS = [
  {
    title: '9H+ Hardness',
    description: 'Exceeds industry standard 9H pencil hardness, resisting scratches, swirls, and physical abrasion far better than bare paint or traditional wax.',
  },
  {
    title: 'UV Protection',
    description: 'Blocks harmful ultraviolet radiation that causes paint oxidation, colour fade, and clear coat degradation over time.',
  },
  {
    title: 'Hydrophobic Effect',
    description: 'Water beads and rolls off the surface, carrying dirt and contaminants with it. Your car stays cleaner longer between washes.',
  },
  {
    title: 'Self-Cleaning',
    description: 'The slick nano-layer prevents bonding of road grime, bird droppings, and tree sap. Contaminants release more easily during a simple rinse.',
  },
  {
    title: 'Enhanced Gloss',
    description: 'Ceramic compounds amplify depth and clarity, giving the paint a wet-look mirror finish that outperforms any wax or sealant on the market.',
  },
  {
    title: 'Chemical Resistance',
    description: 'Resists acids, alkaline cleaners, road salt, industrial fallout, and harsh weather. Your paint stays protected in the toughest environments.',
  },
]

const FAQS = [
  {
    question: 'How long does the full application take?',
    answer:
      'A standard application takes 1 to 2 days. If significant paint correction is required first, the process can extend to 2–3 days. Your installer will give you a precise timeframe after an initial inspection.',
  },
  {
    question: 'How long will the coating last?',
    answer:
      'Depending on the product you choose, protection lasts from 1 year (Typhoon) up to 10 years (Dok Do). Longevity depends on the coating, maintenance habits, and environmental conditions.',
  },
  {
    question: 'Can I wash my car right after the coating?',
    answer:
      'No — the coating needs 48 to 72 hours to fully cure before any water contact. After curing, a touchless or hand wash with a pH-neutral shampoo is recommended.',
  },
  {
    question: 'Does ceramic coating replace paint protection film (PPF)?',
    answer:
      'They serve different purposes. PPF physically absorbs rock chips and deep scratches. A ceramic coating provides chemical resistance, UV protection, and a hydrophobic effect. For maximum protection, many customers apply both — PPF first, then a ceramic coating on top.',
  },
  {
    question: 'Do I need paint correction before coating?',
    answer:
      'Strongly recommended. A ceramic coating locks in whatever is on the paint — including swirls and scratches. Correcting the paint first ensures the coating seals a flawless surface and delivers the maximum gloss result.',
  },
]

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t border-carbon-200">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-6 py-5 text-left"
      >
        <span className="text-base font-semibold text-carbon-900">{question}</span>
        <svg
          className={`h-5 w-5 shrink-0 text-carbon-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="pb-5 text-sm leading-relaxed text-carbon-700">{answer}</p>
        </div>
      </div>
    </div>
  )
}

export function HowItWorks() {
  return (
    <div className="w-full bg-white text-carbon-900">
      {/* Hero */}
      <section className="relative border-b border-carbon-200" aria-label="How ceramic coating works">
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
                How It Works
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75">
                A professional ceramic coating is more than a product — it's a multi-step process that transforms the surface of your vehicle for years to come.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to={shopBrowseCategoryPath('coatings')}
                  className="inline-flex items-center gap-2 rounded-xl px-8 py-2.5 font-nav text-sm font-bold uppercase shadow-lg transition-all duration-300 hover:opacity-90 hover:shadow-xl"
                  style={{ backgroundColor: GAUGE_COLOR, color: 'white' }}
                >
                  Shop Coatings
                </Link>
                <SecondaryClipButton to="/coatings/compare" idleTextClass="text-white" hoverTextClass="text-black">
                  Compare Products
                </SecondaryClipButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is ceramic coating */}
      <section className="border-b border-carbon-200">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-20">
            <div>
              <p className="font-nav text-[11px] font-bold uppercase tracking-[0.28em] text-carbon-500">
                The Science
              </p>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-carbon-950 md:text-4xl">
                What Is Ceramic Coating?
              </h2>
              <p className="mt-5 text-base leading-relaxed text-carbon-700">
                A ceramic coating is a liquid polymer infused with silicon dioxide (SiO₂) and other ceramic compounds that chemically bonds to your vehicle's clear coat. Unlike wax or sealant, which sit on top of the paint and wash away, a ceramic coating forms a permanent semi-rigid layer that becomes part of the surface.
              </p>
              <p className="mt-4 text-base leading-relaxed text-carbon-700">
                Once cured, the layer is hydrophobic, UV-resistant, chemically inert, and far harder than the paint beneath it. The result: a surface that looks better, stays cleaner, and withstands the elements for years — not weeks.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-6 border-t border-carbon-200 pt-8">
                <div>
                  <p className="font-nav text-2xl font-black text-carbon-950">9H+</p>
                  <p className="mt-1 font-nav text-[10px] uppercase tracking-[0.2em] text-carbon-500">Hardness</p>
                </div>
                <div>
                  <p className="font-nav text-2xl font-black text-carbon-950">92%</p>
                  <p className="mt-1 font-nav text-[10px] uppercase tracking-[0.2em] text-carbon-500">SiO₂ Max</p>
                </div>
                <div>
                  <p className="font-nav text-2xl font-black text-carbon-950">10yr</p>
                  <p className="mt-1 font-nav text-[10px] uppercase tracking-[0.2em] text-carbon-500">Max Warranty</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl">
              <div className="aspect-[4/5] w-full bg-carbon-950/5">
                <img
                  src="/Assets/Coatings/DokDO.png"
                  alt="Dok Do ceramic coating"
                  className="h-full w-full object-contain p-8"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process steps */}
      <section className="border-b border-carbon-200 bg-carbon-950">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="mb-12 max-w-2xl">
            <p className="font-nav text-[11px] font-bold uppercase tracking-[0.28em] text-white/35">
              The Process
            </p>
            <h2 className="mt-3 font-nav text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
              5-Step Application
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/55">
              Every Fireball coating is applied by a certified professional following a rigorous process. Each step builds on the last to ensure a perfect, long-lasting result.
            </p>
          </div>

          <div className="space-y-px">
            {STEPS.map((step, idx) => (
              <div
                key={step.number}
                className="group grid gap-6 border-t border-white/[0.08] py-8 md:grid-cols-[auto_1fr] md:gap-12"
              >
                <div className="flex items-start gap-5 md:gap-8">
                  <span className="font-nav text-5xl font-black leading-none text-white/10 md:text-6xl">
                    {step.number}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: GAUGE_COLOR }}
                    >
                      {step.icon}
                    </div>
                    <h3 className="font-nav text-lg font-black uppercase tracking-tight text-white">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/55 md:text-base">
                    {step.description}
                  </p>
                  {idx < STEPS.length - 1 && (
                    <div className="mt-6 flex items-center gap-2 text-white/20">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <span className="font-nav text-[10px] uppercase tracking-[0.2em]">Next step</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-b border-carbon-200">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="mb-12">
            <p className="font-nav text-[11px] font-bold uppercase tracking-[0.28em] text-carbon-500">
              Why Fireball
            </p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-carbon-950 md:text-4xl">
              6 Reasons to Coat
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((benefit, idx) => (
              <div key={benefit.title} className="border-t-2 pt-6" style={{ borderColor: GAUGE_COLOR }}>
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-nav text-[11px] font-black text-white"
                    style={{ backgroundColor: GAUGE_COLOR }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-nav text-sm font-black uppercase tracking-tight text-carbon-950">
                    {benefit.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-carbon-700">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-carbon-200">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="grid gap-12 md:grid-cols-[1fr_2fr] md:gap-20">
            <div className="md:sticky md:top-24 md:self-start">
              <p className="font-nav text-[11px] font-bold uppercase tracking-[0.28em] text-carbon-500">
                FAQ
              </p>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-carbon-950 md:text-4xl">
                Common Questions
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-carbon-600">
                Everything you need to know about the ceramic coating process, maintenance, and product selection.
              </p>
              <div className="mt-8">
                <SecondaryClipButton to="/coatings/find-installer" idleTextClass="text-carbon-900" hoverTextClass="text-black">
                  Ask an Installer
                </SecondaryClipButton>
              </div>
            </div>

            <div className="border-b border-carbon-200">
              {FAQS.map((faq) => (
                <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-carbon-950 py-20 text-center">
        <p className="font-nav text-[11px] font-bold uppercase tracking-[0.28em] text-white/30">
          Get Started
        </p>
        <h2 className="mt-4 font-nav text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
          Ready to Protect Your Vehicle?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/55">
          Find a certified Fireball installer near you or browse our full coating lineup to choose the right product.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/coatings/find-installer"
            className="inline-flex items-center gap-2 rounded-xl px-8 py-3 font-nav text-sm font-bold uppercase shadow-lg transition-all duration-300 hover:opacity-90 hover:shadow-xl"
            style={{ backgroundColor: GAUGE_COLOR, color: 'white' }}
          >
            Find an Installer
          </Link>
          <SecondaryClipButton to="/coatings/compare" idleTextClass="text-white" hoverTextClass="text-black">
            Compare Coatings
          </SecondaryClipButton>
        </div>
      </section>
    </div>
  )
}
