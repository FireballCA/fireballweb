import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { getProductBySlug, CATEGORIES } from '@/data/products'
import { useCart } from '@/context/CartContext'

export function Product() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const product = slug ? getProductBySlug(slug) : null
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h1 className="font-display text-4xl text-pearl mb-4">Produit introuvable</h1>
        <Link to="/boutique" className="text-chrome hover:underline">Retour à la boutique</Link>
      </div>
    )
  }

  const category = CATEGORIES.find((c) => c.id === product.category)

  const handleAddToCart = () => {
    addToCart(product, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <nav className="text-sm text-silver/70 mb-8">
        <Link to="/boutique" className="hover:text-chrome">Boutique</Link>
        {category && (
          <>
            <span className="mx-2">/</span>
            <Link to={`/boutique/${category.id}`} className="hover:text-chrome">{category.name}</Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-pearl">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
        <div className="aspect-square lg:aspect-auto lg:min-h-[500px] bg-carbon-800 overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div>
          {product.badge && (
            <span className="inline-block bg-chrome text-carbon-950 text-xs font-semibold px-2 py-1 mb-4">
              {product.badge}
            </span>
          )}
          <h1 className="font-display text-4xl md:text-5xl text-pearl tracking-tight mb-4">
            {product.name}
          </h1>
          <p className="text-xl text-chrome font-medium mb-6">{product.price.toFixed(2)} €</p>
          <p className="text-silver/80 leading-relaxed mb-8">{product.description}</p>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex border border-carbon-600">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-12 h-12 text-silver hover:text-chrome hover:bg-carbon-700 transition-colors"
              >
                −
              </button>
              <span className="w-12 h-12 flex items-center justify-center text-pearl border-x border-carbon-600">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-12 h-12 text-silver hover:text-chrome hover:bg-carbon-700 transition-colors"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              className={`flex-1 min-w-[200px] py-4 px-8 text-sm tracking-wide uppercase transition-colors ${
                added
                  ? 'bg-carbon-600 text-silver cursor-default'
                  : 'bg-chrome text-carbon-950 hover:bg-chrome/90'
              }`}
            >
              {added ? 'Ajouté au panier' : 'Ajouter au panier'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              addToCart(product, quantity)
              navigate('/panier')
            }}
            className="mt-4 w-full py-3 border border-carbon-600 text-silver text-sm tracking-wide uppercase hover:border-chrome hover:text-chrome transition-colors"
          >
            Acheter maintenant
          </button>
        </div>
      </div>
    </div>
  )
}
