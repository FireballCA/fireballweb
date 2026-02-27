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
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      return { success: false, error: errorData.error || 'Failed to create Shopify customer' }
    }

    const result = await response.json()
    return { success: true }
  } catch (error) {
    console.error('Error creating Shopify customer:', error)
    // Ne pas bloquer l'inscription si la création Shopify échoue
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
