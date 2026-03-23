/**
 * Valide un paramètre returnTo (chemin interne) pour limiter les redirections ouvertes.
 */
export function getSafeReturnToPath(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== 'string') return null
  let path = raw.trim()
  try {
    path = decodeURIComponent(path)
  } catch {
    return null
  }
  if (!path.startsWith('/') || path.startsWith('//')) return null
  if (/[\s\n\r]/.test(path)) return null
  if (path.includes('://') || path.includes('@')) return null

  const pathOnly = path.split('?')[0].split('#')[0]

  if (pathOnly === '/account/company' || pathOnly === '/contact') return pathOnly
  if (pathOnly === '/boutique') return pathOnly
  if (/^\/boutique\/[a-zA-Z0-9_-]+$/.test(pathOnly)) return pathOnly
  if (/^\/product\/[a-zA-Z0-9\-_%]+$/.test(pathOnly)) return pathOnly
  if (/^\/produit\/[a-zA-Z0-9\-_%]+$/.test(pathOnly))
    return pathOnly.replace(/^\/produit\//, '/product/')

  return null
}
