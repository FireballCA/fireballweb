/** Valeurs par défaut (landing) si rien n’est défini dans le panneau admin. */
export const DEFAULT_HOME_COLLECTION = {
  eyebrow: 'Surface Technology',
  headline: 'Coatings',
  description: 'Excellence in every detail',
  image: '/Assets/Coatings/CoatingsBanner.png',
  href: '/coatings',
  button1Label: 'Shop coatings',
  button1Href: '/coatings',
  button2Label: 'Learn more',
  button2Href: '/all-coatings',
} as const

export type HomeCollectionResolved = {
  eyebrow: string
  headline: string
  description: string
  image: string
  href: string
  button1Label: string
  button1Href: string
  button2Label: string
  button2Href: string
}
