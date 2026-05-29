/**
 * shopify-tier-checkout.js
 *
 * Endpoint unifié : valide le panier, détecte le tier XP de l'utilisateur,
 * génère un code de réduction Shopify unique à usage unique via l'Admin API,
 * et retourne l'URL de checkout avec ce code pré-appliqué.
 *
 * Sécurité :
 *  - Auth Supabase obligatoire
 *  - Code généré côté serveur, jamais exposé avant usage
 *  - Code à usage unique (usage_limit: 1)
 *  - Price rules créées automatiquement si elles n'existent pas encore
 */
import { createClient } from '@supabase/supabase-js'
import { isPositiveInteger, isShopifyGid, parseJsonBody, rateLimit } from './_security.js'

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL || ''
const SHOPIFY_STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || ''
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN || ''
const SHOPIFY_API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || '2024-10'
const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

const PARTNER_ONLY_TAGS = new Set(['partner-only', 'installer-only', 'installer', 'partner'])

const TIER_RULES = [
  { index: 5, minXp: 35000, title: 'Fireball Loyalty Tier 5 - $30 off', value: '-30.00' },
  { index: 4, minXp: 20000, title: 'Fireball Loyalty Tier 4 - $20 off', value: '-20.00' },
  { index: 3, minXp:  8000, title: 'Fireball Loyalty Tier 3 - $15 off', value: '-15.00' },
  { index: 2, minXp:  1200, title: 'Fireball Loyalty Tier 2 - $10 off', value: '-10.00' },
]

// Cache en mémoire des price rule IDs (dure le temps du process serveur)
const priceRuleCache = new Map()

function shopifyAdminUrl(path) {
  const base = SHOPIFY_STORE_URL.startsWith('http')
    ? SHOPIFY_STORE_URL
    : `https://${SHOPIFY_STORE_URL}`
  return `${base.replace(/\/+$/, '')}/admin/api/${SHOPIFY_API_VERSION}${path}`
}

async function adminFetch(path, options = {}) {
  const resp = await fetch(shopifyAdminUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
      ...(options.headers || {}),
    },
  })
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`Shopify Admin ${path} → HTTP ${resp.status}: ${text.slice(0, 200)}`)
  }
  return resp.json()
}

async function storefrontFetch(query, variables) {
  const base = SHOPIFY_STORE_URL.startsWith('http')
    ? SHOPIFY_STORE_URL
    : `https://${SHOPIFY_STORE_URL}`
  const url = `${base}/api/${SHOPIFY_API_VERSION}/graphql.json`
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  })
  const json = await resp.json().catch(() => null)
  if (!resp.ok || !json || (Array.isArray(json.errors) && json.errors.length)) {
    throw new Error('Shopify Storefront request failed')
  }
  return json.data
}

async function getOrCreatePriceRule(tier) {
  if (priceRuleCache.has(tier.index)) return priceRuleCache.get(tier.index)

  // Chercher une price rule existante avec ce titre exact
  const search = await adminFetch(`/price_rules.json?limit=250`)
  const existing = (search?.price_rules || []).find((r) => r.title === tier.title)
  if (existing) {
    priceRuleCache.set(tier.index, existing.id)
    return existing.id
  }

  // Créer la price rule automatiquement
  const created = await adminFetch('/price_rules.json', {
    method: 'POST',
    body: JSON.stringify({
      price_rule: {
        title: tier.title,
        target_type: 'line_item',
        target_selection: 'all',
        allocation_method: 'across',
        value_type: 'fixed_amount',
        value: tier.value,
        customer_selection: 'all',
        starts_at: new Date().toISOString(),
      },
    }),
  })
  const id = created?.price_rule?.id
  if (!id) throw new Error(`Failed to create price rule for tier ${tier.index}`)
  priceRuleCache.set(tier.index, id)
  return id
}

function generateUniqueCode(tierIndex) {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `FB-T${tierIndex}-${ts}-${rand}`
}

async function createOneTimeDiscountCode(priceRuleId, tierIndex) {
  const code = generateUniqueCode(tierIndex)
  const result = await adminFetch(`/price_rules/${priceRuleId}/discount_codes.json`, {
    method: 'POST',
    body: JSON.stringify({
      discount_code: { code },
    }),
  })
  return result?.discount_code?.code ?? null
}

