/** Même pattern que Home / About : hero remonte sous la navbar fixe (`-mt-20`). */
const NAV_OVER_HERO_PATHS = new Set(['/', '/about', '/car-club', '/academy'])

/**
 * Pages où la navbar se superpose visuellement à un hero plein écran.
 * Sur ces routes uniquement : fond transparent en haut, puis remplissage progressif au scroll.
 */
export function isNavOverFullBleedHero(pathname: string): boolean {
  const path = pathname.split('?')[0] || pathname
  return NAV_OVER_HERO_PATHS.has(path)
}
