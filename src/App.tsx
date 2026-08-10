import { Suspense, useEffect, useState } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { CartProvider } from '@/context/CartContext'
import { NotificationsProvider } from '@/context/NotificationsContext'
import { Layout } from '@/components/Layout/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PartnerRoute } from '@/components/PartnerRoute'
import { AdminProvider } from '@/context/AdminContext'
import { CATEGORIES } from '@/data/products'
import { ShopifyCheckoutBridge } from '@/pages/ShopifyCheckoutBridge'
import { supabase } from '@/lib/supabase'
import { resolveEventSlugFromShortLink, resolveSiteEventConfigs } from '@/constants/siteEventConfigs'

// Core pages — chargées immédiatement (above-the-fold)
import { Home } from '@/pages/Home'
import { Shop } from '@/pages/Shop'
import { Product } from '@/pages/Product'

import {
  About,
  PressKit,
  Cart,
  CarClub,
  Event,
  EventDetail,
  Contact,
  Legal,
  LegalNotice,
  Cookies,
  Privacy,
  TermsOfService,
  Academy,
  TrainingRegistrationThankYou,
  JoinClub,
  ServiceBuilder,
  PartnerCompany,
  PatchNotes,
  NotFoundPage,
  CompareCoatings,
  CeramicCoating,
  FindInstaller,
  HowItWorks,
  Account,
  AccountRegister,
  AccountDashboard,
  AccountOrders,
  AccountTrackOrder,
  AccountSettings,
  BusinessPage,
  ManagePartners,
  PartnerOnboarding,
  PartnerDashboardLayout,
  PartnerOverview,
  PartnerClients,
  PartnerVehicles,
  PartnerWarranties,
  PartnerCertification,
  PartnerSettings,
  PartnerStatistics,
} from '@/routes/lazyPages'

function LegacyProductRedirect() {
  const { slug } = useParams<{ slug: string }>()
  return <Navigate to={`/products/${slug}`} replace />
}

function EventShortLinkRedirect({ alias }: { alias: string }) {
  const [to, setTo] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'events')
          .maybeSingle()
        const events = resolveSiteEventConfigs(data?.value)
        const slug = resolveEventSlugFromShortLink(alias, events)
        if (!cancelled) setTo(slug ? `/event/${slug}` : '/event')
      } catch {
        if (!cancelled) setTo('/event')
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [alias])

  if (!to) return null
  return <Navigate to={to} replace />
}

function CategoryRoute() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const isValid = CATEGORIES.some((c) => c.id === categoryId)
  if (!isValid) return <Navigate to="/404" replace />
  return <Shop />
}

