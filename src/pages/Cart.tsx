import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCart } from '@/context/CartContext'
import { fetchProductsFromShopify } from '@/utils/shopifyStorefront'
import { supabase } from '@/lib/supabase'
import { XP_PER_DOLLAR } from '@/utils/supabaseXp'
import type { Product } from '@/data/products'
import { CATEGORIES, PRODUCTS } from '@/data/products'
import { PaymentMethodBadges } from '@/components/PaymentMethodBadges'
import { getFavoriteSlugsResolved } from '@/utils/favorites'
import { productDetailPath, shopCategoryPath } from '@/constants/paths'
import { ProductYouMightLikeRail } from '@/components/ProductYouMightLikeRail'
import { productSectionHeadingClass } from '@/constants/typography'
import { FREE_SHIPPING_THRESHOLD_CAD } from '@/constants/shipping'
import { useClipRevealHover, CLIP_REVEAL_BUTTON_BASE_CLASS } from '@/hooks/useClipRevealHover'
import { usePageTitle } from '@/hooks/usePageTitle'
import { SEO } from '@/components/SEO'

/** Même offset vertical qu’au chargement : `Layout` main `pt-20` + padding haut de cette page `lg:pt-44`. */
const CART_SUMMARY_STICKY_TOP = 'lg:top-[calc(5rem+11rem)]'

function formatXp(xp: number) {
  return Math.max(0, Math.round(xp)).toLocaleString()
}

function formatMoney(n: number) {
  return `${n.toFixed(2)} $CA`
}

type EmptyCartFeature = {
  title: string
  subtitle: string
  icon: React.ReactElement
}

