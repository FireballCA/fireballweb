export type VehicleSize = 'Compact' | 'Medium' | 'Large' | 'Exotic'
export type PaintCondition = 'Like New' | 'Light Imperfections' | 'Moderate Defects' | 'Heavy Defects'

export const VEHICLE_SIZES: Array<{ id: VehicleSize; label: string; basePrice: number }> = [
  { id: 'Compact', label: 'Compact', basePrice: 199 },
  { id: 'Medium', label: 'Medium Size / VUS', basePrice: 249 },
  { id: 'Large', label: 'Pick-up / Large VUS', basePrice: 299 },
  { id: 'Exotic', label: 'Exotics', basePrice: 399 },
]

export const PAINT_CORRECTION_PRICES: Record<VehicleSize, Record<PaintCondition, number>> = {
  Compact: { 'Like New': 499, 'Light Imperfections': 699, 'Moderate Defects': 999, 'Heavy Defects': 1299 },
  Medium:  { 'Like New': 599, 'Light Imperfections': 799, 'Moderate Defects': 1099, 'Heavy Defects': 1499 },
  Large:   { 'Like New': 699, 'Light Imperfections': 899, 'Moderate Defects': 1199, 'Heavy Defects': 1699 },
  Exotic:  { 'Like New': 899, 'Light Imperfections': 1199, 'Moderate Defects': 1499, 'Heavy Defects': 1999 },
}

export const PAINT_CONDITIONS: Array<{
  id: PaintCondition
  title: string
  description: string
  image: string
}> = [
  {
    id: 'Like New',
    title: 'Like New',
    description: 'No visible defects. Paint is in excellent condition.',
    image: '/servicebuilder/New.png',
  },
  {
    id: 'Light Imperfections',
    title: 'Light Imperfections',
    description: 'Minor swirl marks or light surface scratches.',
    image: '/servicebuilder/Light.png',
  },
  {
    id: 'Moderate Defects',
    title: 'Moderate Defects',
    description: 'Visible scratches, swirls, and dullness.',
    image: '/servicebuilder/Moderate.png',
  },
  {
    id: 'Heavy Defects',
    title: 'Heavy Defects',
    description: 'Deep scratches, oxidation, or heavily damaged paint.',
    image: '/servicebuilder/Heavy.png',
  },
]

export const WAX_PRICE = 299

export const WHEEL_EXTRA_PRICES = { wax: 299, coating: 400 }

export const TALON_WHEEL_COATING = {
  name: 'Talon',
  image: '/servicebuilder/Talon.png',
  gauges: { hardness: 72, gloss: 80, resistance: 95, hydrophobicity: 92 },
}

export const WAX_OPTIONS: Array<{
  id: string
  name: string
  image: string
  ratings: {
    hydrophobicity: number
    slickness: number
    gloss: number
    application: number
  }
}> = [
  {
    id: 'brazil-wax',
    name: 'Brazil Wax',
    image: '/servicebuilder/Wax_Graphene.webp',
    ratings: { hydrophobicity: 5, slickness: 3, gloss: 5, application: 4 },
  },
  {
    id: 'butter-wax-130g',
    name: 'Butter Wax',
    image: '/servicebuilder/Wax_Butter.webp',
    ratings: { hydrophobicity: 5, slickness: 3, gloss: 5, application: 4 },
  },
  {
    id: 'cherry-blossom-wax',
    name: 'Cherry Blossom Wax',
    image: '/servicebuilder/Wax_Cherry.webp',
    ratings: { hydrophobicity: 4, slickness: 3, gloss: 5, application: 4 },
  },
  {
    id: 'fusion-wax-130g',
    name: 'Fusion Wax',
    image: '/servicebuilder/Wax_Fusion.webp',
    ratings: { hydrophobicity: 5, slickness: 1, gloss: 5, application: 2 },
  },
  {
    id: 'ghost-wax',
    name: 'Ghost Wax',
    image: '/servicebuilder/Wax_Ghost.webp',
    ratings: { hydrophobicity: 5, slickness: 2, gloss: 4, application: 4 },
  },
  {
    id: 'liberty-wax-130g',
    name: 'Liberty Wax',
    image: '/servicebuilder/Wax_Lib.png',
    ratings: { hydrophobicity: 5, slickness: 4, gloss: 4, application: 5 },
  },
  {
    id: 'sexy-lady-wax',
    name: 'Sexy Lady Wax',
    image: '/servicebuilder/Wax_Lady.webp',
    ratings: { hydrophobicity: 5, slickness: 3, gloss: 5, application: 4 },
  },
  {
    id: 'wheel-wax-130g',
    name: 'Wheel Wax',
    image: '/servicebuilder/Wax_Wheel.webp',
    ratings: { hydrophobicity: 4, slickness: 3, gloss: 4, application: 4 },
  },
]

