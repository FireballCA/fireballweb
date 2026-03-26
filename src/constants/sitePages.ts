export type SitePage = {
  label: string
  to: string
  keywords?: string[]
}

/**
 * Pages “sélectionnables” pour la bannière (sélecteur avec recherche).
 * On liste volontairement les routes stables (pas les routes dynamiques type /product/:slug).
 */
export const SITE_PAGES: SitePage[] = [
  { label: 'Home', to: '/', keywords: ['accueil', 'landing'] },
  { label: 'Shop', to: '/boutique', keywords: ['boutique', 'store', 'products'] },
  { label: 'About', to: '/about', keywords: ['company', 'brand'] },
  { label: 'Contact', to: '/contact', keywords: ['support'] },
  { label: 'Events', to: '/event', keywords: ['event'] },
  { label: 'Academy', to: '/academy', keywords: ['training', 'formation'] },
  { label: 'Press kit', to: '/press-kit', keywords: ['media', 'presse'] },
  { label: 'Legal', to: '/legal', keywords: ['privacy', 'terms', 'cookies'] },
  { label: 'Join Fireball (Installers)', to: '/join-fireball', keywords: ['installers', 'partner', 'company'] },
  { label: 'Car club', to: '/car-club', keywords: ['club'] },
]

