import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import {
  attemptMarketingCheckoutRedirect,
  buildMyshopifyCheckoutUrl,
  clearCheckoutRedirectState,
  hasCheckoutRedirectLoop,
} from '@/utils/shopifyCheckoutBridge'

export function ShopifyCheckoutBridge() {
  const loopDetected = hasCheckoutRedirectLoop()

  useEffect(() => {
    if (loopDetected) return
    if (attemptMarketingCheckoutRedirect()) return
    clearCheckoutRedirectState()
    const target = buildMyshopifyCheckoutUrl(window.location.pathname, window.location.search)
    window.location.replace(target)
  }, [loopDetected])

  if (loopDetected) {
    return (
      <div className="min-h-screen bg-carbon-950 text-white flex items-center justify-center px-6 py-16">
        <div className="max-w-lg text-center space-y-4">
          <h1 className="text-2xl font-semibold">Checkout — action requise dans Shopify</h1>
          <p className="text-white/70 text-sm leading-relaxed">
            Le domaine <strong className="text-white">fireball-canada.com</strong> pointe vers Vercel (ton site),
            mais Shopify essaie aussi d&apos;y envoyer le paiement. Résultat : boucle ou page 404.
          </p>
          <ol className="text-left text-sm text-white/80 space-y-2 list-decimal list-inside">
            <li>Shopify Admin → <strong>Settings → Domains</strong></li>
            <li>Retire <strong>fireball-canada.com</strong> / <strong>www</strong> du store Shopify</li>
            <li>Garde uniquement <strong>fireball-canada.myshopify.com</strong> côté Shopify</li>
            <li>Le site vitrine reste sur Vercel — seul le paiement passe par myshopify.com</li>
          </ol>
          <div className="pt-4 flex flex-col gap-3 items-center">
            <Link
              to="/cart"
              className="inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-carbon-900"
              onClick={() => clearCheckoutRedirectState()}
            >
              Retour au panier
            </Link>
            <button
              type="button"
              className="text-xs text-white/50 underline"
              onClick={() => {
                clearCheckoutRedirectState()
                window.location.reload()
              }}
            >
              Réessayer le checkout
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-carbon-950 text-white flex items-center justify-center px-6">
      <p className="text-sm text-white/70">Redirection vers le paiement sécurisé Shopify…</p>
    </div>
  )
}
