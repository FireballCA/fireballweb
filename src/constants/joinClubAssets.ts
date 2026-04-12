/** Image affichée tant que l’utilisateur n’a pas choisi Ignition / Apex (pas les visuels de carte). */
export const JOIN_CLUB_WIZARD_PLACEHOLDER = '/Assets/Carclub Hero.png'

/** Cartes membership (face / dos). Les fichiers « Back » peuvent être ajoutés plus tard ; repli sur la face en cas d’erreur. */
export const JOIN_CLUB_CARD_IMAGES = {
  ignition: {
    front: '/Assets/Fireball Ignition Membership.png',
    back: '/Assets/Fireball Ignition Membership Back.png',
  },
  apex: {
    front: '/Assets/Fireball Apex Membership.png',
    back: '/Assets/Fireball Apex Membership Back.png',
  },
} as const
