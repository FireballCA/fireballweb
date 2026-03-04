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
  const email = payload.email || payload.customer?.email || null
  const totalPrice = payload.total_price || null
  const currency = payload.currency || payload.presentment_currency || null

  console.log('[shopify-order-webhook] Order received', {
    orderId,
    email,
    totalPrice,
    currency,
  })

  // TODO: ici plus tard
  // - retrouver le profil Supabase correspondant (par email)
  // - créer une ligne dans une table purchases / purchase_items
  // - calculer et ajouter les points / XP

  return res.status(200).json({ ok: true })
}

