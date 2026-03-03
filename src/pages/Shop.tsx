import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PRODUCTS, CATEGORIES, type CategoryId, type Product } from '@/data/products'
import { useCart } from '@/context/CartContext'
import { fetchProductsFromShopify } from '@/utils/shopifyStorefront'

export function Shop() {
  const { categoryId } = useParams<{ categoryId?: string }>()
  const { addToCart } = useCart()
  const [allProducts, setAllProducts] = useState<Product[]>(PRODUCTS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const products = await fetchProductsFromShopify()
        if (!cancelled) {
          setAllProducts(products)
        }
      } catch (err) {
        console.error('Unable to load Shopify products', err)
        if (!cancelled) {
          setError("Impossible de charger les produits en temps réel. Affichage des produits statiques.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  const category = categoryId ? CATEGORIES.find((c) => c.id === categoryId) : null

  const products = categoryId
    ? allProducts.filter((p) => p.category === (categoryId as CategoryId))
    : allProducts

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="mb-12">
        <p className="text-chrome text-sm uppercase mb-2">Boutique</p>
        <h1 className="font-display text-4xl md:text-6xl text-pearl tracking-tight">
          {category ? category.name : 'Tous les produits'}
        </h1>
        {category && (
          <p className="text-silver/80 mt-2 max-w-xl">{category.description}</p>
        )}
        {loading && (
          <p className="text-silver/70 mt-4 text-sm">Chargement des produits en temps réel…</p>
        )}
        {!loading && error && (
          <p className="text-amber-300 mt-4 text-sm">{error}</p>
        )}
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-12">
        <Link
          to="/boutique"
          className={`px-4 py-2 text-sm border transition-colors ${
            !categoryId
              ? 'border-chrome text-chrome bg-chrome/10'
              : 'border-carbon-600 text-silver hover:border-carbon-500'
          }`}
        >
          Tous
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            to={`/boutique/${c.id}`}
            className={`px-4 py-2 text-sm border transition-colors ${
              categoryId === c.id
                ? 'border-chrome text-chrome bg-chrome/10'
                : 'border-carbon-600 text-silver hover:border-carbon-500'
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {products.map((product) => (
          <article
            key={product.id}
            className="group border border-carbon-700 hover:border-carbon-600 transition-colors"
          >
            <Link to={`/produit/${product.slug}`} className="block">
              <div className="aspect-square bg-carbon-800 overflow-hidden relative">
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
              <div className="p-5">
                <h2 className="font-medium text-pearl group-hover:text-chrome transition-colors">
                  {product.name}
                </h2>
                <p className="text-silver/70 text-sm mt-1 line-clamp-2">{product.shortDesc}</p>
                <p className="text-chrome mt-3 font-medium">{product.price.toFixed(2)} €</p>
              </div>
            </Link>
            <div className="px-5 pb-5">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  addToCart(product)
                }}
                className="w-full py-3 border border-carbon-600 text-silver text-sm uppercase hover:border-chrome hover:text-chrome transition-colors"
              >
                Ajouter au panier
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
