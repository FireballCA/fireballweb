const rateLimitBuckets = globalThis.__fireballRateLimitBuckets || new Map()
globalThis.__fireballRateLimitBuckets = rateLimitBuckets

export function parseJsonBody(req) {
  if (!req?.body) return {}
  if (typeof req.body !== 'string') return req.body || {}
  try {
    const parsed = JSON.parse(req.body)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded
  return String(raw || req.socket?.remoteAddress || 'unknown')
    .split(',')[0]
    .trim()
}

export function rateLimit(req, res, options = {}) {
  const {
    key = 'global',
    windowMs = 60_000,
    max = 60,
  } = options
  const now = Date.now()
  const ip = getClientIp(req)
  const bucketKey = `${key}:${ip}`
  const current = rateLimitBuckets.get(bucketKey)

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(bucketKey, { count: 1, resetAt: now + windowMs })
    res.setHeader('X-RateLimit-Limit', String(max))
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - 1)))
    return false
  }

  current.count += 1
  const remaining = Math.max(0, max - current.count)
  res.setHeader('X-RateLimit-Limit', String(max))
  res.setHeader('X-RateLimit-Remaining', String(remaining))
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(current.resetAt / 1000)))

  if (current.count > max) {
    res.setHeader('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)))
    res.status(429).json({ error: 'Too many requests' })
    return true
  }

  return false
}

export function cleanInline(value, maxLength = 256) {
  return String(value || '')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

export function isValidEmail(value) {
  const email = String(value || '').trim()
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isShopifyGid(value, resource) {
  return new RegExp(`^gid://shopify/${resource}/\\d+$`).test(String(value || '').trim())
}

export function isPositiveInteger(value, max = Number.MAX_SAFE_INTEGER) {
  return Number.isInteger(value) && value > 0 && value <= max
}
