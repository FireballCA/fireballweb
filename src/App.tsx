import { Routes, Route } from 'react-router-dom'
import { CartProvider } from '@/context/CartContext'
import { Layout } from '@/components/Layout/Layout'
import { Home } from '@/pages/Home'
import { Shop } from '@/pages/Shop'
import { Product } from '@/pages/Product'
import { Cart } from '@/pages/Cart'

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
        </Route>
      </Routes>
    </CartProvider>
  )
}

export default App
