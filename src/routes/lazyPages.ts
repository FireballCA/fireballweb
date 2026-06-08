import { lazy, type ComponentType } from 'react'
import { importWithChunkRecovery } from '@/utils/chunkLoadRecovery'

type PageModule = { default: ComponentType }

const asDefault = <T extends Record<string, ComponentType>>(
  loader: () => Promise<T>,
  key: keyof T,
): (() => Promise<PageModule>) =>
  memoizeRouteLoader(importWithChunkRecovery(() => loader().then((m) => ({ default: m[key] }))))

/** Une seule promesse par route : prefetch + React.lazy partagent le même chargement. */
function memoizeRouteLoader(loader: () => Promise<PageModule>): () => Promise<PageModule> {
  let cached: Promise<PageModule> | null = null
  return () => {
    if (!cached) cached = loader()
    return cached
  }
}

// ─── Pages publiques du site (préchargées à l’arrivée, hors compte / admin) ───

export const loadAbout = asDefault(() => import('@/pages/About'), 'About')
export const loadPressKit = asDefault(() => import('@/pages/PressKit'), 'PressKit')
export const loadCart = asDefault(() => import('@/pages/Cart'), 'Cart')
export const loadCarClub = asDefault(() => import('@/pages/CarClub'), 'CarClub')
export const loadEvent = asDefault(() => import('@/pages/Event'), 'Event')
export const loadEventDetail = asDefault(() => import('@/pages/EventDetail'), 'EventDetail')
export const loadContact = asDefault(() => import('@/pages/Contact'), 'Contact')
export const loadLegal = asDefault(() => import('@/pages/Legal'), 'Legal')
export const loadLegalNotice = asDefault(() => import('@/pages/LegalNotice'), 'LegalNotice')
export const loadCookies = asDefault(() => import('@/pages/Cookies'), 'Cookies')
export const loadPrivacy = asDefault(() => import('@/pages/Privacy'), 'Privacy')
export const loadTermsOfService = asDefault(() => import('@/pages/TermsOfService'), 'TermsOfService')
export const loadAcademy = asDefault(() => import('@/pages/Academy'), 'Academy')
export const loadTrainingThankYou = asDefault(
  () => import('@/pages/TrainingRegistrationThankYou'),
  'TrainingRegistrationThankYou',
)
export const loadJoinClub = asDefault(() => import('@/pages/JoinClub'), 'JoinClub')
export const loadServiceBuilder = asDefault(() => import('@/pages/ServiceBuilder'), 'ServiceBuilder')
export const loadPartnerCompany = asDefault(() => import('@/pages/PartnerCompany'), 'PartnerCompany')
export const loadCompareCoatings = asDefault(() => import('@/pages/coatings/CompareCoatings'), 'CompareCoatings')
export const loadCeramicCoating = asDefault(() => import('@/pages/coatings/CeramicCoating'), 'CeramicCoating')
export const loadFindInstaller = asDefault(() => import('@/pages/coatings/FindInstaller'), 'FindInstaller')
export const loadHowItWorks = asDefault(() => import('@/pages/coatings/HowItWorks'), 'HowItWorks')
export const loadNotFoundPage = asDefault(() => import('@/components/NotFoundPage'), 'NotFoundPage')

export const About = lazy(loadAbout)
export const PressKit = lazy(loadPressKit)
export const Cart = lazy(loadCart)
export const CarClub = lazy(loadCarClub)
export const Event = lazy(loadEvent)
export const EventDetail = lazy(loadEventDetail)
export const Contact = lazy(loadContact)
export const Legal = lazy(loadLegal)
export const LegalNotice = lazy(loadLegalNotice)
export const Cookies = lazy(loadCookies)
export const Privacy = lazy(loadPrivacy)
export const TermsOfService = lazy(loadTermsOfService)
export const Academy = lazy(loadAcademy)
export const TrainingRegistrationThankYou = lazy(loadTrainingThankYou)
export const JoinClub = lazy(loadJoinClub)
export const ServiceBuilder = lazy(loadServiceBuilder)
export const PartnerCompany = lazy(loadPartnerCompany)
export const CompareCoatings = lazy(loadCompareCoatings)
export const CeramicCoating = lazy(loadCeramicCoating)
export const FindInstaller = lazy(loadFindInstaller)
export const HowItWorks = lazy(loadHowItWorks)
export const NotFoundPage = lazy(loadNotFoundPage)

const PUBLIC_ROUTE_LOADERS: Record<string, () => Promise<PageModule>> = {
  '/about': loadAbout,
  '/press-kit': loadPressKit,
  '/cart': loadCart,
  '/car-club': loadCarClub,
  '/event': loadEvent,
  '/contact': loadContact,
  '/legal': loadLegal,
  '/Legal-Notice': loadLegalNotice,
  '/Cookies': loadCookies,
  '/Privacy': loadPrivacy,
  '/Terms-of-Service': loadTermsOfService,
  '/academy': loadAcademy,
  '/academy/training-thank-you': loadTrainingThankYou,
  '/join-club': loadJoinClub,
  '/service-builder': loadServiceBuilder,
  '/join': loadPartnerCompany,
  '/all-coatings': loadCeramicCoating,
  '/coatings/compare': loadCompareCoatings,
  '/coatings/find-installer': loadFindInstaller,
  '/find-installer': loadFindInstaller,
  '/coatings/how-it-works': loadHowItWorks,
  '/404': loadNotFoundPage,
}

