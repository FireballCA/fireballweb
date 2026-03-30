import { useMemo } from 'react'
import { Carousel, Card } from '@/components/ui/apple-cards-carousel'
import { SHOP_NAV_CATEGORY_IDS, type ShopNavCategoryId } from '@/data/products'
import { shopCategoryPath } from '@/constants/paths'

const LINEUP_IMAGES = [
  'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1520340351874-db919552aa6a?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1619400136518-355d8283a35f?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507131561656-3a6ace29fe0f?q=80&w=1200&auto=format&fit=crop',
] as const

/** Même ordre que le menu Shop : 8 catégories. */
const LINEUP_COPY: Record<ShopNavCategoryId, { label: string; headline: string }> = {
  coatings: { label: 'CERAMIC COATINGS', headline: 'Unmatched Protection' },
  sealants: { label: 'SEALANTS', headline: 'Enhanced Durability' },
  waxes: { label: 'WAXES', headline: 'Deep, Rich Shine' },
  dressings: { label: 'DRESSINGS', headline: 'Refined Finish' },
  washing: { label: 'WASHING', headline: 'Pure Clean Start' },
  cleaners: { label: 'CLEANERS', headline: 'Pure, Flawless Finish' },
  towels: { label: 'TOWELS', headline: 'Soft. Safe. Precise.' },
  accessories: { label: 'ACCESSORIES', headline: 'Precision Tools' },
}

export function ProductCategoryLineup() {
  const cards = useMemo(
    () =>
      SHOP_NAV_CATEGORY_IDS.map((id, i) => {
        const copy = LINEUP_COPY[id]
        return (
          <Card
            key={id}
            card={{
              category: copy.label,
              title: copy.headline,
              src: LINEUP_IMAGES[i % LINEUP_IMAGES.length] ?? LINEUP_IMAGES[0],
              to: shopCategoryPath(id),
            }}
          />
        )
      }),
    [],
  )

  return (
    <section
      id="product-lineup"
      className="scroll-mt-24 border-t border-carbon-800 bg-carbon-950 py-12 md:py-16"
      aria-labelledby="product-lineup-heading"
    >
      <div className="w-full py-6 md:py-10">
        <h2
          id="product-lineup-heading"
          className="mx-auto max-w-7xl pl-4 font-sans text-2xl font-bold tracking-tight text-pearl md:pl-6 md:text-5xl"
        >
          Our Product Lineup
        </h2>
        <Carousel items={cards} />
      </div>
    </section>
  )
}
