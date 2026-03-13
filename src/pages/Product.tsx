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
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isImageZoomed, setIsImageZoomed] = useState(false)
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<LocalProduct[]>([])
  const imageRef = useRef<HTMLDivElement>(null)
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
            })
            setSelectedOptions(defaultOptions)
          }

          // Charger les produits liés de la même catégorie
          try {
            const allProducts = await fetchProductsFromShopify()
            const related = allProducts
              .filter((p) => p.category === loaded.category && p.id !== loaded.id)
              .slice(0, 4)
            if (!cancelled) {
              setRelatedProducts(related)
            }
          } catch (err) {
            // Fallback sur les produits statiques
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h1 className="font-display text-3xl text-pearl mb-4">{t('product.loading')}</h1>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h1 className="font-display text-4xl text-pearl mb-4">{t('product.notFound')}</h1>
        <Link to="/boutique" className="text-chrome hover:underline">
          {t('product.backToShop')}
        </Link>
      </div>
    )
  }

  const category = CATEGORIES.find((c) => c.id === product.category)

  const handleAddToCart = () => {
    // Créer un produit avec la variante sélectionnée pour le panier
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
    
    // Trouver la variante correspondante
    const matchingVariant = product.variants?.find((v) => {
      return v.selectedOptions.every(
        (opt) => newOptions[opt.name] === opt.value
      )
    })
    
    if (matchingVariant) {
      setSelectedVariant(matchingVariant.id)
      // Changer l'image si la variante a une image spécifique
      if (matchingVariant.image && product.images) {
        const imageIndex = product.images.findIndex((img) => img === matchingVariant.image)
        if (imageIndex >= 0) {
          setSelectedImageIndex(imageIndex)
        }
      }
    }
  }

  const handleImageZoom = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 1024) return // Pas de zoom sur mobile
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const xPercent = (x / rect.width) * 100
    const yPercent = (y / rect.height) * 100

    if (imageRef.current) {
      const img = imageRef.current.querySelector('img')
      if (img) {
        img.style.transformOrigin = `${xPercent}% ${yPercent}%`
        setIsImageZoomed(true)
      }
    }
  }

  const handleImageZoomOut = () => {
    setIsImageZoomed(false)
    if (imageRef.current) {
      const img = imageRef.current.querySelector('img')
      if (img) {
        img.style.transformOrigin = 'center'
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
    <div className="bg-carbon-950 min-h-screen">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-4">
        <nav className="text-sm text-silver/60">
          <Link to="/boutique" className="hover:text-chrome transition-colors">
            {t('product.shop')}
          </Link>
          {category && (
            <>
              <span className="mx-2">/</span>
              <Link to={`/boutique/${category.id}`} className="hover:text-chrome transition-colors">
                {category.name}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-pearl">{product.name}</span>
        </nav>
      </div>

      {/* 1. HERO PRODUCT SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left: Product Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div
              ref={imageRef}
              className="aspect-square bg-carbon-900 overflow-hidden rounded-lg relative group cursor-zoom-in lg:cursor-zoom-in"
              onMouseMove={handleImageZoom}
              onMouseLeave={handleImageZoomOut}
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
                  className={`w-full h-full object-cover transition-transform duration-300 ${
                    isImageZoomed ? 'scale-150' : 'group-hover:scale-105'
                  }`}
                />
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-chrome'
                        : 'border-carbon-700 hover:border-carbon-600'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} - Vue ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Information */}
          <div className="space-y-6">
            {product.badge && (
              <span className="inline-block bg-chrome text-carbon-950 text-xs font-semibold px-3 py-1.5 uppercase tracking-wide">
                {product.badge}
              </span>
            )}

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-pearl tracking-tight leading-none">
              {product.name}
            </h1>

            <p className="text-xl text-silver/80 font-light max-w-lg">
              {product.shortDesc}
            </p>

            <div className="pt-4">
              <p className="text-4xl font-light text-chrome">
                {displayPrice.toFixed(2)} €
              </p>
            </div>

            {/* Variant Selectors */}
            {product.options && product.options.length > 0 && (
              <div className="space-y-4 pt-4">
                {product.options.map((option) => (
                  <div key={option.name}>
                    <label className="block text-sm font-medium text-silver/90 mb-2 uppercase tracking-wide">
                      {option.name}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((value) => {
                        const isSelected = selectedOptions[option.name] === value
                        const isAvailable = product.variants?.some((v) => {
                          const opt = v.selectedOptions.find((o) => o.name === option.name)
                          return opt?.value === value && v.availableForSale
                        })
                        
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => handleOptionChange(option.name, value)}
                            disabled={!isAvailable}
                            className={`px-4 py-2 text-sm border transition-all ${
                              isSelected
                                ? 'border-chrome bg-chrome/10 text-chrome'
                                : isAvailable
                                  ? 'border-carbon-600 text-silver hover:border-carbon-500'
                                  : 'border-carbon-800 text-carbon-600 cursor-not-allowed opacity-50'
                            }`}
                          >
                            {value}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Availability */}
            {currentVariant && !currentVariant.availableForSale && (
              <p className="text-amber-300 text-sm">{t('product.unavailable')}</p>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 pt-4">
              <label className="text-sm font-medium text-silver/90 uppercase tracking-wide">
                {t('product.quantity')}
              </label>
              <div className="flex border border-carbon-700">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-12 h-12 text-silver hover:text-chrome hover:bg-carbon-800 transition-colors flex items-center justify-center"
                >
                  −
                </button>
                <span className="w-12 h-12 flex items-center justify-center text-pearl border-x border-carbon-700">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-12 h-12 text-silver hover:text-chrome hover:bg-carbon-800 transition-colors flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-3 pt-4">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={currentVariant && !currentVariant.availableForSale}
                className={`w-full py-5 px-8 text-sm uppercase tracking-wide font-medium transition-all ${
                  added
                    ? 'bg-carbon-700 text-silver cursor-default'
                    : currentVariant && !currentVariant.availableForSale
                      ? 'bg-carbon-800 text-carbon-600 cursor-not-allowed'
                      : 'bg-chrome text-carbon-950 hover:bg-chrome/90 active:scale-[0.98]'
                }`}
              >
                {added ? `✓ ${t('product.addedToCart')}` : t('product.addToCart')}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={currentVariant && !currentVariant.availableForSale}
                className={`w-full py-4 px-8 border text-sm uppercase tracking-wide transition-all ${
                  currentVariant && !currentVariant.availableForSale
                    ? 'border-carbon-800 text-carbon-600 cursor-not-allowed'
                    : 'border-carbon-700 text-silver hover:border-chrome hover:text-chrome active:scale-[0.98]'
                }`}
              >
                {t('product.buyNow')}
              </button>
            </div>

            {/* Trust Signals */}
            <div className="pt-6 space-y-2 text-sm text-silver/70">
              <div className="flex items-center gap-2">
                <span className="text-chrome">✓</span>
                <span>{t('product.trustFastShipping')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-chrome">✓</span>
                <span>{t('product.trustProfessional')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-chrome">✓</span>
                <span>{t('product.trustTrusted')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. QUICK PRODUCT HIGHLIGHTS */}
      <section className="border-t border-carbon-800 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-carbon-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-chrome" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-medium text-pearl">{t('product.highlight1Title')}</h3>
              <p className="text-sm text-silver/70">{t('product.highlight1Desc')}</p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-carbon-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-chrome" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-pearl">{t('product.highlight2Title')}</h3>
              <p className="text-sm text-silver/70">{t('product.highlight2Desc')}</p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-carbon-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-chrome" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-pearl">{t('product.highlight3Title')}</h3>
              <p className="text-sm text-silver/70">{t('product.highlight3Desc')}</p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-carbon-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-chrome" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-medium text-pearl">{t('product.highlight4Title')}</h3>
              <p className="text-sm text-silver/70">{t('product.highlight4Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PRODUCT STORY SECTION */}
      <section className="border-t border-carbon-800 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="aspect-[4/3] bg-carbon-900 rounded-lg overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-6">
              <h2 className="font-display text-4xl md:text-5xl text-pearl tracking-tight">
                {t('product.storyTitle')}
              </h2>
              <p className="text-lg text-silver/80 leading-relaxed">
                {product.description}
              </p>
              <p className="text-silver/70 leading-relaxed">
                {t('product.storyText')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW TO USE SECTION */}
      <section className="border-t border-carbon-800 py-20 bg-carbon-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-4xl md:text-5xl text-pearl tracking-tight text-center mb-16">
            {t('product.howToTitle')}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-chrome/10 rounded-full flex items-center justify-center border-2 border-chrome/30">
                <span className="text-3xl font-display text-chrome">1</span>
              </div>
              <h3 className="font-medium text-pearl text-lg">{t('product.step1Title')}</h3>
              <p className="text-sm text-silver/70">
                {t('product.step1Desc')}
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-chrome/10 rounded-full flex items-center justify-center border-2 border-chrome/30">
                <span className="text-3xl font-display text-chrome">2</span>
              </div>
              <h3 className="font-medium text-pearl text-lg">{t('product.step2Title')}</h3>
              <p className="text-sm text-silver/70">
                {t('product.step2Desc')}
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-chrome/10 rounded-full flex items-center justify-center border-2 border-chrome/30">
                <span className="text-3xl font-display text-chrome">3</span>
              </div>
              <h3 className="font-medium text-pearl text-lg">{t('product.step3Title')}</h3>
              <p className="text-sm text-silver/70">
                {t('product.step3Desc')}
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-chrome/10 rounded-full flex items-center justify-center border-2 border-chrome/30">
                <span className="text-3xl font-display text-chrome">4</span>
              </div>
              <h3 className="font-medium text-pearl text-lg">{t('product.step4Title')}</h3>
              <p className="text-sm text-silver/70">
                {t('product.step4Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TECHNICAL DETAILS */}
      <section className="border-t border-carbon-800 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-display text-4xl md:text-5xl text-pearl tracking-tight text-center mb-12">
            {t('product.technicalTitle')}
          </h2>
          <div className="space-y-2">
            {[
              { titleKey: 'product.specsTitle', contentKey: 'product.specsContent' },
              { titleKey: 'product.compatibilityTitle', contentKey: 'product.compatibilityContent' },
              { titleKey: 'product.conditionsTitle', contentKey: 'product.conditionsContent' },
              { titleKey: 'product.includesTitle', contentKey: 'product.includesContent' },
            ].map((item) => (
              <div key={item.titleKey} className="border-b border-carbon-800">
                <button
                  type="button"
                  onClick={() => setExpandedAccordion(expandedAccordion === item.titleKey ? null : item.titleKey)}
                  className="w-full py-5 flex items-center justify-between text-left hover:text-chrome transition-colors"
                >
                  <span className="font-medium text-pearl text-lg">{t(item.titleKey)}</span>
                  <svg
                    className={`w-5 h-5 text-silver transition-transform ${
                      expandedAccordion === item.titleKey ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedAccordion === item.titleKey && (
                  <div className="pb-5 text-silver/80">
                    {t(item.contentKey)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. SOCIAL PROOF */}
      <section className="border-t border-carbon-800 py-20 bg-carbon-900/30">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-display text-4xl md:text-5xl text-pearl tracking-tight text-center mb-12">
            {t('product.reviewsTitle')}
          </h2>
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-6 h-6 text-chrome" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-2xl font-light text-pearl ml-2">4.8</span>
            </div>
            <p className="text-silver/70 text-sm">{t('product.reviewsBased')}</p>
          </div>

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
              <div key={i} className="bg-carbon-900/50 p-6 rounded-lg border border-carbon-800">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-pearl">{review.name}</span>
                      {review.verified && (
                        <span className="text-xs bg-chrome/20 text-chrome px-2 py-0.5 rounded">
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
                <p className="text-silver/80 leading-relaxed">{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-carbon-800 py-20">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="font-display text-4xl md:text-5xl text-pearl tracking-tight mb-4">
              {t('product.relatedTitle')}
            </h2>
            <p className="text-silver/70 mb-12">{t('product.relatedDesc')}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  to={`/produit/${relatedProduct.slug}`}
                  className="bg-carbon-900/50 border border-carbon-800 rounded-lg overflow-hidden group hover:border-carbon-700 transition-colors"
                >
                  <div className="aspect-square bg-carbon-800 overflow-hidden">
                    <img
                      src={relatedProduct.image}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {relatedProduct.badge && (
                      <span className="absolute top-3 left-3 bg-chrome text-carbon-950 text-xs font-semibold px-2 py-1">
                        {relatedProduct.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-pearl mb-1 group-hover:text-chrome transition-colors">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-sm text-silver/70 mb-2">{relatedProduct.shortDesc}</p>
                    <p className="text-chrome font-medium">{relatedProduct.price.toFixed(2)} €</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. TRUST SECTION */}
      <section className="border-t border-carbon-800 py-20 bg-carbon-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-8">
            <div>
              <h2 className="font-display text-4xl md:text-5xl text-pearl tracking-tight mb-4">
                {t('product.trustTitle')}
              </h2>
              <p className="text-xl text-silver/80 max-w-2xl mx-auto">
                {t('product.trustSubtitle')}
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-8 pt-8">
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto bg-chrome/10 rounded-full flex items-center justify-center border border-chrome/30">
                  <svg className="w-8 h-8 text-chrome" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-medium text-pearl">{t('product.trust1Title')}</h3>
                <p className="text-sm text-silver/70">{t('product.trust1Desc')}</p>
              </div>

              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto bg-chrome/10 rounded-full flex items-center justify-center border border-chrome/30">
                  <svg className="w-8 h-8 text-chrome" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="font-medium text-pearl">{t('product.trust2Title')}</h3>
                <p className="text-sm text-silver/70">{t('product.trust2Desc')}</p>
              </div>

              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto bg-chrome/10 rounded-full flex items-center justify-center border border-chrome/30">
                  <svg className="w-8 h-8 text-chrome" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-medium text-pearl">{t('product.trust3Title')}</h3>
                <p className="text-sm text-silver/70">{t('product.trust3Desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Add to Cart Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-carbon-900 border-t border-carbon-800 p-4 z-50">
        <div className="max-w-7xl mx-auto flex gap-3">
          <div className="flex-1">
            <p className="text-xs text-silver/60 mb-1">{t('cart.total')}</p>
            <p className="text-xl font-medium text-chrome">{(displayPrice * quantity).toFixed(2)} €</p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={currentVariant && !currentVariant.availableForSale}
            className={`px-6 py-3 text-sm uppercase tracking-wide font-medium transition-all ${
              currentVariant && !currentVariant.availableForSale
                ? 'bg-carbon-800 text-carbon-600 cursor-not-allowed'
                : 'bg-chrome text-carbon-950 hover:bg-chrome/90 active:scale-[0.98]'
            }`}
          >
            {t('product.addToCart')}
          </button>
        </div>
      </div>
    </div>
  )
}
