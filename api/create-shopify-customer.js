import { requireAuth } from './_auth.js'
import { cleanInline, isValidEmail, parseJsonBody, rateLimit } from './_security.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (rateLimit(req, res, { key: 'create-shopify-customer', windowMs: 15 * 60_000, max: 8 })) return

  const auth = await requireAuth(req)
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error })
  }

  const payload = parseJsonBody(req)
  const email = cleanInline(payload.email, 254).toLowerCase()
  const firstName = cleanInline(payload.first_name, 80)
  const lastName = cleanInline(payload.last_name, 80)
  const password = String(payload.password || '')

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing required fields: email and password' })
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address' })
  }
  if (auth.user.email?.toLowerCase() !== email) {
    return res.status(403).json({ error: 'Forbidden: cannot create another user customer' })
  }
  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'Invalid password length' })
  }

  const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL || 'fireball-canada.myshopify.com'
  const SHOPIFY_STOREFRONT_TOKEN =
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    process.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    ''
  const SHOPIFY_API_VERSION = process.env.SHOPIFY_STOREFRONT_API_VERSION || '2024-10'

  if (!SHOPIFY_STOREFRONT_TOKEN) {
    return res.status(500).json({
      error:
        'Missing Storefront token. Set SHOPIFY_STOREFRONT_ACCESS_TOKEN.',
    })
  }

  const normalizedStoreUrl = SHOPIFY_STORE_URL.startsWith('http')
    ? SHOPIFY_STORE_URL
    : `https://${SHOPIFY_STORE_URL}`
  const url = `${normalizedStoreUrl}/api/${SHOPIFY_API_VERSION}/graphql.json`

  const mutation = `
    mutation customerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer {
          id
          email
          firstName
          lastName
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `

  const variables = {
    input: {
      email,
      password,
      firstName,
      lastName,
    },
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
      },
      body: JSON.stringify({
        query: mutation,
        variables,
      }),
    })

    const data = await response.json()
    const userErrors = data?.data?.customerCreate?.customerUserErrors || []
    const graphqlErrors = data?.errors || null

    if (!response.ok || (Array.isArray(graphqlErrors) && graphqlErrors.length) || userErrors.length) {
      const details = graphqlErrors || userErrors || data || null
      return res.status(400).json({
        error: `Failed to create Shopify customer (HTTP ${response.status})`,
        details,
      })
    }

    const customer = data?.data?.customerCreate?.customer || null
    const shopifyCustomerId = customer?.id || null
    return res.status(200).json({
      success: true,
      customer,
      shopifyCustomerId,
    })
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
