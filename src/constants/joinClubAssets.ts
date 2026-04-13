/** Image affichée tant que l’utilisateur n’a pas choisi Ignition / Apex (pas les visuels de carte). */
export const JOIN_CLUB_WIZARD_PLACEHOLDER = '/Assets/CardsDefauts.png'

/** Dos de carte Apex (aperçu) : image fournie ; le nom est superposé entre les filets. */
export const JOIN_CLUB_CARD_BACK_PREVIEW_IMAGE_APEX = '/Assets/APEXback.png'

/** Dos de carte Ignition (aperçu) : même principe qu’Apex. */
export const JOIN_CLUB_CARD_BACK_PREVIEW_IMAGE_IGNITION = '/Assets/Igntionback.png'

/** Longueur max du nom sur la carte (ligne entre les filets). */
export const JOIN_CLUB_MEMBER_NAME_MAX_LENGTH = 22

/** Cartes membership (face / dos). Les fichiers « Back » peuvent être ajoutés plus tard ; repli sur la face en cas d’erreur. */
export const JOIN_CLUB_CARD_IMAGES = {
  ignition: {
    front: '/Assets/Fireball Ignition Membership.png',
    back: '/Assets/Igntionback.png',
  },
  apex: {
    front: '/Assets/Fireball Apex Membership.png',
    back: '/Assets/Fireball Apex Membership Back.png',
  },
} as const