async function getUserTier(token) {
  if (!supabaseAdmin || !token) return null
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !userData?.user?.id) return null

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('xp, role, partner_status')
    .eq('id', userData.user.id)
    .maybeSingle()
  if (!profile) return null

  const xp = typeof profile.xp === 'number' ? profile.xp : parseInt(String(profile.xp || '0'), 10)
  for (const tier of TIER_RULES) {
    if (xp >= tier.minXp) return { tier, xp, profile }
  }
  return { tier: null, xp, profile }
}

async function isPartner(profile) {
  const role = String(profile?.role || '').toLowerCase()
  const status = String(profile?.partner_status || '').toLowerCase()
  return role === 'partner' || status === 'partner'
}

async function resolveVariantPartnerOnly(variantId) {
  const query = `
    query VariantAccess($id: ID!) {
      node(id: $id) {
        ... on ProductVariant {
          id
          product { tags }
        }
      }
    }
  `
  const data = await storefrontFetch(query, { id: variantId })
  const tags = Array.isArray(data?.node?.product?.tags) ? data.node.product.tags : []
  return tags.some((t) => PARTNER_ONLY_TAGS.has(String(t).toLowerCase().trim()))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (rateLimit(req, res, { key: 'shopify-tier-checkout', windowMs: 60_000, max: 20 })) return

  if (!SHOPIFY_STORE_URL || !SHOPIFY_STOREFRONT_TOKEN) {
    return res.status(500).json({ error: 'Missing Shopify Storefront configuration' })
  }
  if (!SHOPIFY_ADMIN_TOKEN) {
    return res.status(500).json({ error: 'Missing Shopify Admin API token' })
  }

  // Auth obligatoire
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token) {
    return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' })
  }

  const body = parseJsonBody(req)
  const linesRaw = Array.isArray(body.lines) ? body.lines : []
  if (linesRaw.length === 0 || linesRaw.length > 25) {
    return res.status(400).json({ error: 'Invalid cart' })
  }

  const lineMap = new Map()
  for (const line of linesRaw) {
    const variantId = String(line?.shopifyVariantId || '').trim()
    const qty = Number(line?.quantity || 0)
    if (!isShopifyGid(variantId, 'ProductVariant') || !isPositiveInteger(qty, 99)) {
      return res.status(400).json({ error: 'Invalid cart line' })
    }
    lineMap.set(variantId, (lineMap.get(variantId) || 0) + qty)
  }

  try {
    // 1. Récupérer tier et profil
    const userTierData = await getUserTier(token)
    if (!userTierData) {
      return res.status(401).json({ error: 'Invalid session', code: 'AUTH_REQUIRED' })
    }
    const { tier, profile } = userTierData
    const partnerUser = await isPartner(profile)

    // 2. Valider les produits partner-only
    for (const [variantId] of lineMap) {
      const restricted = await resolveVariantPartnerOnly(variantId)
      if (restricted && !partnerUser) {
        return res.status(403).json({
          error: 'Access denied for restricted product',
          code: 'PARTNER_REQUIRED',
        })
      }
    }

    // 3. Construire l'URL de checkout Shopify
    const encoded = Array.from(lineMap.entries())
      .map(([variantId, qty]) => {
        const numericId = variantId.split('/').pop()
        return numericId ? `${numericId}:${qty}` : null
      })
      .filter(Boolean)

    if (!encoded.length) {
      return res.status(400).json({ error: 'No valid Shopify variants' })
    }

    const baseUrl = SHOPIFY_STORE_URL.startsWith('http')
      ? SHOPIFY_STORE_URL
      : `https://${SHOPIFY_STORE_URL}`
    let checkoutUrl = `${baseUrl.replace(/\/+$/, '')}/cart/${encoded.join(',')}`

    // 4. Générer un code de réduction unique si tier ≥ 2
    if (tier) {
      try {
        const priceRuleId = await getOrCreatePriceRule(tier)
        const discountCode = await createOneTimeDiscountCode(priceRuleId, tier.index)
        if (discountCode) {
          checkoutUrl += `?discount=${encodeURIComponent(discountCode)}`
        }
      } catch (discountErr) {
        // Ne pas bloquer le checkout si la création du code échoue
        console.error('Discount code generation failed:', discountErr)
      }
    }

    return res.status(200).json({ checkoutUrl })
  } catch (error) {
    return res.status(500).json({
      error: 'Checkout failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
