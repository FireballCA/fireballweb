import { Link } from 'react-router-dom'
import { CATEGORIES } from '@/data/products'
import { getFeaturedProducts } from '@/data/products'

export function Home() {
  const featured = getFeaturedProducts()

  return (
    <div>
      {/* Hero — full viewport, Porsche-style */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-carbon-950/80 via-carbon-950/60 to-carbon-950" />
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto animate-slide-up">
          <p className="text-chrome text-sm tracking-widest uppercase mb-4">Esthétique automobile</p>
          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl text-pearl tracking-tight leading-none">
            FIREBALL
          </h1>
          <p className="text-silver/80 text-lg md:text-xl mt-6 max-w-xl mx-auto font-light">
            Des produits premium pour une finition sans compromis. Classique, Pro, Revêtements.
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Link
              to="/boutique"
              className="inline-block px-8 py-4 bg-chrome text-carbon-950 font-medium text-sm tracking-wide uppercase hover:bg-chrome/90 transition-colors"
            >
              Découvrir la boutique
            </Link>
            <Link
              to="/boutique#featured"
              className="inline-block px-8 py-4 border border-silver/30 text-pearl text-sm tracking-wide uppercase hover:border-chrome hover:text-chrome transition-colors"
            >
              Produits phares
            </Link>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-silver/40">
          <span className="block w-px h-12 bg-current mx-auto animate-pulse" />
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 border-t border-carbon-800">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-chrome text-sm tracking-widest uppercase mb-2">Gammes</p>
          <h2 className="font-display text-4xl md:text-5xl text-pearl tracking-tight mb-16">
            Trois univers, une exigence
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {CATEGORIES.map((cat, i) => (
              <Link
                key={cat.id}
                to={`/boutique/${cat.id}`}
                className="group block border border-carbon-700 hover:border-chrome/50 transition-all duration-300 overflow-hidden"
              >
                <div className="aspect-[4/3] bg-carbon-800 relative overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
                    style={{
                      backgroundImage: `url(https://images.unsplash.com/photo-${i === 0 ? '1607860108855-64acf2078ed9' : i === 1 ? '1487754180451-c456f719a1fc' : '1492144534655-ae79c964c9d7'}?w=800)`,
                    }}
                  />
                  <div className="absolute inset-0 bg-carbon-950/40 group-hover:bg-carbon-950/20 transition-colors" />
                  <div className="absolute inset-0 flex flex-col justify-end p-8">
                    <span className="font-display text-3xl text-pearl">{cat.name}</span>
                    <span className="text-silver/80 text-sm mt-1">{cat.description}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section id="featured" className="py-24 bg-carbon-900/50 border-t border-carbon-800">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-chrome text-sm tracking-widest uppercase mb-2">Sélection</p>
          <h2 className="font-display text-4xl md:text-5xl text-pearl tracking-tight mb-16">
            Produits phares
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featured.map((product) => (
              <Link
                key={product.id}
                to={`/produit/${product.slug}`}
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
              className="inline-block text-chrome text-sm tracking-wide uppercase hover:underline"
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
            L'excellence en détail
          </h2>
          <p className="text-silver/80 mb-10">
            Des formulations professionnelles pour les passionnés et les experts. Livraison soignée, conseils inclus.
          </p>
          <Link
            to="/boutique"
            className="inline-block px-8 py-4 border border-chrome text-chrome text-sm tracking-wide uppercase hover:bg-chrome hover:text-carbon-950 transition-colors"
          >
            Accéder à la boutique
          </Link>
        </div>
      </section>
    </div>
  )
}
