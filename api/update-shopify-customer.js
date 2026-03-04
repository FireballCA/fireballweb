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

  const email = typeof payload.email === 'string' ? payload.email.trim() : ''
  const firstName = typeof payload.first_name === 'string' ? payload.first_name.trim() : ''
  const lastName = typeof payload.last_name === 'string' ? payload.last_name.trim() : ''

  if (!email) {
    return res.status(400).json({ error: 'Missing required field: email' })
  }

  try {
    const normalizedStoreUrl = shopifyStoreUrl.startsWith('http')
      ? shopifyStoreUrl
      : `https://${shopifyStoreUrl}`

    const endpoint = `${normalizedStoreUrl}/admin/api/${shopifyApiVersion}/graphql.json`

    // 1) Récupérer le client par email
    const lookupQuery = `
      query customersByEmail($query: String!) {
        customers(first: 1, query: $query) {
          edges {
            node {
              id
              email
            }
          }
        }
      }
    `

    const lookupResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyAdminApiToken,
      },
      body: JSON.stringify({
        query: lookupQuery,
        variables: {
          query: `email:${email}`,
        },
      }),
    })

    const lookupResult = (await lookupResponse.json()) as any

    if (!lookupResponse.ok || lookupResult?.errors?.length) {
      console.error('Shopify customer lookup failed:', lookupResult?.errors)
      return res.status(400).json({
        error: 'Failed to lookup Shopify customer',
        details: lookupResult?.errors || null,
      })
    }

    const edges = lookupResult?.data?.customers?.edges || []
    if (!Array.isArray(edges) || edges.length === 0 || !edges[0]?.node?.id) {
      // Pas de client trouvé pour cet email – on ne considère pas ça comme une erreur bloquante
      console.warn('[update-shopify-customer] No customer found for email', email)
      return res.status(200).json({ ok: true, skipped: 'customer_not_found' })
    }

    const customerId = edges[0].node.id

    // 2) Mise à jour du client
    const updateMutation = `
      mutation customerUpdate($id: ID!, $input: CustomerInput!) {
        customerUpdate(id: $id, input: $input) {
          customer {
            id
            email
            firstName
            lastName
          }
          userErrors {
            field
            message
          }
        }
      }
    `

    const input = {
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
    }

    const updateResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyAdminApiToken,
      },
      body: JSON.stringify({
        query: updateMutation,
        variables: {
          id: customerId,
          input,
        },
      }),
    })

    const updateResult = (await updateResponse.json()) as any
    const userErrors = updateResult?.data?.customerUpdate?.userErrors || []

    if (!updateResponse.ok || updateResult?.errors?.length || userErrors.length) {
      console.error('Shopify customerUpdate failed', {
        errors: updateResult?.errors,
        userErrors,
      })
      return res.status(400).json({
        error: 'Failed to update Shopify customer',
        details: updateResult?.errors || userErrors || null,
      })
    }

    return res.status(200).json({
      ok: true,
      customer: updateResult?.data?.customerUpdate?.customer || null,
    })
  } catch (error) {
    console.error('[update-shopify-customer] Unexpected error', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