function App() {
  return (
    <AdminProvider>
    <NotificationsProvider>
      <CartProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="shop" element={<Shop />} />
            <Route path="shop/:categoryId" element={<Shop />} />
            <Route path="products/:slug" element={<Product />} />
            <Route path="product/:slug" element={<LegacyProductRedirect />} />
            <Route path="all-coatings" element={<CeramicCoating />} />
            <Route path="coatings/compare" element={<CompareCoatings />} />
            <Route path="coatings/find-installer" element={<FindInstaller />} />
            <Route path="find-installer" element={<FindInstaller />} />
            <Route path="coatings/how-it-works" element={<HowItWorks />} />
            <Route path="coatings" element={<Shop />} />
            <Route path="pleingaz" element={<EventShortLinkRedirect alias="pleingaz" />} />
            {/* Routes directes pour les catégories (doivent être après les routes spécifiques) */}
            <Route path=":categoryId" element={<CategoryRoute />} />
            <Route path="about" element={<About />} />
            <Route path="press-kit" element={<PressKit />} />
            <Route path="cart" element={<Cart />} />
            <Route path="car-club" element={<CarClub />} />
            <Route path="event/:eventSlug" element={<EventDetail />} />
            <Route path="event" element={<Event />} />
            <Route path="contact" element={<Contact />} />
            <Route path="legal" element={<Legal />} />
            <Route path="Legal-Notice" element={<LegalNotice />} />
            <Route path="Cookies" element={<Cookies />} />
            <Route path="Privacy" element={<Privacy />} />
            <Route path="Terms-of-Service" element={<TermsOfService />} />
            <Route path="academy/training-thank-you" element={<TrainingRegistrationThankYou />} />
            <Route path="academy" element={<Academy />} />
            <Route path="join-fireball" element={<Navigate to="/join" replace />} />
            <Route path="join-club" element={<JoinClub />} />
            <Route path="service-builder" element={<ServiceBuilder />} />
            <Route path="join" element={<PartnerCompany />} />
            <Route path="account" element={<Account />} />
            <Route path="account/register" element={<AccountRegister />} />
            <Route 
              path="account/dashboard" 
              element={
                <ProtectedRoute>
                  <AccountDashboard />
                </ProtectedRoute>
              } 
            />
            <Route
              path="account/orders"
              element={
                <ProtectedRoute>
                  <AccountOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/track-order"
              element={
                <ProtectedRoute>
                  <AccountTrackOrder />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/settings"
              element={
                <ProtectedRoute>
                  <AccountSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/business"
              element={
                <ProtectedRoute>
                  <BusinessPage />
                </ProtectedRoute>
              }
            />
            {/* New clean business routes (aliases) */}
            <Route
              path="business"
              element={
                <ProtectedRoute>
                  <BusinessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/business/clients"
              element={
                <ProtectedRoute>
                  <BusinessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="business/clients"
              element={
                <ProtectedRoute>
                  <BusinessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/business/admin"
              element={
                <ProtectedRoute>
                  <BusinessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="business/admin"
              element={
                <ProtectedRoute>
                  <BusinessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/business/admin/stats"
              element={
                <ProtectedRoute>
                  <BusinessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="business/admin/stats"
              element={
                <ProtectedRoute>
                  <BusinessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/business/admin/partners"
              element={
                <ProtectedRoute>
                  <BusinessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="business/admin/partners"
              element={
                <ProtectedRoute>
                  <BusinessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/business/admin/configuration"
              element={
                <ProtectedRoute>
                  <BusinessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/business/admin/services"
              element={
                <ProtectedRoute>
                  <BusinessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="business/admin/configuration"
              element={
                <ProtectedRoute>
                  <BusinessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="business/admin/services"
              element={
                <ProtectedRoute>
                  <BusinessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/business/admin/notifications"
              element={<Navigate to="/account/business/admin/configuration" replace />}
            />
            <Route
              path="business/admin/notifications"
              element={<Navigate to="/business/admin/configuration" replace />}
            />
            <Route
              path="account/business/admin/announcements"
              element={<Navigate to="/account/business/admin/configuration" replace />}
            />
            <Route
              path="business/admin/announcements"
              element={<Navigate to="/business/admin/configuration" replace />}
            />
            <Route
              path="account/business/admin/products"
              element={<Navigate to="/account/business/admin/configuration" replace />}
            />
            <Route
              path="business/admin/products"
              element={<Navigate to="/business/admin/configuration" replace />}
            />
            <Route
              path="account/manage-partners"
              element={
                <ProtectedRoute>
                  <ManagePartners />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/company"
              element={<PartnerCompany />}
            />
            <Route path="dashboard" element={<Navigate to="/account/dashboard" replace />} />
            <Route path="patch-notes" element={<PatchNotes />} />
          </Route>
          <Route path="/cart/c/*" element={<ShopifyCheckoutBridge />} />
          <Route path="/404" element={<Suspense fallback={null}><NotFoundPage /></Suspense>} />
          <Route path="/partner/onboarding" element={<Suspense fallback={null}><PartnerRoute requireOnboarded={false}><PartnerOnboarding /></PartnerRoute></Suspense>} />
          <Route path="/partner/dashboard" element={<Suspense fallback={null}><PartnerRoute requireOnboarded={true}><PartnerDashboardLayout /></PartnerRoute></Suspense>}>
            <Route index element={<PartnerOverview />} />
            <Route path="clients" element={<PartnerClients />} />
            <Route path="vehicles" element={<PartnerVehicles />} />
            <Route path="warranties" element={<PartnerWarranties />} />
            <Route path="stats" element={<PartnerStatistics />} />
            <Route path="certification" element={<PartnerCertification />} />
            <Route path="settings" element={<PartnerSettings />} />
          </Route>
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </CartProvider>
    </NotificationsProvider>
    </AdminProvider>
  )
}

export default App
