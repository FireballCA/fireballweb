import { createClient } from '@supabase/supabase-js'
import { isPositiveInteger, isShopifyGid, parseJsonBody, rateLimit } from './_security.js'
import {
  buildShopifyCartPermalink,
  getShopifyStoreUrlFromEnv,
  resolveShopifyCheckoutBaseUrl,
} from './_shopifyCheckout.js'

const SHOPIFY_STORE_URL = getShopifyStoreUrlFromEnv()
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

  if (rateLimit(req, res, { key: 'shopify-secure-cart', windowMs: 60_000, max: 30 })) return

  if (!SHOPIFY_STORE_URL || !SHOPIFY_STOREFRONT_TOKEN) {
    return res.status(500).json({ error: 'Missing Shopify Storefront server configuration' })
  }

  const body = parseJsonBody(req)
  const linesRaw = Array.isArray(body.lines) ? body.lines : []
  if (linesRaw.length > 25) {
    return res.status(400).json({ error: 'Too many cart lines' })
  }

  const lineMap = new Map()
  for (const line of linesRaw) {
    const shopifyVariantId = String(line?.shopifyVariantId || '').trim()
    const quantity = Number(line?.quantity || 0)
    if (!isShopifyGid(shopifyVariantId, 'ProductVariant') || !isPositiveInteger(quantity, 99)) {
      return res.status(400).json({ error: 'Invalid cart line' })
    }
    lineMap.set(shopifyVariantId, (lineMap.get(shopifyVariantId) || 0) + quantity)
  }

  const lines = Array.from(lineMap.entries()).map(([shopifyVariantId, quantity]) => {
    if (!isPositiveInteger(quantity, 99)) {
      return { invalid: true }
    }
    return { shopifyVariantId, quantity }
  })

  if (lines.some((line) => line.invalid)) {
    return res.status(400).json({ error: 'Invalid cart quantity' })
  }

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

    const checkoutUrl = buildShopifyCartPermalink(encoded, {
      baseUrl: resolveShopifyCheckoutBaseUrl(SHOPIFY_STORE_URL),
    })
    return res.status(200).json({ checkoutUrl })
  } catch (error) {
    return res.status(500).json({
      error: 'Secure checkout validation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

