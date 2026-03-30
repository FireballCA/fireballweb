import { useCallback, useContext, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getFeaturedProducts } from '@/data/products'
import { SurfaceTechnology } from '@/components/SurfaceTechnology'
import { ProductCategoryLineup } from '@/components/ProductCategoryLineup'
import { LenisContext } from '@/components/LenisRoot'

function setTechnologyClipVars(el: HTMLAnchorElement, clientX: number, clientY: number) {
  const rect = el.getBoundingClientRect()
  const w = rect.width || 1
  const h = rect.height || 1
  const localX = clientX - rect.left
  const localY = clientY - rect.top
  const x = (localX / w) * 100
  const y = (localY / h) * 100

  // Rayon max pour recouvrir tout le bouton depuis le point du curseur
  const d1 = Math.hypot(localX, localY)
  const d2 = Math.hypot(w - localX, localY)
  const d3 = Math.hypot(localX, h - localY)
  const d4 = Math.hypot(w - localX, h - localY)
  const r = Math.max(d1, d2, d3, d4)
  el.style.setProperty('--clip-x', `${x}%`)
  el.style.setProperty('--clip-y', `${y}%`)
  el.style.setProperty('--clip-r', `${r}px`)
}

const technologyLinkCssVars = {
  '--clip-x': '50%',
  '--clip-y': '50%',
  '--clip-r': '0px',
} as CSSProperties

export function Home() {
  const { t } = useTranslation()
  const lenis = useContext(LenisContext)
  const featured = getFeaturedProducts()
  const [technologyHover, setTechnologyHover] = useState(false)

  const scrollToProductLineup = useCallback(() => {
    const el = document.getElementById('product-lineup')
    if (!el) return
    if (lenis) {
      lenis.scrollTo(el, { offset: -96, duration: 1.15 })
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [lenis])

  const onTechnologyPointerEnter = useCallback((e: ReactPointerEvent<HTMLAnchorElement>) => {
    setTechnologyClipVars(e.currentTarget, e.clientX, e.clientY)
    setTechnologyHover(true)
  }, [])

  const onTechnologyPointerMove = useCallback((e: ReactPointerEvent<HTMLAnchorElement>) => {
    setTechnologyClipVars(e.currentTarget, e.clientX, e.clientY)
  }, [])

  const onTechnologyPointerLeave = useCallback((e: ReactPointerEvent<HTMLAnchorElement>) => {
    setTechnologyClipVars(e.currentTarget, e.clientX, e.clientY)
    setTechnologyHover(false)
  }, [])

  return (
    <div className="relative">
      {/* Hero pinned: video + hero content stay fixed, only lower sections scroll over it */}
      <section
        className="fixed inset-0 z-0 flex min-h-[100dvh] items-center justify-center overflow-hidden bg-black"
        aria-label="Hero"
      >
        <video
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/videoplayback.mp4" type="video/mp4" />
        </video>
        <div className="pointer-events-none absolute inset-0 bg-black/45" aria-hidden />

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center animate-slide-up pt-16 md:pt-24 lg:pt-28">
          <h1 className="font-nav font-bold text-4xl md:text-6xl lg:text-7xl text-pearl tracking-tight leading-tight mb-4">
            Long-Lasting
            <br />
            Gloss & Protection
          </h1>
          <p className="text-silver/80 text-base md:text-lg max-w-3xl mx-auto font-light">
            Professional ceramic coatings designed for real durability and a deep, flawless shine.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={scrollToProductLineup}
              className="inline-block cursor-pointer px-8 py-2.5 font-nav text-sm font-bold uppercase rounded-xl shadow-lg transition-all duration-300 hover:opacity-90 hover:shadow-xl"
              style={{ backgroundColor: '#B61B1B', color: 'white' }}
            >
              Explore Products
            </button>
            <Link
              to="/about"
              className="relative inline-flex items-center justify-center overflow-hidden rounded-xl border border-white/[0.12] bg-transparent px-8 py-2.5 text-center font-nav text-sm font-bold uppercase transition-[border-color,color] duration-500 ease-out hover:border-white/25 motion-reduce:transition-none"
              style={technologyLinkCssVars}
              onPointerEnter={onTechnologyPointerEnter}
              onPointerMove={onTechnologyPointerMove}
              onPointerLeave={onTechnologyPointerLeave}
            >
              <span
                className="pointer-events-none absolute inset-0 z-0 bg-white"
                style={{
                  clipPath: `circle(${technologyHover ? 'var(--clip-r, 0px)' : '0px'} at var(--clip-x, 50%) var(--clip-y, 50%))`,
                  WebkitClipPath: `circle(${technologyHover ? 'var(--clip-r, 0px)' : '0px'} at var(--clip-x, 50%) var(--clip-y, 50%))`,
                  transition:
                    'clip-path 900ms cubic-bezier(0.22,1,0.36,1), -webkit-clip-path 900ms cubic-bezier(0.22,1,0.36,1)',
                  willChange: 'clip-path',
                }}
                aria-hidden
              />
              <span
                className={`relative z-10 transition-colors duration-500 motion-reduce:duration-200 ${
                  technologyHover ? 'text-black' : 'text-pearl'
                }`}
              >
                About Fireball
              </span>
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-silver/40">
          <span className="block w-px h-12 bg-current mx-auto animate-pulse" />
        </div>
      </section>

      {/* Content stack: starts 1 viewport below (minus main padding), then scrolls over the pinned hero */}
      <div className="relative z-10 pointer-events-none">
        {/* Spacer (transparent) MUST NOT block interactions with the pinned hero */}
        <div className="h-[calc(100dvh-5rem)] pointer-events-none select-none" aria-hidden />
        <div className="bg-carbon-950 pointer-events-auto">
      <ProductCategoryLineup />

      {/* Surface Technology */}
      <SurfaceTechnology />

      {/* Featured products */}
      <section id="featured" className="py-24 bg-carbon-900/50 border-t border-carbon-800">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-chrome text-sm uppercase mb-2">Sélection</p>
          <h2 className="font-display text-4xl md:text-5xl text-pearl tracking-tight mb-16">
            {t('home.featuredTitle')}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featured.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.slug}`}
                className="group block"
              >
                <div className="aspect-square bg-carbon-800 overflow-hidden mb-4 relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.badge && (
                    <span className="absolute top-3 left-3 bg-chrome text-carbon-950 text-xs font-semibold px-2 py-1">
                      {product.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-pearl group-hover:text-chrome transition-colors">
                  {product.name}
                </h3>
                <p className="text-silver/70 text-sm mt-1">{product.shortDesc}</p>
                <p className="text-chrome mt-2 font-medium">{product.price.toFixed(2)} €</p>
              </Link>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              to="/boutique"
              className="inline-block text-chrome text-sm uppercase hover:underline"
            >
              Voir toute la boutique →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-carbon-800">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-4xl md:text-5xl text-pearl tracking-tight mb-6">
            {t('home.ctaTitle')}
          </h2>
          <p className="text-silver/80 mb-10">
            {t('home.ctaSubtitle')}
          </p>
          <Link
            to="/boutique"
            className="inline-block px-8 py-4 border border-chrome text-chrome text-sm uppercase hover:bg-chrome hover:text-carbon-950 transition-colors"
          >
            {t('home.ctaButton')}
          </Link>
        </div>
      </section>
        </div>
      </div>
    </div>
  )
}
