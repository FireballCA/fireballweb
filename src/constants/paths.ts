/** URL canonique des fiches produit (anglais) */
export function productDetailPath(slug: string) {
  return `/products/${slug}`
}

/** Liste produits pour une catégorie (route App : `/:categoryId`, sans préfixe `/shop`) */
export function shopCategoryPath(categoryId: string) {
  return `/${categoryId}`
}

/**
 * Catalogue shop : catégorie **coatings** → `/coatings` (achat) ; sinon `/shop/:id`.
 * La page contenu coatings (liste, détails) est `/all-coatings`.
 */
export function shopBrowseCategoryPath(categoryId: string) {
  return categoryId === 'coatings' ? '/coatings' : `/shop/${categoryId}`
}
