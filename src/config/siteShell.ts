export type SiteShellScrollMode = 'container' | 'page' | 'contact-desktop'

export type SiteShellContentBg = 'dark' | 'black' | 'white'

export type SiteShellHeaderVariant = 'none' | 'public' | 'dashboard'

export type SiteShellConfig = {
  headerVariant: SiteShellHeaderVariant
  showFooter: boolean
  scrollMode: SiteShellScrollMode
  contentBg: SiteShellContentBg
  showAnnouncementBanner: boolean
}

function normalizePathname(pathname: string): string {
  return pathname.split('?')[0] || pathname
}

export function isAccountAuthPath(pathname: string): boolean {
  const path = normalizePathname(pathname)
  return path === '/account' || path === '/account/register'
}

export function isDashboardPath(pathname: string): boolean {
  const path = normalizePathname(pathname)
  return path === '/account/dashboard' || path === '/dashboard'
}

export function isAnyAccountPath(pathname: string): boolean {
  const path = normalizePathname(pathname)
  return path.startsWith('/account') || path.startsWith('/business')
}

export function isBusinessPath(pathname: string): boolean {
  const path = normalizePathname(pathname)
  return path.startsWith('/business') || path.startsWith('/account/business')
}

export function isContactPath(pathname: string): boolean {
  return normalizePathname(pathname) === '/contact'
}

export function isCarClubPath(pathname: string): boolean {
  return normalizePathname(pathname) === '/car-club'
}

/** Configuration unique du shell (header, footer, scroll, fond) selon la route. */
export function resolveSiteShell(pathname: string, isMobile = false): SiteShellConfig {
  const isAccountAuth = isAccountAuthPath(pathname)
  const isDashboard = isDashboardPath(pathname)
  const isAnyAccount = isAnyAccountPath(pathname)
  const isBusiness = isBusinessPath(pathname)
  const isContact = isContactPath(pathname)
  const isCarClub = isCarClubPath(pathname)

  let headerVariant: SiteShellHeaderVariant = 'public'
  if (isAccountAuth) headerVariant = 'none'
  else if (isDashboard) headerVariant = 'dashboard'

  const showFooter = !isAnyAccount && !isContact

  let scrollMode: SiteShellScrollMode = 'container'
  if (isAnyAccount) scrollMode = 'page'
  else if (isContact && !isMobile) scrollMode = 'contact-desktop'

  let contentBg: SiteShellContentBg = 'dark'
  if (isCarClub) contentBg = 'black'
  else if (isContact) contentBg = 'white'

  const showAnnouncementBanner = !isBusiness && !isDashboard

  return {
    headerVariant,
    showFooter,
    scrollMode,
    contentBg,
    showAnnouncementBanner,
  }
}
