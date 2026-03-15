import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CATEGORIES, type CategoryId, type Product } from '@/data/products'
import { fetchProductsFromShopify } from '@/utils/shopifyStorefront'
import { LiquidGlassSelect } from '@/components/LiquidGlassSelect'
import { getCurrentUserProfile } from '@/utils/supabaseAuth'

export function Shop() {
  const { t } = useTranslation()
  const { categoryId } = useParams<{ categoryId?: string }>()
  const location = useLocation()
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('best-sellers')
  const [onSale, setOnSale] = useState(false)
  const [inStock, setInStock] = useState(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])
  const [showPriceMenu, setShowPriceMenu] = useState(false)
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [isPartner, setIsPartner] = useState(false)

  // Détecter la catégorie depuis l'URL (support /boutique/category et /category)
  // Liste des routes qui ne sont pas des catégories
  const nonCategoryRoutes = ['produit', 'about', 'panier', 'car-club', 'contact', 'legal', 'academy', 'join-fireball', 'account', 'partner', 'dashboard', 'compte', 'boutique']
  const pathSegment = location.pathname !== '/' && !location.pathname.startsWith('/boutique/')
    ? location.pathname.slice(1).split('/')[0] 
    : undefined
  const pathCategoryId = pathSegment && !nonCategoryRoutes.includes(pathSegment) && CATEGORIES.some(c => c.id === pathSegment)
    ? pathSegment
    : undefined
  const detectedCategoryId = categoryId || pathCategoryId

  // Calculer le prix min/max des produits de la catégorie
  const categoryProducts = detectedCategoryId
    ? allProducts.filter((p) => p.category === (detectedCategoryId as CategoryId))
    : []
  const minPrice = categoryProducts.length > 0 ? Math.min(...categoryProducts.map((p) => p.price)) : 0
  const maxPrice = categoryProducts.length > 0 ? Math.max(...categoryProducts.map((p) => p.price)) : 1000

  // Initialiser et corriger le priceRange avec les valeurs réelles
  useEffect(() => {
    if (categoryProducts.length > 0) {
      const newMinPrice = Math.min(...categoryProducts.map((p) => p.price))
      const newMaxPrice = Math.max(...categoryProducts.map((p) => p.price))
      
      // Si c'est l'initialisation ou si les valeurs sont hors limites, réinitialiser
      if (priceRange[0] === 0 && priceRange[1] === 1000) {
        setPriceRange([newMinPrice, newMaxPrice])
      } else {
        // Corriger les valeurs si elles sont hors limites
        let correctedMin = Math.max(priceRange[0], newMinPrice)
        let correctedMax = Math.min(priceRange[1], newMaxPrice)
        
        // S'assurer que min <= max
        if (correctedMin > correctedMax) {
          correctedMin = newMinPrice
          correctedMax = newMaxPrice
        }
        
        // Arrondir à 2 décimales pour éviter les problèmes de précision
        correctedMin = Math.round(correctedMin * 100) / 100
        correctedMax = Math.round(correctedMax * 100) / 100
        
        if (correctedMin !== priceRange[0] || correctedMax !== priceRange[1]) {
          setPriceRange([correctedMin, correctedMax])
        }
      }
    } else {
      // Pas de produits, réinitialiser
      setPriceRange([0, 1000])
    }
  }, [detectedCategoryId, allProducts.length, categoryProducts.length])

  // Fermer le menu prix quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const priceMenu = document.querySelector('[data-price-menu]')
      if (showPriceMenu && priceMenu && !priceMenu.contains(target)) {
        setShowPriceMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPriceMenu])

  // Gérer l'expansion de la recherche
  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [searchExpanded])

  // Fermer la recherche quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const searchContainer = document.querySelector('[data-search-container]')
      if (searchContainer && !searchContainer.contains(target) && searchExpanded) {
        if (!searchQuery.trim()) {
          setSearchExpanded(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [searchExpanded, searchQuery])

  // Vérifier le rôle utilisateur (Partner)
  useEffect(() => {
    let cancelled = false
    const checkPartner = async () => {
      try {
        const profile = await getCurrentUserProfile()
        if (!cancelled) {
          if (profile) {
            const role = (profile.role || '').toLowerCase()
            const partnerStatus = (profile.partner_status || '').toLowerCase()
            setIsPartner(role === 'partner' || partnerStatus === 'partner')
          } else {
            setIsPartner(false)
          }
        }
      } catch (err) {
        console.error('Error checking partner status:', err)
        if (!cancelled) {
          setIsPartner(false)
        }
      }
    }
    checkPartner()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const products = await fetchProductsFromShopify()
        if (!cancelled) {
          setAllProducts(products)
        }
      } catch (err) {
        console.error('Unable to load Shopify products', err)
        if (!cancelled) {
          setError(t('shop.loadError'))
          setAllProducts([]) // Pas de fallback sur les produits statiques
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [t])

  const category = detectedCategoryId ? CATEGORIES.find((c) => c.id === detectedCategoryId) : null

  // Séparer les produits normaux et les produits bloqués (partner-only)
  const allCategoryProducts = detectedCategoryId
    ? allProducts.filter((p) => p.category === (detectedCategoryId as CategoryId))
    : allProducts

  const availableProducts = allCategoryProducts.filter((p) => !p.partnerOnly || isPartner)
  const blockedProducts = detectedCategoryId && !isPartner
    ? allCategoryProducts.filter((p) => p.partnerOnly)
    : []

  // Filtrer et trier les produits disponibles
  let filteredProducts = availableProducts

  // Debug: Afficher le nombre de produits avant et après filtrage
  console.log('[Shop] Total products:', allProducts.length)
  console.log('[Shop] After partner filter:', allProducts.filter(p => !p.partnerOnly || isPartner).length)
  console.log('[Shop] Filtered products:', filteredProducts.length)
  console.log('[Shop] Is Partner:', isPartner)
  console.log('[Shop] Partner-only products:', allProducts.filter(p => p.partnerOnly).length)
  console.log('[Shop] Category:', detectedCategoryId)

  // Filtre: Recherche
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim()
    filteredProducts = filteredProducts.filter((p) =>
      p.name.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query)
    )
  }

  // Filtre: En promotion
  if (onSale) {
    // Pour l'instant, on considère qu'un produit est en promotion s'il a un badge
    filteredProducts = filteredProducts.filter((p) => p.badge)
  }

  // Filtre: En stock
  if (inStock) {
    // Filtrer les produits qui ont des variantes disponibles
    filteredProducts = filteredProducts.filter((p) => {
      // Si le produit a des variantes, vérifier qu'au moins une est disponible
      if (p.variants && p.variants.length > 0) {
        return p.variants.some((v) => v.availableForSale)
      }
      // Sinon, considérer comme disponible par défaut
      return true
    })
  }

  // Filtre: Prix
  filteredProducts = filteredProducts.filter(
    (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
  )

  // Trier les produits
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        // Pour l'instant, on trie par ID (à améliorer avec les dates Shopify)
        return b.id.localeCompare(a.id)
      case 'price-low-high':
        return a.price - b.price
      case 'price-high-low':
        return b.price - a.price
      case 'best-sellers':
      default:
        // Pour l'instant, on garde l'ordre original
        return 0
    }
  })

  const products = sortedProducts

  // Si pas de catégorie détectée, rediriger ou afficher un message
  if (!detectedCategoryId && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center py-24">
          <p className="text-carbon-600 text-lg">{t('shop.selectCategory')}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Hero section avec le nom de la catégorie */}
      {category && (
        <section className="relative min-h-[70vh] flex items-start justify-center border-b border-carbon-800 pt-20">
          <div className="w-full px-6 text-center pt-16 md:pt-24">
            {/* Catégorie en dégradé */}
            <h1 className="text-[clamp(5.5rem,18vw,14rem)] font-black uppercase leading-[0.78] tracking-[-0.045em] bg-gradient-to-b from-white/[0.2] via-white/[0.08] to-transparent bg-clip-text text-transparent whitespace-nowrap overflow-hidden select-none">
              {category.name}
            </h1>
          </div>
        </section>
      )}

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Filtres */}
        {category && !loading && (
          <div className="mb-12 flex flex-wrap items-end gap-4 justify-between">
            {/* Filtres à gauche */}
            <div className="flex flex-wrap items-end gap-4">
              {/* Filter by dropdown */}
              <div className="w-full sm:w-auto">
                <label className="block text-white/80 text-sm mb-2 font-medium">Filter by</label>
                <LiquidGlassSelect
                  label=""
                  value={sortBy}
                  options={[
                    { value: 'best-sellers', label: 'Best sellers' },
                    { value: 'newest', label: 'Newest' },
                    { value: 'price-low-high', label: 'Price: Low - High' },
                    { value: 'price-high-low', label: 'Price: High - Low' },
                  ]}
                  onChange={setSortBy}
                  placeholder="Filter by"
                  searchable={false}
                />
              </div>

              {/* On Sale button */}
              <button
                type="button"
                onClick={() => setOnSale(!onSale)}
                className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors h-[42px] flex items-center ${
                  onSale
                    ? 'bg-white text-carbon-950'
                    : 'bg-white/[0.06] border border-white/15 text-white hover:bg-white/10'
                }`}
              >
                On Sale
              </button>

              {/* Price menu */}
              <div className="relative">
                <button
                  data-price-button
                  type="button"
                  onClick={() => setShowPriceMenu(!showPriceMenu)}
                  className="px-4 py-2.5 rounded-2xl text-sm font-medium bg-white/[0.06] border border-white/15 text-white hover:bg-white/10 transition-colors h-[42px] flex items-center justify-between gap-2"
                >
                  <span>Price</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${showPriceMenu ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showPriceMenu && (
                  <div data-price-menu className="absolute top-full left-0 mt-2 p-4 rounded-xl bg-carbon-900 border border-carbon-700 shadow-xl z-50 min-w-[300px]">
                    <div className="mb-4">
                      <label className="block text-white text-sm mb-3 font-medium">
                        Price Range: ${priceRange[0].toFixed(2)} $CA - ${priceRange[1].toFixed(2)} $CA
                      </label>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-3">
                            <span className="text-white/70 text-xs">Min</span>
                            <span className="text-white text-xs font-medium">${priceRange[0].toFixed(2)} $CA</span>
                          </div>
                          <input
                            type="range"
                            className="level-price w-full"
                            min={minPrice}
                            max={Math.min(priceRange[1], maxPrice)}
                            step={maxPrice > minPrice ? 0.01 : 1}
                            value={Math.max(minPrice, Math.min(priceRange[0], priceRange[1]))}
                            onChange={(e) => {
                              const newMin = Math.round(Number(e.target.value) * 100) / 100
                              const clampedMin = Math.max(minPrice, Math.min(newMin, priceRange[1]))
                              if (clampedMin <= priceRange[1]) {
                                setPriceRange([clampedMin, priceRange[1]])
                              }
                            }}
                            onMouseUp={() => {
                              // S'assurer que les valeurs sont correctes après le drag
                              if (priceRange[0] > priceRange[1]) {
                                setPriceRange([priceRange[1], priceRange[1]])
                              }
                            }}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-3">
                            <span className="text-white/70 text-xs">Max</span>
                            <span className="text-white text-xs font-medium">${priceRange[1].toFixed(2)} $CA</span>
                          </div>
                          <input
                            type="range"
                            className="level-price w-full"
                            min={Math.max(priceRange[0], minPrice)}
                            max={maxPrice}
                            step={maxPrice > minPrice ? 0.01 : 1}
                            value={Math.max(priceRange[0], Math.min(priceRange[1], maxPrice))}
                            onChange={(e) => {
                              const newMax = Math.round(Number(e.target.value) * 100) / 100
                              const clampedMax = Math.max(priceRange[0], Math.min(newMax, maxPrice))
                              if (clampedMax >= priceRange[0]) {
                                setPriceRange([priceRange[0], clampedMax])
                              }
                            }}
                            onMouseUp={() => {
                              // S'assurer que les valeurs sont correctes après le drag
                              if (priceRange[1] < priceRange[0]) {
                                setPriceRange([priceRange[0], priceRange[0]])
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPriceMenu(false)}
                      className="w-full px-4 py-2 rounded-lg bg-white text-carbon-950 text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* In Stock button */}
              <button
                type="button"
                onClick={() => setInStock(!inStock)}
                className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors h-[42px] flex items-center ${
                  inStock
                    ? 'bg-white text-carbon-950'
                    : 'bg-white/[0.06] border border-white/15 text-white hover:bg-white/10'
                }`}
              >
                In Stock
              </button>
            </div>

            {/* Search button à droite */}
            <div className="flex items-end">
              <div
                data-search-container
                className={`relative flex items-center flex-row-reverse transition-all duration-300 ease-in-out h-[42px] rounded-2xl bg-white/[0.06] border border-white/15 overflow-hidden ${
                  searchExpanded
                    ? 'w-[300px] sm:w-[400px] md:w-[500px]'
                    : 'w-[42px]'
                }`}
              >
                {/* Icône fixe à droite */}
                <button
                  type="button"
                  onClick={() => {
                    setSearchExpanded(!searchExpanded)
                    if (!searchExpanded && searchInputRef.current) {
                      setTimeout(() => searchInputRef.current?.focus(), 100)
                    }
                  }}
                  className="h-full w-[42px] flex items-center justify-center flex-shrink-0 text-white hover:bg-white/10 transition-colors relative group"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-r-2xl" />
                  <svg
                    className="w-5 h-5 relative z-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
                {/* Input qui s'élargit vers la gauche */}
                {searchExpanded && (
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="flex-1 h-full px-4 py-2.5 bg-transparent text-white placeholder-white/50 focus:outline-none"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-chrome mx-auto mb-4"></div>
            <p className="text-carbon-600">{t('shop.loading')}</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-24">
          <p className="text-amber-300 mb-4">{error}</p>
          <p className="text-carbon-600 text-sm">{t('shop.loadError')}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24">
          {onSale ? (
            <div className="max-w-md mx-auto">
              <p className="text-carbon-600 text-lg mb-2">We're sorry</p>
              <p className="text-carbon-600 mb-8">
                There are currently no promotions available in this category. Stay informed about upcoming sales and exclusive offers.
              </p>
              <Link
                to="/join-fireball"
                className="group inline-flex items-center gap-1.5 text-xs font-medium text-carbon-600 hover:text-white transition-colors duration-200 pb-1"
              >
                <span>Create an account to stay informed</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 640 640"
                  className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                >
                  <path fill="currentColor" d="M566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L406.6 137.3C394.1 124.8 373.8 124.8 361.3 137.3C348.8 149.8 348.8 170.1 361.3 182.6L466.7 288L96 288C78.3 288 64 302.3 64 320C64 337.7 78.3 352 96 352L466.7 352L361.3 457.4C348.8 469.9 348.8 490.2 361.3 502.7C373.8 515.2 394.1 515.2 406.6 502.7L566.6 342.7z" />
                </svg>
              </Link>
            </div>
          ) : (
            <p className="text-carbon-600">{t('shop.noProducts')}</p>
          )}
        </div>
      ) : (
        <>
          {/* Message pour les produits bloqués si l'utilisateur n'est pas Partner */}
          {blockedProducts.length > 0 && (
            <div className="mb-12 p-6 rounded-2xl bg-[#B61B1B]/10 border border-[#B61B1B]/30">
              <p className="text-white text-lg mb-4">
                Some products in this category are restricted to certified installers only.
              </p>
              <Link
                to="/join-fireball"
                className="group inline-flex items-center gap-2 text-sm font-medium text-carbon-600 hover:text-white transition-colors duration-200"
              >
                <span>Become a certified installer</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 640 640"
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                >
                  <path fill="currentColor" d="M566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L406.6 137.3C394.1 124.8 373.8 124.8 361.3 137.3C348.8 149.8 348.8 170.1 361.3 182.6L466.7 288L96 288C78.3 288 64 302.3 64 320C64 337.7 78.3 352 96 352L466.7 352L361.3 457.4C348.8 469.9 348.8 490.2 361.3 502.7C373.8 515.2 394.1 515.2 406.6 502.7L566.6 342.7z" />
                </svg>
              </Link>
            </div>
          )}

          {/* Produits disponibles */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => {
            // Utiliser le rating réel du produit ou 0 par défaut
            const rating = product.rating || 0
            
            return (
              <Link
                key={product.id}
                to={`/produit/${product.slug}`}
                className="group"
              >
                {/* Image réduite avec coins arrondis */}
                <div className="aspect-square bg-carbon-800 overflow-hidden rounded-lg mb-3">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                
                {/* Informations produit */}
                <div className="flex flex-col gap-1">
                  <h2 className="text-white text-sm font-bold truncate">
                    {product.name}
                  </h2>
                  
                  {/* Étoiles */}
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(rating)
                            ? 'text-yellow-400'
                            : i < rating
                            ? 'text-yellow-400/50'
                            : 'text-carbon-600'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  
                  {/* Prix */}
                  <p className="text-white text-sm font-bold">
                    {product.price.toFixed(2)} $CA
                  </p>
                </div>
              </Link>
            )
          })}
          </div>

          {/* Produits bloqués (flous) */}
          {blockedProducts.length > 0 && (
            <>
              <div className="mt-16 mb-8">
                <h3 className="text-white text-xl font-semibold mb-2">Certified Installer Products</h3>
                <p className="text-carbon-600 text-sm">
                  These products are available exclusively to certified Fireball installers.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {blockedProducts.map((product) => {
                  const rating = product.rating || 0
                  
                  return (
                    <div
                      key={product.id}
                      className="group relative select-none"
                    >
                      {/* Overlay avec icône de cadenas centrée */}
                      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                        <div className="text-center px-4">
                          <svg
                            className="w-12 h-12 mx-auto mb-3 text-white/50"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                          <p className="text-white text-sm font-medium mb-2 blur-sm">Certified Installer Only</p>
                          <Link
                            to="/join-fireball"
                            className="inline-block text-xs font-medium underline transition-colors pointer-events-auto"
                            style={{ color: '#B61B1B' }}
                          >
                            Become certified
                          </Link>
                        </div>
                      </div>

                      {/* Image réduite avec coins arrondis - floutée individuellement */}
                      <div className="aspect-square mb-3 rounded-lg overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover blur-sm"
                        />
                      </div>
                      
                      {/* Nom du produit - flouté individuellement avec espacement */}
                      <div className="mb-1 select-none">
                        <h3 className="text-white text-sm font-bold truncate blur-sm">
                          {product.name}
                        </h3>
                      </div>
                      
                      {/* Étoiles et avis - floutés individuellement avec espacement */}
                      <div className="flex items-center gap-2 mb-1 select-none">
                        <div className="flex items-center gap-0.5 blur-sm">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(rating)
                                  ? 'text-yellow-400'
                                  : i < rating
                                    ? 'text-yellow-400/50'
                                    : 'text-carbon-600'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        {product.reviewCount !== undefined && (
                          <span className="text-xs font-bold text-white underline blur-sm">
                            {product.reviewCount} Reviews
                          </span>
                        )}
                      </div>
                      
                      {/* Prix - flouté individuellement avec espacement */}
                      <div className="select-none">
                        <p className="text-white text-sm font-bold blur-sm">
                          {product.price.toFixed(2)} $CA
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
      </div>
    </div>
  )
}
