import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { CATEGORIES, PRODUCTS, type Product as LocalProduct } from '@/data/products'
import { useCart } from '@/context/CartContext'
import { fetchProductFromShopifyBySlug, fetchProductsFromShopify } from '@/utils/shopifyStorefront'

type ProductType = LocalProduct

export function Product() {
  const { t } = useTranslation()
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [product, setProduct] = useState<ProductType | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [relatedProducts, setRelatedProducts] = useState<LocalProduct[]>([])
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const galleryRef = useRef<HTMLDivElement>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!slug) {
        setLoading(false)
        setProduct(null)
        return
      }
      setLoading(true)
      try {
        const loaded = await fetchProductFromShopifyBySlug(slug)
        if (!cancelled && loaded) {
          setProduct(loaded)
          // Sélectionner la première variante par défaut
          if (loaded.variants && loaded.variants.length > 0) {
            setSelectedVariant(loaded.variants[0].id)
            const defaultOptions: Record<string, string> = {}
            loaded.variants[0].selectedOptions.forEach((opt) => {
              defaultOptions[opt.name] = opt.value
              if (opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'couleur') {
                setSelectedColor(opt.value)
              }
              if (opt.name.toLowerCase() === 'size' || opt.name.toLowerCase() === 'taille') {
                setSelectedSize(opt.value)
              }
            })
            setSelectedOptions(defaultOptions)
          }

          // Charger les produits liés
          try {
            const allProducts = await fetchProductsFromShopify()
            const related = allProducts
              .filter((p) => p.category === loaded.category && p.id !== loaded.id)
              .slice(0, 4)
            if (!cancelled) {
              setRelatedProducts(related)
            }
          } catch (err) {
            const related = PRODUCTS.filter(
              (p) => p.category === loaded.category && p.id !== loaded.id
            ).slice(0, 4)
            if (!cancelled) {
              setRelatedProducts(related)
            }
          }
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
  }, [slug])

  // Trouver la variante correspondant aux options sélectionnées
  const currentVariant = product?.variants?.find((v) => {
    return v.selectedOptions.every(
      (opt) => selectedOptions[opt.name] === opt.value
    )
  })

  const displayPrice = currentVariant?.price ?? product?.price ?? 0
  const displayImage = currentVariant?.image || product?.images?.[selectedImageIndex] || product?.image
  const allImages = product?.images && product.images.length > 0 
    ? product.images 
    : product?.image 
      ? [product.image] 
      : []

  // Extraire les options de couleur et taille
  const colorOptions = product?.options?.find(opt => 
    opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'couleur'
  )?.values || []
  const sizeOptions = product?.options?.find(opt => 
    opt.name.toLowerCase() === 'size' || opt.name.toLowerCase() === 'taille'
  )?.values || []

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-chrome mx-auto mb-4"></div>
          <p className="text-carbon-600">{t('product.loading')}</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-carbon-900 mb-4">{t('product.notFound')}</h1>
          <Link to="/boutique" className="text-chrome hover:underline">
            {t('product.backToShop')}
          </Link>
        </div>
      </div>
    )
  }

  const category = CATEGORIES.find((c) => c.id === product.category)

  const handleAddToCart = () => {
    const productToAdd: ProductType = {
      ...product,
      shopifyVariantId: currentVariant?.id || product.shopifyVariantId,
      price: displayPrice,
    }
    addToCart(productToAdd, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleBuyNow = () => {
    const productToAdd: ProductType = {
      ...product,
      shopifyVariantId: currentVariant?.id || product.shopifyVariantId,
      price: displayPrice,
    }
    addToCart(productToAdd, quantity)
    navigate('/panier')
  }

  const handleOptionChange = (optionName: string, value: string) => {
    const newOptions = { ...selectedOptions, [optionName]: value }
    setSelectedOptions(newOptions)
    
    if (optionName.toLowerCase() === 'color' || optionName.toLowerCase() === 'couleur') {
      setSelectedColor(value)
    }
    if (optionName.toLowerCase() === 'size' || optionName.toLowerCase() === 'taille') {
      setSelectedSize(value)
    }
    
    const matchingVariant = product.variants?.find((v) => {
      return v.selectedOptions.every(
        (opt) => newOptions[opt.name] === opt.value
      )
    })
    
    if (matchingVariant) {
      setSelectedVariant(matchingVariant.id)
      if (matchingVariant.image && product.images) {
        const imageIndex = product.images.findIndex((img) => img === matchingVariant.image)
        if (imageIndex >= 0) {
          setSelectedImageIndex(imageIndex)
        }
      }
    }
  }

  // Swipe handlers pour mobile
  const minSwipeDistance = 50
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    if (isLeftSwipe && allImages.length > 0) {
      setSelectedImageIndex((prev) => (prev + 1) % allImages.length)
    }
    if (isRightSwipe && allImages.length > 0) {
      setSelectedImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
    }
  }

  return (
    <div className="bg-white min-h-screen" data-no-smooth-scroll>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-carbon-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center space-x-2 text-sm text-carbon-600">
            <Link to="/" className="hover:text-carbon-900">{t('product.shop')}</Link>
            <span>/</span>
            {category && (
              <>
                <Link to={`/boutique/${category.id}`} className="hover:text-carbon-900">{category.name}</Link>
                <span>/</span>
              </>
            )}
            <span className="text-carbon-900">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Left: Image Gallery - Sticky */}
          <div className="lg:sticky lg:top-20 lg:self-start space-y-4">
            {/* Main Image */}
            <div
              ref={galleryRef}
              className="relative aspect-square bg-carbon-50 rounded-lg overflow-hidden group"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {product.video && selectedImageIndex === 0 ? (
                <video
                  src={product.video}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={displayImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Navigation Arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-5 h-5 text-carbon-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedImageIndex((prev) => (prev + 1) % allImages.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-5 h-5 text-carbon-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Action Icons */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  type="button"
                  className="w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all"
                  aria-label="Share"
                >
                  <svg className="w-5 h-5 text-carbon-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all"
                  aria-label="Add to wishlist"
                >
                  <svg className="w-5 h-5 text-carbon-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Thumbnails - Carrés arrondis basiques */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-carbon-900 ring-2 ring-carbon-900/20'
                        : 'border-carbon-200 hover:border-carbon-400'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} - View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
                {product.video && (
                  <button
                    type="button"
                    onClick={() => setSelectedImageIndex(0)}
                    className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all flex items-center justify-center bg-carbon-50 ${
                      selectedImageIndex === 0 && product.video
                        ? 'border-carbon-900 ring-2 ring-carbon-900/20'
                        : 'border-carbon-200 hover:border-carbon-400'
                    }`}
                  >
                    <svg className="w-6 h-6 text-carbon-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right: Product Information */}
          <div className="space-y-6">
            {/* Product Title */}
            {product.badge && (
              <span className="inline-block text-xs font-semibold text-chrome uppercase tracking-wide">
                {product.badge}
              </span>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-carbon-900 mb-2">
                {product.name}
              </h1>
              <p className="text-lg text-carbon-600">{product.shortDesc}</p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-carbon-900">
                {displayPrice.toFixed(2)} €
              </span>
            </div>

            {/* Reviews */}
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-chrome" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-carbon-600">4.8</span>
              <span className="text-sm text-carbon-500">(289 {t('product.reviewsBased')})</span>
            </div>

            {/* Description - Collapsible */}
            <div className="border-t border-carbon-200 pt-6">
              <button
                type="button"
                onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                className="w-full flex items-center justify-between text-left group"
              >
                <span className="text-sm font-semibold text-carbon-900 flex items-center gap-2">
                  <svg
                    className={`w-4 h-4 text-carbon-600 transition-transform ${descriptionExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Description
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  descriptionExpanded ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="prose prose-sm max-w-none">
                  <p className="text-carbon-700 leading-relaxed whitespace-pre-line">{product.description}</p>
                </div>
              </div>
            </div>

            {/* Color Selection */}
            {colorOptions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-carbon-900 mb-2">
                  {t('product.quantity')}: {selectedColor || colorOptions[0]}
                </label>
                <div className="flex gap-3">
                  {colorOptions.map((color) => {
                    const isSelected = selectedColor === color || (!selectedColor && color === colorOptions[0])
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleOptionChange(
                          product.options?.find(opt => opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'couleur')?.name || 'Color',
                          color
                        )}
                        className={`w-12 h-12 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-carbon-900 ring-2 ring-carbon-900/20'
                            : 'border-carbon-300 hover:border-carbon-400'
                        }`}
                        style={{
                          backgroundColor: color.toLowerCase() === 'black' ? '#000' : 
                                         color.toLowerCase() === 'white' ? '#fff' :
                                         color.toLowerCase() === 'gray' ? '#6b7280' :
                                         color.toLowerCase() === 'purple' ? '#9333ea' : '#e5e7eb'
                        }}
                        aria-label={color}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {sizeOptions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-carbon-900">
                    {t('product.quantity')}: {selectedSize || sizeOptions[0]}
                  </label>
                  <button type="button" className="text-sm text-carbon-600 hover:text-carbon-900 underline">
                    View Size Chart
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((size) => {
                    const isSelected = selectedSize === size || (!selectedSize && size === sizeOptions[0])
                    const isAvailable = product.variants?.some((v) => {
                      const sizeOpt = v.selectedOptions.find((o) => 
                        (o.name.toLowerCase() === 'size' || o.name.toLowerCase() === 'taille') && o.value === size
                      )
                      return sizeOpt && v.availableForSale
                    })
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleOptionChange(
                          product.options?.find(opt => opt.name.toLowerCase() === 'size' || opt.name.toLowerCase() === 'taille')?.name || 'Size',
                          size
                        )}
                        disabled={!isAvailable}
                        className={`px-4 py-2 text-sm font-medium border-2 rounded transition-all ${
                          isSelected
                            ? 'border-carbon-900 bg-carbon-900 text-white'
                            : isAvailable
                              ? 'border-carbon-300 text-carbon-900 hover:border-carbon-400'
                              : 'border-carbon-200 text-carbon-400 cursor-not-allowed'
                        }`}
                      >
                        {size}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-carbon-900 mb-2">
                {t('product.quantity')}
              </label>
              <div className="flex items-center gap-3">
                <div className="flex border border-carbon-300 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-carbon-600 hover:text-carbon-900 hover:bg-carbon-50 transition-colors"
                  >
                    −
                  </button>
                  <span className="w-10 h-10 flex items-center justify-center text-carbon-900 border-x border-carbon-300">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-10 h-10 flex items-center justify-center text-carbon-600 hover:text-carbon-900 hover:bg-carbon-50 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Availability */}
            {currentVariant && !currentVariant.availableForSale && (
              <p className="text-sm text-amber-600">{t('product.unavailable')}</p>
            )}

            {/* CTAs */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={currentVariant && !currentVariant.availableForSale}
                className={`flex-1 py-4 px-6 rounded-lg font-medium text-white transition-all ${
                  added
                    ? 'bg-carbon-600'
                    : currentVariant && !currentVariant.availableForSale
                      ? 'bg-carbon-300 cursor-not-allowed'
                      : 'bg-carbon-900 hover:bg-carbon-800 active:scale-[0.98]'
                }`}
              >
                {added ? `✓ ${t('product.addedToCart')}` : t('product.addToCart')}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={currentVariant && !currentVariant.availableForSale}
                className={`px-6 py-4 border-2 rounded-lg font-medium transition-all ${
                  currentVariant && !currentVariant.availableForSale
                    ? 'border-carbon-200 text-carbon-400 cursor-not-allowed'
                    : 'border-carbon-900 text-carbon-900 hover:bg-carbon-50 active:scale-[0.98]'
                }`}
              >
                {t('product.buyNow')}
              </button>
            </div>

            {/* Trust Signals */}
            <div className="pt-6 border-t border-carbon-200 space-y-3">
              <div className="flex items-center gap-2 text-sm text-carbon-600">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{t('product.trustFastShipping')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-carbon-600">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>{t('product.trustProfessional')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-carbon-600">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{t('product.trustTrusted')}</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="pt-6 border-t border-carbon-200">
              <p className="text-sm text-carbon-600 mb-3">Secure your payment guarantee.</p>
              <div className="flex items-center gap-4">
                <span className="text-xs text-carbon-500">VISA</span>
                <span className="text-xs text-carbon-500">Mastercard</span>
                <span className="text-xs text-carbon-500">PayPal</span>
              </div>
            </div>

            {/* Return Policy */}
            <div className="pt-6 border-t border-carbon-200">
              <h3 className="text-sm font-semibold text-carbon-900 mb-2">Return</h3>
              <p className="text-sm text-carbon-600">
                You have 60 days to return the item(s) using any of the following methods: Free store return, Free returns via USPS Dropoff Service.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="bg-carbon-50 border-t border-carbon-200 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-carbon-900 mb-8">{t('product.reviewsTitle')}</h2>
          <div className="space-y-6">
            {[
              {
                name: 'Marc D.',
                verified: true,
                rating: 5,
                text: 'Exceptional product! Easy application and impeccable results. The protection really lasts over time.',
              },
              {
                name: 'Sophie L.',
                verified: true,
                rating: 5,
                text: 'Professional quality delivered. I highly recommend for all detailing enthusiasts.',
              },
              {
                name: 'Thomas R.',
                verified: true,
                rating: 5,
                text: 'The best coating I\'ve used. Incredible shine and durable protection.',
              },
            ].map((review, i) => (
              <div key={i} className="bg-white p-6 rounded-lg border border-carbon-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-carbon-900">{review.name}</span>
                      {review.verified && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                          ✓ {t('product.reviewVerified')}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(review.rating)].map((_, j) => (
                        <svg key={j} className="w-4 h-4 text-chrome" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-carbon-700 leading-relaxed">{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-carbon-900 mb-4">{t('product.relatedTitle')}</h2>
            <p className="text-carbon-600 mb-8">{t('product.relatedDesc')}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  to={`/produit/${relatedProduct.slug}`}
                  className="group"
                >
                  <div className="aspect-square bg-carbon-50 rounded-lg overflow-hidden mb-3">
                    <img
                      src={relatedProduct.image}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="font-medium text-carbon-900 mb-1 group-hover:text-chrome transition-colors">
                    {relatedProduct.name}
                  </h3>
                  <p className="text-sm text-carbon-600 mb-2">{relatedProduct.shortDesc}</p>
                  <p className="text-chrome font-semibold">{relatedProduct.price.toFixed(2)} €</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sticky Add to Cart Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-carbon-200 p-4 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex gap-3">
          <div className="flex-1">
            <p className="text-xs text-carbon-500 mb-1">{t('cart.total')}</p>
            <p className="text-xl font-bold text-carbon-900">{(displayPrice * quantity).toFixed(2)} €</p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={currentVariant && !currentVariant.availableForSale}
            className={`px-6 py-3 rounded-lg text-sm font-medium text-white transition-all ${
              currentVariant && !currentVariant.availableForSale
                ? 'bg-carbon-300 cursor-not-allowed'
                : 'bg-carbon-900 hover:bg-carbon-800 active:scale-[0.98]'
            }`}
          >
            {t('product.addToCart')}
          </button>
        </div>
      </div>
    </div>
  )
}
