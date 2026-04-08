import { createClient } from '@supabase/supabase-js'

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL || process.env.VITE_SHOPIFY_STORE_URL || ''
const SHOPIFY_STOREFRONT_TOKEN =
  process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
  process.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
  ''
const SHOPIFY_STOREFRONT_API_VERSION =
  process.env.SHOPIFY_STOREFRONT_API_VERSION ||
  process.env.VITE_SHOPIFY_STOREFRONT_API_VERSION ||
  '2024-10'

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null

const PARTNER_ONLY_TAGS = new Set(['partner-only', 'installer-only', 'installer', 'partner'])

function parseBody(req) {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return req.body || {}
}

function getStorefrontEndpoint() {
  const normalizedStoreUrl = SHOPIFY_STORE_URL.startsWith('http')
    ? SHOPIFY_STORE_URL
    : `https://${SHOPIFY_STORE_URL}`
  return `${normalizedStoreUrl}/api/${SHOPIFY_STOREFRONT_API_VERSION}/graphql.json`
}

async function storefrontQuery(query, variables) {
  const response = await fetch(getStorefrontEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  })

  const json = await response.json().catch(() => null)
  if (!response.ok || !json || (Array.isArray(json.errors) && json.errors.length)) {
    throw new Error('Shopify Storefront request failed')
  }
  return json.data
}

async function isPartnerFromBearer(req) {
  if (!supabase) return false
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token) return false

  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  if (userError || !userData?.user?.id) return false

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role,partner_status')
    .eq('id', userData.user.id)
    .maybeSingle()
  if (profileError || !profile) return false

  const role = String(profile.role || '').toLowerCase()
  const partnerStatus = String(profile.partner_status || '').toLowerCase()
  return role === 'partner' || partnerStatus === 'partner'
}

async function resolveVariantPartnerOnly(variantId) {
  const query = `
    query VariantAccess($id: ID!) {
      node(id: $id) {
        ... on ProductVariant {
          id
          product {
            id
            handle
            tags
          }
        }
      }
    }
  `
  const data = await storefrontQuery(query, { id: variantId })
  const variant = data?.node
  const tags = Array.isArray(variant?.product?.tags) ? variant.product.tags : []
  const isRestricted = tags.some((t) => PARTNER_ONLY_TAGS.has(String(t).toLowerCase().trim()))
  return { isRestricted }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!SHOPIFY_STORE_URL || !SHOPIFY_STOREFRONT_TOKEN) {
    return res.status(500).json({ error: 'Missing Shopify Storefront server configuration' })
  }

  const body = parseBody(req)
  const linesRaw = Array.isArray(body.lines) ? body.lines : []
  const lines = linesRaw
    .map((line) => ({
      shopifyVariantId: String(line?.shopifyVariantId || ''),
      quantity: Number(line?.quantity || 0),
    }))
    .filter((line) => line.shopifyVariantId && Number.isFinite(line.quantity) && line.quantity > 0)

  if (!lines.length) {
    return res.status(400).json({ error: 'Cart is empty or invalid' })
  }

  try {
    const isPartner = await isPartnerFromBearer(req)

    // Validation serveur: chaque variante est vérifiée côté Shopify
    for (const line of lines) {
      const { isRestricted } = await resolveVariantPartnerOnly(line.shopifyVariantId)
      if (isRestricted && !isPartner) {
        return res.status(403).json({
          error: 'Access denied for restricted product',
          code: 'PARTNER_REQUIRED',
          redirectTo: '/join-fireball',
        })
      }
    }

    const encoded = lines
      .map((line) => {
        const numericId = line.shopifyVariantId.split('/').pop()
        if (!numericId) return null
        return `${numericId}:${line.quantity}`
      })
      .filter(Boolean)

    if (!encoded.length) {
      return res.status(400).json({ error: 'No valid Shopify variants in cart' })
    }

    const normalizedStoreUrl = SHOPIFY_STORE_URL.startsWith('http')
      ? SHOPIFY_STORE_URL
      : `https://${SHOPIFY_STORE_URL}`
    const checkoutUrl = `${normalizedStoreUrl.replace(/\/+$/, '')}/cart/${encoded.join(',')}`
    return res.status(200).json({ checkoutUrl })
  } catch (error) {
    return res.status(500).json({
      error: 'Secure checkout validation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