export function Cart() {
  const { t } = useTranslation()
  const { items, removeFromCart, updateQuantity, totalPrice, addToCart } = useCart()

  usePageTitle('Cart - Fireball Canada')

  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isPartner, setIsPartner] = useState(false)
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [allShopProducts, setAllShopProducts] = useState<Product[]>([])
  const [emptyCtaCategoryIndex, setEmptyCtaCategoryIndex] = useState(0)
  const clipCheckout = useClipRevealHover()

  useEffect(() => {
    const refreshUserState = async () => {
      const { data } = await supabase.auth.getUser()
      const currentUser = data.user
      setUserId(currentUser?.id ?? null)
      if (!currentUser?.id) {
        setIsPartner(false)
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role,partner_status')
        .eq('id', currentUser.id)
        .maybeSingle()
      const role = String(profile?.role || '').toLowerCase()
      const partnerStatus = String(profile?.partner_status || '').toLowerCase()
      setIsPartner(role === 'partner' || partnerStatus === 'partner')
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshUserState()
    })
    void refreshUserState()
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
  const shippingFree = totalPrice >= FREE_SHIPPING_THRESHOLD_CAD
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
      .filter((p) => !p.partnerOnly || isPartner)
      .sort((a, b) => a.price - b.price)
      .slice(0, 10)
  }, [allShopProducts, cartProductSlugs, isPartner])

  const emptyCtaCategories = useMemo(
    () =>
      CATEGORIES.filter((category) =>
        ['coatings', 'sealants', 'waxes', 'dressings', 'washing', 'cleaners', 'towels', 'accessories'].includes(
          category.id,
        ),
      ),
    [],
  )

  const emptyCtaCategory = emptyCtaCategories[emptyCtaCategoryIndex] ?? emptyCtaCategories[0]
  const emptyCtaButtonWidth = `${Math.max(16, 6 + (emptyCtaCategory?.name.length ?? 4))}ch`

  const favoritesSection = (
    <section className="py-8">
      <h2 className={productSectionHeadingClass}>Favorites</h2>

      {favoriteProducts.length === 0 ? (
        <p className="mt-4 text-sm text-carbon-600">No saved favorites yet.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {favoriteProducts.map((p) => (
            <article key={p.id} className="overflow-hidden bg-white">
              <Link to={productDetailPath(p.slug)} className="group block">
                <div className="aspect-square">
                  <img src={p.image} alt="" className="w-full h-full object-cover group-hover:opacity-95" />
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-carbon-900 line-clamp-2 leading-snug">{p.name}</p>
                  <p className="text-[11px] text-carbon-600 mt-1 tabular-nums">{formatMoney(p.price)}</p>
                </div>
              </Link>
              <div className="px-2 pb-2">
                <button
                  type="button"
                  onClick={() => addToCart(p, 1)}
                  className="w-full rounded-full border border-black bg-black px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-carbon-800"
                >
                  Add to cart
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {!userId && (
        <div className="mt-4 px-0 py-1 text-center sm:text-left">
          <p className="text-xs text-carbon-600">Favorites are saved locally on this device.</p>
          <Link to="/account?tab=login" className="mt-2 inline-block text-xs font-semibold text-carbon-900 underline underline-offset-2">
            Sign in to sync across devices
          </Link>
        </div>
      )}
      {productsLoading && <p className="mt-2 text-xs text-carbon-500">Loading favorites…</p>}
    </section>
  )

  useEffect(() => {
    if (items.length > 0 || emptyCtaCategories.length <= 1) return
    const timer = window.setInterval(() => {
      setEmptyCtaCategoryIndex((prev) => (prev + 1) % emptyCtaCategories.length)
    }, 3400)
    return () => window.clearInterval(timer)
  }, [items.length, emptyCtaCategories.length])

  const handleCheckout = async () => {
    setCheckoutMessage(null)

    if (items.length === 0) {
      setCheckoutMessage(t('cart.emptyCartMsg'))
      return
    }

    const lines = items.map(({ product, quantity }) => ({
      shopifyVariantId: product.shopifyVariantId,
      quantity,
    }))
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const response = await fetch('/api/shopify-secure-cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ lines }),
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      if (payload?.code === 'PARTNER_REQUIRED') {
        setCheckoutMessage('Access restricted: join Fireball to buy this product.')
        return
      }
      setCheckoutMessage(t('cart.checkoutSoon'))
      return
    }

    const url = typeof payload?.checkoutUrl === 'string' ? payload.checkoutUrl : ''
    if (!url) {
      setCheckoutMessage(t('cart.checkoutSoon'))
      return
    }
    window.location.href = url
  }

  if (items.length === 0) {
    const emptyFeatures: EmptyCartFeature[] = [
      {
        title: 'Secure payments',
        subtitle: 'Encrypted and trusted checkout.',
        icon: (
          <svg className="h-5 w-5 text-carbon-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3l7 4v5c0 5-3.5 8.3-7 9-3.5-.7-7-4-7-9V7l7-4z" />
          </svg>
        ),
      },
      {
        title: 'Free & easy returns',
        subtitle: 'Simple policy, no hassle.',
        icon: (
          <svg className="h-5 w-5 text-carbon-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 8h10a6 6 0 110 12H6" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 4L4 8l4 4" />
          </svg>
        ),
      },
      {
        title: 'Active support',
        subtitle: 'Fast help when you need it.',
        icon: (
          <svg className="h-5 w-5 text-carbon-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h8M8 14h5" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 11-9-9 9 9 0 019 9z" />
          </svg>
        ),
      },
    ]

    return (
      <div className="bg-white px-6 pt-28 pb-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="font-sans font-bold text-4xl text-carbon-900 mb-8">{t('cart.empty')}</h1>
            <Link
              to={emptyCtaCategory ? shopCategoryPath(emptyCtaCategory.id) : '/shop'}
              className="inline-flex items-center justify-center rounded-full bg-black px-8 py-4 font-medium text-white transition-[width] duration-500 ease-out"
              style={{ width: emptyCtaButtonWidth }}
            >
              <span>View </span>
              <span
                className="ml-1 inline-block text-left transition-all duration-300 ease-out"
              >
                {emptyCtaCategory?.name ?? 'Shop'}
              </span>
            </Link>
          </div>

          <section className="mt-14">
            <div className="grid gap-4 md:grid-cols-3">
              {emptyFeatures.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-carbon-200 bg-white p-5"
                >
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-carbon-100">
                    {feature.icon}
                  </div>
                  <h2 className="text-base font-semibold text-carbon-900">{feature.title}</h2>
                  <p className="mt-1 text-sm text-carbon-600">{feature.subtitle}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-10 text-center">
            <p className="text-base font-semibold text-carbon-900">Our payments partners</p>
            <PaymentMethodBadges className="mt-4" iconClassName="h-8 w-auto shrink-0" />
          </section>

          {favoritesSection}
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO title="Cart — Fireball Canada" rawTitle description="Your Fireball Canada cart." canonicalPath="/cart" noindex />
      <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 lg:pt-44 pb-12">
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
                              className="font-medium text-carbon-900 hover:text-carbon-600 transition-colors line-clamp-2"
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

            {favoritesSection}

          </div>

          <aside className={`lg:sticky ${CART_SUMMARY_STICKY_TOP}`} aria-label="Order summary">
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
                onPointerEnter={clipCheckout.onPointerEnter}
                onPointerMove={clipCheckout.onPointerMove}
                onPointerLeave={clipCheckout.onPointerLeave}
                onFocus={clipCheckout.onFocus}
                onBlur={clipCheckout.onBlur}
                style={clipCheckout.cssVars}
                className={`relative w-full overflow-hidden rounded-full border py-4 px-6 font-medium transition-[border-color,color] duration-500 ease-out outline-none [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:outline-none ${CLIP_REVEAL_BUTTON_BASE_CLASS}`}
              >
                <span
                  className="pointer-events-none absolute -inset-px z-0 rounded-full"
                  style={{
                    backgroundColor: '#ffffff',
                    clipPath: `circle(${clipCheckout.active ? 'var(--clip-r, 0px)' : '0px'} at var(--clip-x, 50%) var(--clip-y, 50%))`,
                    WebkitClipPath: `circle(${clipCheckout.active ? 'var(--clip-r, 0px)' : '0px'} at var(--clip-x, 50%) var(--clip-y, 50%))`,
                    transition:
                      'clip-path 900ms cubic-bezier(0.22,1,0.36,1), -webkit-clip-path 900ms cubic-bezier(0.22,1,0.36,1)',
                    willChange: 'clip-path',
                  }}
                  aria-hidden
                />
                <span
                  className={`relative z-10 block transition-all duration-300 ${
                    clipCheckout.hover ? 'text-black' : 'text-white'
                  }`}
                >
                  {t('cart.checkout')}
                </span>
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
    </>
  )
}
