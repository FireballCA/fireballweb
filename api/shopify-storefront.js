import { getShopifyStoreUrlFromEnv, getShopifyStorefrontGraphqlUrl } from './_shopifyCheckout.js'
import { parseJsonBody, rateLimit } from './_security.js'

const ALLOWED_OPERATIONS = new Set(['FireballProducts', 'FireballProductByHandle'])

function getOperationName(query) {
  const match = String(query || '').match(/\bquery\s+([A-Za-z0-9_]+)/)
  return match?.[1] || ''
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (rateLimit(req, res, { key: 'shopify-storefront', windowMs: 60_000, max: 80 })) return

  const payload = parseJsonBody(req)
  const { query, variables } = payload
  if (typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Missing GraphQL query' })
  }
  if (query.length > 8_000) {
    return res.status(400).json({ error: 'GraphQL query is too large' })
  }
  const operationName = getOperationName(query)
  if (!ALLOWED_OPERATIONS.has(operationName) || /\bmutation\b/i.test(query)) {
    return res.status(403).json({ error: 'GraphQL operation is not allowed' })
  }
  if (variables && (typeof variables !== 'object' || Array.isArray(variables))) {
    return res.status(400).json({ error: 'Invalid GraphQL variables' })
  }

  const SHOPIFY_STOREFRONT_TOKEN =
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    process.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    ''

  if (!getShopifyStoreUrlFromEnv() || !SHOPIFY_STOREFRONT_TOKEN) {
    return res.status(500).json({
      error:
        'Missing SHOPIFY_STORE_URL or SHOPIFY_STOREFRONT_ACCESS_TOKEN (set in Vercel env, not VITE_ in client).',
    })
  }

  const url = getShopifyStorefrontGraphqlUrl()

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    })

    if (response.status === 405) {
      return res.status(502).json({
        error:
          'Shopify Storefront endpoint rejected the request. SHOPIFY_STORE_URL must resolve to *.myshopify.com (not the marketing site).',
      })
    }

    const data = await response.json().catch(() => null)
    return res.status(response.status).json(data ?? { errors: [{ message: 'Invalid JSON from Shopify' }] })
  } catch (error) {
    return res.status(500).json({
      error: 'Shopify Storefront proxy failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
