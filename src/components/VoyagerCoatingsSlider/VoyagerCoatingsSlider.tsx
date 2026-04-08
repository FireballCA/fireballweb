import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import './VoyagerCoatingsSlider.css'

/** Précharge et décode toutes les images du carrousel (cache navigateur = transitions sans attente). */
function preloadSlideImages(urls: string[]): Promise<void> {
  const unique = [...new Set(urls)]
  if (unique.length === 0) return Promise.resolve()
  return Promise.all(
    unique.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image()
          const done = () => resolve()
          img.onload = () => {
            void img.decode?.().then(done).catch(done)
          }
          img.onerror = done
          img.src = url
        }),
    ),
  ).then(() => undefined)
}

export type VoyagerSlide = {
  id: string
  title: string
  subtitle: string
  image: string
}

type VoyagerCoatingsSliderProps = {
  slides: VoyagerSlide[]
  className?: string
  /** Index du slide actif (centre) — pour parallax / plein écran parent */
  onActiveChange?: (index: number) => void
}

const EASE = 'power2.inOut'
/** Flèches : fin d’animation un peu plus « précoce » visuellement (ease out) */
const EASE_ARROW = 'power3.out'
/** Flèches : un peu plus longues pour lire la rotation ; points : plus secs */
const DURATION_ARROW = 0.34
const DURATION_DOT_STEP = 0.2
/** Rotation latérale au repos (deg) — effet « roue » / carrousel 3D */
const ROT_Y_SIDE = 34
/** Carte qui sort du champ : rotation plus marquée */
const ROT_Y_OUT = 62
/** translateZ (px) : côtés en profondeur (négatif), centre vers la caméra — sinon le tri 3D dessine les côtés PAR-DESSUS le milieu. */
const Z_SIDE = -52
const Z_CENTER = 44
/** Carte qui sort du tapis : encore plus loin */
const Z_EXIT = -88
/** Budget temps pour un saut multi-points (plusieurs steps) — plus réactif */
const DOT_JUMP_TOTAL_S = 1.05

/** Même URL que la carte latérale qui recevra une nouvelle image après le swap — décodage avant paint. */
function decodeImageUrl(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => void img.decode?.().then(() => resolve()).catch(() => resolve())
    img.onerror = () => resolve()
    img.src = url
  })
}

/** Chemin le plus court sur le cercle d’indices */
function getNavigationPlan(current: number, target: number, n: number): { dir: 'next' | 'prev'; steps: number } | null {
  if (current === target || n < 2) return null
  const forward = (target - current + n) % n
  const backward = (current - target + n) % n
  if (forward < backward) return { dir: 'next', steps: forward }
  if (backward < forward) return { dir: 'prev', steps: backward }
  return { dir: 'next', steps: forward }
}

function stepDurationForDotJumps(steps: number): number {
  if (steps <= 1) return DURATION_DOT_STEP
  return Math.max(0.12, Math.min(DURATION_DOT_STEP, DOT_JUMP_TOTAL_S / steps))
}

