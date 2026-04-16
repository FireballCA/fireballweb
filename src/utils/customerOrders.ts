import { supabase } from '@/lib/supabase'

export interface OrderLineItem {
  title: string
  price: number
  quantity: number
  imageUrl?: string
}

export interface CustomerOrder {
  id: string
  shopifyOrderId?: string
  name: string
  date?: string
  description?: string
  imageUrl?: string
  orderNumber?: string
  totalPrice?: number
  currency?: string
  lineItems?: OrderLineItem[]
  pointsEarned?: number
}

export function formatOrderRef(orderNumber?: string | null): string {
  if (!orderNumber) return '-'
  const raw = String(orderNumber).trim()
  if (raw.startsWith('#')) {
    return raw
  }
  const digits = raw.replace(/\D+/g, '')
  return digits ? `#${digits.padStart(5, '0')}` : raw
}

function getImageFromPurchaseRow(purchase: Record<string, unknown>): string | null {
  const direct =
    (purchase?.image_url as string | undefined) ||
    (purchase?.product_image_url as string | undefined) ||
    (purchase?.first_product_image_url as string | undefined) ||
    (purchase?.first_item_image_url as string | undefined) ||
    (purchase?.featured_image as string | undefined) ||
    null

  if (typeof direct === 'string' && direct.trim()) return direct.trim()

  const lineItemsRaw =
    purchase?.line_items || purchase?.items || purchase?.products || null
  if (lineItemsRaw) {
    try {
      const parsed = typeof lineItemsRaw === 'string' ? JSON.parse(lineItemsRaw) : lineItemsRaw
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0] as Record<string, unknown>
        const fromItem =
          (first?.image_url as string) ||
          (first?.product_image_url as string) ||
          (first?.image as string) ||
          (first?.featured_image as string) ||
          ((first?.image as { src?: string })?.src as string | undefined) ||
          ((first?.featured_image as { src?: string })?.src as string | undefined) ||
          null
        if (typeof fromItem === 'string' && fromItem.trim()) return fromItem.trim()
      }
    } catch {
      // ignore
    }
  }

  return null
}

function getFirstPurchaseItemFromPayload(payload: unknown): Record<string, unknown> | null {
  if (!payload) return null

  if (Array.isArray(payload)) {
    const firstObject = payload.find((item) => item && typeof item === 'object')
    return (firstObject as Record<string, unknown>) || null
  }

  if (typeof payload !== 'object') return null

  const lineItems =
    (payload as Record<string, unknown>).line_items ||
    (payload as Record<string, unknown>).items ||
    (payload as Record<string, unknown>).products ||
    null

  if (Array.isArray(lineItems) && lineItems.length > 0) {
    const firstObject = lineItems.find((item) => item && typeof item === 'object')
    if (firstObject) return firstObject as Record<string, unknown>
  }

  return null
}

function getTitleFromPurchaseRow(purchase: Record<string, unknown>): string | null {
  const directTitle =
    (purchase?.product_title as string) ||
    (purchase?.first_product_title as string) ||
    (purchase?.title as string) ||
    (purchase?.name as string) ||
    null

  if (typeof directTitle === 'string' && directTitle.trim()) return directTitle.trim()

  const payloadCandidates = [
    purchase?.line_items,
    purchase?.items,
    purchase?.products,
    purchase?.raw_payload,
    purchase?.payload,
    purchase?.shopify_payload,
    purchase?.order_payload,
    purchase?.metadata,
    purchase?.raw_order,
  ]

  for (const candidate of payloadCandidates) {
    if (!candidate) continue
    let parsed: unknown = candidate
    if (typeof candidate === 'string') {
      try {
        parsed = JSON.parse(candidate)
      } catch {
        continue
      }
    }
    const firstItem = getFirstPurchaseItemFromPayload(parsed)
    if (!firstItem) continue
    const title = firstItem?.product_title || firstItem?.title || firstItem?.name || null
    if (typeof title === 'string' && title.trim()) return title.trim()
  }

  return null
}

