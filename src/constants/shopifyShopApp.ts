/**
 * Official Shopify **Shop** app (consumer) — order tracking, Shop Pay, etc.
 * Opens in a new tab from the dashboard / orders page.
 *
 * Optional: set `VITE_SHOPIFY_SHOP_APP_URL` in `.env` if Shopify gives you a
 * store-specific Shop link (Shop channel → Share / your Shop store URL).
 * Default: https://shop.app
 */
export const SHOPIFY_SHOP_APP_URL = (() => {
  const raw = (import.meta.env.VITE_SHOPIFY_SHOP_APP_URL as string | undefined)?.trim()
  if (raw && /^https?:\/\//i.test(raw)) return raw
  return 'https://shop.app'
})()

/**
 * Customer orders page on the Shopify store.
 * Redirect users here when they want to see full past orders history.
 */
export const SHOPIFY_CUSTOMER_ORDERS_URL = (() => {
  const rawStoreUrl = (import.meta.env.VITE_SHOPIFY_STORE_URL as string | undefined)?.trim()
  const normalizedStoreUrl = rawStoreUrl
    ? rawStoreUrl.startsWith('http')
      ? rawStoreUrl
      : `https://${rawStoreUrl}`
    : 'https://fireball-canada.myshopify.com'

  return `${normalizedStoreUrl.replace(/\/+$/, '')}/account/orders`
})()
