import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { IconArrowUpRight } from '@tabler/icons-react'
import { appleButtonVisualClassName } from '@/components/ui/AppleButton'
import { cn } from '@/lib/utils'
import { usePageTitle } from '@/hooks/usePageTitle'

export function About() {
  usePageTitle('About - Fireball Canada')
  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {
        // Cleanup toujours retourné pour éviter l'erreur React #310
      }
    }

    // Scroll reveal
    const reveals = document.querySelectorAll<HTMLElement>('.reveal')
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

    // Cinematic stats scroll
    const statsEl = document.getElementById('statsScroll')
    const stickyEl = document.getElementById('statsSticky')
    const scenes = [0, 1, 2].map((i) => document.getElementById(`scene${i}`) as HTMLElement | null)
    const nums = [0, 1, 2].map((i) => document.getElementById(`num${i}`) as HTMLElement | null)
    const dots = [0, 1, 2].map((i) => document.getElementById(`dot${i}`) as HTMLElement | null)
    const fillEl = document.getElementById('statsFill') as HTMLElement | null

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
    <main className="bg-black text-white min-h-screen">
      {/* Hero section */}
      <section className="relative min-h-[80vh] md:min-h-[var(--app-hero-h)] flex items-center justify-center overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/Assets/Video About.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/70" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <h1 className="font-nav font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight mb-4">
            Protection, engineered.
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-2xl mx-auto">
            We don't make products for people who park their car and forget about it. We make them for the ones who can't stop looking back.
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 hidden sm:block">
          <span className="block w-px h-12 bg-current mx-auto animate-pulse" />
        </div>
      </section>

      {/* Section 1 — Our Belief */}
      <section className="manifesto">
        <div className="container-narrow">
          <p className="manifesto-text reveal reveal-delay-1">
            Every vehicle deserves to look <em>exactly</em> as it did the moment you fell in love with it.{' '}
            <strong>That finish. That depth. That presence.</strong> Not for a weekend, but forever.
          </p>
        </div>
      </section>

      <div className="divider" />

      {/* Section 2 — Cinematic stats scroll */}
      <div className="stats-scroll" id="statsScroll" data-lenis-prevent>
        <div className="stats-sticky-container" id="statsSticky">
          <div className="stat-scene" id="scene0">
            <div className="stat-big-num" id="num0">
              50<span>+</span>
            </div>
            <div className="stat-line" />
            <div className="stat-big-label">Countries worldwide</div>
            <div className="stat-big-sub">Trusted by professionals across 5 continents</div>
          </div>

          <div className="stat-scene" id="scene1">
            <div className="stat-big-num" id="num1">
              20<span>+</span>
            </div>
            <div className="stat-line" />
            <div className="stat-big-label">Years of R&amp;D in Korea</div>
            <div className="stat-big-sub">Founded 2002 — Busan, South Korea</div>
          </div>

          <div className="stat-scene" id="scene2">
            <div className="stat-big-num" id="num2">
              500<span>+</span>
            </div>
            <div className="stat-line" />
            <div className="stat-big-label">Certified installers in North America</div>
            <div className="stat-big-sub">Each one personally vetted and trained</div>
          </div>

          <div className="stats-progress">
            <div className="stats-progress-fill" id="statsFill" />
          </div>
          <div className="stats-dots">
            <div className="stats-dot" id="dot0" />
            <div className="stats-dot" id="dot1" />
            <div className="stats-dot" id="dot2" />
          </div>
        </div>
      </div>

      {/* Section 3 — Our Story */}
      <section className="story">
        <div className="container">
          <div className="story-grid">
            <div className="story-sticky">
              <div className="section-label reveal">Our Story</div>
              <h2 className="story-title reveal reveal-delay-1">
                The world's best
                <br />
                protection.
                <br />
                Now Canadian.
              </h2>
            </div>
            <div className="story-body">
              <p className="reveal">
                Fireball was born in South Korea — a country with an obsessive culture of precision, quality, and craft.
                Over two decades, <strong>Fireball Korea grew into one of the world's leading manufacturers of professional car care chemicals</strong>, trusted by detailers across Europe, Asia,
                and the Americas.
              </p>
              <p className="reveal reveal-delay-1">
                Fireball Canada is the official home of that same technology on Canadian soil. We saw a market flooded with generic products and a community of enthusiasts who deserved better —{' '}
                <strong>professional-grade formulations that actually perform in our climate.</strong> The freeze-thaw cycles. The road salt. The brutal winters. We built for that.
              </p>
              <p className="reveal reveal-delay-2">
                Every product in our line is developed and tested in Korea, then brought here through a rigorous certification and distribution process.{' '}
                <strong>Nothing makes it to a Canadian driveway until it meets our standard</strong> — which is to say, the highest standard we know.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3a — President Bio */}
      <section className="president-section">
        <div className="container">
          <div className="president-grid">
            <div className="president-media reveal">
              <img src="/Assets/JMB-Fireball.png" alt="Fireball Canada President" className="president-image" />
            </div>
            <div className="president-content">
              <h3 className="president-title reveal reveal-delay-1">Meet Fireball Canada President</h3>
              <p className="president-bio reveal reveal-delay-2">
                Jean-Michel Bergeron is a Quebec entrepreneur specializing in automotive detailing. Currently president of Fireball Canada, he is also the founder of{' '}
                <a
                  href="https://passiondetailing.ca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold underline decoration-white/30 underline-offset-4 transition-colors hover:text-[#0485F7] hover:decoration-[#0485F7]/40"
                >
                  Passion Detailing
                  <IconArrowUpRight className="h-4 w-4" stroke={2} aria-hidden />
                </a>{' '}
                - an auto detailing shop and boutique in Saint-Hyacinthe, recognized as a Quebec leader in automotive protection (PPF films, nano-ceramic coatings, etc.).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 — Our Vision */}
      <section className="vision">
        <div className="container">
          <blockquote className="vision-quote reveal reveal-delay-1">
            &quot;To stay ahead of the car care market is not ambition — it is obligation. The people who trust us with their vehicles deserve nothing less.&quot;
          </blockquote>
          <div className="vision-attribution reveal reveal-delay-2">- Fireball Est. 2002</div>
        </div>
      </section>

      {/* Section 5 — Get Started CTA */}
      <section className="cta-section">
        <div className="container-narrow">
          <h2 className="cta-title reveal">
            Ready to protect
            <br />
            what you love?
          </h2>
          <p className="cta-sub reveal reveal-delay-1">Become part of the Fireball network.</p>
          <div className="cta-btns reveal reveal-delay-2">
            <Link to="/join-fireball" className={cn('inline-flex', appleButtonVisualClassName)}>
              Join fireball now
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

