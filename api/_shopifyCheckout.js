/** Domaine myshopify par défaut — permalinks /cart/* doivent y pointer, pas le site marketing. */
const DEFAULT_MYSHOPIFY_HOST = 'fireball-canada.myshopify.com'

const MARKETING_CHECKOUT_HOSTS = new Set([
  'fireball-canada.com',
  'www.fireball-canada.com',
  'localhost',
  '127.0.0.1',
])

function getCheckoutPublicHost() {
  const explicit =
    process.env.SHOPIFY_CHECKOUT_PUBLIC_HOST ||
    process.env.SHOPIFY_CHECKOUT_STORE_URL ||
    process.env.SHOPIFY_MYSHOPIFY_DOMAIN ||
    ''
  if (explicit.trim()) {
    return explicit
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '')
      .split('/')[0]
  }
  return DEFAULT_MYSHOPIFY_HOST
}

/**
 * Shopify renvoie souvent checkoutUrl sur le domaine vitrine (Vercel) → 404 ou boucle apex/www.
 * On force le domaine hébergé par Shopify (*.myshopify.com ou checkout.* configuré dans l'admin).
 */
export function normalizeShopifyCheckoutUrl(checkoutUrl) {
  if (!checkoutUrl || typeof checkoutUrl !== 'string') return checkoutUrl

  try {
    const url = new URL(checkoutUrl)
    const host = url.hostname.toLowerCase()
    const checkoutHost = getCheckoutPublicHost().toLowerCase()

    if (host === checkoutHost) return url.toString()

    if (MARKETING_CHECKOUT_HOSTS.has(host) || !host.endsWith('.myshopify.com')) {
      url.protocol = 'https:'
      url.hostname = checkoutHost
    }

    return url.toString()
  } catch {
    return checkoutUrl
  }
}

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

/** GraphQL Storefront — toujours sur *.myshopify.com, jamais le domaine vitrine. */
export function getShopifyStorefrontGraphqlUrl() {
  const apiVersion =
    process.env.SHOPIFY_STOREFRONT_API_VERSION ||
    process.env.VITE_SHOPIFY_STOREFRONT_API_VERSION ||
    '2024-10'
  return `${resolveShopifyCheckoutBaseUrl()}/api/${apiVersion}/graphql.json`
}

/** Base Admin API REST/GraphQL — même règle que Storefront. */
export function getShopifyAdminApiBaseUrl() {
  return resolveShopifyCheckoutBaseUrl()
}

export function getShopifyStorefrontAccessToken() {
  return (
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    process.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    ''
  ).trim()
}

/**
 * Crée un panier Shopify (Storefront API) et retourne checkoutUrl.
 * Requis en headless : les permalinks /cart/variant:qty renvoient vers le site Vercel (404).
 */
export async function createShopifyCartCheckoutUrl(lines, options = {}) {
  const token = options.accessToken || getShopifyStorefrontAccessToken()
  if (!token) {
    throw new Error('Missing Shopify Storefront access token')
  }

  const graphqlUrl = options.graphqlUrl || getShopifyStorefrontGraphqlUrl()

  const cartLines = lines.map(({ shopifyVariantId, quantity }) => ({
    merchandiseId: shopifyVariantId,
    quantity,
  }))

  const input = { lines: cartLines }
  const discountCodes = (options.discountCodes || [])
    .map((code) => String(code || '').trim())
    .filter(Boolean)
  if (discountCodes.length) {
    input.discountCodes = discountCodes
  }

  const mutation = `
    mutation FireballCartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          checkoutUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query: mutation, variables: { input } }),
  })

  const payload = await response.json().catch(() => null)
  const userErrors = payload?.data?.cartCreate?.userErrors || []
  if (userErrors.length) {
    throw new Error(
      userErrors
        .map((error) => error?.message)
        .filter(Boolean)
        .join('; ') || 'Cart creation failed',
    )
  }

  const checkoutUrl = payload?.data?.cartCreate?.cart?.checkoutUrl
  if (!checkoutUrl) {
    throw new Error('Shopify did not return a checkout URL')
  }

  return normalizeShopifyCheckoutUrl(checkoutUrl)
}
