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

  const { email, first_name, last_name, password } = payload

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing required fields: email and password' })
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
      email: String(email).trim(),
      password: String(password),
      firstName: String(first_name || '').trim(),
      lastName: String(last_name || '').trim(),
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
