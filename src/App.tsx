import { Routes, Route, Navigate } from 'react-router-dom'
import { CartProvider } from '@/context/CartContext'
import { Layout } from '@/components/Layout/Layout'
import { Home } from '@/pages/Home'
import { Shop } from '@/pages/Shop'
import { Product } from '@/pages/Product'
import { Cart } from '@/pages/Cart'
import { Account } from '@/pages/Account'
import { AccountRegister } from '@/pages/AccountRegister'
import { AccountDashboard } from '@/pages/AccountDashboard'

function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="boutique" element={<Shop />} />
          <Route path="boutique/:categoryId" element={<Shop />} />
          <Route path="produit/:slug" element={<Product />} />
          <Route path="panier" element={<Cart />} />
          <Route path="account" element={<Account />} />
          <Route path="account/register" element={<AccountRegister />} />
          <Route path="account/dashboard" element={<AccountDashboard />} />
          <Route path="compte" element={<Navigate to="/account" replace />} />
        </Route>
      </Routes>
    </CartProvider>
  )
}

export default App
