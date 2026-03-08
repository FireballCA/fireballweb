/**
 * Crée un client Shopify en arrière-plan après l'inscription Supabase
 */
export async function createShopifyCustomer(data: {
  email: string
  password: string
  first_name: string
  last_name: string
}): Promise<{ success: boolean; error?: string; shopifyCustomerId?: string }> {
  try {
    const response = await fetch('/api/create-shopify-customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const fallbackText = await response.clone().text().catch(() => '')
      const errorData = await response.json().catch(() => ({ error: fallbackText || 'Unknown error' })) as {
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
        error:
          detailsMessage ||
          errorData.error ||
          `Failed to create Shopify customer (HTTP ${response.status})`,
      }
    }

    const body = (await response.json()) as {
      success?: boolean
      customer?: { id?: string; email?: string; firstName?: string; lastName?: string }
    }
    const shopifyCustomerId =
      body?.customer?.id && typeof body.customer.id === 'string' ? body.customer.id : undefined
    return { success: true, shopifyCustomerId }
  } catch (error) {
    console.error('Error creating Shopify customer:', error)
    // Ne pas bloquer l'inscription si la création Shopify échoue
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Met à jour un client Shopify existant (nom, etc.) à partir des paramètres du compte.
 */
export async function updateShopifyCustomer(data: {
  email: string
  first_name?: string
  last_name?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/update-shopify-customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const fallbackText = await response.clone().text().catch(() => '')
      const errorData = await response.json().catch(() => ({ error: fallbackText || 'Unknown error' })) as {
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
        error:
          detailsMessage ||
          errorData.error ||
          `Failed to update Shopify customer (HTTP ${response.status})`,
      }
    }

    const body = await response.json().catch(() => ({})) as { success?: boolean; error?: string }
    if (body && body.success === false && body.error) {
      return { success: false, error: body.error }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating Shopify customer:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
