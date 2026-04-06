import {
  DEFAULT_HOME_COLLECTION,
  type HomeCollectionResolved,
} from '@/constants/homeCollection'

/**
 * Bannière plein écran sur l’accueil — **indépendante** du bloc « Featured collection » du menu Shop.
 * Stockée dans `site_settings.key = announcements` aux côtés des autres clés.
 */
export type HomeCollectionAnnouncements = {
  home_collection_eyebrow?: string | null
  home_collection_headline?: string | null
  home_collection_description?: string | null
  home_collection_image?: string | null
  home_collection_href?: string | null
  home_collection_button1_label?: string | null
  home_collection_button1_href?: string | null
  home_collection_button2_label?: string | null
  home_collection_button2_href?: string | null
}

export function resolveHomeCollection(
  announcementsValue: Record<string, unknown> | null | undefined,
): HomeCollectionResolved {
  if (announcementsValue == null) {
    return {
      eyebrow: DEFAULT_HOME_COLLECTION.eyebrow,
      headline: DEFAULT_HOME_COLLECTION.headline,
      description: DEFAULT_HOME_COLLECTION.description,
      image: DEFAULT_HOME_COLLECTION.image,
      href: DEFAULT_HOME_COLLECTION.href,
      button1Label: DEFAULT_HOME_COLLECTION.button1Label,
      button1Href: DEFAULT_HOME_COLLECTION.button1Href,
      button2Label: DEFAULT_HOME_COLLECTION.button2Label,
      button2Href: DEFAULT_HOME_COLLECTION.button2Href,
    }
  }

  const r = announcementsValue as HomeCollectionAnnouncements

  const btn1Lab =
    r.home_collection_button1_label === undefined
      ? DEFAULT_HOME_COLLECTION.button1Label
      : (r.home_collection_button1_label ?? '').trim() || DEFAULT_HOME_COLLECTION.button1Label
  const btn1Href =
    r.home_collection_button1_href === undefined
      ? DEFAULT_HOME_COLLECTION.button1Href
      : (r.home_collection_button1_href ?? '').trim() || DEFAULT_HOME_COLLECTION.button1Href

  const btn2Lab =
    r.home_collection_button2_label === undefined
      ? DEFAULT_HOME_COLLECTION.button2Label
      : (r.home_collection_button2_label ?? '').trim()
  const btn2Href =
    r.home_collection_button2_href === undefined
      ? DEFAULT_HOME_COLLECTION.button2Href
      : (r.home_collection_button2_href ?? '').trim() || DEFAULT_HOME_COLLECTION.button2Href

  return {
    eyebrow: (r.home_collection_eyebrow ?? '').trim() || DEFAULT_HOME_COLLECTION.eyebrow,
    headline:
      (r.home_collection_headline ?? '').trim() || DEFAULT_HOME_COLLECTION.headline,
    description:
      (r.home_collection_description ?? '').trim() || DEFAULT_HOME_COLLECTION.description,
    image: (r.home_collection_image ?? '').trim() || DEFAULT_HOME_COLLECTION.image,
    href: (r.home_collection_href ?? '').trim() || DEFAULT_HOME_COLLECTION.href,
    button1Label: btn1Lab,
    button1Href: btn1Href,
    button2Label: btn2Lab,
    button2Href: btn2Href,
  }
}
