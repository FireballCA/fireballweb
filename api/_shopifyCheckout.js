/** Domaine myshopify par défaut — permalinks /cart/* doivent y pointer, pas le site marketing. */
const DEFAULT_MYSHOPIFY_HOST = 'fireball-canada.myshopify.com'

export function getShopifyStoreUrlFromEnv() {
  return (
    process.env.SHOPIFY_STORE_URL ||
    process.env.VITE_SHOPIFY_STORE_URL ||
    DEFAULT_MYSHOPIFY_HOST
  ).trim()
}

/**
 * URL de base pour les permalinks panier Shopify (/cart/variant:qty).
 * Si SHOPIFY_STORE_URL pointe vers le site vitrine (ex. fireball-canada.com),
 * on force le domaine *.myshopify.com pour éviter un 404 sur le site React.
 */
export function resolveShopifyCheckoutBaseUrl(rawStoreUrl = getShopifyStoreUrlFromEnv()) {
  const explicit =
    process.env.SHOPIFY_CHECKOUT_STORE_URL ||
    process.env.SHOPIFY_MYSHOPIFY_DOMAIN ||
    ''
  if (explicit.trim()) {
    const value = explicit.trim()
    const base = value.startsWith('http') ? value : `https://${value}`
    return base.replace(/\/+$/, '')
  }

  const normalized = rawStoreUrl.startsWith('http')
    ? rawStoreUrl
    : `https://${rawStoreUrl}`

  try {
    const hostname = new URL(normalized).hostname.toLowerCase()
    if (hostname.endsWith('.myshopify.com')) {
      return normalized.replace(/\/+$/, '')
    }
  } catch {
    return `https://${DEFAULT_MYSHOPIFY_HOST}`
  }

  const shopSlug =
    process.env.SHOPIFY_SHOP_SLUG?.trim() ||
    process.env.SHOPIFY_SHOP_NAME?.trim() ||
    'fireball-canada'

  return `https://${shopSlug}.myshopify.com`
}

export function buildShopifyCartPermalink(encodedPairs, options = {}) {
  const base = options.baseUrl || resolveShopifyCheckoutBaseUrl()
  let url = `${base}/cart/${encodedPairs.join(',')}`
  if (options.discountCode) {
    url += `?discount=${encodeURIComponent(options.discountCode)}`
  }
  return url
}
