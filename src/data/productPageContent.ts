import raw from '@/data/productPageContent.json'

export type ProductPageContent = {
  why?: string
  howToUseSteps?: string[]
}

type ContentMap = Record<string, ProductPageContent | undefined>

const CONTENT = raw as unknown as ContentMap

/** Afficher « Why [product]? » et « How to use » sur les pages produit publiques. */
export const SHOW_PRODUCT_WHY_AND_HOW_TO_ON_STOREFRONT = false

export function getProductPageContent(slug: string | undefined): ProductPageContent | null {
  if (slug && CONTENT[slug]) return CONTENT[slug] ?? null
  return CONTENT._default ?? null
}

