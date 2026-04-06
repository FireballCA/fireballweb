/** URL canonique des fiches produit (anglais) */
export function productDetailPath(slug: string) {
  return `/product/${slug}`
}

/** Liste produits pour une catégorie (route App : `/:categoryId`, sans préfixe `/boutique`) */
export function shopCategoryPath(categoryId: string) {
  return `/${categoryId}`
}

/**
 * Catalogue boutique : catégorie **coatings** → `/coatings` (achat) ; sinon `/boutique/:id`.
 * La page contenu coatings (liste, détails) est `/all-coatings`.
 */
export function shopBrowseCategoryPath(categoryId: string) {
  return categoryId === 'coatings' ? '/coatings' : `/boutique/${categoryId}`
}
