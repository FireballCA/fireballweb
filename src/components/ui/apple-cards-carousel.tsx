import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ImgHTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconArrowNarrowLeft,
  IconArrowNarrowRight,
  IconArrowUpLeft,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react'

interface CarouselProps {
  items: ReactElement[]
  initialScroll?: number
}

export type AppleCarouselCard = {
  src: string
  title: string
  category: string
  /** Navigation SPA vers la catégorie (carte cliquable, sans modale). */
  to: string
}

/** Largeurs de carte (px) : base mobile / desktop — alignées sur w-56 / md:w-96 */
function useLineupCardBaseWidth() {
  const [basePx, setBasePx] = useState(224)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const sync = () => setBasePx(mq.matches ? 384 : 224)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return basePx
}

const springSmooth = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 34,
  mass: 0.82,
}

const springLayout = {
  type: 'spring' as const,
  stiffness: 320,
  damping: 38,
  mass: 0.75,
}

const DRAG_CLICK_THRESHOLD_PX = 8

/** Marge minimale carte / bord du viewport (px), pour limiter l’extension vers la gauche. */
function getViewportEdgePadding(): number {
  if (typeof window === 'undefined') return 28
  const w = window.innerWidth
  if (w >= 1024) return 40
  if (w >= 768) return 32
  if (w >= 640) return 28
  return 24
}

function measureMaxPullLeft(el: HTMLElement, basePx: number): number {
  const r = el.getBoundingClientRect()
  const margin = getViewportEdgePadding()
  const allowed = Math.max(0, r.left - margin)
  return Math.min(basePx, allowed)
}

type LineupExpandContextValue = {
  beginExpand: () => void
  endExpand: () => void
  scrollRef: React.RefObject<HTMLDivElement | null>
}

const LineupExpandContext = createContext<LineupExpandContextValue | null>(null)

const springMagnet = { stiffness: 440, damping: 36, mass: 0.55 }
const springArrowEntrance = {
  type: 'spring' as const,
  stiffness: 560,
  damping: 42,
  mass: 0.42,
}

