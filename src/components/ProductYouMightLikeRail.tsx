import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '@/data/products'
import { CATEGORIES } from '@/data/products'
import { productDetailPath } from '@/constants/paths'
import { productSectionHeadingClass } from '@/constants/typography'

function categoryLabel(categoryId: Product['category']): string {
  return CATEGORIES.find((c) => c.id === categoryId)?.name ?? categoryId
}

const cardWidthClass =
  'w-[260px] flex-shrink-0 sm:w-[270px] lg:w-[280px]'

/** Piste plus longue mais plus fine */
const SCROLL_TRACK_WIDTH_CLASS = 'flex-1 max-w-[720px] sm:max-w-[820px]'

type Props = {
  title?: string
  products: Product[]
  showAddToCart?: boolean
  onAddToCart?: (product: Product) => void
  formatPrice?: (price: number) => string
  className?: string
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

export function ProductYouMightLikeRail({
  title = 'You might also like',
  products,
  showAddToCart = false,
  onAddToCart,
  formatPrice = (n) => `${n.toFixed(2)} $CA`,
  className = '',
}: Props) {
  const headingId = useId()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const dragOffsetPxRef = useRef(0)
  const [thumbLeftPct, setThumbLeftPct] = useState(0)
  const [thumbWidthPct, setThumbWidthPct] = useState(100)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScroll = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const max = scrollWidth - clientWidth
    if (max <= 0) {
      setThumbWidthPct(100)
      setThumbLeftPct(0)
      setCanScrollLeft(false)
      setCanScrollRight(false)
      return
    }
    const tw = Math.max(12, (clientWidth / scrollWidth) * 100)
    const left = (scrollLeft / max) * (100 - tw)
    setThumbWidthPct(tw)
    setThumbLeftPct(left)
    setCanScrollLeft(scrollLeft > 2)
    setCanScrollRight(scrollLeft < max - 2)
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    updateScroll()
    el.addEventListener('scroll', updateScroll, { passive: true })
    const ro = new ResizeObserver(updateScroll)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScroll)
      ro.disconnect()
    }
  }, [updateScroll, products])

  const scrollByAmount = useCallback((delta: number) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: delta, behavior: 'smooth' })
  }, [])

  const getStep = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return 280
    return Math.min(320, Math.round(el.clientWidth * 0.75))
  }, [])

  const setScrollFromClientX = useCallback((clientX: number) => {
    const el = scrollerRef.current
    const track = trackRef.current
    if (!el || !track) return
    const max = el.scrollWidth - el.clientWidth
    if (max <= 0) return
    const rect = track.getBoundingClientRect()
    const thumbPx = (thumbWidthPct / 100) * rect.width
    const usable = Math.max(1, rect.width - thumbPx)
    const x = clientX - rect.left - dragOffsetPxRef.current
    const ratio = Math.min(1, Math.max(0, x / usable))
    el.scrollLeft = ratio * max
  }, [thumbWidthPct])

  const onTrackPointerDown = (e: MouseEvent<HTMLDivElement>) => {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const thumbPx = (thumbWidthPct / 100) * rect.width
    dragOffsetPxRef.current = thumbPx / 2
    draggingRef.current = true
    setScrollFromClientX(e.clientX)
  }

  const onThumbMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const thumb = e.currentTarget
    const rect = thumb.getBoundingClientRect()
    dragOffsetPxRef.current = Math.min(rect.width, Math.max(0, e.clientX - rect.left))
    draggingRef.current = true
  }

  useEffect(() => {
    const onMove = (e: globalThis.MouseEvent) => {
      if (!draggingRef.current) return
      setScrollFromClientX(e.clientX)
    }
    const onUp = () => {
      draggingRef.current = false
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [setScrollFromClientX])

  if (products.length === 0) return null

  return (
    <section
      className={['overflow-visible', className].filter(Boolean).join(' ')}
      aria-labelledby={headingId}
    >
      <div className="mb-6 min-w-0">
        <h2 id={headingId} className={productSectionHeadingClass}>
          {title}
        </h2>
      </div>

      <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-x-visible">
        <div
          ref={scrollerRef}
          className={[
            'flex flex-nowrap gap-8 overflow-x-auto overflow-y-visible scroll-smooth',
            '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            'px-4 sm:px-6 lg:px-8',
          ].join(' ')}
        >
          {products.map((p) => (
            <div key={p.id} className={cardWidthClass}>
              <Link to={productDetailPath(p.slug)} className="group block">
                <div className="mb-3 aspect-square overflow-hidden rounded-lg">
                  <img
                    src={p.image}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-carbon-900">{p.name}</p>
                <p className="mt-1 text-[11px] font-medium text-carbon-500/85">
                  {categoryLabel(p.category)}
                </p>
                <p className="mt-1 text-sm font-bold tabular-nums text-carbon-900">{formatPrice(p.price)}</p>
              </Link>
              {showAddToCart && onAddToCart && (
                <button
                  type="button"
                  onClick={() => onAddToCart(p)}
                  className="mt-3 w-full rounded-md bg-carbon-900 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Add to cart
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Piste largeur fixe + flèches comme avant (aligné titre : max-w-7xl) */}
      <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            aria-label="Scroll left"
            disabled={!canScrollLeft}
            onClick={() => scrollByAmount(-getStep())}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-carbon-200 bg-white text-carbon-800 shadow-sm transition-colors hover:bg-carbon-50 disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>

          <div
            ref={trackRef}
            role="presentation"
            className={`relative h-1.5 shrink-0 cursor-pointer rounded-full bg-carbon-200/80 ${SCROLL_TRACK_WIDTH_CLASS}`}
            onClick={onTrackPointerDown}
          >
            <div
              role="slider"
              aria-label="Horizontal scroll thumb"
              className="absolute top-0 h-full rounded-full bg-carbon-500 cursor-grab active:cursor-grabbing transition-[left,width] duration-100 ease-out"
              style={{
                width: `${thumbWidthPct}%`,
                left: `${thumbLeftPct}%`,
              }}
              onMouseDown={onThumbMouseDown}
            />
          </div>

          <button
            type="button"
            aria-label="Scroll right"
            disabled={!canScrollRight}
            onClick={() => scrollByAmount(getStep())}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-carbon-200 bg-white text-carbon-800 shadow-sm transition-colors hover:bg-carbon-50 disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}
