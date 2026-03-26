type CacheEnvelope<T> = {
  v: T
  e: number
}

function toCookieKey(key: string) {
  return `fb_cache_${encodeURIComponent(key)}`
}

function safeNow() {
  return Date.now()
}

export function setClientCache<T>(key: string, value: T, ttlMs: number): void {
  if (typeof window === 'undefined') return
  try {
    const expiresAt = safeNow() + Math.max(1, ttlMs)
    const payload: CacheEnvelope<T> = { v: value, e: expiresAt }
    window.localStorage.setItem(key, JSON.stringify(payload))
    // Cookie marker (lightweight) so cache intent is also persisted as requested.
    const maxAge = Math.floor(ttlMs / 1000)
    document.cookie = `${toCookieKey(key)}=1; path=/; max-age=${maxAge}; SameSite=Lax`
  } catch {
    // Ignore cache failures (quota/private mode)
  }
}

export function getClientCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEnvelope<T>
    if (!parsed || typeof parsed !== 'object') return null
    if (typeof parsed.e !== 'number' || parsed.e <= safeNow()) {
      window.localStorage.removeItem(key)
      return null
    }
    return parsed.v as T
  } catch {
    return null
  }
}

export function clearClientCache(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
    document.cookie = `${toCookieKey(key)}=; path=/; max-age=0; SameSite=Lax`
  } catch {
    // Ignore
  }
}

