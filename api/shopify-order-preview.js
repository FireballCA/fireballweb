import { requireAuth } from './_auth.js'
import { parseJsonBody, rateLimit } from './_security.js'

function normalizeStoreUrl(raw) {
  if (!raw) return ''
  return raw.startsWith('http') ? raw : `https://${raw}`
}

async function fetchJson(url, token) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
  })
  const data = await response.json().catch(() => null)
  return { ok: response.ok, status: response.status, data }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (rateLimit(req, res, { key: 'shopify-order-preview', windowMs: 60_000, max: 30 })) return

  // ── Auth : utilisateur connecté uniquement ────────────────────────────────
  const auth = await requireAuth(req)
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error })
  }

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
  const inputIds = Array.isArray(payload.orderIds) ? payload.orderIds : []
  const orderIds = inputIds
    .map((id) => String(id || '').trim())
    .filter((id) => /^\d+$/.test(id))
    .slice(0, 10)

  if (!orderIds.length) {
    return res.status(200).json({ ok: true, previews: {} })
  }

  const { data: ownedPurchases, error: ownedError } = await auth.supabase
    .from('purchases')
    .select('shopify_order_id')
    .eq('user_id', auth.user.id)
    .in('shopify_order_id', orderIds)

  if (ownedError) {
    return res.status(200).json({ ok: true, previews: {} })
  }

  const ownedOrderIds = new Set(
    (Array.isArray(ownedPurchases) ? ownedPurchases : [])
      .map((row) => String(row?.shopify_order_id || '').trim())
      .filter(Boolean),
  )
  const allowedOrderIds = orderIds.filter((id) => ownedOrderIds.has(id))

  if (!allowedOrderIds.length) {
    return res.status(200).json({ ok: true, previews: {} })
  }

  const previews = {}

  for (const orderId of allowedOrderIds) {
    try {
      const orderUrl = `${shopifyStoreUrl}/admin/api/${shopifyApiVersion}/orders/${encodeURIComponent(
        orderId,
      )}.json?status=any&fields=id,name,currency,line_items`
      const orderRes = await fetchJson(orderUrl, shopifyAdminApiToken)
      const order = orderRes?.data?.order || null
      if (!order) continue

      const firstItem =
        Array.isArray(order.line_items) && order.line_items.length > 0
          ? order.line_items[0]
          : null

      let imageUrl =
        firstItem?.image?.src ||
        firstItem?.image?.url ||
        firstItem?.featured_image?.src ||
        firstItem?.featured_image?.url ||
        null

      if (!imageUrl && firstItem?.product_id) {
        const productUrl = `${shopifyStoreUrl}/admin/api/${shopifyApiVersion}/products/${encodeURIComponent(
          String(firstItem.product_id),
        )}.json?fields=id,image,images,title`
        const productRes = await fetchJson(productUrl, shopifyAdminApiToken)
        const product = productRes?.data?.product || null
        imageUrl = product?.image?.src || (Array.isArray(product?.images) ? product.images[0]?.src : null) || null
      }

      previews[orderId] = {
        orderName: typeof order.name === 'string' ? order.name : null,
        currency: typeof order.currency === 'string' ? order.currency : null,
        productTitle:
          typeof firstItem?.title === 'string'
            ? firstItem.title
            : (typeof firstItem?.name === 'string' ? firstItem.name : null),
        imageUrl: typeof imageUrl === 'string' ? imageUrl : null,
      }
    } catch {
      // Skip individual failures to avoid breaking the whole dashboard.
    }
  }

  return res.status(200).json({ ok: true, previews })
}