export function VoyagerCoatingsSlider({ slides, className = '', onActiveChange }: VoyagerCoatingsSliderProps) {
  const n = slides.length
  const [active, setActive] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const indexRef = useRef(0)
  /** Évite les doubles clics avant que React mette à jour `isAnimating`. */
  const swapLockRef = useRef(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)

  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    indexRef.current = active
  }, [active])

  useEffect(() => {
    onActiveChange?.(active)
  }, [active, onActiveChange])

  const indices = useMemo(() => {
    if (n === 0) return { l: 0, c: 0, r: 0 }
    const l = (active - 1 + n) % n
    const c = active
    const r = (active + 1) % n
    return { l, c, r }
  }, [active, n])

  const getOffset = useCallback(() => {
    const w = trackRef.current?.offsetWidth ?? 400
    return Math.min(w * 0.26, 200)
  }, [])

  const applyResting = useCallback(() => {
    const offset = getOffset()
    const gpu = { force3D: true }
    const sideBase = {
      scale: 0.88,
      opacity: 0.62,
      filter: 'blur(4px)',
      z: Z_SIDE,
      transformOrigin: '50% 50%',
      ...gpu,
    }
    if (leftRef.current) {
      gsap.set(leftRef.current, {
        x: -offset,
        yPercent: -50,
        xPercent: -50,
        rotationY: ROT_Y_SIDE,
        ...sideBase,
      })
    }
    if (centerRef.current) {
      gsap.set(centerRef.current, {
        x: 0,
        yPercent: -50,
        xPercent: -50,
        rotationY: 0,
        scale: 1,
        opacity: 1,
        filter: 'blur(0px)',
        z: Z_CENTER,
        transformOrigin: '50% 50%',
        ...gpu,
      })
    }
    if (rightRef.current) {
      gsap.set(rightRef.current, {
        x: offset,
        yPercent: -50,
        xPercent: -50,
        rotationY: -ROT_Y_SIDE,
        ...sideBase,
      })
    }
  }, [getOffset])

  useEffect(() => {
    void preloadSlideImages(slides.map((s) => s.image))
  }, [slides])

  const idxAfterNext = n > 0 ? (active + 2) % n : 0
  const idxAfterPrev = n > 0 ? (active - 2 + n) % n : 0
  const idxAhead3 = n > 0 ? (active + 3) % n : 0
  const urlAfterNext = n > 0 ? slides[idxAfterNext]?.image : ''
  const urlAfterPrev = n > 0 ? slides[idxAfterPrev]?.image : ''
  const urlAhead3 = n > 0 ? slides[idxAhead3]?.image : ''

  useEffect(() => {
    if (n < 2 || !urlAfterNext || !urlAfterPrev) return
    const prime = (url: string) => {
      const img = new Image()
      img.onload = () => void img.decode?.().catch(() => {})
      img.onerror = () => {}
      img.src = url
    }
    if (urlAfterNext !== urlAfterPrev) {
      prime(urlAfterNext)
      prime(urlAfterPrev)
    } else {
      prime(urlAfterNext)
    }
    if (urlAhead3 && urlAhead3 !== urlAfterNext && urlAhead3 !== urlAfterPrev) {
      prime(urlAhead3)
    }
  }, [active, n, urlAfterNext, urlAfterPrev, urlAhead3])

  useLayoutEffect(() => {
    applyResting()
  }, [applyResting, active, slides])

  useEffect(() => {
    const el = trackRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => {
      if (!isAnimating) applyResting()
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [applyResting, isAnimating])

  const runSwapOnce = useCallback(
    (dir: 'next' | 'prev', duration: number, animEase: string = EASE): Promise<void> => {
      return new Promise((resolve) => {
        if (n < 2) {
          resolve()
          return
        }
        const offset = getOffset()
        const a = indexRef.current
        const incomingEdgeUrl =
          dir === 'next' ? slides[(a + 2) % n]?.image : slides[(a - 2 + n) % n]?.image

        const finishTransition = () => {
          const nextIdx = dir === 'next' ? (a + 1) % n : (a - 1 + n) % n
          indexRef.current = nextIdx
          setActive(nextIdx)
          requestAnimationFrame(() => {
            applyResting()
            resolve()
          })
        }

        if (reduceMotion) {
          if (incomingEdgeUrl) {
            void decodeImageUrl(incomingEdgeUrl).then(finishTransition)
          } else {
            finishTransition()
          }
          return
        }

        const left = leftRef.current
        const center = centerRef.current
        const right = rightRef.current
        if (!left || !center || !right) {
          resolve()
          return
        }

        if (incomingEdgeUrl) {
          const warm = new Image()
          warm.src = incomingEdgeUrl
        }

        const tl = gsap.timeline({
          defaults: { duration, ease: animEase },
          onComplete: () => {
            if (incomingEdgeUrl) {
              void decodeImageUrl(incomingEdgeUrl).then(finishTransition)
            } else {
              finishTransition()
            }
          },
        })

        const gpu = { force3D: true, overwrite: 'auto' as const }

        if (dir === 'next') {
          tl.to(
            left,
            {
              x: `-=${offset * 1.35}`,
              rotationY: ROT_Y_OUT,
              opacity: 0,
              z: Z_EXIT,
              duration,
              ease: animEase,
              ...gpu,
            },
            0,
          )
          tl.to(
            center,
            {
              x: -offset,
              rotationY: ROT_Y_SIDE,
              scale: 0.88,
              opacity: 0.62,
              filter: 'blur(4px)',
              z: Z_SIDE,
              duration,
              ease: animEase,
              ...gpu,
            },
            0,
          )
          tl.to(
            right,
            {
              x: 0,
              rotationY: 0,
              scale: 1,
              opacity: 1,
              filter: 'blur(0px)',
              z: Z_CENTER,
              duration,
              ease: animEase,
              ...gpu,
            },
            0,
          )
        } else {
          tl.to(
            right,
            {
              x: `+=${offset * 1.35}`,
              rotationY: -ROT_Y_OUT,
              opacity: 0,
              z: Z_EXIT,
              duration,
              ease: animEase,
              ...gpu,
            },
            0,
          )
          tl.to(
            center,
            {
              x: offset,
              rotationY: -ROT_Y_SIDE,
              scale: 0.88,
              opacity: 0.62,
              filter: 'blur(4px)',
              z: Z_SIDE,
              duration,
              ease: animEase,
              ...gpu,
            },
            0,
          )
          tl.to(
            left,
            {
              x: 0,
              rotationY: 0,
              scale: 1,
              opacity: 1,
              filter: 'blur(0px)',
              z: Z_CENTER,
              duration,
              ease: animEase,
              ...gpu,
            },
            0,
          )
        }
      })
    },
    [applyResting, getOffset, n, reduceMotion, slides],
  )

  const runSwapSequence = useCallback(
    async (steps: number, dir: 'next' | 'prev', stepDur: number) => {
      if (steps < 1 || n < 2 || swapLockRef.current) return
      swapLockRef.current = true
      setIsAnimating(true)
      try {
        for (let s = 0; s < steps; s++) {
          await runSwapOnce(dir, stepDur)
        }
      } finally {
        swapLockRef.current = false
        setIsAnimating(false)
        requestAnimationFrame(() => applyResting())
      }
    },
    [applyResting, n, runSwapOnce],
  )

  const swap = useCallback(
    (dir: 'next' | 'prev') => {
      void runSwapSequence(1, dir, DURATION_ARROW)
    },
    [runSwapSequence],
  )

  const goTo = useCallback(
    (target: number) => {
      if (swapLockRef.current || n < 2) return
      const plan = getNavigationPlan(indexRef.current, target, n)
      if (!plan) return
      if (reduceMotion) {
        indexRef.current = target
        setActive(target)
        requestAnimationFrame(() => applyResting())
        return
      }
      void runSwapSequence(plan.steps, plan.dir, stepDurationForDotJumps(plan.steps), EASE)
    },
    [applyResting, n, reduceMotion, runSwapSequence],
  )

  if (n === 0) return null

  const sLeft = slides[indices.l]
  const sCenter = slides[indices.c]
  const sRight = slides[indices.r]

  return (
    <div className={`voyager ${className}`.trim()}>
      {n > 1 && urlAfterNext && urlAfterPrev && (
        <div className="voyager__edgePrefetch" aria-hidden>
          {urlAfterNext === urlAfterPrev ? (
            <img
              className="voyager__edgePrefetchImg"
              src={urlAfterNext}
              alt=""
              loading="eager"
              decoding="async"
            />
          ) : (
            <>
              <img
                className="voyager__edgePrefetchImg"
                src={urlAfterNext}
                alt=""
                loading="eager"
                decoding="async"
              />
              <img
                className="voyager__edgePrefetchImg"
                src={urlAfterPrev}
                alt=""
                loading="eager"
                decoding="async"
              />
            </>
          )}
        </div>
      )}

      <div className="voyager__stage">
        <button
          type="button"
          className="voyager__btn voyager__btn--prev"
          aria-label="Slide précédent"
          disabled={isAnimating || n < 2}
          onClick={() => swap('prev')}
        >
          <Chevron direction="left" />
        </button>

        <div ref={trackRef} className="voyager__track">
          <div ref={leftRef} className="voyager__card" style={{ zIndex: 1 }}>
            <CardInner slide={sLeft} fetchPriority="low" />
          </div>
          <div ref={centerRef} className="voyager__card" style={{ zIndex: 3 }}>
            <CardInner slide={sCenter} fetchPriority="high" />
          </div>
          <div ref={rightRef} className="voyager__card" style={{ zIndex: 1 }}>
            <CardInner slide={sRight} fetchPriority="low" />
          </div>
        </div>

        <button
          type="button"
          className="voyager__btn voyager__btn--next"
          aria-label="Slide suivant"
          disabled={isAnimating || n < 2}
          onClick={() => swap('next')}
        >
          <Chevron direction="right" />
        </button>
      </div>

      {n > 1 && (
        <div className="voyager__dots" role="tablist" aria-label="Choix du produit">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-label={s.title}
              aria-selected={i === active}
              aria-current={i === active ? 'true' : undefined}
              className="voyager__dot"
              disabled={isAnimating}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CardInner({ slide, fetchPriority }: { slide: VoyagerSlide; fetchPriority: 'high' | 'low' }) {
  return (
    <div className="voyager__cardInner">
      <img
        className="voyager__cardImg"
        src={slide.image}
        alt={slide.title}
        loading="eager"
        decoding="async"
        {...{ fetchpriority: fetchPriority }}
        draggable={false}
      />
      <div className="voyager__cardInfo">
        <p className="voyager__cardTitle font-nav">{slide.title}</p>
        <p className="voyager__cardSubtitle">{slide.subtitle}</p>
      </div>
    </div>
  )
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      {direction === 'left' ? (
        <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )
}
