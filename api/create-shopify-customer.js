export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, first_name, last_name } = req.body || {}

  if (!email) {
    return res.status(400).json({ error: 'Missing required field: email' })
  }

  const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL || 'fireball-canada.myshopify.com'
  const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN || ''
  const SHOPIFY_API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || '2024-10'

  if (!SHOPIFY_ADMIN_API_TOKEN) {
    return res.status(500).json({ error: 'Missing SHOPIFY_ADMIN_API_TOKEN' })
  }

  const normalizedStoreUrl = SHOPIFY_STORE_URL.startsWith('http')
    ? SHOPIFY_STORE_URL
    : `https://${SHOPIFY_STORE_URL}`
  const url = `${normalizedStoreUrl}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`

  const mutation = `
    mutation customerCreate($input: CustomerInput!) {
      customerCreate(input: $input) {
        customer {
          id
          email
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const variables = {
    input: {
      email: String(email).trim(),
      firstName: String(first_name || '').trim(),
      lastName: String(last_name || '').trim(),
    },
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
      },
      body: JSON.stringify({
        query: mutation,
        variables,
      }),
    })

    const data = await response.json()
    const userErrors = data?.data?.customerCreate?.userErrors || []

    if (!response.ok || data?.errors?.length || userErrors.length) {
      return res.status(400).json({
        error: 'Failed to create Shopify customer',
        details: data?.errors || userErrors,
      })
    }

    return res.status(200).json({
      success: true,
      customer: data?.data?.customerCreate?.customer || null,
    })
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
