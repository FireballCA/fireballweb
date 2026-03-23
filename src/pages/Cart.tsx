import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCart } from '@/context/CartContext'
import { buildShopifyCartUrl, fetchProductsFromShopify } from '@/utils/shopifyStorefront'
import { supabase } from '@/lib/supabase'
import { XP_PER_DOLLAR } from '@/utils/supabaseXp'
import type { Product } from '@/data/products'
import { PRODUCTS } from '@/data/products'
import { PaymentMethodBadges } from '@/components/PaymentMethodBadges'
import { getFavoriteSlugsResolved } from '@/utils/favorites'
import { productDetailPath } from '@/constants/paths'
import { ProductYouMightLikeRail } from '@/components/ProductYouMightLikeRail'
import { productSectionHeadingClass } from '@/constants/typography'

const FREE_SHIPPING_THRESHOLD = 100

function formatXp(xp: number) {
  return Math.max(0, Math.round(xp)).toLocaleString()
}

function formatMoney(n: number) {
  return `${n.toFixed(2)} $CA`
}

export function Cart() {
  const { t } = useTranslation()
  const { items, removeFromCart, updateQuantity, totalPrice, addToCart } = useCart()

  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [allShopProducts, setAllShopProducts] = useState<Product[]>([])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
    })
    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const slugs = await getFavoriteSlugsResolved()
      if (!cancelled) setFavoriteSlugs(slugs)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setProductsLoading(true)
      try {
        const list = await fetchProductsFromShopify()
        if (!cancelled) setAllShopProducts(list)
      } catch {
        if (!cancelled) setAllShopProducts(PRODUCTS)
      } finally {
        if (!cancelled) setProductsLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const cartXpGained = useMemo(() => Math.max(0, Math.round(totalPrice * XP_PER_DOLLAR)), [totalPrice])
  const shippingFree = totalPrice >= FREE_SHIPPING_THRESHOLD
  const shippingLabel = shippingFree ? 'Free' : 'Calculated at checkout'

  const favoriteProducts = useMemo(() => {
    const source = allShopProducts.length ? allShopProducts : PRODUCTS
    const bySlug = new Map(source.map((p) => [p.slug, p]))
    return favoriteSlugs.map((s) => bySlug.get(s)).filter(Boolean) as Product[]
  }, [favoriteSlugs, allShopProducts])

  const taxNote = userId
    ? 'Set your location in account settings for a closer estimate.'
    : 'Calculated at checkout'

  const cartProductSlugs = useMemo(() => new Set(items.map((i) => i.product.slug)), [items])

  const railProducts = useMemo(() => {
    const source = allShopProducts.length ? allShopProducts : PRODUCTS
    return source
      .filter((p) => p.price > 0 && !cartProductSlugs.has(p.slug))
      .sort((a, b) => a.price - b.price)
      .slice(0, 10)
  }, [allShopProducts, cartProductSlugs])

  const handleCheckout = () => {
    setCheckoutMessage(null)

    if (items.length === 0) {
      setCheckoutMessage(t('cart.emptyCartMsg'))
      return
    }

    const url = buildShopifyCartUrl(
      items.map(({ product, quantity }) => ({
        shopifyVariantId: product.shopifyVariantId,
        quantity,
      })),
    )

    if (!url) {
      setCheckoutMessage(t('cart.checkoutSoon'))
      return
    }

    window.location.href = url
  }

  if (items.length === 0) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center px-6 py-24 text-center">
        <div>
          <h1 className="font-sans font-bold text-4xl text-carbon-900 mb-4">{t('cart.empty')}</h1>
          <p className="text-silver/80 mb-8">{t('cart.emptyDesc')}</p>
          <Link
            to="/boutique"
            className="inline-block px-8 py-4 bg-carbon-900 text-white font-medium text-sm uppercase hover:opacity-90 transition-colors"
          >
            {t('cart.viewShop')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-10 lg:gap-12 items-start">
          <div className="divide-y divide-carbon-100">
            <section className="py-8 first:pt-0">
              <h2 className={productSectionHeadingClass}>Cart</h2>

              <div className="mt-4 divide-y divide-carbon-100">
                {items.map(({ product, quantity }) => {
                  const lineTotal = product.price * quantity
                  const lineXp = Math.round(lineTotal * XP_PER_DOLLAR)
                  const variantCount = product.variants?.length ?? 1
                  const showTrash = quantity === 1 && variantCount <= 1

                  return (
                    <div key={product.id} className="flex gap-4 py-5 first:pt-0">
                      <Link
                        to={productDetailPath(product.slug)}
                        className="w-24 h-24 flex-shrink-0 bg-carbon-50 overflow-hidden"
                      >
                        <img
                          src={product.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-4 items-start">
                          <div className="min-w-0 flex-1">
                            <Link
                              to={productDetailPath(product.slug)}
                              className="font-medium text-carbon-900 hover:text-chrome line-clamp-2"
                            >
                              {product.name}
                            </Link>
                          </div>
                          <div className="flex flex-col items-end shrink-0 text-right">
                            <p className="text-carbon-900 font-semibold tabular-nums leading-tight">
                              {formatMoney(lineTotal)}
                            </p>
                            <p className="text-[11px] text-carbon-500 font-medium mt-0.5 tabular-nums">
                              +{formatXp(lineXp)} XP
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          {showTrash ? (
                            <button
                              type="button"
                              onClick={() => removeFromCart(product.id)}
                              className="w-8 h-8 rounded-md bg-carbon-100 text-carbon-700 hover:text-carbon-950 hover:bg-carbon-200 transition-colors flex items-center justify-center"
                              aria-label={`Remove ${product.name}`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                <path d="M3 6h18" />
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              className="w-8 h-8 rounded-md bg-carbon-100 text-carbon-700 hover:text-carbon-950 hover:bg-carbon-200 transition-colors"
                            >
                              −
                            </button>
                          )}

                          <span className="w-8 text-center text-carbon-900 font-medium">{quantity}</span>

                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            className="w-8 h-8 rounded-md bg-carbon-100 text-carbon-700 hover:text-carbon-950 hover:bg-carbon-200 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="py-8">
              <p className="font-semibold text-carbon-900">Free returns</p>
              <Link
                to="/legal"
                className="mt-2 inline-block text-sm font-bold text-carbon-900 underline underline-offset-2 hover:text-carbon-700"
              >
                Learn more
              </Link>
            </section>

            <section className="py-8">
              <h2 className={productSectionHeadingClass}>Favorites</h2>

              {!userId ? (
                <div className="mt-4 px-0 py-2 text-center sm:text-left">
                  <p className="text-sm text-carbon-700">Want to see your favorites?</p>
                  <Link
                    to="/account?tab=login"
                    className="mt-3 inline-block text-sm font-bold text-carbon-900 underline underline-offset-2"
                  >
                    Sign in
                  </Link>
                </div>
              ) : favoriteProducts.length === 0 ? (
                <p className="mt-4 text-sm text-carbon-600">No saved favorites yet.</p>
              ) : (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {favoriteProducts.map((p) => (
                    <Link
                      key={p.id}
                      to={productDetailPath(p.slug)}
                      className="group overflow-hidden bg-white"
                    >
                      <div className="aspect-square bg-carbon-50">
                        <img
                          src={p.image}
                          alt=""
                          className="w-full h-full object-cover group-hover:opacity-95"
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium text-carbon-900 line-clamp-2 leading-snug">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-carbon-600 mt-1 tabular-nums">
                          {formatMoney(p.price)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {productsLoading && userId && (
                <p className="mt-2 text-xs text-carbon-500">Loading favorites…</p>
              )}
            </section>

          </div>

          <aside className="lg:sticky lg:top-24" aria-label="Order summary">
            <div className="bg-white">
              <h2 className={`${productSectionHeadingClass} m-0`}>Your summary</h2>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between gap-4 text-carbon-700">
                  <span>Sub-Total</span>
                  <span className="font-medium text-carbon-900 tabular-nums">{formatMoney(totalPrice)}</span>
                </div>
                <div className="flex justify-between gap-4 text-carbon-700">
                  <span>Shipping</span>
                  <span className="font-medium text-carbon-900">{shippingLabel}</span>
                </div>
                <div className="flex justify-between gap-4 text-carbon-700">
                  <span>Estimated taxes</span>
                  <span className="font-medium text-carbon-900 text-right max-w-[200px]">{taxNote}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3 border-t border-carbon-100 pt-6 text-sm">
                <div className="flex justify-between gap-4 text-carbon-900">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold tabular-nums">{formatMoney(totalPrice)}</span>
                </div>
                <div className="flex justify-between gap-4 text-carbon-700">
                  <span>XP earned</span>
                  <span className="font-semibold text-carbon-900">{formatXp(cartXpGained)} XP</span>
                </div>
              </div>

              <div className="mt-6 border-t border-carbon-100 pt-6">
              <button
                type="button"
                onClick={handleCheckout}
                className="w-full py-4 px-6 rounded-full font-medium text-white transition-all duration-300"
                style={{ backgroundColor: '#000' }}
              >
                {t('cart.checkout')}
              </button>

              <PaymentMethodBadges iconClassName="h-5 w-auto shrink-0" />

              {checkoutMessage && (
                <p className="text-carbon-600 text-xs mt-3 text-center">{checkoutMessage}</p>
              )}
              </div>
            </div>
          </aside>
        </div>

        {railProducts.length > 0 && (
          <div className="mt-16 pt-4">
            <ProductYouMightLikeRail
              title="You might also like"
              products={railProducts}
              showAddToCart
              onAddToCart={(p) => addToCart(p, 1)}
              formatPrice={formatMoney}
            />
          </div>
        )}
      </div>
    </div>
  )
}
