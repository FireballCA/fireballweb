import './SurfaceTechnology.css'

interface TechnologyCard {
  number: string
  title: string
  description: string
}

const technologies: TechnologyCard[] = [
  {
    number: '01',
    title: 'Chemical Resistance',
    description: 'Protects against environmental contaminants and harsh chemical exposure.',
  },
  {
    number: '02',
    title: 'Hydrophobic Behaviour',
    description: 'Repels water and minimizes surface contamination bonding.',
  },
  {
    number: '03',
    title: 'UV Stability',
    description: 'Reduces long-term paint degradation caused by sunlight exposure.',
  },
  {
    number: '04',
    title: 'Molecular Bonding',
    description: 'Forms a durable protective layer at a microscopic level.',
  },
]

export function SurfaceTechnology() {
  return (
    <section className="surface-technology">
      <div className="surface-technology-container">
        <div className="surface-technology-header">
          <p className="surface-technology-label">SURFACE TECHNOLOGY</p>
          <h2 className="surface-technology-title">The Science Behind Protection</h2>
          <p className="surface-technology-subtitle">
            Multi-layer ceramic protection technologies engineered to enhance durability and defend automotive finishes.
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
