/**
 * tier-discount.js
 * Retourne le code de rabais correspondant au tier XP de l'utilisateur connecté.
 * Les codes doivent être créés dans Shopify Admin > Discounts et configurés dans les vars d'env.
 *
 * Tiers:
 *   Tier 2 (Titanium,  ≥1200 XP)  → TIER_DISCOUNT_CODE_2 ($10 off)
 *   Tier 3 (Carbon,    ≥8000 XP)  → TIER_DISCOUNT_CODE_3 ($15 off)
 *   Tier 4 (Obsidian,  ≥20000 XP) → TIER_DISCOUNT_CODE_4 ($20 off)
 *   Tier 5 (Gold,      ≥35000 XP) → TIER_DISCOUNT_CODE_5 ($30 off)
 */
import { requireAuth } from './_auth.js'
import { rateLimit } from './_security.js'

const XP_TIERS = [
  { index: 5, minXp: 35000, envKey: 'TIER_DISCOUNT_CODE_5' },
  { index: 4, minXp: 20000, envKey: 'TIER_DISCOUNT_CODE_4' },
  { index: 3, minXp: 8000,  envKey: 'TIER_DISCOUNT_CODE_3' },
  { index: 2, minXp: 1200,  envKey: 'TIER_DISCOUNT_CODE_2' },
]

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (rateLimit(req, res, { key: 'tier-discount', windowMs: 60_000, max: 20 })) return

  const auth = await requireAuth(req)
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error })
  }

  const { data: profile, error } = await auth.supabase
    .from('profiles')
    .select('xp')
    .eq('id', auth.user.id)
    .maybeSingle()

  if (error || !profile) {
    return res.status(200).json({ discountCode: null, tier: 1 })
  }

  const xp = typeof profile.xp === 'number' ? profile.xp : parseInt(String(profile.xp || '0'), 10)

  for (const tier of XP_TIERS) {
    if (xp >= tier.minXp) {
      const code = process.env[tier.envKey] || null
      return res.status(200).json({ discountCode: code, tier: tier.index, xp })
    }
  }

  return res.status(200).json({ discountCode: null, tier: 1, xp })
}
