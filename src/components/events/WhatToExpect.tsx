import { useEffect, useRef, useState } from 'react'

const EXPECT_ROWS = [
  {
    num: '01',
    title: 'The Community',
    body: 'Connect with certified Fireball installers, industry partners, and enthusiasts who live this world. Real conversations — the kind that don’t happen on a show floor.',
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
] as const

export function WhatToExpect() {
  const [bgNum, setBgNum] = useState<string | null>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setRevealed(true)
          io.disconnect()
        }
      },
      { threshold: 0.1 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-white text-carbon-900"
      aria-labelledby="what-to-expect-heading"
    >
      <div
        className={`mx-auto max-w-7xl px-6 py-16 transition-all duration-700 ease-out sm:px-10 sm:py-20 lg:px-16 lg:py-[80px] ${
          revealed ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
        }`}
        style={{ fontFamily: "'Roboto', sans-serif" }}
      >
        <h2
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
              color: 'rgba(0,0,0,0.028)',
              opacity: bgNum ? 1 : 0,
            }}
            aria-hidden
          >
            {bgNum ?? '01'}
          </div>

          <div className="relative z-[1] flex flex-col">
            {EXPECT_ROWS.map((row) => (
              <div
                key={row.num}
                className="group relative cursor-default overflow-hidden border-t border-carbon-900/10 last:border-b last:border-carbon-900/10"
                onMouseEnter={() => setBgNum(row.num)}
                onMouseLeave={() => setBgNum(null)}
              >
                <div
                  className="pointer-events-none absolute inset-0 z-0 hidden -translate-x-full bg-carbon-900 transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.18,1)] motion-reduce:transition-none md:block md:group-hover:translate-x-0"
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

                <div
                  className="pointer-events-none absolute right-5 top-1/2 z-[2] hidden -translate-y-1/2 translate-x-2 text-xl text-white opacity-0 transition-all duration-300 md:block md:group-hover:translate-x-0 md:group-hover:opacity-100"
                  aria-hidden
                >
                  →
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
