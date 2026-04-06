export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const payload =
    typeof req.body === 'string'
      ? (() => {
          try {
            return JSON.parse(req.body)
          } catch {
            return {}
          }
        })()
      : (req.body || {})

  const { query, variables } = payload
  if (typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Missing GraphQL query' })
  }

  const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL || process.env.VITE_SHOPIFY_STORE_URL || ''
  const SHOPIFY_STOREFRONT_TOKEN =
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    process.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    ''
  const SHOPIFY_API_VERSION =
    process.env.SHOPIFY_STOREFRONT_API_VERSION ||
    process.env.VITE_SHOPIFY_STOREFRONT_API_VERSION ||
    '2024-10'

  if (!SHOPIFY_STORE_URL || !SHOPIFY_STOREFRONT_TOKEN) {
    return res.status(500).json({
      error:
        'Missing SHOPIFY_STORE_URL or SHOPIFY_STOREFRONT_ACCESS_TOKEN (set in Vercel env, not VITE_ in client).',
    })
  }

  const normalizedStoreUrl = SHOPIFY_STORE_URL.startsWith('http')
    ? SHOPIFY_STORE_URL
    : `https://${SHOPIFY_STORE_URL}`
  const url = `${normalizedStoreUrl}/api/${SHOPIFY_API_VERSION}/graphql.json`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    })

    const data = await response.json().catch(() => null)
    return res.status(response.status).json(data ?? { errors: [{ message: 'Invalid JSON from Shopify' }] })
  } catch (error) {
    return res.status(500).json({
      error: 'Shopify Storefront proxy failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
