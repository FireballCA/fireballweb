/**
 * Envoie l’email d’invitation Shopify au client (pour définir son mot de passe boutique).
 * Utilise customerSendAccountInviteEmail (Admin API).
 */
import { requireAuth } from './_auth.js'
import { isShopifyGid, parseJsonBody, rateLimit } from './_security.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (rateLimit(req, res, { key: 'send-shopify-customer-invite', windowMs: 60_000, max: 10 })) return

  const auth = await requireAuth(req)
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error })
  }

  const shopifyStoreUrl = process.env.SHOPIFY_STORE_URL || process.env.VITE_SHOPIFY_STORE_URL || ''
  const shopifyAdminApiToken = process.env.SHOPIFY_ADMIN_API_TOKEN || ''
  const shopifyApiVersion = process.env.SHOPIFY_ADMIN_API_VERSION || '2024-10'

  if (!shopifyStoreUrl || !shopifyAdminApiToken) {
    return res.status(500).json({
      error: 'Missing SHOPIFY_STORE_URL or SHOPIFY_ADMIN_API_TOKEN in server env.',
    })
  }

  const payload = parseJsonBody(req)

  const shopifyCustomerId =
    typeof payload.shopifyCustomerId === 'string' ? payload.shopifyCustomerId.trim() : ''

  if (!shopifyCustomerId) {
    return res.status(400).json({ error: 'Missing required field: shopifyCustomerId' })
  }

  if (!isShopifyGid(shopifyCustomerId, 'Customer')) {
    return res.status(400).json({ error: 'Invalid shopifyCustomerId format' })
  }

  const { data: profile, error: profileError } = await auth.supabase
    .from('profiles')
    .select('role, shopify_customer_id')
    .eq('id', auth.user.id)
    .maybeSingle()

  if (profileError || !profile) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const role = String(profile.role || '').toLowerCase()
  const ownsCustomer = String(profile.shopify_customer_id || '') === shopifyCustomerId
  if (role !== 'admin' && !ownsCustomer) {
    return res.status(403).json({ error: 'Forbidden' })
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
