export type CategoryId = 'classique' | 'pro' | 'revetements'

export interface Product {
  id: string
  name: string
  slug: string
  category: CategoryId
  shortDesc: string
  description: string
  price: number
  image: string
  images?: string[]
  featured?: boolean
  badge?: string
}

export const CATEGORIES: { id: CategoryId; name: string; description: string }[] = [
  { id: 'classique', name: 'Classique', description: 'Soins et finitions pour l\'entretien quotidien' },
  { id: 'pro', name: 'Pro', description: 'Gammes professionnelles pour les experts' },
  { id: 'revetements', name: 'Revêtements', description: 'Protections céramiques et coatings haute performance' },
]

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Nettoyant Carrosserie Premium',
    slug: 'nettoyant-carrosserie-premium',
    category: 'classique',
    shortDesc: 'Mousse active pH neutre',
    description: 'Nettoyant haute performance à mousse active, pH neutre. Préserve les cires et revêtements. Idéal pour l\'entretien régulier de toute carrosserie.',
    price: 34.90,
    image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800',
    featured: true,
  },
  {
    id: '2',
    name: 'Cire Carnauba Signature',
    slug: 'cire-carnauba-signature',
    category: 'classique',
    shortDesc: 'Brillance profonde longue durée',
    description: 'Cire naturelle à base de carnauba brésilienne. Applique une brillance miroir et une protection hydrophobe jusqu\'à 3 mois.',
    price: 89.00,
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800',
    featured: true,
  },
  {
    id: '3',
    name: 'Polish Correction Pro',
    slug: 'polish-correction-pro',
    category: 'pro',
    shortDesc: 'Correction des micro-rayures',
    description: 'Composé abrasif premium pour la correction des défauts de peinture. Coupe progressive, finition LSP-ready. Pour usage polisseuse orbitale.',
    price: 129.00,
    image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800',
    featured: true,
    badge: 'Pro',
  },
  {
    id: '4',
    name: 'Coating Céramique 9H',
    slug: 'coating-ceramique-9h',
    category: 'revetements',
    shortDesc: 'Durée de vie 5 ans',
    description: 'Revêtement céramique haute résistance. Dureté 9H, hydrophobie extrême, résistance aux UV et contaminants. Garantie 5 ans avec entretien.',
    price: 349.00,
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800',
    featured: true,
    badge: 'Revêtement',
  },
  {
    id: '5',
    name: 'Shampooing Sans Rinçage',
    slug: 'shampooing-sans-rincage',
    category: 'classique',
    shortDesc: 'Lavage écologique',
    description: 'Formule sans rinçage pour un lavage rapide et sans eau. Enlève les salissures légères tout en nourrissant la surface.',
    price: 24.90,
    image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800',
  },
  {
    id: '6',
    name: 'Compound Coupe Ferme',
    slug: 'compound-coupe-ferme',
    category: 'pro',
    shortDesc: 'Correction lourde',
    description: 'Compound professionnel pour les défauts profonds. Coupe rapide, faible poussière. Recommandé en première étape de correction.',
    price: 79.00,
    image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800',
    badge: 'Pro',
  },
  {
    id: '7',
    name: 'Coating Vitre Siloxane',
    slug: 'coating-vitre-siloxane',
    category: 'revetements',
    shortDesc: 'Vitres hydrophobes',
    description: 'Revêtement hydrophobe pour pare-brise et vitres. Améliore la visibilité sous la pluie, répulsion eau et contaminants.',
    price: 59.00,
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800',
    badge: 'Revêtement',
  },
  {
    id: '8',
    name: 'Sérum Brillance',
    slug: 'serum-brillance',
    category: 'classique',
    shortDesc: 'Éclat instantané',
    description: 'Sérum de finition à appliquer après lavage. Redonne un éclat parfait sans effort, compatible tous revêtements.',
    price: 42.00,
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800',
  },
  {
    id: '9',
    name: 'Kit Polissage Complet Pro',
    slug: 'kit-polissage-complet-pro',
    category: 'pro',
    shortDesc: '3 étapes correction + finition',
    description: 'Kit professionnel : compound, polish et finition. Pads inclus. Pour une correction complète en atelier ou passionné averti.',
    price: 249.00,
    image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800',
    badge: 'Pro',
  },
  {
    id: '10',
    name: 'Coating Jantes Céramique',
    slug: 'coating-jantes-ceramique',
    category: 'revetements',
    shortDesc: 'Protection freinage et sel',
    description: 'Revêtement céramique dédié jantes. Résiste à la chaleur des freins, au sel et aux dépôts de plaquettes.',
    price: 69.00,
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800',
    badge: 'Revêtement',
  },
]

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug)
}

export function getProductsByCategory(category: CategoryId): Product[] {
  return PRODUCTS.filter((p) => p.category === category)
}

export function getFeaturedProducts(): Product[] {
  return PRODUCTS.filter((p) => p.featured)
}
