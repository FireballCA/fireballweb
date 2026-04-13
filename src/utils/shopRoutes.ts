import { CATEGORIES } from '@/data/products'

/** Aligné sur Shop.tsx — segments racine qui ne sont pas une catégorie boutique */
const NON_CATEGORY_ROUTE_SEGMENTS = new Set([
  'about',
  'car-club',
  'contact',
  'legal',
  'academy',
  'event',
  'join-fireball',
  'join-club',
  'account',
  'partner',
  'dashboard',
  'shop',
  'products',
  'all-coatings',
])

/** Pages liste produits / shop (/shop, /shop/:cat, /coatings seul, /:categoryId) */
export function isShopPathname(pathname: string): boolean {
  if (pathname.startsWith('/shop')) return true
  if (pathname === '/coatings') return true
  const seg = pathname.split('/').filter(Boolean)[0]
  if (!seg) return false
  if (NON_CATEGORY_ROUTE_SEGMENTS.has(seg)) return false
  /** /coatings/compare, /coatings/how-it-works, etc. — contenu, pas le catalogue */
  if (seg === 'coatings') return false
  return CATEGORIES.some((c) => c.id === seg)
}
