import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { WhatToExpectRow } from '@/constants/siteEventConfigs'

gsap.registerPlugin(ScrollTrigger)

const DEFAULT_ROWS: WhatToExpectRow[] = [
  {
    num: '01',
    title: 'The Community',
    body: "Connect with certified Fireball installers, industry partners, and enthusiasts who live this world. Real conversations — the kind that don't happen on a show floor.",
  },
  {
    num: '02',
    title: 'The Fireball Team',
    body: 'The full Fireball Canada team will be there — talk product, ask about certification, go deeper on what being a Fireball installer means for your business.',
  },
  {
    num: '03',
    title: 'A Curated Evening',
    body: 'No panels. No presentations. Just a well-curated evening built around the people who take their craft seriously — and know how to celebrate it.',
  },
]

interface WhatToExpectProps {
  rows?: WhatToExpectRow[]
}

export function WhatToExpect({ rows }: WhatToExpectProps) {
  const effectiveRows = rows && rows.length > 0 ? rows : DEFAULT_ROWS
  const [bgNum, setBgNum] = useState<string | null>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const rowsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const heading = headingRef.current
    const rowsContainer = rowsRef.current
    if (!section || !heading || !rowsContainer) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        heading,
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.75,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 82%',
            once: true,
          },
        },
      )

      const rowEls = rowsContainer.querySelectorAll('[data-expect-row]')
      gsap.fromTo(
        rowEls,
        {
          y: 44,
          opacity: 0,
          rotateX: 10,
          transformPerspective: 900,
          transformOrigin: 'top center',
        },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 0.65,
          ease: 'power2.out',
          stagger: 0.1,
          scrollTrigger: {
            trigger: rowsContainer,
            start: 'top 85%',
            once: true,
          },
        },
      )
    }, section)

    return () => ctx.revert()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-white text-carbon-900"
      aria-labelledby="what-to-expect-heading"
    >
      <div
        className="mx-auto max-w-7xl px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-[80px]"
        style={{ fontFamily: "'Roboto', sans-serif" }}
      >
        <h2
          ref={headingRef}
          id="what-to-expect-heading"
          className="mb-12 text-center font-nav text-4xl font-bold tracking-tight text-carbon-950 sm:mb-16 sm:text-5xl md:text-6xl lg:mb-20"
        >
          What to expect
        </h2>

        <div className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute right-[-20px] top-1/2 z-0 -translate-y-1/2 select-none leading-none transition-opacity duration-500"
            style={{
              fontSize: 'clamp(120px, 22vw, 320px)',
              fontWeight: 900,
              letterSpacing: '-10px',
              color: 'rgba(0,0,0,0.09)',
              opacity: bgNum ? 1 : 0,
            }}
            aria-hidden
          >
            {bgNum ?? '01'}
          </div>

          <div ref={rowsRef} className="relative z-[1] flex flex-col">
            {effectiveRows.map((row) => (
              <div
                key={row.num}
                data-expect-row
                className="group relative cursor-default overflow-hidden border-t border-carbon-900/10 last:border-b last:border-carbon-900/10"
                onMouseEnter={() => setBgNum(row.num)}
                onMouseLeave={() => setBgNum(null)}
              >
                <div
                  className="pointer-events-none absolute inset-0 z-0 -translate-x-full bg-carbon-900 transition-transform duration-[480ms] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:translate-x-0"
                  aria-hidden
                />

                <div className="relative z-[1] grid grid-cols-1 gap-4 py-6 sm:gap-6 md:grid-cols-[72px_minmax(0,1fr)_minmax(0,1fr)] md:items-start md:gap-0 md:py-8 lg:py-10">
                  <div className="font-medium text-carbon-400 transition-colors duration-300 md:pt-1 md:text-sm md:group-hover:text-white/30">
                    {row.num}
                  </div>
                  <div className="text-lg font-bold leading-snug text-carbon-950 transition-colors duration-300 md:pr-6 md:pt-1 md:group-hover:text-white/90">
                    {row.title}
                  </div>
                  <div className="max-w-xl text-sm leading-relaxed text-carbon-600 transition-colors duration-300 md:group-hover:text-white/90">
                    {row.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
