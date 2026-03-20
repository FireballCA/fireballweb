import { PRODUCTS, type Product, type ProductVariant, type CategoryId, getProductBySlug } from '@/data/products'

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

function getNormalizedStoreUrl(): string {
  return SHOPIFY_STORE_URL.startsWith('http') ? SHOPIFY_STORE_URL : `https://${SHOPIFY_STORE_URL}`
}

async function shopifyFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!hasShopifyConfig()) {
    throw new Error('Missing Shopify Storefront configuration')
  }

  const normalizedStoreUrl = getNormalizedStoreUrl()

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
  const lower = tags.map((t) => t.toLowerCase().trim())
  
  // Protection Systems
  if (lower.some(t => t.includes('coating') || t.includes('coatings'))) return 'coatings'
  if (lower.some(t => t.includes('sealant') || t.includes('sealants'))) return 'sealants'
  if (lower.some(t => t.includes('wax') || t.includes('waxes'))) return 'waxes'
  if (lower.some(t => t.includes('dressing') || t.includes('dressings'))) return 'dressings'
  
  // Maintenance & Preparation
  if (lower.some(t => t.includes('washing') || t.includes('wash'))) return 'washing'
  if (lower.some(t => t.includes('cleaner') || t.includes('cleaners'))) return 'cleaners'
  if (lower.some(t => t.includes('towel') || t.includes('towels'))) return 'towels'
  if (lower.some(t => t.includes('accessory') || t.includes('accessories'))) return 'accessories'
  
  // Legacy categories (for backward compatibility)
  if (lower.some(t => t.includes('pro'))) return 'pro'
  if (lower.some(t => t.includes('revetements') || t.includes('revêtements'))) return 'revetements'
  if (lower.some(t => t.includes('classique'))) return 'classique'
  
  // Default fallback
  return 'classique'
}

function mapShopifyProductToLocal(node: {
  id: string
  handle: string
  title: string
  description: string
  tags: string[]
  featuredImage?: { url: string; altText?: string | null } | null
  images?: { edges: { node: { url: string; altText?: string | null } }[] }
  priceRange?: { minVariantPrice?: { amount?: string; currencyCode?: string } }
  variants?: {
    edges: {
      node: {
        id: string
        title: string
        price?: { amount?: string; currencyCode?: string }
        availableForSale?: boolean
        selectedOptions?: { name: string; value: string }[]
        image?: { url: string } | null
      }
    }[]
  }
  options?: { name: string; values: string[] }[]
  media?: {
    edges: {
      node: {
        mediaContentType: string
        sources?: { url: string; mimeType: string }[]
      }
    }[]
  }
}): Product {
  const category = resolveCategoryFromTags(node.tags)
  const featuredImageUrl =
    node.featuredImage?.url ||
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&auto=format&fit=crop'

  // Récupérer toutes les images
  const allImages: string[] = []
  if (node.featuredImage?.url) {
    allImages.push(node.featuredImage.url)
  }
  if (node.images?.edges) {
    node.images.edges.forEach((edge) => {
      if (edge.node.url && !allImages.includes(edge.node.url)) {
        allImages.push(edge.node.url)
      }
    })
  }
  if (allImages.length === 0) {
    allImages.push(featuredImageUrl)
  }

  const rawDescription = node.description || ''
  const shortDesc =
    rawDescription.split('\n').find((line) => line.trim().length > 0)?.trim() ||
    'Premium detailing product by Fireball Canada.'

  // Récupérer les tags Shopify
  const tags = Array.isArray(node.tags) ? node.tags : []
  // Vérifier si le produit est réservé aux partenaires (tag: "partner-only", "installer-only", "installer", "partner")
  const partnerOnlyTags = ['partner-only', 'installer-only', 'installer', 'partner']
  const partnerOnly = tags.some(tag => 
    partnerOnlyTags.includes(tag.toLowerCase().trim())
  )

  // Vérifier que priceRange existe avant d'accéder à amount
  const minPriceAmount = node.priceRange?.minVariantPrice?.amount || '0'
  const price = Number.parseFloat(minPriceAmount)
  const firstVariantId = node.variants?.edges?.[0]?.node?.id

  // Mapper les variantes
  const variants: ProductVariant[] =
    node.variants?.edges
      .map((edge) => {
        // Vérifier que price existe avant d'accéder à amount
        const variantPriceAmount = edge.node.price?.amount
        const fallbackPriceAmount = node.priceRange?.minVariantPrice?.amount || minPriceAmount
        
        const variantPrice = variantPriceAmount 
          ? Number.parseFloat(variantPriceAmount)
          : Number.parseFloat(fallbackPriceAmount)
        
        return {
          id: edge.node.id,
          title: edge.node.title,
          price: Number.isFinite(variantPrice) ? variantPrice : price,
          availableForSale: edge.node.availableForSale ?? true,
          selectedOptions: edge.node.selectedOptions || [],
          image: edge.node.image?.url,
        }
      })
      .filter((v) => v.price > 0) || []

  // Récupérer la vidéo si disponible
  let videoUrl: string | undefined
  if (node.media?.edges) {
    const videoMedia = node.media.edges.find(
      (edge) => edge.node.mediaContentType === 'VIDEO'
    )
    if (videoMedia?.node.sources?.[0]?.url) {
      videoUrl = videoMedia.node.sources[0].url
    }
  }

  return {
    id: node.id,
    name: node.title,
    slug: node.handle,
    category,
    shortDesc,
    description: rawDescription || shortDesc,
    price: Number.isFinite(price) ? price : 0,
    image: allImages[0],
    images: allImages.length > 1 ? allImages : undefined,
    shopifyProductId: node.id,
    shopifyVariantId: firstVariantId,
    variants: variants.length > 0 ? variants : undefined,
    options: node.options?.filter((opt) => opt.values.length > 1),
    video: videoUrl,
    tags: tags.length > 0 ? tags : undefined,
    partnerOnly: partnerOnly || undefined,
  }
}

