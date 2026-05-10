import { cleanInline, isValidEmail, parseJsonBody, rateLimit } from './_security.js'

function normalizeStoreUrl(raw) {
  if (!raw) return ''
  return raw.startsWith('http') ? raw : `https://${raw}`
}

function normalizeOrderNumber(raw) {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return ''
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`
}

function isInvalidShopifyToken(details) {
  const text = typeof details === 'string' ? details : JSON.stringify(details || {})
  return /invalid api key|access token|wrong password|unrecognized login/i.test(text)
}

function isMissingReadOrdersScope(details) {
  const text = typeof details === 'string' ? details : JSON.stringify(details || {})
  return /read_orders scope|requires merchant approval/i.test(text)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (rateLimit(req, res, { key: 'shopify-track-order', windowMs: 15 * 60_000, max: 8 })) return

  const shopifyStoreUrl = normalizeStoreUrl(
    process.env.SHOPIFY_STORE_URL || process.env.VITE_SHOPIFY_STORE_URL || '',
  )
  const shopifyAdminApiToken = process.env.SHOPIFY_ADMIN_API_TOKEN || ''
  const shopifyApiVersion = process.env.SHOPIFY_ADMIN_API_VERSION || '2024-10'

  if (!shopifyStoreUrl || !shopifyAdminApiToken) {
    return res.status(500).json({
      error: 'Missing SHOPIFY_STORE_URL or SHOPIFY_ADMIN_API_TOKEN in server env.',
    })
  }

  const payload = parseJsonBody(req)
  const orderNumber = normalizeOrderNumber(payload?.orderNumber)
  const email = cleanInline(payload?.email, 254).toLowerCase()

  if (!orderNumber || !email) {
    return res.status(400).json({
      error: 'Missing required fields: orderNumber and email',
    })
  }
  if (!/^#?\d{3,12}$/.test(orderNumber) || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid order lookup details' })
  }

  try {
    const url = `${shopifyStoreUrl}/admin/api/${shopifyApiVersion}/orders.json?status=any&name=${encodeURIComponent(
      orderNumber,
    )}&fields=id,name,order_number,email,created_at,financial_status,fulfillment_status,fulfillments,total_price,currency,line_items`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyAdminApiToken,
      },
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      if (isInvalidShopifyToken(data)) {
        return res.status(500).json({
          error: 'Shopify Admin token is invalid. Update SHOPIFY_ADMIN_API_TOKEN in server environment.',
        })
      }
      if (isMissingReadOrdersScope(data)) {
        return res.status(403).json({
          error:
            'Shopify API access is missing read_orders permission. Approve and reinstall your app scopes in Shopify admin.',
        })
      }
      return res.status(response.status).json({
        error: 'Shopify request failed',
        details: data,
      })
    }

    const orders = Array.isArray(data?.orders) ? data.orders : []
    const order = orders.find((candidate) => {
      const candidateEmail = String(candidate?.email || '')
        .trim()
        .toLowerCase()
      return candidateEmail === email
    })

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      })
    }

    const firstLineItem =
      Array.isArray(order.line_items) && order.line_items.length > 0 ? order.line_items[0] : null
    const fulfillments = Array.isArray(order.fulfillments) ? order.fulfillments : []

    const tracking = fulfillments.flatMap((fulfillment) => {
      const company = String(fulfillment?.tracking_company || '').trim() || null
      const status = String(fulfillment?.shipment_status || '').trim() || null

      if (Array.isArray(fulfillment?.tracking_numbers) && fulfillment.tracking_numbers.length) {
        return fulfillment.tracking_numbers.map((trackingNumber, index) => ({
          number: String(trackingNumber || '').trim() || null,
          url:
            Array.isArray(fulfillment?.tracking_urls) && fulfillment.tracking_urls[index]
              ? String(fulfillment.tracking_urls[index]).trim()
              : null,
          company,
          status,
        }))
      }

      const singleNumber = String(fulfillment?.tracking_number || '').trim() || null
      const singleUrl = String(fulfillment?.tracking_url || '').trim() || null

      if (!singleNumber && !singleUrl) return []

      return [
        {
          number: singleNumber,
          url: singleUrl,
          company,
          status,
        },
      ]
    })

    return res.status(200).json({
      ok: true,
      order: {
        id: order.id,
        name: order.name,
        orderNumber: order.order_number,
        email: order.email,
        createdAt: order.created_at,
        financialStatus: order.financial_status,
        fulfillmentStatus: order.fulfillment_status,
        totalPrice: Number.parseFloat(order.total_price || '0'),
        currency: order.currency || 'CAD',
        firstItemTitle: firstLineItem?.title || null,
      },
      tracking,
    })
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
