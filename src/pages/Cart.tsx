import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCart } from '@/context/CartContext'
import { buildShopifyCartUrl, fetchProductsFromShopify } from '@/utils/shopifyStorefront'
import { supabase } from '@/lib/supabase'
import { XP_PER_DOLLAR } from '@/utils/supabaseXp'
import type { Product } from '@/data/products'
import { PRODUCTS } from '@/data/products'

const FREE_DELIVERY_THRESHOLD = 100

function formatXp(xp: number) {
  return Math.max(0, Math.round(xp)).toLocaleString()
}

const XP_TIERS = [
  { id: 'brushed_silver', minXp: 0 },
  { id: 'titanium', minXp: 1200 },
  { id: 'carbon_fiber', minXp: 8000 },
  { id: 'obsidian', minXp: 20000 },
  { id: 'gold', minXp: 35000 },
] as const

function getTierForXp(xp: number) {
  const sorted = [...XP_TIERS].sort((a, b) => a.minXp - b.minXp)
  let current = sorted[0]
  for (const tier of sorted) {
    if (xp >= tier.minXp) current = tier
    else break
  }

  const currentIndex = sorted.findIndex((t) => t.id === current.id)
  const next = currentIndex >= 0 && currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null
  return { current, next }
}

function PaymentBadge({ label, src, className }: { label: string; src: string; className?: string }) {
  return <img src={src} alt={label} className={className ?? 'h-7 w-auto shrink-0'} loading="lazy" />
}

