/**
 * Envoie l’email d’invitation Shopify au client (pour définir son mot de passe boutique).
 * Utilise customerSendAccountInviteEmail (Admin API).
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const shopifyStoreUrl = process.env.SHOPIFY_STORE_URL || process.env.VITE_SHOPIFY_STORE_URL || ''
  const shopifyAdminApiToken = process.env.SHOPIFY_ADMIN_API_TOKEN || ''
  const shopifyApiVersion = process.env.SHOPIFY_ADMIN_API_VERSION || '2024-10'

  if (!shopifyStoreUrl || !shopifyAdminApiToken) {
    return res.status(500).json({
      error: 'Missing SHOPIFY_STORE_URL or SHOPIFY_ADMIN_API_TOKEN in server env.',
    })
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

  const shopifyCustomerId =
    typeof payload.shopifyCustomerId === 'string' ? payload.shopifyCustomerId.trim() : ''

  if (!shopifyCustomerId) {
    return res.status(400).json({ error: 'Missing required field: shopifyCustomerId' })
  }

  // GID format: gid://shopify/Customer/123
  if (!shopifyCustomerId.startsWith('gid://shopify/Customer/')) {
    return res.status(400).json({ error: 'Invalid shopifyCustomerId format' })
  }

  try {
    const normalizedStoreUrl = shopifyStoreUrl.startsWith('http')
      ? shopifyStoreUrl
      : `https://${shopifyStoreUrl}`
    const endpoint = `${normalizedStoreUrl}/admin/api/${shopifyApiVersion}/graphql.json`

    const mutation = `
      mutation customerSendAccountInviteEmail($customerId: ID!) {
        customerSendAccountInviteEmail(customerId: $customerId) {
          customer {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyAdminApiToken,
      },
      body: JSON.stringify({
        query: mutation,
        variables: { customerId: shopifyCustomerId },
      }),
    })

    const result = (await response.json()) || {}
    const userErrors = result?.data?.customerSendAccountInviteEmail?.userErrors || []
    const errors = result?.errors || []

    if (!response.ok || errors.length || userErrors.length) {
      const details = errors.length ? errors : userErrors
      return res.status(400).json({
        error: 'Failed to send Shopify account invite email',
        details,
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Invite email sent',
    })
  } catch (error) {
    console.error('[send-shopify-customer-invite]', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
