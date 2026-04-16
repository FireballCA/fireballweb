import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  JOIN_CLUB_CARD_BACK_PREVIEW_IMAGE_APEX,
  JOIN_CLUB_CARD_BACK_PREVIEW_IMAGE_IGNITION,
  JOIN_CLUB_MEMBER_NAME_MAX_LENGTH,
} from '@/constants/joinClubAssets'

type Tier = 'ignition' | 'apex'

type MembershipCardBackPreviewProps = {
  name: string
  tier: Tier
  className?: string
}

/**
 * Aperçu du dos : image d’origine, nom uniquement superposé (zone entre les filets sur Apex).
 */
export function MembershipCardBackPreview({ name, tier, className }: MembershipCardBackPreviewProps) {
  const raw = name.trim().slice(0, JOIN_CLUB_MEMBER_NAME_MAX_LENGTH)
  const displayName = raw ? raw.toUpperCase() : 'CLIENT NAME'

  const isApex = tier === 'apex'
  const imageSrc = isApex
    ? JOIN_CLUB_CARD_BACK_PREVIEW_IMAGE_APEX
    : JOIN_CLUB_CARD_BACK_PREVIEW_IMAGE_IGNITION

  /** Pas de texte « dans le vide » : n’afficher nom + image qu’après chargement du dos. */
  const [imageReady, setImageReady] = useState(false)
  useEffect(() => {
    setImageReady(false)
  }, [imageSrc])

  const nameZoneClass = isApex
    ? 'left-[10%] right-[10%] top-[37%] bottom-[50%]'
    : 'left-[10%] right-[10%] top-[38%] bottom-[45%]'

  const namePresentation = isApex
    ? {
        className:
          'bg-gradient-to-b from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent',
        style: {
          filter:
            'drop-shadow(0 1px 0 rgba(255,255,255,0.12)) drop-shadow(0 -1px 1px rgba(0,0,0,0.9))',
        } as const,
      }
    : {
        className: 'text-[#1e1d1c]',
        style: {
          textShadow:
            '0 1px 0 rgba(255,255,255,0.28), 0 2px 4px rgba(0,0,0,0.28), 0 -0.5px 0 rgba(0,0,0,0.15)',
        } as const,
      }

  /** Tailles de référence (section gauche) : cqw sur la largeur du bloc @container. */
  const nameTextSizeClass = isApex
    ? 'text-[clamp(0.82rem,4.2cqw,1.55rem)]'
    : 'text-[clamp(0.78rem,3.95cqw,1.42rem)]'

  return (
    <div
      className={cn(
        'relative flex min-h-0 w-full max-w-full shrink-0 select-none',
        className,
      )}
    >
      <div className="relative @container h-full min-h-0 w-full max-w-full">
        <img
          src={imageSrc}
          alt=""
          loading="eager"
          decoding="async"
          fetchPriority="high"
          onLoad={() => setImageReady(true)}
          onError={() => setImageReady(true)}
          className={cn(
            'pointer-events-none block h-full w-full max-h-full max-w-full object-contain object-center mix-blend-multiply',
            'transition-opacity duration-150 ease-out',
            imageReady ? 'opacity-100' : 'opacity-0',
          )}
          draggable={false}
        />

        <div
          className={cn(
            'pointer-events-none absolute flex items-center justify-center px-[2%]',
            nameZoneClass,
            'transition-opacity duration-150 ease-out',
            imageReady ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden={!imageReady}
        >
          <p
            aria-live="polite"
            className={cn(
              'w-full max-w-full text-center font-[family-name:Playfair_Display,serif]',
              nameTextSizeClass,
              'uppercase leading-[1.05]',
              isApex ? 'font-semibold tracking-[0.06em]' : 'font-medium tracking-[0.05em]',
              namePresentation.className,
              'transition-all duration-300 ease-out',
              'truncate',
            )}
            style={namePresentation.style}
          >
            {displayName}
          </p>
        </div>
      </div>
    </div>
  )
}
