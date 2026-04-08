import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { CartProvider } from '@/context/CartContext'
import { NotificationsProvider } from '@/context/NotificationsContext'
import { Layout } from '@/components/Layout/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PartnerRoute } from '@/components/PartnerRoute'
import { Home } from '@/pages/Home'
import { Shop } from '@/pages/Shop'
import { About } from '@/pages/About'
import { PressKit } from '@/pages/PressKit'
import { Product } from '@/pages/Product'
import { Cart } from '@/pages/Cart'
import { Account } from '@/pages/Account'
import { AccountRegister } from '@/pages/AccountRegister'
import { AccountDashboard } from '@/pages/AccountDashboard'
import { AccountSettings } from '@/pages/AccountSettings'
import { BusinessPage } from '@/pages/BusinessPage'
import { ManagePartners } from '@/pages/ManagePartners'
import { PartnerCompany } from '@/pages/PartnerCompany'
import { CarClub } from '@/pages/CarClub'
import { Event } from '@/pages/Event'
import { EventDetail } from '@/pages/EventDetail'
import { Contact } from '@/pages/Contact'
import { Legal } from '@/pages/Legal'
import { Academy } from '@/pages/Academy'
import { JoinFireball } from '@/pages/JoinFireball'
import { PartnerOnboarding } from '@/pages/partner/PartnerOnboarding'
import { PartnerDashboardLayout } from '@/pages/partner/PartnerDashboardLayout'
import { PartnerOverview } from '@/pages/partner/PartnerOverview'
import { PartnerClients } from '@/pages/partner/PartnerClients'
import { PartnerVehicles } from '@/pages/partner/PartnerVehicles'
import { PartnerWarranties } from '@/pages/partner/PartnerWarranties'
import { PartnerCertification } from '@/pages/partner/PartnerCertification'
import { PartnerSettings } from '@/pages/partner/PartnerSettings'
import { PartnerStatistics } from '@/pages/partner/PartnerStatistics'
import { Typhon } from '@/pages/coating/Typhon'
import { CompareCoatings } from '@/pages/coatings/CompareCoatings'
import { CeramicCoating } from '@/pages/coatings/CeramicCoating'
import { FindInstaller } from '@/pages/coatings/FindInstaller'
import { HowItWorks } from '@/pages/coatings/HowItWorks'
import { CATEGORIES } from '@/data/products'
import { NotFoundPage } from '@/components/NotFoundPage'

function LegacyProduitRedirect() {
  const { slug } = useParams<{ slug: string }>()
  return <Navigate to={`/product/${slug}`} replace />
}

/** Anciennes URLs `/shop/:cat` → `/:cat` (ex. `/shop/coatings` → `/coatings`). */
function LegacyShopCategoryRedirect() {
  const { categoryId } = useParams<{ categoryId: string }>()
  return <Navigate to={`/${categoryId}`} replace />
}

function CategoryRoute() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const isValid = CATEGORIES.some((c) => c.id === categoryId)
  if (!isValid) return <Navigate to="/404" replace />
  return <Shop />
}

function App() {
  return (
    <NotificationsProvider>
      <CartProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="boutique" element={<Shop />} />
            <Route path="boutique/:categoryId" element={<Shop />} />
            <Route path="shop" element={<Navigate to="/boutique" replace />} />
            <Route path="shop/:categoryId" element={<LegacyShopCategoryRedirect />} />
            <Route path="product/:slug" element={<Product />} />
            <Route path="produit/:slug" element={<LegacyProduitRedirect />} />
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
            <Route path="panier" element={<Navigate to="/cart" replace />} />
            <Route path="car-club" element={<CarClub />} />
            <Route path="event/:eventSlug" element={<EventDetail />} />
            <Route path="event" element={<Event />} />
            <Route path="contact" element={<Contact />} />
            <Route path="legal" element={<Legal />} />
            <Route path="academy" element={<Academy />} />
            <Route path="coating/typhon" element={<Typhon />} />
            <Route path="join-fireball" element={<JoinFireball />} />
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
              path="account/business/admin/notifications"
              element={
                <ProtectedRoute>
                  <BusinessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="business/admin/notifications"
              element={
                <ProtectedRoute>
                  <BusinessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/business/admin/announcements"
              element={
                <ProtectedRoute>
                  <BusinessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="business/admin/announcements"
              element={
                <ProtectedRoute>
                  <BusinessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/business/admin/products"
              element={
                <ProtectedRoute>
                  <BusinessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="business/admin/products"
              element={
                <ProtectedRoute>
                  <BusinessPage />
                </ProtectedRoute>
              }
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
            <Route path="compte" element={<Navigate to="/account" replace />} />
          </Route>
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="/partner/onboarding" element={<PartnerRoute requireOnboarded={false}><PartnerOnboarding /></PartnerRoute>} />
          <Route path="/partner/dashboard" element={<PartnerRoute requireOnboarded={true}><PartnerDashboardLayout /></PartnerRoute>}>
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
  )
}

export default App
