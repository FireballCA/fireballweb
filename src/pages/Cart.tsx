import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import { buildShopifyCartUrl } from '@/utils/shopifyStorefront'

export function Cart() {
  const { items, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart()
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null)

  const handleCheckout = () => {
    setCheckoutMessage(null)

    if (items.length === 0) {
      setCheckoutMessage('Votre panier est vide.')
      return
    }

    const url = buildShopifyCartUrl(
      items.map(({ product, quantity }) => ({
        shopifyVariantId: product.shopifyVariantId,
        quantity,
      })),
    )

    if (!url) {
      setCheckoutMessage(
        "Le checkout en ligne sera bientôt disponible pour ces produits. Aucun montant n'a été débité."
      )
      return
    }

    // Redirection vers le checkout Shopify
    window.location.href = url
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <h1 className="font-display text-4xl text-pearl mb-4">Votre panier est vide</h1>
        <p className="text-silver/80 mb-8">Découvrez nos produits d'esthétique automobile.</p>
        <Link
          to="/boutique"
          className="inline-block px-8 py-4 bg-chrome text-carbon-950 font-medium text-sm uppercase hover:bg-chrome/90 transition-colors"
        >
          Voir la boutique
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="font-display text-4xl md:text-5xl text-pearl tracking-tight mb-12">
        Panier
      </h1>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {items.map(({ product, quantity }) => (
            <div
              key={product.id}
              className="flex gap-6 border border-carbon-700 p-4"
            >
              <div className="w-24 h-24 flex-shrink-0 bg-carbon-800 overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/produit/${product.slug}`} className="font-medium text-pearl hover:text-chrome">
                  {product.name}
                </Link>
                <p className="text-silver/70 text-sm mt-1">{product.price.toFixed(2)} €</p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    className="w-8 h-8 border border-carbon-600 text-silver hover:text-chrome text-sm"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-pearl">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    className="w-8 h-8 border border-carbon-600 text-silver hover:text-chrome text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-chrome font-medium">{(product.price * quantity).toFixed(2)} €</p>
                <button
                  type="button"
                  onClick={() => removeFromCart(product.id)}
                  className="mt-2 text-xs text-silver/70 hover:text-red-400 transition-colors"
                >
                  Retirer
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="border border-carbon-700 p-6 sticky top-28">
            <h2 className="text-sm font-semibold text-chrome uppercase mb-4">
              Récapitulatif
            </h2>
            <div className="flex justify-between text-silver/80 text-sm mb-2">
              <span>{totalItems} article{totalItems > 1 ? 's' : ''}</span>
            </div>
            <div className="border-t border-carbon-600 pt-4 mt-4 flex justify-between text-pearl font-medium">
              <span>Total</span>
              <span className="text-chrome">{totalPrice.toFixed(2)} €</span>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              className="w-full mt-6 py-4 bg-chrome text-carbon-950 font-medium text-sm uppercase hover:bg-chrome/90 transition-colors"
            >
              Passer la commande
            </button>
            {checkoutMessage && (
              <p className="text-silver/70 text-xs mt-3 text-center">
                {checkoutMessage}
              </p>
            )}
            <p className="text-silver/50 text-xs mt-4 text-center">
              Paiement sécurisé. Livraison offerte dès 100 €.
            </p>
            <Link
              to="/boutique"
              className="block mt-4 text-center text-silver/70 text-sm hover:text-chrome"
            >
              Continuer mes achats
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