export async function fetchProductsFromShopify(): Promise<Product[]> {
  if (!hasShopifyConfig()) {
    console.warn('[Shopify] Storefront config missing, using static PRODUCTS.')
    return PRODUCTS
  }

  try {
    const query = `
      query FireballProducts($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
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
              variants(first: 1) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          }
        }
      }
    `

    const allProducts: Product[] = []
    let hasNextPage = true
    let cursor: string | null = null
    const pageSize = 250 // Maximum par page dans Shopify

    while (hasNextPage) {
      try {
    const data = await shopifyFetch<{
          products: {
            pageInfo: { hasNextPage: boolean; endCursor: string | null }
            edges: { node: any }[]
          }
        }>(query, { first: pageSize, after: cursor })

        // Vérifier que data.products existe
        if (!data || !data.products) {
          console.error('[Shopify] Invalid response structure')
          break
        }

    const edges = data.products?.edges || []
        if (edges.length > 0) {
          const mappedProducts = edges.map((edge) => {
            try {
              return mapShopifyProductToLocal(edge.node)
            } catch (err) {
              console.error('[Shopify] Error mapping product:', err, edge.node)
              return null
            }
          }).filter((p): p is Product => p !== null)
          
          allProducts.push(...mappedProducts)
        }

        hasNextPage = data.products?.pageInfo?.hasNextPage || false
        cursor = data.products?.pageInfo?.endCursor || null
      } catch (pageError) {
        console.error('[Shopify] Error loading page:', pageError)
        // Si on a déjà des produits, retourner ce qu'on a
        if (allProducts.length > 0) {
          console.warn(`[Shopify] Returning ${allProducts.length} products loaded before error`)
          return allProducts
        }
        // Sinon, propager l'erreur
        throw pageError
      }
    }

    console.log(`[Shopify] Loaded ${allProducts.length} products total`)
    return allProducts
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
          images(first: 10) {
            edges {
              node {
                url
                altText
              }
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          options {
            name
            values
          }
          variants(first: 50) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
                selectedOptions {
                  name
                  value
                }
                image {
                  url
                }
              }
            }
          }
          media(first: 5) {
            edges {
              node {
                mediaContentType
                ... on Video {
                  sources {
                    url
                    mimeType
                  }
                }
              }
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

/**
 * Construit l'URL de checkout Shopify (cart permalink) à partir des produits du panier.
 * Nécessite que les produits aient un shopifyVariantId (gid) pour fonctionner.
 */
export function buildShopifyCartUrl(lines: { shopifyVariantId?: string; quantity: number }[]): string | null {
  if (!hasShopifyConfig()) return null

  const usable = lines
    .filter((line) => line.shopifyVariantId && line.quantity > 0)
    .map((line) => {
      const gid = line.shopifyVariantId as string
      const numericId = gid.split('/').pop()
      if (!numericId) return null
      return `${numericId}:${line.quantity}`
    })
    .filter(Boolean) as string[]

  if (!usable.length) return null

  const base = getNormalizedStoreUrl()
  return `${base.replace(/\/+$/, '')}/cart/${usable.join(',')}`
}