/** Tous les chunks de pages publiques (dédupliqués). */
export const PUBLIC_SITE_ROUTE_LOADERS: Array<() => Promise<PageModule>> = [
  ...new Set(Object.values(PUBLIC_ROUTE_LOADERS)),
]

const ADMIN_ROUTE_PREFIXES = [
  '/account',
  '/business',
  '/partner',
  '/dashboard',
  '/patch-notes',
] as const

function normalizePath(path: string): string {
  const raw = path.split('?')[0]?.split('#')[0] ?? path
  if (!raw || raw === '/') return '/'
  return raw.length > 1 && raw.endsWith('/') ? raw.slice(0, -1) : raw
}

function isAdminOrPartnerPath(path: string): boolean {
  return ADMIN_ROUTE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

function runLoader(loader: () => Promise<PageModule>): void {
  void loader().catch(() => {
    /* prefetch best-effort */
  })
}

/** Précharge le chunk JS d’une route publique (shop, coatings, etc.). */
export function prefetchSiteRoute(path: string): void {
  const normalized = normalizePath(path)
  if (isAdminOrPartnerPath(normalized)) return

  const exact = PUBLIC_ROUTE_LOADERS[normalized]
  if (exact) {
    runLoader(exact)
    return
  }

  if (normalized.startsWith('/event/') && normalized.length > '/event/'.length) {
    runLoader(loadEventDetail)
  }
}

/**
 * Lance en parallèle le téléchargement de tous les chunks des pages publiques.
 * À appeler dès l’arrivée sur le site pour une navigation instantanée ensuite.
 */
export function prefetchAllPublicSiteRoutes(): void {
  for (const loader of PUBLIC_SITE_ROUTE_LOADERS) {
    runLoader(loader)
  }
}

/** Démarre le préchargement dès que possible après le premier paint. */
export function bootstrapPublicSiteRoutePrefetch(): void {
  if (typeof window === 'undefined') return
  prefetchAllPublicSiteRoutes()
}

// ─── Account / admin / partner (lazy only, pas de prefetch idle) ─────────────

export const loadAccount = asDefault(() => import('@/pages/Account'), 'Account')
export const loadAccountRegister = asDefault(() => import('@/pages/AccountRegister'), 'AccountRegister')
export const loadAccountDashboard = asDefault(() => import('@/pages/AccountDashboard'), 'AccountDashboard')
export const loadAccountOrders = asDefault(() => import('@/pages/AccountOrders'), 'AccountOrders')
export const loadAccountTrackOrder = asDefault(() => import('@/pages/AccountTrackOrder'), 'AccountTrackOrder')
export const loadAccountSettings = asDefault(() => import('@/pages/AccountSettings'), 'AccountSettings')
export const loadBusinessPage = asDefault(() => import('@/pages/BusinessPage'), 'BusinessPage')
export const loadManagePartners = asDefault(() => import('@/pages/ManagePartners'), 'ManagePartners')
export const loadPatchNotes = asDefault(() => import('@/pages/PatchNotes'), 'PatchNotes')

export const Account = lazy(loadAccount)
export const AccountRegister = lazy(loadAccountRegister)
export const AccountDashboard = lazy(loadAccountDashboard)
export const AccountOrders = lazy(loadAccountOrders)
export const AccountTrackOrder = lazy(loadAccountTrackOrder)
export const AccountSettings = lazy(loadAccountSettings)
export const BusinessPage = lazy(loadBusinessPage)
export const ManagePartners = lazy(loadManagePartners)
export const PatchNotes = lazy(loadPatchNotes)

export const loadPartnerOnboarding = asDefault(
  () => import('@/pages/partner/PartnerOnboarding'),
  'PartnerOnboarding',
)
export const loadPartnerDashboardLayout = asDefault(
  () => import('@/pages/partner/PartnerDashboardLayout'),
  'PartnerDashboardLayout',
)
export const loadPartnerOverview = asDefault(() => import('@/pages/partner/PartnerOverview'), 'PartnerOverview')
export const loadPartnerClients = asDefault(() => import('@/pages/partner/PartnerClients'), 'PartnerClients')
export const loadPartnerVehicles = asDefault(() => import('@/pages/partner/PartnerVehicles'), 'PartnerVehicles')
export const loadPartnerWarranties = asDefault(() => import('@/pages/partner/PartnerWarranties'), 'PartnerWarranties')
export const loadPartnerCertification = asDefault(
  () => import('@/pages/partner/PartnerCertification'),
  'PartnerCertification',
)
export const loadPartnerSettings = asDefault(() => import('@/pages/partner/PartnerSettings'), 'PartnerSettings')
export const loadPartnerStatistics = asDefault(() => import('@/pages/partner/PartnerStatistics'), 'PartnerStatistics')

export const PartnerOnboarding = lazy(loadPartnerOnboarding)
export const PartnerDashboardLayout = lazy(loadPartnerDashboardLayout)
export const PartnerOverview = lazy(loadPartnerOverview)
export const PartnerClients = lazy(loadPartnerClients)
export const PartnerVehicles = lazy(loadPartnerVehicles)
export const PartnerWarranties = lazy(loadPartnerWarranties)
export const PartnerCertification = lazy(loadPartnerCertification)
export const PartnerSettings = lazy(loadPartnerSettings)
export const PartnerStatistics = lazy(loadPartnerStatistics)