function getLineItemsFromPurchase(purchase: Record<string, unknown>): OrderLineItem[] {
  const lineItemsRaw =
    purchase?.line_items ||
    purchase?.items ||
    purchase?.products ||
    (purchase?.raw_payload &&
      (() => {
        try {
          const p =
            typeof purchase.raw_payload === 'string' ? JSON.parse(purchase.raw_payload as string) : purchase.raw_payload
          return (p as Record<string, unknown>)?.line_items || (p as Record<string, unknown>)?.items || (p as Record<string, unknown>)?.products || null
        } catch {
          return null
        }
      })()) ||
    null

  if (!lineItemsRaw) return []

  try {
    const parsed = typeof lineItemsRaw === 'string' ? JSON.parse(lineItemsRaw) : lineItemsRaw
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((item: unknown) => item && typeof item === 'object')
      .map((item: Record<string, unknown>) => {
        const price =
          typeof item?.price === 'number'
            ? item.price
            : Number.parseFloat(String(item?.price ?? item?.original_unit_price ?? 0)) || 0
        const qty = Math.max(1, Number(item?.quantity) || 1)
        const img =
          item?.image_url ||
          item?.product_image_url ||
          (item?.image as { src?: string })?.src ||
          (item?.featured_image as { src?: string })?.src ||
          item?.image ||
          item?.featured_image ||
          null
        return {
          title:
            typeof (item?.product_title ?? item?.title ?? item?.name) === 'string'
              ? String(item.product_title ?? item.title ?? item.name).trim()
              : 'Product',
          price,
          quantity: qty,
          imageUrl: typeof img === 'string' && img.trim() ? img.trim() : undefined,
        }
      })
  } catch {
    return []
  }
}

/**
 * Loads Shopify-linked purchases for the signed-in user (same source as dashboard Orders).
 */
export async function fetchCustomerOrders(): Promise<CustomerOrder[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const userId = user?.id
  if (!userId) return []

  const { data: purchases, error: purchasesError } = await supabase
    .from('purchases')
    .select('*')
    .eq('user_id', userId)
    .order('placed_at', { ascending: false })

  if (purchasesError) {
    console.warn('fetchCustomerOrders:', purchasesError.message)
    return []
  }

  const mappedOrders: CustomerOrder[] = (purchases || []).map((purchase: Record<string, unknown>) => {
    const placedAt = purchase?.placed_at ? new Date(purchase.placed_at as string) : null
    const formattedDate =
      placedAt && !Number.isNaN(placedAt.getTime())
        ? placedAt.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
        : undefined
    const extractedProductTitle = getTitleFromPurchaseRow(purchase)

    const purchaseImage = getImageFromPurchaseRow(purchase)

    const lineItems = getLineItemsFromPurchase(purchase)
    const pointsEarned =
      typeof purchase?.points_earned === 'number'
        ? purchase.points_earned
        : typeof purchase?.xp_earned === 'number'
          ? purchase.xp_earned
          : undefined

    return {
      id: String(purchase.id),
      shopifyOrderId: purchase?.shopify_order_id ? String(purchase.shopify_order_id) : undefined,
      orderNumber: purchase?.order_number ? String(purchase.order_number) : undefined,
      name: extractedProductTitle || (purchase?.order_number ? String(purchase.order_number) : 'Order'),
      date: formattedDate,
      description: 'Product ordered via Fireball store.',
      imageUrl: purchaseImage || '',
      totalPrice:
        typeof purchase?.total_price === 'number'
          ? purchase.total_price
          : Number.parseFloat(String(purchase?.total_price ?? '0')) || 0,
      currency: purchase?.currency ? String(purchase.currency).toUpperCase() : 'CAD',
      lineItems: lineItems.length > 0 ? lineItems : undefined,
      pointsEarned,
    }
  })

  const shopifyOrderIds = mappedOrders.map((order) => order.shopifyOrderId).filter((id): id is string => Boolean(id))

  if (shopifyOrderIds.length === 0) {
    return mappedOrders
  }

  try {
    const previewResponse = await fetch('/api/shopify-order-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderIds: shopifyOrderIds }),
    })
    const previewJson = await previewResponse.json().catch(() => null)
    const previews =
      (previewJson && typeof previewJson === 'object' ? (previewJson as { previews?: Record<string, unknown> }).previews : {}) || {}

    return mappedOrders.map((order) => {
      const preview = order.shopifyOrderId ? (previews[order.shopifyOrderId] as { productTitle?: string; imageUrl?: string; currency?: string } | undefined) : null
      if (!preview) {
        return { ...order, imageUrl: order.imageUrl || '' }
      }
      return {
        ...order,
        name: preview.productTitle || order.name,
        imageUrl: preview.imageUrl || order.imageUrl || '',
        currency: preview.currency || order.currency,
      }
    })
  } catch {
    return mappedOrders
  }
}