/** Flèche coin magnétique (lineup / landing CTA). */
export function CardMagneticCornerArrow({ visible }: { visible: boolean }) {
  const reduceMotion = useReducedMotion()
  const fieldRef = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, springMagnet)
  const sy = useSpring(my, springMagnet)

  useEffect(() => {
    if (!visible || reduceMotion) {
      mx.set(0)
      my.set(0)
      return
    }

    const PROXIMITY_PX = 104
    const FOLLOW = 0.26
    const MAX_PULL = 36

    const onMove = (e: PointerEvent) => {
      const el = fieldRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.hypot(dx, dy)
      if (dist <= PROXIMITY_PX) {
        const tx = Math.max(-MAX_PULL, Math.min(MAX_PULL, dx * FOLLOW))
        const ty = Math.max(-MAX_PULL, Math.min(MAX_PULL, dy * FOLLOW))
        mx.set(tx)
        my.set(ty)
      } else {
        mx.set(0)
        my.set(0)
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      mx.set(0)
      my.set(0)
    }
  }, [visible, reduceMotion, mx, my])

  return (
    <AnimatePresence mode="sync">
      {visible && (
        <motion.div
          key="lineup-corner-arrow"
          ref={fieldRef}
          initial={{ y: 64, opacity: 0, scale: 0.82, filter: 'blur(12px)' }}
          animate={{
            y: 0,
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
          }}
          transition={reduceMotion ? { duration: 0.18 } : springArrowEntrance}
          exit={{
            y: 40,
            opacity: 0,
            scale: 0.9,
            filter: 'blur(8px)',
            transition: {
              duration: 0.22,
              ease: [0.32, 0, 0.67, 0],
            },
          }}
          className="pointer-events-none absolute bottom-3 right-3 z-[55] flex h-[7rem] w-[7rem] items-end justify-end md:bottom-5 md:right-5 md:h-[7.5rem] md:w-[7.5rem]"
          aria-hidden
        >
          <motion.div
            style={reduceMotion ? undefined : { x: sx, y: sy }}
            className="flex items-end justify-end"
          >
            <IconArrowUpLeft
              className="h-11 w-11 text-white md:h-14 md:w-14"
              stroke={1.35}
              aria-hidden
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export const Carousel = ({ items, initialScroll = 0 }: CarouselProps) => {
  const carouselRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(true)
  const [isDraggingStrip, setIsDraggingStrip] = useState(false)

  const dragStripRef = useRef<{
    active: boolean
    pointerId: number
    startX: number
    startScroll: number
    moved: boolean
  }>({
    active: false,
    pointerId: -1,
    startX: 0,
    startScroll: 0,
    moved: false,
  })

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll
      checkScrollability()
    }
  }, [initialScroll])

  const checkScrollability = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  const endStripDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragStripRef.current
    const el = carouselRef.current
    if (!d.active || d.pointerId !== e.pointerId) return
    if (el) {
      try {
        el.releasePointerCapture(e.pointerId)
      } catch {
        /* déjà relâché */
      }
    }
    const moved = d.moved
    d.active = false
    d.pointerId = -1
    setIsDraggingStrip(false)
    if (moved) {
      const blockStrayClick = (ev: Event) => {
        ev.preventDefault()
        ev.stopPropagation()
        if ('stopImmediatePropagation' in ev) {
          ;(ev as Event & { stopImmediatePropagation: () => void }).stopImmediatePropagation()
        }
      }
      document.addEventListener('click', blockStrayClick, true)
      window.setTimeout(() => document.removeEventListener('click', blockStrayClick, true), 80)
    }
  }

  const onStripPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const t = e.target as HTMLElement | null
    if (t?.closest?.('[data-lineup-card]')) return
    const el = carouselRef.current
    if (!el) return
    el.setPointerCapture(e.pointerId)
    dragStripRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
    }
    setIsDraggingStrip(true)
  }

  const onStripPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragStripRef.current
    if (!d.active || e.pointerId !== d.pointerId) return
    const el = carouselRef.current
    if (!el) return
    const dx = e.clientX - dragStripRef.current.startX
    if (Math.abs(dx) > DRAG_CLICK_THRESHOLD_PX) {
      dragStripRef.current.moved = true
    }
    el.scrollLeft = dragStripRef.current.startScroll - dx
    checkScrollability()
  }

  const lineupExpandDepthRef = useRef(0)
  const [lineupRowCompact, setLineupRowCompact] = useState(false)
  const beginLineupExpand = useCallback(() => {
    lineupExpandDepthRef.current += 1
    if (lineupExpandDepthRef.current === 1) setLineupRowCompact(true)
  }, [])
  const endLineupExpand = useCallback(() => {
    lineupExpandDepthRef.current = Math.max(0, lineupExpandDepthRef.current - 1)
    if (lineupExpandDepthRef.current === 0) setLineupRowCompact(false)
  }, [])
  const lineupExpandApi = useMemo(
    () => ({
      beginExpand: beginLineupExpand,
      endExpand: endLineupExpand,
      scrollRef: carouselRef,
    }),
    [beginLineupExpand, endLineupExpand],
  )

  return (
    <div className="relative w-full">
      <div
        className={cn(
          'flex w-full overflow-x-auto overflow-y-visible overscroll-x-auto scroll-auto px-4 py-10 [scrollbar-width:none] sm:px-8 md:px-12 md:py-20 [&::-webkit-scrollbar]:hidden',
          isDraggingStrip ? 'cursor-grabbing select-none' : 'cursor-grab',
        )}
        ref={carouselRef}
        onScroll={checkScrollability}
        onPointerDown={onStripPointerDown}
        onPointerMove={onStripPointerMove}
        onPointerUp={endStripDrag}
        onPointerCancel={endStripDrag}
      >
        <div
          className={cn(
            'pointer-events-none absolute right-0 z-[1000] h-auto w-[5%] overflow-hidden bg-gradient-to-l',
          )}
        />

        <LayoutGroup id="product-lineup-carousel">
          <LineupExpandContext.Provider value={lineupExpandApi}>
            <div
              className={cn(
                'mx-auto flex min-h-0 max-w-7xl flex-row items-stretch justify-start pl-0 transition-[gap] duration-300 ease-out',
                lineupRowCompact ? 'gap-2' : 'gap-4',
              )}
            >
              {items.map((item, index) => (
                <motion.div
                  layout
                  layoutScroll={carouselRef}
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.5,
                      delay: 0.2 * index,
                      ease: 'easeOut',
                    },
                  }}
                  transition={{ layout: springLayout }}
                  key={`card-${index}`}
                  className="shrink-0 rounded-3xl last:pr-[5%] md:last:pr-[33%]"
                >
                  {item}
                </motion.div>
              ))}
            </div>
          </LineupExpandContext.Provider>
        </LayoutGroup>
      </div>
      <div className="mr-10 flex justify-end gap-2">
        <button
          type="button"
          className="relative z-40 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 disabled:opacity-50 dark:bg-carbon-800"
          onClick={scrollLeft}
          disabled={!canScrollLeft}
          aria-label="Faire défiler vers la gauche"
        >
          <IconArrowNarrowLeft className="h-6 w-6 text-gray-500 dark:text-silver/80" />
        </button>
        <button
          type="button"
          className="relative z-40 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 disabled:opacity-50 dark:bg-carbon-800"
          onClick={scrollRight}
          disabled={!canScrollRight}
          aria-label="Faire défiler vers la droite"
        >
          <IconArrowNarrowRight className="h-6 w-6 text-gray-500 dark:text-silver/80" />
        </button>
      </div>
    </div>
  )
}

