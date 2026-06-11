const MYSHOPIFY_ORIGIN = 'https://fireball-canada.myshopify.com'
const REDIRECT_STATE_KEY = 'fb-checkout-redirect-state'
const MAX_REDIRECT_ATTEMPTS = 2
const REDIRECT_WINDOW_MS = 45_000

const MARKETING_HOSTS = new Set([
  'fireball-canada.com',
  'www.fireball-canada.com',
  'localhost',
  '127.0.0.1',
])

function readRedirectState(): { count: number; at: number } {
  try {
    const raw = sessionStorage.getItem(REDIRECT_STATE_KEY)
    if (!raw) return { count: 0, at: 0 }
    const parsed = JSON.parse(raw) as { count?: number; at?: number }
    return {
      count: typeof parsed.count === 'number' ? parsed.count : 0,
      at: typeof parsed.at === 'number' ? parsed.at : 0,
    }
  } catch {
    return { count: 0, at: 0 }
  }
}

function writeRedirectState(count: number) {
  sessionStorage.setItem(REDIRECT_STATE_KEY, JSON.stringify({ count, at: Date.now() }))
}

export function clearCheckoutRedirectState() {
  sessionStorage.removeItem(REDIRECT_STATE_KEY)
}

export function isShopifyCheckoutSessionPath(pathname: string): boolean {
  return pathname.startsWith('/cart/c/')
}

export function isMarketingCheckoutHost(hostname: string): boolean {
  return MARKETING_HOSTS.has(hostname.toLowerCase())
}

export function buildMyshopifyCheckoutUrl(pathname: string, search: string): string {
  return `${MYSHOPIFY_ORIGIN}${pathname}${search}`
}

/**
 * Sur le site Vercel, /cart/c/* tombe sur le SPA → 404.
 * On renvoie vers myshopify.com avant React si possible.
 * Retourne true si une redirection navigateur est en cours (ne pas monter React).
 */
export function attemptMarketingCheckoutRedirect(): boolean {
  if (typeof window === 'undefined') return false

  const { pathname, search, hostname } = window.location
  if (!isShopifyCheckoutSessionPath(pathname) || !isMarketingCheckoutHost(hostname)) {
    return false
  }

  const state = readRedirectState()
  const elapsed = Date.now() - state.at
  const count = elapsed > REDIRECT_WINDOW_MS ? 0 : state.count

  if (count >= MAX_REDIRECT_ATTEMPTS) {
    return false
  }

  writeRedirectState(count + 1)
  window.location.replace(buildMyshopifyCheckoutUrl(pathname, search))
  return true
}

export function hasCheckoutRedirectLoop(): boolean {
  const state = readRedirectState()
  if (Date.now() - state.at > REDIRECT_WINDOW_MS) return false
  return state.count >= MAX_REDIRECT_ATTEMPTS
}
