/**
 * RouteSkeleton.tsx
 * Choisit le skeleton correspondant à la route en cours.
 * Utilisé comme fallback du <Suspense> dans Layout.tsx.
 */
import { useLocation } from 'react-router-dom'
import {
  HomeSkeleton,
  ShopSkeleton,
  ProductSkeleton,
  AboutSkeleton,
  AcademySkeleton,
  ContactSkeleton,
  CartSkeleton,
  AccountSkeleton,
  CarClubSkeleton,
  EventSkeleton,
  LegalSkeleton,
  ServiceBuilderSkeleton,
  PartnerSkeleton,
  GenericDarkSkeleton,
} from '@/components/ui/PageSkeletons'

export function RouteSkeleton() {
  const { pathname } = useLocation()

  // Home
  if (pathname === '/') return <HomeSkeleton />

  // Shop / categories
  if (pathname.startsWith('/shop') || pathname.startsWith('/coatings') || pathname === '/all-coatings') return <ShopSkeleton />

  // Product detail
  if (pathname.startsWith('/products/') || pathname.startsWith('/product/')) return <ProductSkeleton />

  // Account pages
  if (pathname === '/account' || pathname === '/account/register') return <AccountSkeleton />
  if (pathname.startsWith('/account') || pathname.startsWith('/business')) return <AccountSkeleton />

  // Specific pages
  if (pathname === '/about') return <AboutSkeleton />
  if (pathname === '/academy' || pathname.startsWith('/academy/')) return <AcademySkeleton />
  if (pathname === '/contact') return <ContactSkeleton />
  if (pathname === '/cart') return <CartSkeleton />
  if (pathname === '/car-club') return <CarClubSkeleton />
  if (pathname === '/event' || pathname.startsWith('/event/')) return <EventSkeleton />
  if (pathname === '/service-builder') return <ServiceBuilderSkeleton />
  if (
    pathname === '/join' ||
    pathname === '/join-fireball' ||
    pathname === '/join-club' ||
    pathname.startsWith('/partner')
  ) return <PartnerSkeleton />
  if (
    pathname === '/legal' ||
    pathname === '/Legal-Notice' ||
    pathname === '/Cookies' ||
    pathname === '/Privacy' ||
    pathname === '/Terms-of-Service'
  ) return <LegalSkeleton />

  // Category routes directes (/coating, /wax, etc.) → shop skeleton
  if (pathname.split('/').length === 2 && !pathname.includes('.')) return <ShopSkeleton />
  return <GenericDarkSkeleton />
}
