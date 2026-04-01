import './FireballLoading.css'

interface FireballLoadingProps {
  /** Taille du conteneur (logo + anneau) en pixels */
  size?: number
  /** Affichage pleine page (centre + min-height) */
  fullScreen?: boolean
  /** Classe de fond (ex: bg-white / bg-black). */
  backgroundClassName?: string
  /** Classe CSS additionnelle pour le conteneur */
  className?: string
}

/**
 * Écran de chargement Fireball : logo rond en blanc avec un anneau
 * qui tourne autour (avec un espace, les deux bouts ne se touchent jamais).
 */
export function FireballLoading({
  size = 120,
  fullScreen = true,
  backgroundClassName = 'bg-[#0B0B0B]',
  className = '',
}: FireballLoadingProps) {
  const ringSize = size * 1.24
  const ringStroke = Math.max(3, size * 0.04)
  const badgeSize = size * 0.64
  const iconSize = size * 0.42
  // Cercle : ~75% tracé, ~25% vide pour que les deux bouts ne se touchent jamais
  const circumference = 2 * Math.PI * (ringSize / 2 - ringStroke / 2)
  const dashLength = circumference * 0.72
  const gapLength = circumference - dashLength

  return (
    <div
      className={[
        'fireball-loading flex items-center justify-center w-full',
        fullScreen ? 'min-h-screen' : '',
        backgroundClassName,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-label="Chargement"
    >
      <div className="fireball-loading__wrapper relative" style={{ width: ringSize, height: ringSize }}>
        {/* Anneau avec espace qui tourne */}
        <svg
          className="fireball-loading__ring absolute inset-0 w-full h-full -rotate-90"
          viewBox={`0 0 ${ringSize} ${ringSize}`}
          aria-hidden
        >
          <circle
            className="fireball-loading__ring-circle"
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringSize / 2 - ringStroke / 2}
            fill="none"
            stroke="currentColor"
            strokeWidth={ringStroke}
            strokeLinecap="round"
            strokeDasharray={`${dashLength} ${gapLength}`}
          />
        </svg>
        {/* Badge (rond blanc) + icône (centrée) */}
        <div
          className="fireball-loading__logo absolute inset-0 flex items-center justify-center"
          style={{ width: ringSize, height: ringSize }}
        >
          <div
            className="rounded-full bg-white shadow-sm"
            style={{ width: badgeSize, height: badgeSize }}
            aria-hidden
          />
          <img
            src="/Assets/BrandKIT/Icon/RBG%20(for%20Digital)/Icon_Black.svg"
            alt=""
            width={iconSize}
            height={iconSize}
            className="absolute select-none pointer-events-none"
            draggable={false}
          />
        </div>
      </div>
    </div>
  )
}