export const Card = ({ card }: { card: AppleCarouselCard }) => {
  const basePx = useLineupCardBaseWidth()
  const reduceMotion = useReducedMotion()
  const lineupCtx = useContext(LineupExpandContext)
  const navigate = useNavigate()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const wasActiveRef = useRef(false)

  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [pullPx, setPullPx] = useState(basePx)

  const active = (hovered || focused) && !reduceMotion

  const goToCategory = () => {
    void navigate(card.to, { state: { pageTransition: reduceMotion ? undefined : 'slideUp' } })
  }

  const onCardKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      goToCategory()
    }
  }
  const effectivePull = active ? pullPx : 0
  const hoverWidth = active ? basePx + effectivePull : basePx
  const marginLeft = active ? -effectivePull : 0

  useLayoutEffect(() => {
    const prev = wasActiveRef.current
    if (active && !prev) lineupCtx?.beginExpand()
    if (!active && prev) lineupCtx?.endExpand()
    wasActiveRef.current = active
  }, [active, lineupCtx])

  useLayoutEffect(() => {
    if (!active) {
      setPullPx(basePx)
      return
    }
    const recompute = () => {
      if (!wrapperRef.current) return
      setPullPx(measureMaxPullLeft(wrapperRef.current, basePx))
    }
    recompute()
    const raf = requestAnimationFrame(recompute)
    window.addEventListener('resize', recompute)
    const sc = lineupCtx?.scrollRef.current
    sc?.addEventListener('scroll', recompute, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', recompute)
      sc?.removeEventListener('scroll', recompute)
    }
  }, [active, basePx, lineupCtx])

  useEffect(() => {
    if (!active) setPullPx(basePx)
  }, [basePx, active])

  return (
    <motion.div
      ref={wrapperRef}
      layout
      className="relative shrink-0 overflow-visible rounded-3xl"
      style={{ zIndex: active ? 40 : 1 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
      }}
      animate={{
        width: hoverWidth,
        marginLeft,
      }}
      transition={{ ...springSmooth, layout: springLayout }}
    >
      <motion.div
        data-lineup-card
        role="link"
        tabIndex={0}
        aria-label={`${card.category}: ${card.title}`}
        onClick={goToCategory}
        onKeyDown={onCardKeyDown}
        onPointerDown={(e: ReactPointerEvent<HTMLDivElement>) => {
          if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
            e.stopPropagation()
          }
        }}
        className="relative z-10 flex h-80 w-full cursor-pointer select-none flex-col items-start justify-start overflow-hidden rounded-3xl bg-gray-100 md:h-[40rem] dark:bg-carbon-900"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-full bg-gradient-to-b from-black/50 via-transparent to-transparent" />
        <div className="relative z-40 p-8">
          <p className="text-left font-sans text-sm font-medium text-white md:text-base">{card.category}</p>
          <p className="mt-2 max-w-xs text-left font-sans text-xl font-semibold [text-wrap:balance] text-white md:text-3xl">
            {card.title}
          </p>
        </div>
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-3xl">
          <BlurImage
            src={card.src}
            alt=""
            className="absolute inset-0 z-10 h-full w-full object-cover"
          />
        </div>
      </motion.div>
      <CardMagneticCornerArrow visible={active} />
    </motion.div>
  )
}

export const BlurImage = ({
  src,
  className,
  alt,
  height,
  width,
  ...rest
}: ImgHTMLAttributes<HTMLImageElement>) => {
  const [isLoading, setLoading] = useState(true)
  return (
    <img
      draggable={false}
      className={cn(
        'h-full w-full select-none transition duration-300 [-webkit-user-drag:none] [user-drag:none]',
        isLoading ? 'blur-sm' : 'blur-0',
        className,
      )}
      onDragStart={(e) => e.preventDefault()}
      onLoad={() => setLoading(false)}
      src={typeof src === 'string' ? src : undefined}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      alt={alt ?? 'Visuel produit'}
      {...rest}
    />
  )
}
