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

  if (!response.ok) {
    console.error('[Shopify] HTTP error:', response.status, response.statusText)
    throw new Error(`Shopify Storefront HTTP error: ${response.status}`)
  }

  if (Array.isArray(data.errors) && data.errors.length) {
    // Filtrer les erreurs liées aux metafields (non critiques)
    const criticalErrors = data.errors.filter((err: any) => {
      const message = err.message || ''
      return !message.toLowerCase().includes('metafield') && 
             !message.toLowerCase().includes('field "metafields"')
    })
    
    if (criticalErrors.length > 0) {
      console.error('[Shopify] GraphQL errors:', criticalErrors)
      throw new Error('Shopify Storefront request failed')
    }
    // Si seulement des erreurs de metafields, continuer sans les metafields
    console.warn('[Shopify] Metafields not available, continuing without them')
  }

  // S'assurer que data.data existe avant de le retourner
  if (!data.data) {
    throw new Error('Shopify Storefront returned no data')
  }

  return data.data as T
}

function resolveCategoryFromTags(tags: string[]): CategoryId {
  const lower = tags.map((t) => t.toLowerCase())
  
  // Protection Systems
  if (lower.some(t => t.includes('coating') || t.includes('coatings'))) return 'coatings'
  if (lower.some(t => t.includes('sealant') || t.includes('sealants'))) return 'sealants'
  if (lower.some(t => t.includes('wax') || t.includes('waxes'))) return 'waxes'
  if (lower.some(t => t.includes('dressing') || t.includes('dressings'))) return 'dressings'
  
  // Maintenance & Preparation
  if (lower.some(t => t.includes('wash') || t.includes('washing') || t.includes('shampoo'))) return 'washing'
  if (lower.some(t => t.includes('cleaner') || t.includes('cleaners') || t.includes('clean'))) return 'cleaners'
  if (lower.some(t => t.includes('towel') || t.includes('towels') || t.includes('microfiber'))) return 'towels'
  if (lower.some(t => t.includes('accessory') || t.includes('accessories') || t.includes('tool'))) return 'accessories'
  
  // Legacy categories
  if (lower.includes('pro')) return 'pro'
  if (lower.some(t => t.includes('revetements') || t.includes('revêtements'))) {
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
  metafields?: {
    edges?: {
      node?: {
        namespace?: string
        key?: string
        value?: string
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

  // Récupérer rating et reviewCount depuis les metafields
  const ratingMetafield = (node as any).metafields?.edges?.find(
    (e: any) => e.node?.namespace === 'custom' && e.node?.key === 'rating'
  )?.node?.value
  const reviewCountMetafield = (node as any).metafields?.edges?.find(
    (e: any) => e.node?.namespace === 'custom' && e.node?.key === 'review_count'
  )?.node?.value

  const rating = ratingMetafield ? Number.parseFloat(ratingMetafield) : undefined
  const reviewCount = reviewCountMetafield ? Number.parseInt(reviewCountMetafield, 10) : undefined

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
    rating: Number.isFinite(rating) ? rating : undefined,
    reviewCount: Number.isFinite(reviewCount) ? reviewCount : undefined,
  }
}

export async function fetchProductsFromShopify(): Promise<Product[]> {
  if (!hasShopifyConfig()) {
    console.warn('[Shopify] Storefront config missing.')
    return []
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
      const data = await shopifyFetch<{
        products: {
          pageInfo: { hasNextPage: boolean; endCursor: string | null }
          edges: { node: any }[]
        }
      }>(query, { first: pageSize, after: cursor })

      const edges = data.products?.edges || []
      allProducts.push(...edges.map((edge) => mapShopifyProductToLocal(edge.node)))

      hasNextPage = data.products?.pageInfo?.hasNextPage || false
      cursor = data.products?.pageInfo?.endCursor || null
    }

    return allProducts
  } catch (error) {
    console.error('[Shopify] Failed to load products:', error)
    return []
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
          metafields(first: 10) {
            edges {
              node {
                namespace
                key
                value
              }
            }
          }
        }
      }
    `

    const data = await shopifyFetch<{
      product: any | null
    }>(query, { handle: slug })

    if (!data || !data.product) {
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


