import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type Lenis from 'lenis'
import { VoyagerCoatingsSlider, type VoyagerSlide } from '@/components/VoyagerCoatingsSlider/VoyagerCoatingsSlider'
import { LenisContext } from '@/components/LenisRoot'

const STORAGE_KEY = 'fireball:voyager-parallax-done'
/** Hauteur de scroll « consommée » pour le chapitre (sticky + parallax + zoom) */
const CHAPTER_VH = 3.15

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / Math.max(1e-6, edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function scrollPosition(lenis: Lenis | null): number {
  return lenis?.animatedScroll ?? window.scrollY
}

type VoyagerWorldwideScrollSectionProps = {
  slides: VoyagerSlide[]
  eyebrow: string
  heading: string
  description: string
}

export function VoyagerWorldwideScrollSection({
  slides,
  eyebrow,
  heading,
  description,
}: VoyagerWorldwideScrollSectionProps) {
  const lenis = useContext(LenisContext)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const completeRef = useRef(false)
  const rafRef = useRef<number>(0)

  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const [parallaxConsumed, setParallaxConsumed] = useState(() => {
    if (typeof window === 'undefined') return true
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  const [activeIndex, setActiveIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  const updateProgress = useCallback(() => {
    if (parallaxConsumed) return
    const el = wrapperRef.current
    if (!el) return
    const scrollY = scrollPosition(lenis)
    const rect = el.getBoundingClientRect()
    const docTop = scrollY + rect.top
    const H = el.offsetHeight
    const vh = window.innerHeight
    const range = Math.max(1, H - vh)
    const p = (scrollY - docTop) / range
    setProgress(Math.max(0, Math.min(1, p)))
  }, [lenis, parallaxConsumed])

  useLayoutEffect(() => {
    updateProgress()
  }, [parallaxConsumed, updateProgress])

  useEffect(() => {
    if (parallaxConsumed) return

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0
        updateProgress()
      })
    }

    if (lenis) {
      lenis.on('scroll', onScroll)
    } else {
      window.addEventListener('scroll', onScroll, { passive: true })
    }

    const ro = new ResizeObserver(() => onScroll())
    if (wrapperRef.current) ro.observe(wrapperRef.current)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (lenis) lenis.off('scroll', onScroll)
      else window.removeEventListener('scroll', onScroll)
      ro.disconnect()
    }
  }, [lenis, parallaxConsumed, updateProgress])

  useEffect(() => {
    if (parallaxConsumed || completeRef.current) return
    if (progress < 0.97) return
    const el = wrapperRef.current
    if (!el) return
    completeRef.current = true
    const oldH = el.getBoundingClientRect().height
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
    setParallaxConsumed(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const w2 = wrapperRef.current
        if (!w2) return
        const newH = w2.getBoundingClientRect().height
        const delta = oldH - newH
        if (delta <= 2) return
        if (lenis) {
          lenis.scrollTo(lenis.animatedScroll - delta, { immediate: true })
        } else {
          window.scrollTo({ top: window.scrollY - delta, behavior: 'auto' })
        }
      })
    })
  }, [progress, parallaxConsumed, lenis])

  const slide = slides[activeIndex] ?? slides[0]
  const img = slide?.image ?? ''

  const titleY = -progress * 56
  const subY = -progress * 36
  const sliderY = progress * 28
  const zoomT = smoothstep(0.1, 0.62, progress)
  const fsScale = 0.34 + zoomT * 0.66
  const overlayIn = smoothstep(0.06, 0.38, progress)
  const overlayOut = 1 - smoothstep(0.78, 0.96, progress)
  const overlayOpacity = overlayIn * overlayOut
  const sliderFade = 1 - smoothstep(0.08, 0.44, progress)

  const showChapter = !parallaxConsumed

  return (
    <section
      id="trusted-worldwide"
      className="bg-white text-carbon-900"
      aria-labelledby="trusted-worldwide-heading"
    >
      <div
        ref={wrapperRef}
        className="relative"
        style={
          showChapter
            ? {
                minHeight: `${CHAPTER_VH * 100}vh`,
              }
            : undefined
        }
      >
        <div
          ref={stickyRef}
          className={
            showChapter
              ? 'sticky top-20 z-10 flex min-h-[calc(100dvh-5rem)] flex-col justify-start overflow-hidden pb-16 pt-8 md:pb-24 md:pt-12'
              : 'relative z-10 flex flex-col pb-16 pt-8 md:pb-24 md:pt-12'
          }
        >
          <div className="mx-auto w-full max-w-7xl px-6">
            <p
              className="mb-2 text-center font-nav text-[11px] font-semibold uppercase tracking-[0.22em] text-carbon-500 md:mb-3 md:text-xs"
              style={{ transform: `translate3d(0, ${titleY}px, 0)` }}
            >
              {eyebrow}
            </p>
            <h2
              id="trusted-worldwide-heading"
              className="text-center font-nav text-3xl font-black uppercase tracking-tight text-carbon-950 sm:text-4xl md:text-5xl"
              style={{ transform: `translate3d(0, ${titleY * 0.85}px, 0)` }}
            >
              {heading}
            </h2>
            <p
              className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-carbon-600 md:mt-5 md:text-lg"
              style={{ transform: `translate3d(0, ${subY}px, 0)` }}
            >
              {description}
            </p>
          </div>

          <div
            className="relative z-20 mt-10 flex min-h-0 flex-1 flex-col md:mt-12"
            style={{
              transform: `translate3d(0, ${sliderY}px, 0)`,
              opacity: showChapter ? Math.max(0.35, sliderFade) : 1,
              pointerEvents: showChapter && overlayOpacity > 0.42 ? 'none' : 'auto',
            }}
          >
            <div className="mx-auto w-full max-w-7xl px-6">
              <VoyagerCoatingsSlider slides={slides} onActiveChange={setActiveIndex} />
            </div>
          </div>
        </div>

        {showChapter && img ? (
          <div
            className="pointer-events-none fixed inset-0 z-[24]"
            style={{
              opacity: overlayOpacity,
              visibility: overlayOpacity < 0.02 ? 'hidden' : 'visible',
            }}
            aria-hidden
          >
            <img
              src={img}
              alt=""
              className="h-full w-full object-cover"
              style={{
                transform: `scale(${fsScale})`,
                transformOrigin: '50% 45%',
                willChange: 'transform',
              }}
              draggable={false}
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent"
              aria-hidden
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}
