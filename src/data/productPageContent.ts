import raw from '@/data/productPageContent.json'

export type ProductPageContent = {
  why?: string
  howToUseSteps?: string[]
}

type ContentMap = Record<string, ProductPageContent | undefined>

const CONTENT = raw as unknown as ContentMap

export function getProductPageContent(slug: string | undefined): ProductPageContent | null {
  if (slug && CONTENT[slug]) return CONTENT[slug] ?? null
  return CONTENT._default ?? null
}