export type ProductKit = {
  id: string
  name: string
  image: string
  items: Array<{ name: string; price: number }>
  price?: number
  discountLabel?: string
}

export const PRODUCT_KITS: ProductKit[] = [
  {
    id: 'kit-vitre',
    name: 'Glass',
    image: '/servicebuilder/Vitre Kit.png',
    price: 63.99,
    discountLabel: '20%',
    items: [
      { name: 'Fireball Premium Glass Cleaner 500ml', price: 24 },
      { name: 'Fireball Waterspot Remover', price: 28 },
      { name: 'Fireball Premium Twist Drying Towel', price: 14 },
    ],
  },
  {
    id: 'kit-roue',
    name: 'Wheel',
    image: '/servicebuilder/Roue KIT.png',
    price: 63.99,
    discountLabel: '20%',
    items: [
      { name: 'Fireball Wheel++ Iron Wheel Cleaner', price: 27 },
      { name: 'Fireball Wheel & Tire 500mL', price: 27 },
      { name: 'Fireball SiO2 Tire Coating (Satin) 500mL', price: 27 },
    ],
  },
  {
    id: 'kit-exterieur',
    name: 'Exterior',
    image: '/servicebuilder/Extérieur KIT.png',
    price: 75,
    discountLabel: '20%',
    items: [
      { name: 'Fireball pH3 Shampoo 500mL', price: 28 },
      { name: 'Fireball Hydro Shampoo SiO2 Wash And Coat', price: 37 },
      { name: 'Fireball Waterless DIRECT 500ml', price: 28 },
      { name: 'Fireball Premium Wash Mitt', price: 0 },
      { name: 'Fireball Twist Drying Towel', price: 0 },
    ],
  },
  {
    id: 'kit-interieur',
    name: 'Interior',
    image: '/servicebuilder/Intérieur KIT.png',
    price: 75,
    discountLabel: '20%',
    items: [
      { name: 'Fireball Nappa Cleaner 500ml', price: 24 },
      { name: 'Fireball Nappa Coat 500ml', price: 28 },
      { name: 'Fireball Nappa Brush', price: 20 },
      { name: 'Fireball Glass 500ml', price: 23 },
    ],
  },
]

export function getKitRetailTotal(kit: ProductKit): number {
  return kit.items.reduce((sum, item) => sum + item.price, 0)
}

export function getKitPrice(kit: ProductKit): number {
  return kit.price ?? Math.round(getKitRetailTotal(kit) * 0.85 * 100) / 100
}

export const SERVICE_BUILDER_FAQS = [
  {
    q: 'Is the price estimate a final quote?',
    a: 'The estimate is a starting price based on your vehicle size and paint condition. The final price is confirmed by your installer after an in-person inspection. Additional factors such as heavily contaminated paint or specialty surfaces may affect the final cost.',
  },
  {
    q: 'What does paint condition affect in the estimate?',
    a: 'Paint condition determines the level of correction work needed before the coating can be applied. Light imperfections require a one-stage polish, while heavy defects require multi-stage machine correction — each adding to the preparation time and cost.',
  },
  {
    q: 'Can I modify or cancel my service request after sending?',
    a: 'Yes. Since your request is reviewed manually by our team before any appointment is confirmed, you can contact us directly to update your configuration, change your coating choice, or cancel altogether at no charge.',
  },
  {
    q: 'Do I earn XP for submitting a service request?',
    a: 'XP is awarded once your service request is reviewed and approved by a certified installer — not at submission. The estimated XP shown during configuration gives you a preview of what you stand to earn when the service is completed.',
  },
  {
    q: 'What happens after I send my service request?',
    a: "Our team reviews your configuration and will follow up by email and phone to confirm details and schedule your appointment. You will also receive a request confirmation number to track your service in your account dashboard if you're signed in.",
  },
] as const
