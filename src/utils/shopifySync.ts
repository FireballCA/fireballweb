/**
 * Crée un client Shopify en arrière-plan après l'inscription Supabase
 */
export async function createShopifyCustomer(data: {
  email: string
  first_name: string
  last_name: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/create-shopify-customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as {
        error?: string
        details?: unknown
      }
      let detailsMessage = ''

      if (Array.isArray(errorData.details)) {
        detailsMessage = errorData.details
          .map((d) => {
            if (d && typeof d === 'object' && 'message' in d) {
              return String((d as { message?: string }).message || '')
            }
            return ''
          })
          .filter(Boolean)
          .join(', ')
      } else if (typeof errorData.details === 'string') {
        detailsMessage = errorData.details
      } else if (errorData.details) {
        detailsMessage = JSON.stringify(errorData.details)
      }

      return {
        success: false,
        error: detailsMessage || errorData.error || `Failed to create Shopify customer (HTTP ${response.status})`,
      }
    }

    await response.json()
    return { success: true }
  } catch (error) {
    console.error('Error creating Shopify customer:', error)
    // Ne pas bloquer l'inscription si la création Shopify échoue
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
