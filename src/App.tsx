import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { CartProvider } from '@/context/CartContext'
import { NotificationsProvider } from '@/context/NotificationsContext'
import { Layout } from '@/components/Layout/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PartnerRoute } from '@/components/PartnerRoute'
import { AdminProvider } from '@/context/AdminContext'
import { CATEGORIES } from '@/data/products'

// Core pages — chargées immédiatement (above-the-fold)
import { Home } from '@/pages/Home'
import { Shop } from '@/pages/Shop'
import { Product } from '@/pages/Product'

// Toutes les autres pages — lazy loaded (code splitting)
const About = lazy(() => import('@/pages/About').then(m => ({ default: m.About })))
const PressKit = lazy(() => import('@/pages/PressKit').then(m => ({ default: m.PressKit })))
const Cart = lazy(() => import('@/pages/Cart').then(m => ({ default: m.Cart })))
const Account = lazy(() => import('@/pages/Account').then(m => ({ default: m.Account })))
const AccountRegister = lazy(() => import('@/pages/AccountRegister').then(m => ({ default: m.AccountRegister })))
const AccountDashboard = lazy(() => import('@/pages/AccountDashboard').then(m => ({ default: m.AccountDashboard })))
const AccountOrders = lazy(() => import('@/pages/AccountOrders').then(m => ({ default: m.AccountOrders })))
const AccountTrackOrder = lazy(() => import('@/pages/AccountTrackOrder').then(m => ({ default: m.AccountTrackOrder })))
const AccountSettings = lazy(() => import('@/pages/AccountSettings').then(m => ({ default: m.AccountSettings })))
const BusinessPage = lazy(() => import('@/pages/BusinessPage').then(m => ({ default: m.BusinessPage })))
const ManagePartners = lazy(() => import('@/pages/ManagePartners').then(m => ({ default: m.ManagePartners })))
const PartnerCompany = lazy(() => import('@/pages/PartnerCompany').then(m => ({ default: m.PartnerCompany })))
const CarClub = lazy(() => import('@/pages/CarClub').then(m => ({ default: m.CarClub })))
const Event = lazy(() => import('@/pages/Event').then(m => ({ default: m.Event })))
const EventDetail = lazy(() => import('@/pages/EventDetail').then(m => ({ default: m.EventDetail })))
const Contact = lazy(() => import('@/pages/Contact').then(m => ({ default: m.Contact })))
const Legal = lazy(() => import('@/pages/Legal').then(m => ({ default: m.Legal })))
const LegalNotice = lazy(() => import('@/pages/LegalNotice').then(m => ({ default: m.LegalNotice })))
const Cookies = lazy(() => import('@/pages/Cookies').then(m => ({ default: m.Cookies })))
const Privacy = lazy(() => import('@/pages/Privacy').then(m => ({ default: m.Privacy })))
const TermsOfService = lazy(() => import('@/pages/TermsOfService').then(m => ({ default: m.TermsOfService })))
const Academy = lazy(() => import('@/pages/Academy').then(m => ({ default: m.Academy })))
const TrainingRegistrationThankYou = lazy(() => import('@/pages/TrainingRegistrationThankYou').then(m => ({ default: m.TrainingRegistrationThankYou })))
const JoinClub = lazy(() => import('@/pages/JoinClub').then(m => ({ default: m.JoinClub })))
const ServiceBuilder = lazy(() => import('@/pages/ServiceBuilder').then(m => ({ default: m.ServiceBuilder })))
const PatchNotes = lazy(() => import('@/pages/PatchNotes').then(m => ({ default: m.PatchNotes })))
const NotFoundPage = lazy(() => import('@/components/NotFoundPage').then(m => ({ default: m.NotFoundPage })))

// Partner portal — lazy loaded
const PartnerOnboarding = lazy(() => import('@/pages/partner/PartnerOnboarding').then(m => ({ default: m.PartnerOnboarding })))
const PartnerDashboardLayout = lazy(() => import('@/pages/partner/PartnerDashboardLayout').then(m => ({ default: m.PartnerDashboardLayout })))
const PartnerOverview = lazy(() => import('@/pages/partner/PartnerOverview').then(m => ({ default: m.PartnerOverview })))
const PartnerClients = lazy(() => import('@/pages/partner/PartnerClients').then(m => ({ default: m.PartnerClients })))
const PartnerVehicles = lazy(() => import('@/pages/partner/PartnerVehicles').then(m => ({ default: m.PartnerVehicles })))
const PartnerWarranties = lazy(() => import('@/pages/partner/PartnerWarranties').then(m => ({ default: m.PartnerWarranties })))
const PartnerCertification = lazy(() => import('@/pages/partner/PartnerCertification').then(m => ({ default: m.PartnerCertification })))
const PartnerSettings = lazy(() => import('@/pages/partner/PartnerSettings').then(m => ({ default: m.PartnerSettings })))
const PartnerStatistics = lazy(() => import('@/pages/partner/PartnerStatistics').then(m => ({ default: m.PartnerStatistics })))

// Coatings pages — lazy loaded
const CompareCoatings = lazy(() => import('@/pages/coatings/CompareCoatings').then(m => ({ default: m.CompareCoatings })))
const CeramicCoating = lazy(() => import('@/pages/coatings/CeramicCoating').then(m => ({ default: m.CeramicCoating })))
const FindInstaller = lazy(() => import('@/pages/coatings/FindInstaller').then(m => ({ default: m.FindInstaller })))
const HowItWorks = lazy(() => import('@/pages/coatings/HowItWorks').then(m => ({ default: m.HowItWorks })))

function LegacyProductRedirect() {
  const { slug } = useParams<{ slug: string }>()
  return <Navigate to={`/products/${slug}`} replace />
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
