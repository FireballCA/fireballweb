/** URL canonique des fiches produit (anglais) */
export function productDetailPath(slug: string) {
  return `/product/${slug}`
}

/** Liste produits pour une catégorie (route App : `/:categoryId`, sans préfixe `/boutique`) */
export function shopCategoryPath(categoryId: string) {
  return `/${categoryId}`
}
