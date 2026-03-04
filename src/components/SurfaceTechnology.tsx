import { useTranslation } from 'react-i18next'
import './SurfaceTechnology.css'

export function SurfaceTechnology() {
  const { t } = useTranslation()

  const technologies = [
    { number: '01', title: t('surfaceTech.chemicalResistance'), description: t('surfaceTech.chemicalResistanceDesc') },
    { number: '02', title: t('surfaceTech.hydrophobic'), description: t('surfaceTech.hydrophobicDesc') },
    { number: '03', title: t('surfaceTech.uvStability'), description: t('surfaceTech.uvStabilityDesc') },
    { number: '04', title: t('surfaceTech.molecularBonding'), description: t('surfaceTech.molecularBondingDesc') },
  ]

  return (
    <section className="surface-technology">
      <div className="surface-technology-container">
        <div className="surface-technology-header">
          <p className="surface-technology-label">{t('surfaceTech.label')}</p>
          <h2 className="surface-technology-title">{t('surfaceTech.title')}</h2>
          <p className="surface-technology-subtitle">
            {t('surfaceTech.subtitle')}
          </p>
        </div>

        <div className="surface-technology-grid">
          {technologies.map((tech) => (
            <div key={tech.number} className="surface-technology-card">
              <span className="surface-technology-number">{tech.number}</span>
              <h3 className="surface-technology-card-title">{tech.title}</h3>
              <p className="surface-technology-card-description">{tech.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
