import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
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
      .select('id,xp,email')
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

    // Règle simple: 1 XP par dollar dépensé (arrondi)
    const pointsEarned = Math.max(0, Math.round(numericTotal))

    // 2) Insérer une ligne de commande dans purchases (si la table existe)
    let purchaseId = null
    try {
      const { data: inserted, error: insertError } = await supabase
        .from('purchases')
        .insert({
          user_id: userId,
          shopify_order_id: String(orderId ?? ''),
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
          return {
            purchase_id: purchaseId,
            shopify_line_item_id: String(item.id ?? ''),
            product_title: String(item.title || item.name || 'Produit').trim(),
            variant_title: item.variant_title ? String(item.variant_title).trim() : null,
            sku: item.sku ? String(item.sku).trim() : null,
            quantity: qty,
            unit_price: unit,
            total_price: unit * qty,
          }
        })

        await supabase.from('purchase_items').insert(rows)
      } catch (itemsError) {
        console.warn('[shopify-order-webhook] Could not insert into purchase_items (table may not exist yet)', itemsError)
      }
    }

    // 3) Mettre à jour le XP cumulé sur le profil
    if (pointsEarned > 0) {
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

