import { PRODUCTS, type Product, type CategoryId, getProductBySlug } from '@/data/products'

const SHOPIFY_STORE_URL =
  (import.meta.env.VITE_SHOPIFY_STORE_URL as string | undefined) || 'fireball-canada.myshopify.com'
const SHOPIFY_STOREFRONT_TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN as
  | string
  | undefined

const SHOPIFY_API_VERSION =
  (import.meta.env.VITE_SHOPIFY_STOREFRONT_API_VERSION as string | undefined) || '2024-10'

function hasShopifyConfig(): boolean {
  return Boolean(SHOPIFY_STOREFRONT_TOKEN && SHOPIFY_STORE_URL)
}

async function shopifyFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!hasShopifyConfig()) {
    throw new Error('Missing Shopify Storefront configuration')
  }

  const normalizedStoreUrl = SHOPIFY_STORE_URL.startsWith('http')
    ? SHOPIFY_STORE_URL
    : `https://${SHOPIFY_STORE_URL}`

  const response = await fetch(`${normalizedStoreUrl}/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN as string,
    },
    body: JSON.stringify({ query, variables }),
  })

  const data = (await response.json()) as { data?: unknown; errors?: unknown }

  if (!response.ok || (Array.isArray(data.errors) && data.errors.length)) {
    throw new Error('Shopify Storefront request failed')
  }

  return data.data as T
}

function resolveCategoryFromTags(tags: string[]): CategoryId {
  const lower = tags.map((t) => t.toLowerCase())
  if (lower.includes('pro')) return 'pro'
  if (lower.includes('revetements') || lower.includes('revêtements') || lower.includes('coating')) {
    return 'revetements'
  }
  return 'classique'
}

function mapShopifyProductToLocal(node: {
  id: string
  handle: string
  title: string
  description: string
  tags: string[]
  featuredImage?: { url: string; altText?: string | null } | null
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } }
}): Product {
  const category = resolveCategoryFromTags(node.tags)
  const image =
    node.featuredImage?.url ||
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&auto=format&fit=crop'

  const rawDescription = node.description || ''
  const shortDesc =
    rawDescription.split('\n').find((line) => line.trim().length > 0)?.trim() ||
    'Premium detailing product by Fireball Canada.'

  const price = Number.parseFloat(node.priceRange.minVariantPrice.amount)

  return {
    id: node.id,
    name: node.title,
    slug: node.handle,
    category,
    shortDesc,
    description: rawDescription || shortDesc,
    price: Number.isFinite(price) ? price : 0,
    image,
  }
}

export async function fetchProductsFromShopify(): Promise<Product[]> {
  if (!hasShopifyConfig()) {
    console.warn('[Shopify] Storefront config missing, using static PRODUCTS.')
    return PRODUCTS
  }

  try {
    const query = `
      query FireballProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              handle
              title
              description
              tags
              featuredImage {
                url
                altText
              }
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    `

    const data = await shopifyFetch<{
      products: { edges: { node: any }[] }
    }>(query, { first: 60 })

    const edges = data.products?.edges || []
    if (!edges.length) {
      return PRODUCTS
    }

    return edges.map((edge) => mapShopifyProductToLocal(edge.node))
  } catch (error) {
    console.error('[Shopify] Failed to load products, falling back to static data:', error)
    return PRODUCTS
  }
}

export async function fetchProductFromShopifyBySlug(slug: string): Promise<Product | null> {
  if (!slug) return null

  if (!hasShopifyConfig()) {
    const local = getProductBySlug(slug)
    return local ?? null
  }

  try {
    const query = `
      query FireballProductByHandle($handle: String!) {
        product(handle: $handle) {
          id
          handle
          title
          description
          tags
          featuredImage {
            url
            altText
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    `

    const data = await shopifyFetch<{
      product: any | null
    }>(query, { handle: slug })

    if (!data.product) {
      const fallback = getProductBySlug(slug)
      return fallback ?? null
    }

    return mapShopifyProductToLocal(data.product)
  } catch (error) {
    console.error('[Shopify] Failed to load product by slug, using static data:', error)
    const fallback = getProductBySlug(slug)
    return fallback ?? null
  }
}