export function Cart() {
  const { t } = useTranslation()
  const { items, removeFromCart, updateQuantity, totalItems, totalPrice, addToCart } = useCart()

  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null)
  const [currentXp, setCurrentXp] = useState<number | null>(null)
  const [xpLoading, setXpLoading] = useState(false)

  const [productsLoading, setProductsLoading] = useState(true)
  const [allShopProducts, setAllShopProducts] = useState<Product[]>([])

  const cartXpGained = useMemo(() => Math.max(0, Math.round(totalPrice * XP_PER_DOLLAR)), [totalPrice])
  const missingForFreeDelivery = useMemo(
    () => Math.max(0, FREE_DELIVERY_THRESHOLD - totalPrice),
    [totalPrice],
  )

  // XP bar preview values (computed even when currentXp is still null)
  const currentXpValue = currentXp ?? 0
  const expectedTotalXp = currentXpValue + cartXpGained
  const { current: currentTier, next: nextTier } = getTierForXp(currentXpValue)
  const targetXp = nextTier
    ? nextTier.minXp
    : Math.max(currentTier.minXp || 1, currentXpValue || 1)

  const hasAccount = currentXp !== null
  const currentFillPct = Math.max(0, Math.min(((currentXpValue || 0) / (targetXp || 1)) * 100, 100))

  const currentSegmentPct = hasAccount ? currentFillPct : 0
  const xpToGo = Math.max(targetXp - expectedTotalXp, 0)

  const [animatedExpectedTotalXp, setAnimatedExpectedTotalXp] = useState<number>(expectedTotalXp)
  const [animatedXpToGo, setAnimatedXpToGo] = useState<number>(xpToGo)
  const animatedExpectedTotalXpRef = useRef<number>(expectedTotalXp)
  const animatedXpToGoRef = useRef<number>(xpToGo)
  const animationRafRef = useRef<number | null>(null)

  const animatedExpectedFillPctForBar = Math.max(
    0,
    Math.min((animatedExpectedTotalXp / (targetXp || 1)) * 100, 100),
  )
  const intermediateWidthPctForBar = Math.max(0, animatedExpectedFillPctForBar - currentSegmentPct)

  useEffect(() => {
    const fromExpected = animatedExpectedTotalXpRef.current
    const toExpected = expectedTotalXp
    const fromToGo = animatedXpToGoRef.current
    const toToGo = xpToGo

    const diffExpected = toExpected - fromExpected
    const diffToGo = toToGo - fromToGo

    if (diffExpected === 0 && diffToGo === 0) return

    if (animationRafRef.current) cancelAnimationFrame(animationRafRef.current)

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
    const easeInCubic = (t: number) => t * t * t

    const directionExpected = diffExpected >= 0 ? 'up' : 'down'
    const bigDuration = Math.abs(diffExpected) > 20000 ? 950 : Math.abs(diffExpected) > 5000 ? 800 : 650
    const smallDuration = 380

    const start = performance.now()
    const tick = (now: number) => {
      const tBig = Math.min((now - start) / bigDuration, 1)
      const tSmall = Math.min((now - start) / smallDuration, 1)

      const easedBig = directionExpected === 'up' ? easeOutCubic(tBig) : easeInCubic(tBig)
      const easedSmall = diffToGo >= 0 ? easeOutCubic(tSmall) : easeInCubic(tSmall)

      const nextExpected = Math.round(fromExpected + diffExpected * easedBig)
      const nextToGo = Math.round(fromToGo + diffToGo * easedSmall)

      animatedExpectedTotalXpRef.current = nextExpected
      animatedXpToGoRef.current = nextToGo
      setAnimatedExpectedTotalXp(nextExpected)
      setAnimatedXpToGo(nextToGo)

      if (tBig < 1 || tSmall < 1) {
        animationRafRef.current = requestAnimationFrame(tick)
      } else {
        // Force l'exact au final
        animatedExpectedTotalXpRef.current = toExpected
        animatedXpToGoRef.current = toToGo
        setAnimatedExpectedTotalXp(toExpected)
        setAnimatedXpToGo(toToGo)
      }
    }

    animationRafRef.current = requestAnimationFrame(tick)
    return () => {
      if (animationRafRef.current) cancelAnimationFrame(animationRafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expectedTotalXp, xpToGo])

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

    run()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setXpLoading(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          if (!cancelled) setCurrentXp(null)
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('xp')
          .eq('id', user.id)
          .maybeSingle()

        if (!cancelled) {
          setCurrentXp(typeof (profile as any)?.xp === 'number' ? (profile as any).xp : 0)
        }
      } catch {
        if (!cancelled) setCurrentXp(null)
      } finally {
        if (!cancelled) setXpLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  const cartProductSlugs = useMemo(() => new Set(items.map((i) => i.product.slug)), [items])

  const suggestedProducts = useMemo(() => {
    const source = allShopProducts.length ? allShopProducts : PRODUCTS
    const candidates = source
      .filter((p) => p.price > 0 && !cartProductSlugs.has(p.slug))
      .sort((a, b) => a.price - b.price)

    if (!candidates.length) return []

    // Si déjà en livraison offerte: on recommande surtout pour gagner plus d'XP
    if (missingForFreeDelivery <= 0) {
      return candidates.slice(0, 3)
    }

    // Sinon: pick des items (les moins chers) jusqu'à atteindre le seuil (ou dépasser légèrement)
    const picked: Product[] = []
    let sum = 0
    for (const p of candidates) {
      if (picked.length >= 4) break
      picked.push(p)
      sum += p.price
      if (sum >= missingForFreeDelivery) break
    }
    return picked
  }, [allShopProducts, cartProductSlugs, missingForFreeDelivery])

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
        <div className="flex items-start justify-between gap-8 mb-10 flex-col md:flex-row">
          <h1 className="font-sans font-bold text-4xl md:text-5xl text-carbon-950 tracking-tight mb-0 leading-none">
            Your Cart
          </h1>

          {/* XP bar preview (slightly lighter than dashboard) */}
          <div className="flex justify-end w-full md:w-auto">
            <div className="flex flex-col items-start w-full max-w-[380px]">
              {/* XP Number */}
              <div className="flex items-start">
                <span
                  className="text-carbon-950 font-inter leading-[1.2]"
                  style={{ fontSize: 74, fontWeight: 400 }}
                >
                  {animatedExpectedTotalXp.toLocaleString()}
                </span>
                <span
                  className="text-carbon-900 font-inter mt-1"
                  style={{ fontSize: 16, fontWeight: 400, lineHeight: '22px' }}
                >
                  XP
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full mt-2">
                    <div className="h-[10px] w-full bg-[#E6E6E6] rounded-[20px] overflow-hidden relative">
                  <div
                        className="absolute left-0 top-0 h-full bg-[#BDBDBD] transition-[width] duration-500 ease-out"
                    style={{ width: `${currentSegmentPct}%` }}
                  />
                      {intermediateWidthPctForBar > 0 && (
                    <div
                          className="absolute top-0 h-full bg-[#DADADA] transition-[width] duration-500 ease-out"
                      style={{
                            left: `${currentSegmentPct}%`,
                            width: `${intermediateWidthPctForBar}%`,
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Counters */}
              <div className="w-full flex items-center justify-between mt-2">
                <span
                  className="text-carbon-900 font-inter"
                  style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px' }}
                >
                  {animatedExpectedTotalXp.toLocaleString()}/{targetXp.toLocaleString()}
                </span>
                <span
                  className="text-carbon-500 font-inter"
                  style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px' }}
                >
                  {animatedXpToGo.toLocaleString()} XP to go
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-12 items-start">
          <div className="lg:col-span-1">
            <div className="border border-carbon-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-carbon-900 uppercase mb-4">Products</h2>
              <div className="divide-y divide-carbon-200">
                {items.map(({ product, quantity }) => {
                  const lineTotal = product.price * quantity
                  const lineXp = Math.round(lineTotal * XP_PER_DOLLAR)
                  const variantCount = product.variants?.length ?? 1
                  const showTrash = quantity === 1 && variantCount <= 1
                  return (
                    <div key={product.id} className="flex gap-6 py-5">
                      <div className="w-24 h-24 flex-shrink-0 bg-carbon-50 overflow-hidden border border-carbon-200">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/produit/${product.slug}`}
                          className="font-medium text-carbon-900 hover:text-chrome"
                        >
                          {product.name}
                        </Link>
                        <p className="text-carbon-700 text-sm mt-1">{product.price.toFixed(2)} €</p>

                        <div className="flex items-center gap-2 mt-2">
                          {showTrash ? (
                            <button
                              type="button"
                              onClick={() => removeFromCart(product.id)}
                              className="w-8 h-8 border border-carbon-300 text-carbon-700 hover:text-carbon-950 hover:bg-carbon-50 transition-colors flex items-center justify-center"
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
                              className="w-8 h-8 border border-carbon-300 text-carbon-700 hover:text-carbon-950 hover:bg-carbon-50 transition-colors"
                            >
                              −
                            </button>
                          )}

                          <span className="w-8 text-center text-carbon-900 font-medium">{quantity}</span>

                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            className="w-8 h-8 border border-carbon-300 text-carbon-700 hover:text-carbon-950 hover:bg-carbon-50 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-right min-w-[170px]">
                        <p className="text-carbon-900 font-semibold">{lineTotal.toFixed(2)} €</p>

                        {/* XP (juste le nombre, sans fond) */}
                        <div className="mt-1 text-[11px] text-carbon-600 font-medium">
                          +{formatXp(lineXp)} XP
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(product.id)}
                          className="mt-2 text-xs text-carbon-600 hover:text-red-500 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )
                })}

              {/* Add a little extra (free shipping / extra XP) */}
              <div className="pt-6">
                <h2 className="text-xl font-bold text-carbon-900">
                  {missingForFreeDelivery > 0 ? 'Add a little extra' : 'Want to earn more XP?'}
                </h2>
                <p className="text-sm text-carbon-600 mt-1">
                  {missingForFreeDelivery > 0
                    ? 'Add one or more of these items to get free delivery'
                    : 'Add one or more of these items to boost your XP.'}
                </p>

                <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestedProducts.map((p) => {
                    const xp = Math.round(p.price * XP_PER_DOLLAR)
                    return (
                      <div key={p.id} className="border border-carbon-200 bg-white p-4">
                        <div className="aspect-square bg-carbon-50 overflow-hidden border border-carbon-200">
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="mt-3">
                          <p className="font-semibold text-carbon-900 line-clamp-2">{p.name}</p>
                          <p className="text-sm text-carbon-700 mt-1">{p.price.toFixed(2)} €</p>

                          {/* XP (juste le nombre, sans fond) */}
                          <div className="mt-2 text-[11px] text-carbon-600 font-medium">
                            +{formatXp(xp)} XP
                          </div>

                          <button
                            type="button"
                            onClick={() => addToCart(p, 1)}
                            className="mt-3 w-full py-3 bg-carbon-900 text-white text-sm font-semibold hover:opacity-90 transition-colors"
                          >
                            Add to cart
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {productsLoading && (
                  <p className="text-sm text-carbon-600 mt-3">Loading recommendations…</p>
                )}
              </div>
            </div>
          </div>

          <aside className="lg:col-span-1" aria-label="Purchase">
            <div className="border border-carbon-200 bg-white p-6 sticky top-10 max-h-[calc(100vh-5rem)] overflow-y-auto">
              <h2 className="text-sm font-semibold text-carbon-900 uppercase mb-4">Purchase</h2>

              <div className="flex justify-between text-carbon-700 text-sm mb-3">
                <span>
                  {totalItems} {totalItems > 1 ? 'items' : 'item'}
                </span>
                <span>{totalPrice.toFixed(2)} €</span>
              </div>

              <div className="border-t border-carbon-200 pt-4 mt-4 space-y-2">
                <div className="flex justify-between text-carbon-800 text-sm">
                  <span>XP gained</span>
                  <span className="font-semibold text-carbon-900">{cartXpGained} XP</span>
                </div>

                <div className="pt-2 border-t border-carbon-200">
                  <div className="flex justify-between text-carbon-800 text-sm">
                    <span>Taxes</span>
                    <span className="font-semibold text-carbon-900">Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between text-carbon-800 text-sm mt-2">
                    <span>Delivery</span>
                    <span className="font-semibold text-carbon-900">
                      {missingForFreeDelivery <= 0 ? 'Free delivery unlocked' : 'Calculated at checkout'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                className="w-full mt-6 py-4 bg-carbon-950 text-white font-semibold text-sm uppercase hover:opacity-90 transition-colors"
              >
                checkout securely
              </button>

              {/* Payment methods (inline SVG) */}
              <div className="mt-4">
                <div className="flex flex-wrap items-center gap-3">
                  <PaymentBadge
                    label="American Express"
                    src="https://cdn.jsdelivr.net/npm/payment-icons@0.0.13/svg/flat/amex.svg"
                    className="h-7 w-auto"
                  />
                  <PaymentBadge
                    label="Apple Pay"
                    src="https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/apple.svg"
                    className="h-7 w-auto"
                  />
                  <PaymentBadge
                    label="Discover"
                    src="https://cdn.jsdelivr.net/npm/payment-icons@0.0.13/svg/flat/discover.svg"
                    className="h-7 w-auto"
                  />
                  <PaymentBadge
                    label="Google Pay"
                    src="https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/google.svg"
                    className="h-7 w-auto"
                  />
                  <PaymentBadge
                    label="Mastercard"
                    src="https://cdn.jsdelivr.net/npm/payment-icons@0.0.13/svg/flat/mastercard.svg"
                    className="h-7 w-auto"
                  />
                  <PaymentBadge
                    label="PayPal"
                    src="https://cdn.jsdelivr.net/npm/payment-icons@0.0.13/svg/flat/paypal.svg"
                    className="h-7 w-auto"
                  />
                  <PaymentBadge
                    label="Shop Pay"
                    src="https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/shopify.svg"
                    className="h-7 w-auto"
                  />
                </div>
                <div className="mt-2 flex justify-center">
                  <PaymentBadge
                    label="Visa"
                    src="https://cdn.jsdelivr.net/npm/payment-icons@0.0.13/svg/flat/visa.svg"
                    className="h-7 w-auto"
                  />
                </div>
              </div>

              <p className="text-center text-[11px] text-carbon-600 mt-2">Secured by Shopify</p>

              {checkoutMessage && <p className="text-carbon-600 text-xs mt-3 text-center">{checkoutMessage}</p>}
            </div>
          </aside>
        </div>
      </div>
    </div>
    </div>
  )
}
