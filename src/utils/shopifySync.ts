import { getAuthHeaders } from '@/utils/authHeaders'

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
        ...(await getAuthHeaders()),
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
 * Génère un mot de passe aléatoire (pour création client Shopify sans mot de passe utilisateur, ex. OAuth).
 */
function generateRandomPassword(): string {
  const arr = new Uint8Array(32)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr)
  } else {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Crée un client Shopify pour un utilisateur qui n'en a pas (ex. connexion OAuth).
 * Utilise un mot de passe aléatoire (non stocké). À appeler après chargement du profil.
 */
export async function ensureShopifyCustomerForProfile(profile: {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
}): Promise<{ success: boolean; error?: string; shopifyCustomerId?: string }> {
  if (!profile?.email?.trim()) {
    return { success: false, error: 'Email required' }
  }
  const result = await createShopifyCustomer({
    email: profile.email.trim(),
    password: generateRandomPassword(),
    first_name: (profile.first_name ?? '').trim() || 'Member',
    last_name: (profile.last_name ?? '').trim() || '',
  })
  return result
}

/**
 * Envoie l’email d’invitation Shopify pour que le client puisse définir son mot de passe boutique.
 * À appeler après avoir défini le mot de passe Supabase (ex. utilisateur Google qui set un mdp).
 */
export async function sendShopifyCustomerInvite(shopifyCustomerId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const response = await fetch('/api/send-shopify-customer-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify({ shopifyCustomerId }),
    })
    if (!response.ok) {
      const err = (await response.json().catch(() => ({}))) as { error?: string }
      return { success: false, error: err.error || `HTTP ${response.status}` }
    }
    return { success: true }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error',
    }
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
        ...(await getAuthHeaders()),
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
