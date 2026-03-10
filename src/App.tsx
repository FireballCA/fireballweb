import { Routes, Route, Navigate } from 'react-router-dom'
import { CartProvider } from '@/context/CartContext'
import { NotificationsProvider } from '@/context/NotificationsContext'
import { Layout } from '@/components/Layout/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PartnerRoute } from '@/components/PartnerRoute'
import { Home } from '@/pages/Home'
import { Shop } from '@/pages/Shop'
import { About } from '@/pages/About'
import { Product } from '@/pages/Product'
import { Cart } from '@/pages/Cart'
import { Account } from '@/pages/Account'
import { AccountRegister } from '@/pages/AccountRegister'
import { AccountDashboard } from '@/pages/AccountDashboard'
import { BusinessPage } from '@/pages/BusinessPage'
import { ManagePartners } from '@/pages/ManagePartners'
import { PartnerCompany } from '@/pages/PartnerCompany'
import { CarClub } from '@/pages/CarClub'
import { Contact } from '@/pages/Contact'
import { Legal } from '@/pages/Legal'
import { PartnerOnboarding } from '@/pages/partner/PartnerOnboarding'
import { PartnerDashboardLayout } from '@/pages/partner/PartnerDashboardLayout'
import { PartnerOverview } from '@/pages/partner/PartnerOverview'
import { PartnerClients } from '@/pages/partner/PartnerClients'
import { PartnerVehicles } from '@/pages/partner/PartnerVehicles'
import { PartnerWarranties } from '@/pages/partner/PartnerWarranties'
import { PartnerCertification } from '@/pages/partner/PartnerCertification'
import { PartnerSettings } from '@/pages/partner/PartnerSettings'

function App() {
  return (
    <NotificationsProvider>
      <CartProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="boutique" element={<Shop />} />
            <Route path="boutique/:categoryId" element={<Shop />} />
            <Route path="produit/:slug" element={<Product />} />
            <Route path="about" element={<About />} />
            <Route path="panier" element={<Cart />} />
            <Route path="car-club" element={<CarClub />} />
            <Route path="contact" element={<Contact />} />
            <Route path="legal" element={<Legal />} />
            <Route path="join-fireball" element={<PartnerCompany />} />
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
              path="account/business"
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
              path="account/business/admin"
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
              path="account/business/admin/partners"
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
          <Route path="/partner/onboarding" element={<PartnerRoute requireOnboarded={false}><PartnerOnboarding /></PartnerRoute>} />
          <Route path="/partner/dashboard" element={<PartnerRoute requireOnboarded={true}><PartnerDashboardLayout /></PartnerRoute>}>
            <Route index element={<PartnerOverview />} />
            <Route path="clients" element={<PartnerClients />} />
            <Route path="vehicles" element={<PartnerVehicles />} />
            <Route path="warranties" element={<PartnerWarranties />} />
            <Route path="certification" element={<PartnerCertification />} />
            <Route path="settings" element={<PartnerSettings />} />
          </Route>
        </Routes>
      </CartProvider>
    </NotificationsProvider>
  )
}

export default App
