import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'
import { rateLimit } from './_security.js'

// ─── Config webhook ──────────────────────────────────────────────────────────
// Ajouter SHOPIFY_WEBHOOK_SECRET dans les variables d'environnement Vercel
// (Shopify Admin → Settings → Notifications → Webhooks → signing secret)
const shopifyWebhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET || ''

// Désactive le body parser (Next.js / certains runtimes Vercel)
export const config = { api: { bodyParser: false } }

async function readRequestStream(req, maxBytes = 1_000_000) {
  if (typeof req[Symbol.asyncIterator] === 'function') {
    const chunks = []
    let bytes = 0
    for await (const chunk of req) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk))
      bytes += buffer.length
      if (bytes > maxBytes) {
        const error = new Error('Payload too large')
        error.code = 'PAYLOAD_TOO_LARGE'
        throw error
      }
      chunks.push(buffer)
    }
    return Buffer.concat(chunks).toString('utf8')
  }

  return new Promise((resolve, reject) => {
    let data = ''
    let bytes = 0
    req.on('data', (chunk) => {
      bytes += chunk.length
      if (bytes > maxBytes) {
        const error = new Error('Payload too large')
        error.code = 'PAYLOAD_TOO_LARGE'
        reject(error)
        req.destroy()
        return
      }
      data += chunk.toString('utf8')
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

async function getRawBody(req, maxBytes = 1_000_000) {
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString('utf8')
  }
  if (typeof req.body === 'string') {
    return req.body
  }

  const fromStream = await readRequestStream(req, maxBytes)
  if (fromStream) return fromStream

  if (req.body && typeof req.body === 'object') {
    return JSON.stringify(req.body)
  }

  return ''
}

/**
 * Vérifie la signature HMAC-SHA256 envoyée par Shopify.
 * Retourne false si le secret n'est pas configuré (mode dégradé — loguer un warning).
 */
function verifyShopifySignature(rawBody, signatureHeader) {
  if (!shopifyWebhookSecret) {
    console.warn('[shopify-order-webhook] SHOPIFY_WEBHOOK_SECRET non configuré — vérification HMAC ignorée')
    return false
  }
  if (!signatureHeader) return false
  try {
    const expected = createHmac('sha256', shopifyWebhookSecret)
      .update(rawBody, 'utf8')
      .digest('base64')
    const expectedBuf = Buffer.from(expected, 'utf8')
    const receivedBuf = Buffer.from(signatureHeader, 'utf8')
    if (expectedBuf.length !== receivedBuf.length) return false
    return timingSafeEqual(expectedBuf, receivedBuf)
  } catch {
    return false
  }
}

// ─── Supabase ─────────────────────────────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const shopifyStoreUrl = process.env.SHOPIFY_STORE_URL || process.env.VITE_SHOPIFY_STORE_URL || ''
const shopifyAdminApiToken = process.env.SHOPIFY_ADMIN_API_TOKEN || ''
const shopifyApiVersion = process.env.SHOPIFY_ADMIN_API_VERSION || '2024-10'

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null

const PARTNER_ONLY_TAGS = new Set(['partner-only', 'installer-only', 'installer', 'partner'])

export default async function handler(req, res) {
  try {
    return await handleShopifyOrderWebhook(req, res)
  } catch (error) {
    console.error('[shopify-order-webhook] Unhandled error', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

async function handleShopifyOrderWebhook(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (rateLimit(req, res, { key: 'shopify-order-webhook', windowMs: 60_000, max: 120 })) return

  // ── Vérification HMAC Shopify ─────────────────────────────────────────────
  let rawBody = ''
  try {
    rawBody = await getRawBody(req)
  } catch (error) {
    if (error?.code === 'PAYLOAD_TOO_LARGE') {
      return res.status(413).json({ error: 'Payload too large' })
    }
    console.error('[shopify-order-webhook] Failed to read request body', error)
    return res.status(400).json({ error: 'Invalid request body' })
  }
  const shopifySignature = req.headers['x-shopify-hmac-sha256'] || ''

  if (shopifyWebhookSecret) {
    if (!verifyShopifySignature(rawBody, shopifySignature)) {
      console.warn('[shopify-order-webhook] Signature HMAC invalide — requête rejetée')
      return res.status(401).json({ error: 'Invalid webhook signature' })
    }
  } else {
    // Secret non configuré : bloquer en production, accepter en dev avec warning
    if (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production') {
      console.error(
        '[shopify-order-webhook] SHOPIFY_WEBHOOK_SECRET manquant en production — ajoutez-le dans Vercel (Settings → Environment Variables). Valeur = signing secret du webhook dans Shopify Admin → Settings → Notifications → Webhooks.',
      )
      return res.status(503).json({
        error: 'Webhook secret not configured',
        hint: 'Set SHOPIFY_WEBHOOK_SECRET in Vercel environment variables (Shopify webhook signing secret).',
      })
    }
    console.warn('[shopify-order-webhook] SHOPIFY_WEBHOOK_SECRET non configuré (mode dev)')
  }

  // ── Parse le body (déjà lu en raw) ───────────────────────────────────────
  let payload = {}
  try {
    payload = rawBody ? JSON.parse(rawBody) : {}
  } catch {
    payload = {}
  }

  // Payload standard d'un order Shopify
  const orderId = payload.id || null
  const orderNumber = payload.order_number || payload.name || null
  const email = payload.email || payload.customer?.email || null
  const totalPrice = payload.total_price || null
  const currency = payload.currency || payload.presentment_currency || null
  const createdAt = payload.created_at || new Date().toISOString()
  const lineItems = Array.isArray(payload.line_items) ? payload.line_items : []

  console.log('[shopify-order-webhook] Order received', {
    orderId,
    email,
    orderNumber,
    totalPrice,
    currency,
  })

  if (!supabase) {
    console.warn('[shopify-order-webhook] Supabase client not configured, skipping persistence')
    return res.status(200).json({ ok: true, skipped: 'supabase_not_configured' })
  }

  if (!email) {
    console.warn('[shopify-order-webhook] No email on order, cannot link to profile')
    return res.status(200).json({ ok: true, skipped: 'no_email' })
  }

  try {
    // 1) Trouver le profil par email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id,xp,email,role,partner_status')
      .eq('email', email)
      .maybeSingle()

    if (profileError) {
      console.error('[shopify-order-webhook] Error loading profile by email', profileError)
      return res.status(200).json({ ok: true, skipped: 'profile_error' })
    }

    if (!profile) {
      console.warn('[shopify-order-webhook] No profile found for email', email)
      return res.status(200).json({ ok: true, skipped: 'profile_not_found' })
    }

    const userId = profile.id
    const numericTotal = Number.parseFloat(String(totalPrice ?? '0')) || 0
    const role = String(profile.role || '').toLowerCase()
    const partnerStatus = String(profile.partner_status || '').toLowerCase()
    const isPartner = role === 'partner' || partnerStatus === 'partner'

    // Contrôle serveur additionnel: ordre contenant un produit partner-only pour non-partenaire
    if (lineItems.length > 0 && shopifyStoreUrl && shopifyAdminApiToken && !isPartner) {
      const normalizedStoreUrl = shopifyStoreUrl.startsWith('http')
        ? shopifyStoreUrl
        : `https://${shopifyStoreUrl}`
      let hasRestrictedItem = false
      for (const item of lineItems) {
        const productId = item?.product_id
        if (!productId) continue
        try {
          const response = await fetch(
            `${normalizedStoreUrl}/admin/api/${shopifyApiVersion}/products/${productId}.json`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': shopifyAdminApiToken,
              },
            },
          )
          const json = (await response.json().catch(() => null)) || {}
          const tagsRaw = String(json?.product?.tags || '')
          const tags = tagsRaw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
          if (tags.some((t) => PARTNER_ONLY_TAGS.has(t))) {
            hasRestrictedItem = true
            break
          }
        } catch {
          // Ignore product lookup errors and continue best-effort checks
        }
      }
      if (hasRestrictedItem) {
        console.warn('[shopify-order-webhook] blocked non-partner restricted order', { orderId, email })
        return res.status(200).json({ ok: true, blocked: 'partner_required' })
      }
    }

    // 5 XP par dollar dépensé (arrondi)
    const pointsEarned = Math.max(0, Math.round(numericTotal * 5))

    // 2) Insérer une ligne de commande dans purchases (si la table existe)
    let purchaseId = null
    const shopifyOrderId = String(orderId ?? '').trim()
    if (shopifyOrderId) {
      try {
        const { data: existingPurchase, error: existingError } = await supabase
          .from('purchases')
          .select('id')
          .eq('shopify_order_id', shopifyOrderId)
          .maybeSingle()
        if (!existingError && existingPurchase?.id) {
          console.log('[shopify-order-webhook] Duplicate order ignored', { orderId: shopifyOrderId })
          return res.status(200).json({ ok: true, duplicate: true })
        }
      } catch {
        // Continue: old databases may not have the purchases table yet.
      }
    }

    try {
      const { data: inserted, error: insertError } = await supabase
        .from('purchases')
        .insert({
          user_id: userId,
          shopify_order_id: shopifyOrderId,
          order_number: orderNumber ? String(orderNumber) : null,
          total_price: numericTotal,
          currency: currency || 'CAD',
          points_earned: pointsEarned,
          placed_at: createdAt,
        })
        .select('id')
        .maybeSingle()

      if (insertError) {
        console.warn('[shopify-order-webhook] Could not insert into purchases (table may not exist yet)', insertError)
      } else if (inserted && inserted.id) {
        purchaseId = inserted.id
      }
    } catch (insertError) {
      console.warn('[shopify-order-webhook] Unexpected error inserting into purchases', insertError)
    }

    // 2b) Enregistrer les line_items dans purchase_items si la table existe
    if (purchaseId && lineItems.length > 0) {
      try {
        const rows = lineItems.map((item) => {
          const qty = typeof item.quantity === 'number' ? item.quantity : Number(item.quantity || 1) || 1
          const unit = Number.parseFloat(String(item.price ?? '0')) || 0
          const imgUrl =
            (item?.image?.src) ||
            (item?.image?.url) ||
            (item?.featured_image?.src) ||
            (item?.featured_image?.url) ||
            null
          return {
            purchase_id: purchaseId,
            shopify_line_item_id: String(item.id ?? ''),
            product_title: String(item.title || item.name || 'Produit').trim(),
            variant_title: item.variant_title ? String(item.variant_title).trim() : null,
            sku: item.sku ? String(item.sku).trim() : null,
            quantity: qty,
            unit_price: unit,
            total_price: unit * qty,
            image_url: imgUrl,
          }
        })

        await supabase.from('purchase_items').insert(rows)
      } catch (itemsError) {
        console.warn('[shopify-order-webhook] Could not insert into purchase_items (table may not exist yet)', itemsError)
      }
    }

    // 3) Mettre à jour le XP cumulé sur le profil
    if (purchaseId && pointsEarned > 0) {
      const currentXp = Number.isFinite(Number(profile.xp)) ? Number(profile.xp) : 0
      const newXp = currentXp + pointsEarned

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ xp: newXp })
        .eq('id', userId)

      if (updateError) {
        console.error('[shopify-order-webhook] Failed to update XP on profile', updateError)
      } else {
        console.log('[shopify-order-webhook] XP updated', { userId, currentXp, pointsEarned, newXp })
      }
    }
  } catch (e) {
    console.error('[shopify-order-webhook] Unexpected error', e)
  }

  return res.status(200).json({ ok: true })
}

