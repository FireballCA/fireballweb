import { useEffect, useRef } from 'react'

const IDS = {
  scroll: 'fb-home-cinematic-stats',
  sticky: 'fb-home-cinematic-sticky',
  fill: 'fb-home-cinematic-fill',
  scene: (i: number) => `fb-home-cinematic-scene-${i}`,
  num: (i: number) => `fb-home-cinematic-num-${i}`,
  dot: (i: number) => `fb-home-cinematic-dot-${i}`,
} as const

/**
 * Bloc manifesto + stats scroll (même logique que About).
 * Les ids sont préfixés pour éviter tout conflit si la structure évolue.
 */
export function HomeBeliefStatsSection() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {
        // Cleanup toujours retourné pour éviter l'erreur React #310
      }
    }

    const root = rootRef.current
    const reveals = root?.querySelectorAll<HTMLElement>('.reveal') ?? []
    const scrollRoot = document.getElementById('app-scroll-root')
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px', root: scrollRoot ?? null },
    )
    reveals.forEach((el) => revealObs.observe(el))

    const statsEl = document.getElementById(IDS.scroll)
    const stickyEl = document.getElementById(IDS.sticky)
    const scenes = [0, 1, 2].map((i) => document.getElementById(IDS.scene(i)) as HTMLElement | null)
    const nums = [0, 1, 2].map((i) => document.getElementById(IDS.num(i)) as HTMLElement | null)
    const dots = [0, 1, 2].map((i) => document.getElementById(IDS.dot(i)) as HTMLElement | null)
    const fillEl = document.getElementById(IDS.fill) as HTMLElement | null

    if (!statsEl || !stickyEl || scenes.some((s) => !s) || nums.some((n) => !n) || !fillEl) {
      return () => {
        revealObs.disconnect()
      }
    }

    const glows = ['rgba(212,43,43,0.12)', 'rgba(255,255,255,0.04)', 'rgba(212,43,43,0.10)']
    const SIZE_ENTER = 4.5
    const SIZE_PEAK = 14
    const SIZE_HOLD = 11
    const SIZE_EXIT = 22

    const easeOut = (t: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3)
    const easeIn = (t: number) => Math.pow(Math.max(0, Math.min(1, t)), 2)
    const easeInOut = (tIn: number) => {
      const t = Math.max(0, Math.min(1, tIn))
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    }
    const lerp = (a: number, b: number, tIn: number) => a + (b - a) * Math.max(0, Math.min(1, tIn))
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

    const tickStats = () => {
      const rect = statsEl.getBoundingClientRect()
      const scrolled = -rect.top
      const viewportHeight = scrollRoot?.clientHeight ?? window.innerHeight
      const totalTravel = statsEl.offsetHeight - viewportHeight
      if (totalTravel <= 0) return

      const globalT = clamp(scrolled / totalTravel, 0, 1)
      fillEl.style.width = `${(globalT * 100).toFixed(2)}%`

      let activeScene = -1

      for (let i = 0; i < 3; i += 1) {
        const scene = scenes[i]!
        const num = nums[i]!
        const statT = clamp(globalT * 3 - i, 0, 1)
        let size: number
        let opacity: number
        let ty: number
        let showLabel: boolean

        if (statT <= 0) {
          size = SIZE_ENTER
          opacity = 0
          ty = 40
          showLabel = false
        } else if (statT < 0.25) {
          const t = easeOut(statT / 0.25)
          size = lerp(SIZE_ENTER, SIZE_PEAK, t)
          opacity = lerp(0, 1, clamp(t * 3, 0, 1))
          ty = lerp(40, 0, t)
          showLabel = false
        } else if (statT < 0.45) {
          const t = easeInOut((statT - 0.25) / 0.2)
          size = lerp(SIZE_PEAK, SIZE_HOLD, t)
          opacity = 1
          ty = 0
          showLabel = t > 0.5
        } else if (statT < 0.72) {
          size = SIZE_HOLD
          opacity = 1
          ty = 0
          showLabel = true
        } else if (statT < 1) {
          const t = easeIn((statT - 0.72) / 0.28)
          size = lerp(SIZE_HOLD, SIZE_EXIT, t)
          opacity = lerp(1, 0, clamp(t * 1.6, 0, 1))
          ty = lerp(0, -30, t)
          showLabel = t < 0.2
        } else {
          size = SIZE_EXIT
          opacity = 0
          ty = -30
          showLabel = false
        }

        scene.style.opacity = String(opacity)
        scene.style.transform = `translateY(${ty}px)`
        num.style.fontSize = `${size}vw`
        scene.classList.toggle('label-visible', showLabel)
        if (statT > 0.1 && statT < 0.9) activeScene = i
      }

      if (activeScene >= 0) {
        stickyEl.style.setProperty('--glow-color', glows[activeScene])
        stickyEl.classList.add('glow-active')
      } else {
        stickyEl.classList.remove('glow-active')
      }

      dots.forEach((d, i) => {
        if (!d) return
        const statT = clamp(globalT * 3 - i, 0, 1)
        d.classList.toggle('active', statT > 0.1 && statT < 0.9)
      })
    }

    const scrollEventTarget: EventTarget = scrollRoot ?? window
    scrollEventTarget.addEventListener('scroll', tickStats, { passive: true })
    window.addEventListener('resize', tickStats)
    tickStats()

    return () => {
      revealObs.disconnect()
      scrollEventTarget.removeEventListener('scroll', tickStats)
      window.removeEventListener('resize', tickStats)
    }
  }, [])

  return (
    <div ref={rootRef}>
      <section className="manifesto">
        <div className="container-narrow">
          <p className="manifesto-text reveal reveal-delay-1">
            Every vehicle deserves to look <em>exactly</em> as it did the moment you fell in love with it.{' '}
            <strong>That finish. That depth. That presence.</strong> Not for a weekend, but forever.
          </p>
        </div>
      </section>

      <div className="divider" />

      <div className="stats-scroll" id={IDS.scroll}>
        <div className="stats-sticky-container" id={IDS.sticky}>
          <div className="stat-scene" id={IDS.scene(0)}>
            <div className="stat-big-num" id={IDS.num(0)}>
              50<span>+</span>
            </div>
            <div className="stat-line" />
            <div className="stat-big-label">Countries worldwide</div>
            <div className="stat-big-sub">Trusted by professionals across 5 continents</div>
          </div>

          <div className="stat-scene" id={IDS.scene(1)}>
            <div className="stat-big-num" id={IDS.num(1)}>
              20<span>+</span>
            </div>
            <div className="stat-line" />
            <div className="stat-big-label">Years of R&amp;D in Korea</div>
            <div className="stat-big-sub">Founded 2002 — Busan, South Korea</div>
          </div>

          <div className="stat-scene" id={IDS.scene(2)}>
            <div className="stat-big-num" id={IDS.num(2)}>
              500<span>+</span>
            </div>
            <div className="stat-line" />
            <div className="stat-big-label">Certified installers in North America</div>
            <div className="stat-big-sub">Each one personally vetted and trained</div>
          </div>

          <div className="stats-progress">
            <div className="stats-progress-fill" id={IDS.fill} />
          </div>
          <div className="stats-dots">
            <div className="stats-dot" id={IDS.dot(0)} />
            <div className="stats-dot" id={IDS.dot(1)} />
            <div className="stats-dot" id={IDS.dot(2)} />
          </div>
        </div>
      </div>
    </div>
  )
}
