/**
 * Revêtements Fireball utilisés en atelier (Ceramic Coating, etc.)
 * Garantie et date de prochain service conseillée par produit.
 * Modifier ce fichier pour ajouter/éditer les coatings et leurs durées.
 */

export interface CoatingProduct {
  id: string
  label: string
  /** Durée de garantie en mois */
  warrantyMonths: number
  /** Nombre de mois recommandé avant prochain passage (inspection / entretien) */
  recommendedServiceMonths: number
  /** Libellé court pour la garantie (ex. "5 ans") */
  warrantyLabel: string
}

export const COATING_PRODUCTS: CoatingProduct[] = [
  { id: 'aegis', label: 'Aegis', warrantyMonths: 60, recommendedServiceMonths: 12, warrantyLabel: '5 ans' },
  { id: 'typhoon', label: 'Typhoon', warrantyMonths: 60, recommendedServiceMonths: 12, warrantyLabel: '5 ans' },
  { id: 'devils_blood', label: "Devil's Blood", warrantyMonths: 36, recommendedServiceMonths: 12, warrantyLabel: '3 ans' },
  { id: 'dok_do', label: 'Dok Do', warrantyMonths: 24, recommendedServiceMonths: 12, warrantyLabel: '2 ans' },
  { id: 'silla', label: 'Silla', warrantyMonths: 24, recommendedServiceMonths: 12, warrantyLabel: '2 ans' },
]

export function getCoatingById(id: string): CoatingProduct | undefined {
  return COATING_PRODUCTS.find((c) => c.id === id)
}

export function getWarrantyEndDate(installationDate: string, coatingId: string): string {
  const coating = getCoatingById(coatingId)
  if (!coating) return installationDate
  const d = new Date(installationDate)
  d.setMonth(d.getMonth() + coating.warrantyMonths)
  return d.toISOString().slice(0, 10)
}

export function getRecommendedNextServiceDate(installationDate: string, coatingId: string): string {
  const coating = getCoatingById(coatingId)
  if (!coating) return installationDate
  const d = new Date(installationDate)
  d.setMonth(d.getMonth() + coating.recommendedServiceMonths)
  return d.toISOString().slice(0, 10)
}
