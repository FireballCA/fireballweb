import { useCallback, useContext, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LenisContext } from '@/components/LenisRoot'
import { JoinTrainingEventsModal } from '@/components/JoinTrainingEventsModal'
import { appleButtonVisualClassName } from '@/components/ui/AppleButton'
import { SecondaryClipButton } from '@/components/ui/SecondaryClipButton'
import { cn } from '@/lib/utils'

/** Même hiérarchie typographique que les titres de section sur la landing (Home). */
const landingSectionTitle = 'font-sans text-3xl font-bold tracking-tight md:text-5xl'

export function Academy() {
  const lenis = useContext(LenisContext)
  const [searchParams, setSearchParams] = useSearchParams()
  const trainingModalOpen = searchParams.get('joinTraining') === '1'
  const openTrainingModal = () => setSearchParams({ joinTraining: '1' }, { replace: true })
  const closeTrainingModal = () => setSearchParams({}, { replace: true })

  const scrollToWhatYouLearn = useCallback(() => {
    const el = document.getElementById('what-you-learn')
    if (!el) return
    if (lenis) {
      lenis.scrollTo(el, { offset: -96, duration: 1.15 })
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [lenis])

  const roadmapRef = useRef<HTMLDivElement>(null)
  const roadmapFillRef = useRef<HTMLDivElement>(null)

  const nextEvent = {
    title: 'Fireball After Party',
    location: 'Saint-Hyacinthe, QC',
    imageSrc: '/Assets/FireballAfterParty.png',
  }

  useEffect(() => {
    const reveals = document.querySelectorAll<HTMLElement>('.academy-reveal')
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('academy-visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    )
    reveals.forEach((el) => revealObs.observe(el))

    const roadmap = roadmapRef.current
    const fill = roadmapFillRef.current
    if (!roadmap || !fill) {
      return () => {
        revealObs.disconnect()
      }
    }

    const dots = Array.from(roadmap.querySelectorAll<HTMLElement>('.rm-dot'))
    const cards = Array.from(roadmap.querySelectorAll<HTMLElement>('.rm-content'))

    const update = () => {
      const winH = window.innerHeight
      const rect = roadmap.getBoundingClientRect()
      const total = roadmap.offsetHeight
      const threshold = winH * 0.6

      const scrolled = Math.max(0, Math.min(1, (threshold - rect.top) / total))
      fill.style.height = `${scrolled * 100}%`

      dots.forEach((dot, i) => {
        const dotRect = dot.getBoundingClientRect()
        const dotCenter = dotRect.top + dotRect.height / 2
        if (dotCenter < threshold) {
          dot.classList.add('active')
          if (cards[i]) cards[i].classList.add('visible')
        }
      })
    }

    window.addEventListener('scroll', update, { passive: true })
    update()

    return () => {
      revealObs.disconnect()
      window.removeEventListener('scroll', update)
    }
  }, [])

  return (
    <main className="bg-carbon-950 text-pearl min-h-screen">
      <section
        className="relative -mt-20 flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden px-6"
        aria-label="Hero"
      >
        <video
          className="absolute inset-0 z-0 h-full w-full object-cover object-center [transform:translateZ(0)] will-change-transform"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="/Academy Background.mp4" type="video/mp4" />
        </video>
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/70"
          aria-hidden
        />

        <div className="relative z-10 flex h-full min-h-0 flex-1 flex-col pt-20">
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-0 pb-8 text-center md:pb-10 max-w-7xl mx-auto w-full">
            <h1 className="academy-reveal font-nav text-4xl font-black leading-[1.02] tracking-tight text-pearl md:text-5xl lg:text-6xl xl:text-7xl mb-8 md:mb-10">
              Build your expertise.
            </h1>

            <p
              className="academy-reveal max-w-2xl mx-auto text-base md:text-lg leading-relaxed text-silver/70 mb-10"
              style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}
            >
              <strong className="font-normal text-pearl">
                Effective training is the foundation of a profitable business.
              </strong>{' '}
              Master professional ceramic coating installation, grow your client base, and join an exclusive network of certified Fireball installers across Canada.
            </p>

            <div className="academy-reveal flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <SecondaryClipButton type="button" onClick={openTrainingModal}>
                Join next training
              </SecondaryClipButton>
              <button
                type="button"
                onClick={scrollToWhatYouLearn}
                className={cn('inline-flex whitespace-nowrap', appleButtonVisualClassName)}
              >
                Training details
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white text-carbon-900 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <h2 className={cn('academy-reveal text-carbon-900 text-center mb-10 md:mb-16', landingSectionTitle)}>
            Why the Fireball Academy
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: '🎓',
                title: 'Hands-on training',
                body: 'Learn real techniques used by professional installers.',
              },
              {
                icon: '✓',
                title: 'Certification',
                body: 'Become a certified Fireball installer.',
              },
              {
                icon: '📈',
                title: 'Business growth',
                body: 'Develop the skills needed to grow your detailing business.',
              },
            ].map((item, idx) => (
              <div key={idx} className="academy-reveal text-center">
                <div className="text-5xl mb-6">{item.icon}</div>
                <h3 className="text-xl font-bold text-carbon-900 mb-4" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 700 }}>
                  {item.title}
                </h3>
                <p className="text-base leading-relaxed text-carbon-600" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="what-you-learn" className="roadmap-section">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <h2 className={cn('academy-reveal text-carbon-900 text-center mb-10 md:mb-16 mt-16 md:mt-24', landingSectionTitle)}>
            What you will learn
          </h2>
        </div>
        <div className="roadmap-wrap" ref={roadmapRef}>
          <div className="roadmap-spine"></div>
          <div className="roadmap-fill" ref={roadmapFillRef}></div>

          <div className="roadmap-item">
            <div className="rm-content">
              <div className="rm-card">
                <span className="rm-num">01</span>
                <div className="rm-title">Ceramic Coating Application</div>
                <p className="rm-body">Professional coating installation techniques.</p>
                <span className="rm-tag highlight">Day 1 — Morning</span>
              </div>
            </div>
            <div className="rm-node">
              <div className="rm-dot"></div>
            </div>
            <div className="rm-empty"></div>
          </div>

          <div className="roadmap-item">
            <div className="rm-empty"></div>
            <div className="rm-node">
              <div className="rm-dot"></div>
            </div>
            <div className="rm-content">
              <div className="rm-card">
                <span className="rm-num">02</span>
                <div className="rm-title">Surface Preparation</div>
                <p className="rm-body">Proper paint correction and preparation methods.</p>
                <span className="rm-tag">Day 1 — Afternoon</span>
              </div>
            </div>
          </div>

          <div className="roadmap-item">
            <div className="rm-content">
              <div className="rm-card">
                <span className="rm-num">03</span>
                <div className="rm-title">Product Knowledge</div>
                <p className="rm-body">Understanding Fireball's coating technologies.</p>
                <span className="rm-tag highlight">Day 2 — Morning</span>
              </div>
            </div>
            <div className="rm-node">
              <div className="rm-dot"></div>
            </div>
            <div className="rm-empty"></div>
          </div>

          <div className="roadmap-item">
            <div className="rm-empty"></div>
            <div className="rm-node">
              <div className="rm-dot"></div>
            </div>
            <div className="rm-content">
              <div className="rm-card">
                <span className="rm-num">04</span>
                <div className="rm-title">Business Strategies</div>
                <p className="rm-body">How to position and sell professional protection services.</p>
                <span className="rm-tag highlight">Certification Day</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-black text-pearl py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="academy-reveal">
              <h2 className={cn('text-pearl mb-6', landingSectionTitle)}>
                Become Fireball Certified
              </h2>
              <p className="text-lg leading-relaxed text-silver/70" style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 300 }}>
                After completing the training, participants may qualify to become certified Fireball installers and gain access to professional products and support.
              </p>
            </div>
            <div className="academy-reveal text-center">
              <div className="w-48 h-48 mx-auto rounded-full border border-white/20 bg-white/[0.06] flex items-center justify-center text-[#0485F7] text-6xl font-bold shadow-[0_0_40px_rgba(4,133,247,0.25)]">
                ✓
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6 text-center">
          <h2 className={cn('text-carbon-900', landingSectionTitle)}>See our next training</h2>
        </div>
        <div className="mx-auto mt-8 max-w-7xl px-4 md:px-6">
          <div className="overflow-hidden rounded-2xl border border-carbon-200 bg-white">
            <div className="relative aspect-[16/7] min-h-[260px] sm:min-h-[320px]">
              <img
                src={nextEvent.imageSrc}
                alt={nextEvent.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-black/10" aria-hidden />

              <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-6">
                <h3 className="font-nav text-4xl sm:text-4xl font-bold text-white">{nextEvent.title}</h3>
                <p className="mt-1 text-white/80">{nextEvent.location}</p>
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={openTrainingModal}
                    className={cn('inline-flex', appleButtonVisualClassName)}
                  >
                    Apply now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <JoinTrainingEventsModal open={trainingModalOpen} onClose={closeTrainingModal} />
    </main>
  )
}
