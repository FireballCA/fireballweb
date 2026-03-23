import { supabase } from '@/lib/supabase'

const LOCAL_KEY = 'fireball_wishlist_slugs'

export function readLocalFavoriteSlugs(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : []
  } catch {
    return []
  }
}

function writeLocalFavoriteSlugs(slugs: string[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(slugs))
}

export async function getFavoriteSlugsFromProfile(): Promise<string[] | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('favorite_product_slugs')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.warn('favorites: profile read failed', error.message)
    return []
  }

  const raw = (data as { favorite_product_slugs?: unknown } | null)?.favorite_product_slugs
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === 'string')
  }
  return []
}

export async function saveFavoriteSlugsToProfile(slugs: string[]): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('profiles')
    .update({ favorite_product_slugs: slugs })
    .eq('id', user.id)

  if (error) {
    console.warn('favorites: profile update failed', error.message)
    return false
  }
  return true
}

/** Connecté : BDD ; sinon localStorage */
export async function getFavoriteSlugsResolved(): Promise<string[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    const fromDb = await getFavoriteSlugsFromProfile()
    return fromDb ?? []
  }
  return readLocalFavoriteSlugs()
}

export async function toggleFavoriteSlug(slug: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    const list = (await getFavoriteSlugsFromProfile()) ?? []
    const i = list.indexOf(slug)
    if (i >= 0) {
      list.splice(i, 1)
    } else {
      list.push(slug)
    }
    await saveFavoriteSlugsToProfile(list)
    return i < 0
  }

  const list = readLocalFavoriteSlugs()
  const i = list.indexOf(slug)
  if (i >= 0) {
    list.splice(i, 1)
    writeLocalFavoriteSlugs(list)
    return false
  }
  list.push(slug)
  writeLocalFavoriteSlugs(list)
  return true
}

export async function isFavoriteSlug(slug: string): Promise<boolean> {
  const slugs = await getFavoriteSlugsResolved()
  return slugs.includes(slug)
}
