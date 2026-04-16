import { useParams, Link, useNavigate, useLocation, Navigate } from 'react-router-dom'
import type { NavigateFunction } from 'react-router-dom'
import { useEffect, useState, useRef, useMemo, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { CATEGORIES, PRODUCTS, type Product as LocalProduct } from '@/data/products'
import { useCart } from '@/context/CartContext'
import { fetchProductFromShopifyBySlug, fetchProductsFromShopify } from '@/utils/shopifyStorefront'
import { XP_PER_DOLLAR } from '@/utils/supabaseXp'
import { PaymentMethodBadges } from '@/components/PaymentMethodBadges'
import { ProductYouMightLikeRail } from '@/components/ProductYouMightLikeRail'
import { getCurrentUserProfile, isAuthenticated } from '@/utils/supabaseAuth'
import { isFavoriteSlug, toggleFavoriteSlug } from '@/utils/favorites'
import { FavoritePromptModal } from '@/components/FavoritePromptModal'
import { productDetailPath, shopCategoryPath } from '@/constants/paths'
import { getProductPageContent } from '@/data/productPageContent'
import { supabase } from '@/lib/supabase'
import { FireballLoading } from '@/components/FireballLoading'
import { ProductDetailSkeleton } from '@/components/ui/ProductDetailSkeleton'
import { useClipRevealHover, CLIP_REVEAL_BUTTON_BASE_CLASS } from '@/hooks/useClipRevealHover'
import { usePageTitle } from '@/hooks/usePageTitle'

const FIREBALL_RED = '#B61B1B'

type ProductType = LocalProduct

type ProductPageOverrides = Record<
  string,
  { why?: string | null; howToUseSteps?: string[] | null } | undefined
>

function useProductFavoritePrompt(
  slug: string | undefined,
  setWishlisted: React.Dispatch<React.SetStateAction<boolean>>,
  navigate: NavigateFunction,
  location: ReturnType<typeof useLocation>,
) {
  const [modalOpen, setModalOpen] = useState(false)

  const handleFavoriteModalContinue = async () => {
    if (!slug) return
    sessionStorage.setItem('favorite_modal_shown', '1')
    setModalOpen(false)
    const next = await toggleFavoriteSlug(slug)
    setWishlisted(next)
  }

  const handleWishlistClick = async () => {
    if (!slug) return
    if (await isAuthenticated()) {
      const next = await toggleFavoriteSlug(slug)
      setWishlisted(next)
      return
    }
    if (!sessionStorage.getItem('favorite_modal_shown')) {
      setModalOpen(true)
      return
    }
    const next = await toggleFavoriteSlug(slug)
    setWishlisted(next)
  }

  const favoriteModal = (
    <FavoritePromptModal
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      onContinue={handleFavoriteModalContinue}
      onSignIn={() => {
        setModalOpen(false)
        navigate(`/account?tab=login&returnTo=${encodeURIComponent(location.pathname)}`)
      }}
    />
  )

  return { handleWishlistClick, favoriteModal }
}

export function Product() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { slug } = useParams<{ slug: string }>()
  const { addToCart } = useCart()
  const [shareOpen, setShareOpen] = useState(false)
  const shareWrapRef = useRef<HTMLDivElement>(null)
  const [wishlisted, setWishlisted] = useState(false)
  const { handleWishlistClick, favoriteModal } = useProductFavoritePrompt(
    slug,
    setWishlisted,
    navigate,
    location,
  )
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
  const [openAccordion, setOpenAccordion] = useState<'description' | 'why' | 'howToUse' | null>('description')
  const [adminEditorOpen, setAdminEditorOpen] = useState(false)
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [showMobileStickyBar, setShowMobileStickyBar] = useState(false)
  const [navbarWidth, setNavbarWidth] = useState(0)
  const [shippingProgressAnimated, setShippingProgressAnimated] = useState(false)
  const galleryRef = useRef<HTMLDivElement>(null)
  const ctaButtonsRef = useRef<HTMLDivElement>(null)
  const addToCartMainButtonRef = useRef<HTMLButtonElement>(null)
  const navbarRef = useRef<HTMLDivElement>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isPartner, setIsPartner] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)
  const [productPageOverrides, setProductPageOverrides] = useState<ProductPageOverrides>({})
  const [savingProductPage, setSavingProductPage] = useState(false)
  const [productPageSaveError, setProductPageSaveError] = useState('')
  const [whyDraft, setWhyDraft] = useState('')
  const [howToUseDraft, setHowToUseDraft] = useState('')

  const clipAddMain = useClipRevealHover()
  const clipAddSticky = useClipRevealHover()
  const clipAddMobile = useClipRevealHover()

  const sizeSegmentRef = useRef<HTMLDivElement>(null)
  const sizeGroupRef = useRef<HTMLDivElement>(null)
  const sizeButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [sizeIndicator, setSizeIndicator] = useState<{ left: number; width: number; visible: boolean }>({
    left: 0,
    width: 0,
    visible: false,
  })

  const productShareUrl = useMemo(() => {
    const path = slug ? productDetailPath(slug) : ''
    if (typeof window === 'undefined') return path
    return `${window.location.origin}${path}`
  }, [slug])

  usePageTitle(product ? `Buy ${product.name} - Fireball Canada` : 'Product - Fireball Canada')

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    void (async () => {
      const w = await isFavoriteSlug(slug)
      if (!cancelled) setWishlisted(w)
    })()
    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    if (!shareOpen) return
    const onDoc = (e: MouseEvent) => {
      if (!shareWrapRef.current?.contains(e.target as Node)) setShareOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [shareOpen])

  // Bloquer le scroll de fond quand une modale est ouverte
  useEffect(() => {
    if (!adminEditorOpen) return
    const prevHtmlOverflow = document.documentElement.style.overflow
    const prevBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow
      document.body.style.overflow = prevBodyOverflow
    }
  }, [adminEditorOpen])

  useEffect(() => {
    let mounted = true
    void (async () => {
      const profile = await getCurrentUserProfile()
      if (!mounted) return
      const role = (profile?.role || '').toLowerCase()
      const partnerStatus = (profile?.partner_status || '').toLowerCase()
      setIsAdmin(role === 'admin')
      setIsPartner(role === 'partner' || partnerStatus === 'partner')
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    if (!slug) return
    void (async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'product_pages')
        .maybeSingle()
      if (!mounted) return
      if (error) return
      const raw = (data?.value ?? {}) as unknown
      const map = raw && typeof raw === 'object' ? (raw as ProductPageOverrides) : {}
      setProductPageOverrides(map)
    })()
    return () => {
      mounted = false
    }
  }, [slug])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!slug) {
        setLoading(false)
        setProduct(null)
        return
      }
      setLoading(true)
      setAccessDenied(false)
      try {
        const loaded = await fetchProductFromShopifyBySlug(slug)
        if (!cancelled && loaded) {
          const canAccess = !loaded.partnerOnly || isPartner
          if (!canAccess) {
            setProduct(loaded)
            setRelatedProducts([])
            setAccessDenied(true)
            return
          }

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
              .filter((p) => !p.partnerOnly || isPartner)
              .slice(0, 10)
            if (!cancelled) {
              setRelatedProducts(related)
            }
          } catch (err) {
            const related = PRODUCTS.filter(
              (p) => p.category === loaded.category && p.id !== loaded.id
            )
              .filter((p) => !p.partnerOnly || isPartner)
              .slice(0, 10)
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
  }, [slug, isPartner])

  // Animation de la barre de progression au chargement
  useEffect(() => {
    if (product) {
      setShippingProgressAnimated(false)
      // Réinitialiser puis animer après un court délai
      requestAnimationFrame(() => {
        setTimeout(() => {
          setShippingProgressAnimated(true)
        }, 150)
      })
    }
  }, [product])

  // Mesurer la largeur de la navbar (du logo au panier)
  useEffect(() => {
    const measureNavbar = () => {
      const header = document.querySelector('header')
      if (!header) return
      
      const headerContent = header.querySelector('.max-w-7xl')
      if (!headerContent) return
      
      const logo = headerContent.querySelector('a[href="/"]')
      const cartLink = headerContent.querySelector('a[href="/cart"]')
      
      if (logo && cartLink) {
        const logoRect = logo.getBoundingClientRect()
        const cartRect = cartLink.getBoundingClientRect()
        const width = cartRect.right - logoRect.left
        setNavbarWidth(width)
      }
    }
    
    measureNavbar()
    window.addEventListener('resize', measureNavbar)
    // Attendre que le DOM soit prêt
    setTimeout(measureNavbar, 100)
    setTimeout(measureNavbar, 500) // Double vérification
    
    return () => {
      window.removeEventListener('resize', measureNavbar)
    }
  }, [product])

  // Détecter quand on passe en dessous des boutons CTA pour afficher la barre sticky
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null
    
    const handleScroll = () => {
      if (!ctaButtonsRef.current) {
        setShowStickyBar(false)
        return
      }
      
      const ctaRect = ctaButtonsRef.current.getBoundingClientRect()
      const shouldShowFromCTA = ctaRect.bottom < 0
      
      // Vérifier si on est dans le footer
      const footer = document.querySelector('footer')
      let shouldShow = shouldShowFromCTA
      
      if (footer && shouldShowFromCTA) {
        const footerRect = footer.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const menuBottom = viewportHeight - 24 - 64 // bottom-6 (24px) + hauteur du menu (64px environ)
        
        // Si le footer commence avant la position du menu flottant, cacher le menu
        if (footerRect.top < menuBottom) {
          shouldShow = false
        }
      }
      
      // Utiliser un timeout pour éviter le flash de décentrage
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(() => {
        setShowStickyBar(shouldShow)
      }, 10)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Vérifier au chargement
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Mobile: afficher la barre sticky uniquement quand le vrai bouton Add to Cart sort de l'écran
  useEffect(() => {
    const updateMobileStickyVisibility = () => {
      if (window.innerWidth >= 1024) {
        setShowMobileStickyBar(false)
        return
      }

      const mainAddToCartButton = addToCartMainButtonRef.current
      if (!mainAddToCartButton) {
        setShowMobileStickyBar(false)
        return
      }

      const rect = mainAddToCartButton.getBoundingClientRect()
      // Afficher uniquement après avoir dépassé le bouton (quand il est sorti par le haut).
      setShowMobileStickyBar(rect.bottom < 0)
    }

    let rafId: number | null = null
    const onScrollOrResize = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
      }
      rafId = window.requestAnimationFrame(updateMobileStickyVisibility)
    }

    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize)
    onScrollOrResize()

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
      }
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [product, added])

  // Trouver la variante correspondant aux options sélectionnées
  const currentVariant = product?.variants?.find((v) => {
    return v.selectedOptions.every(
      (opt) => selectedOptions[opt.name] === opt.value
    )
  })

  const displayPrice = currentVariant?.price ?? product?.price ?? 0
  const xpGainedForLine = Math.max(0, Math.round(displayPrice * quantity * XP_PER_DOLLAR))

  // Reviews: on n'affiche que ce qui est "réel" côté produit.
  // Actuellement, l'app ne récupère pas la liste détaillée des avis (nom/texte/date),
  // donc on ne rend pas de contenus mockés.
  const reviewCount = typeof product?.reviewCount === 'number' ? product.reviewCount : 0
  const reviewsAverage = typeof product?.rating === 'number' ? product.rating : 0
  // Construire la liste de toutes les images disponibles
  const allImages = product?.images && product.images.length > 0 
    ? product.images 
    : product?.image 
      ? [product.image] 
      : []
  // Toujours utiliser l'image sélectionnée par l'utilisateur via selectedImageIndex
  const displayImage = allImages[selectedImageIndex] || allImages[0] || product?.image

  // Extraire les options de couleur et taille
  const colorOptions = product?.options?.find(opt => 
    opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'couleur'
  )?.values || []
  const sizeOptions = product?.options?.find(opt => 
    opt.name.toLowerCase() === 'size' || opt.name.toLowerCase() === 'taille'
  )?.values || []

  const selectedSizeValue = selectedSize || sizeOptions[0] || ''

  useEffect(() => {
    const scrollContainer = sizeSegmentRef.current
    const group = sizeGroupRef.current
    if (!scrollContainer || !group) return

    const measure = () => {
      const selected = selectedSizeValue
      if (!selected) {
        setSizeIndicator((prev) => (prev.visible ? { ...prev, visible: false } : prev))
        return
      }
      const btn = sizeButtonRefs.current[selected]
      if (!btn) {
        setSizeIndicator((prev) => (prev.visible ? { ...prev, visible: false } : prev))
        return
      }
      const groupRect = group.getBoundingClientRect()
      const btnRect = btn.getBoundingClientRect()
      const insetPx = 1
      const left = Math.round(btnRect.left - groupRect.left) + insetPx
      const width = Math.max(0, Math.round(btnRect.width) - insetPx * 2)
      setSizeIndicator({ left, width, visible: width > 0 })
    }

    measure()
    const onResize = () => measure()
    const onScroll = () => measure()

    window.addEventListener('resize', onResize)
    scrollContainer.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('resize', onResize)
      scrollContainer.removeEventListener('scroll', onScroll)
    }
  }, [selectedSizeValue, sizeOptions.length])

  /** Après « Added » : reset clip — doit rester avant tout return (règles des Hooks). */
  useEffect(() => {
    clipAddMain.reset()
    clipAddSticky.reset()
    clipAddMobile.reset()
    const el = addToCartMainButtonRef.current
    if (el) {
      el.style.removeProperty('--clip-x')
      el.style.removeProperty('--clip-y')
      el.style.removeProperty('--clip-r')
    }
  }, [added])

  if (loading) {
    return <ProductDetailSkeleton />
  }

  if (!product) {
    return <Navigate to="/404" replace />
  }

  if (accessDenied) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center px-6">
        <div className="max-w-xl text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold text-carbon-900 mb-4">
            Access restricted
          </h1>
          <p className="text-carbon-600 mb-8">
            This product is reserved for certified Fireball partners. Join Fireball to request access.
          </p>
          <Link
            to="/join-fireball"
            className="inline-flex items-center justify-center rounded-full bg-carbon-900 px-7 py-3 text-sm font-semibold text-white hover:bg-carbon-800 transition-colors"
          >
            Join Fireball
          </Link>
        </div>
      </div>
    )
  }

  const category = CATEGORIES.find((c) => c.id === product.category)
  const jsonContent = getProductPageContent(slug)
  const override = (slug ? productPageOverrides[slug] : undefined) ?? null
  const pageContent = {
    why: override?.why ?? jsonContent?.why ?? null,
    howToUseSteps: override?.howToUseSteps ?? jsonContent?.howToUseSteps ?? null,
  }

  const openAdminEditor = () => {
    setProductPageSaveError('')
    setWhyDraft(pageContent.why ?? '')
    setHowToUseDraft(Array.isArray(pageContent.howToUseSteps) ? pageContent.howToUseSteps.join('\n') : '')
    setAdminEditorOpen(true)
  }

  const saveAdminEditor = async () => {
    if (!slug) return
    setSavingProductPage(true)
    setProductPageSaveError('')
    try {
      const steps = howToUseDraft
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
      const nextForSlug = {
        why: whyDraft.trim() ? whyDraft.trim() : null,
        howToUseSteps: steps.length ? steps : null,
      }
      const nextMap: ProductPageOverrides = {
        ...productPageOverrides,
        [slug]: nextForSlug,
      }
      // UI optimiste: appliquer tout de suite et fermer l'éditeur
      const prevMap = productPageOverrides
      setProductPageOverrides(nextMap)
      setAdminEditorOpen(false)

      const { data: existing, error: existingError } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'product_pages')
        .maybeSingle()
      if (existingError) throw existingError

      const write = existing
        ? supabase
            .from('site_settings')
            .update({ value: nextMap, updated_at: new Date().toISOString() })
            .eq('key', 'product_pages')
        : supabase
            .from('site_settings')
            .insert({ key: 'product_pages', value: nextMap, updated_at: new Date().toISOString() })

      const res = await write
      if (res.error) throw res.error
    } catch (e) {
      // rollback UI optimiste
      if (slug) {
        const rollback = { ...productPageOverrides }
        delete rollback[slug]
        setProductPageOverrides(rollback)
      }
      setAdminEditorOpen(true)
      setProductPageSaveError(e instanceof Error ? e.message : 'Unable to save.')
    } finally {
      setSavingProductPage(false)
    }
  }

  const copyProductLink = async () => {
    try {
      await navigator.clipboard.writeText(productShareUrl)
    } catch {
      /* ignore */
    }
    setShareOpen(false)
  }

  const shareNative = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.share && product) {
        await navigator.share({ title: product.name, url: productShareUrl })
      }
    } catch {
      /* annulé ou indisponible */
    }
    setShareOpen(false)
  }

  const handleAddToCart = () => {
    const productToAdd: ProductType = {
      ...product,
      shopifyVariantId: currentVariant?.id || product.shopifyVariantId,
      price: displayPrice,
    }
    addToCart(productToAdd, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 3000)
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
      // Ne changer l'image que si l'utilisateur n'a pas sélectionné manuellement une image
      // et que la variante a une image différente
      if (matchingVariant.image && product.images && product.images.length > 0) {
        const imageIndex = product.images.findIndex((img) => img === matchingVariant.image)
        if (imageIndex >= 0 && imageIndex !== selectedImageIndex) {
          // Seulement changer si c'est une image différente
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
      {/* Main Product Section — peu de pt : le flux est déjà sous la navbar (header sticky) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-8 lg:pb-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Left: Image Gallery - Sticky */}
          <div className="lg:sticky lg:top-20 lg:self-start space-y-4">
            {/* Main Image - Légèrement réduite */}
            <div
              ref={galleryRef}
              className="relative aspect-square rounded-lg overflow-hidden group max-w-[90%] mx-auto"
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
                  key={selectedImageIndex}
                  src={displayImage}
                  alt={product.name}
                  className="w-full h-full object-cover transition-opacity duration-300"
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

              {/* Action Icons — partage + favoris */}
              <div className="absolute top-4 right-4 flex gap-2 z-20">
                <div className="relative" ref={shareWrapRef}>
                  <button
                    type="button"
                    onClick={() => setShareOpen((o) => !o)}
                    className={`w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all ${
                      shareOpen ? 'ring-2 ring-carbon-900/20' : ''
                    }`}
                    aria-expanded={shareOpen}
                    aria-haspopup="true"
                    aria-label={t('product.shareAria')}
                  >
                    <svg className="w-5 h-5 text-carbon-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                  {shareOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-carbon-200 bg-white py-1.5 shadow-xl text-left"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={copyProductLink}
                        className="w-full px-3 py-2 text-left text-sm text-carbon-800 hover:bg-carbon-50"
                      >
                        {t('product.shareCopyLink')}
                      </button>
                      {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={shareNative}
                          className="w-full px-3 py-2 text-left text-sm text-carbon-800 hover:bg-carbon-50"
                        >
                          {t('product.shareSystem')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleWishlistClick}
                  className={`w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all ${
                    wishlisted ? 'text-red-600' : 'text-carbon-600'
                  }`}
                  aria-label={t('product.wishlistAria')}
                  aria-pressed={wishlisted}
                >
                  <svg
                    className="w-5 h-5"
                    fill={wishlisted ? 'currentColor' : 'none'}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
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
                    className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all flex items-center justify-center ${
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
            {/* Admin quick edit (only admins) */}
            {isAdmin && (
              <div className="hidden lg:flex items-center justify-end">
                <button
                  type="button"
                  onClick={openAdminEditor}
                  className="inline-flex items-center gap-2 rounded-full border border-carbon-200 bg-carbon-50 px-4 py-2 text-xs font-semibold text-carbon-900 hover:bg-carbon-100 transition-colors"
                >
                  Admin: éditer Why / How to use
                </button>
              </div>
            )}
            {/* Product Title */}
            {product.badge && (
              <span className="inline-block text-xs font-semibold text-chrome uppercase tracking-wide mb-2">
                {product.badge}
              </span>
            )}
            <div className="mb-3">
              {/* Reviews - Style comme les cards produits */}
              {(product.rating !== undefined || product.reviewCount !== undefined) && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => {
                      const rating = product.rating || 0
                      return (
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
                      )
                    })}
                  </div>
                  {product.reviewCount !== undefined && (
                    <span className="text-xs font-bold text-carbon-900 underline">
                      {product.reviewCount} {product.reviewCount === 1 ? 'Review' : 'Reviews'}
                    </span>
                  )}
                </div>
              )}

              <nav
                className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[10px] leading-tight text-carbon-500 mb-2"
                aria-label="Breadcrumb"
              >
                {category ? (
                  <>
                    <Link to={shopCategoryPath(category.id)} className="hover:text-carbon-700">
                      {category.name}
                    </Link>
                    <span aria-hidden="true">/</span>
                  </>
                ) : null}
                <span className="text-carbon-600">{product.name}</span>
              </nav>

              <h1 className="text-3xl md:text-4xl font-bold text-carbon-900 mb-3">
                {product.name}
              </h1>
            </div>

            {/* Price */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex items-center justify-between gap-4">
                <span className="text-base font-bold text-carbon-900">
                  {displayPrice.toFixed(2)} $CA
                </span>
              </div>

              {/* Free Shipping Progress — même style barre que la page coatings */}
              <div className="meter text-[11px]">
                <div className="flex items-center justify-between gap-3 font-bold uppercase leading-snug tracking-normal text-carbon-600">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-[1.2em] w-[1.2em] shrink-0 text-[#B61B1B]"
                      aria-hidden
                    >
                      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                      <path d="M15 18H9" />
                      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                      <circle cx="17" cy="18" r="2" />
                      <circle cx="7" cy="18" r="2" />
                    </svg>
                    {displayPrice >= 50 ? (
                      <span>You're eligible for free shipping!</span>
                    ) : (
                      <span>
                        Add{' '}
                        <span className="font-extrabold text-carbon-900">
                          {(50 - displayPrice).toFixed(2)}
                        </span>{' '}
                        $CA for free shipping
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 tabular-nums text-carbon-500">
                    {Math.round(Math.min((displayPrice / 50) * 100, 100))}%
                  </span>
                </div>
                <div className="meter__track" aria-hidden>
                  <div
                    className="meter__fill transition-[width] duration-1000 ease-out"
                    style={{
                      width: shippingProgressAnimated
                        ? `${Math.min((displayPrice / 50) * 100, 100)}%`
                        : '0%',
                      backgroundColor: FIREBALL_RED,
                    }}
                  />
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
                    Size: {selectedSizeValue}
                  </label>
                  <button type="button" className="text-sm text-carbon-600 hover:text-carbon-900 underline">
                    View Size Chart
                  </button>
                </div>
                <div ref={sizeSegmentRef} className="relative inline-block max-w-full overflow-x-auto">
                  <div
                    ref={sizeGroupRef}
                    role="radiogroup"
                    aria-label="Size"
                    className="relative inline-flex w-max items-stretch gap-1 rounded-full border border-carbon-200 bg-carbon-50 p-1"
                  >
                    <div
                      aria-hidden="true"
                      className={`absolute left-0 top-1 bottom-1 rounded-full bg-[#F6F6F6] shadow-sm ring-1 ring-carbon-900/5 transition-[transform,width,opacity] duration-300 ease-out ${
                        sizeIndicator.visible ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={{
                        width: `${sizeIndicator.width}px`,
                        transform: `translate3d(${sizeIndicator.left}px, 0, 0)`,
                      }}
                    />
                    {sizeOptions.map((size) => {
                      const isSelected = selectedSizeValue === size
                      const isAvailable = product.variants?.some((v) => {
                        const sizeOpt = v.selectedOptions.find((o) =>
                          (o.name.toLowerCase() === 'size' || o.name.toLowerCase() === 'taille') && o.value === size
                        )
                        return sizeOpt && v.availableForSale
                      })

                      return (
                        <button
                          key={size}
                          ref={(el) => {
                            sizeButtonRefs.current[size] = el
                          }}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          disabled={!isAvailable}
                          onKeyDown={(e) => {
                            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
                            e.preventDefault()
                            const enabled = sizeOptions.filter((s) =>
                              product.variants?.some((v) => {
                                const sizeOpt = v.selectedOptions.find(
                                  (o) =>
                                    (o.name.toLowerCase() === 'size' || o.name.toLowerCase() === 'taille') &&
                                    o.value === s,
                                )
                                return sizeOpt && v.availableForSale
                              }),
                            )
                            if (enabled.length <= 1) return
                            const current = selectedSizeValue
                            const idx = Math.max(0, enabled.indexOf(current))
                            const nextIdx =
                              e.key === 'ArrowRight'
                                ? (idx + 1) % enabled.length
                                : (idx - 1 + enabled.length) % enabled.length
                            const next = enabled[nextIdx]
                            const optionName =
                              product.options?.find(
                                (opt) => opt.name.toLowerCase() === 'size' || opt.name.toLowerCase() === 'taille',
                              )?.name || 'Size'
                            handleOptionChange(optionName, next)
                            sizeButtonRefs.current[next]?.focus()
                          }}
                          onClick={() =>
                            handleOptionChange(
                              product.options?.find(
                                (opt) => opt.name.toLowerCase() === 'size' || opt.name.toLowerCase() === 'taille',
                              )?.name || 'Size',
                              size,
                            )
                          }
                          className={`relative z-10 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                            isSelected
                              ? 'text-carbon-950'
                              : isAvailable
                                ? 'text-carbon-700 hover:text-carbon-950'
                                : 'text-carbon-500 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* XP gagné (avant Quantity) */}
            <div className="w-full py-4 px-6 rounded-none border border-carbon-200 bg-[#F6F6F6] flex flex-col items-start justify-center gap-1">
              <span className="text-sm font-bold text-carbon-900">
                Earn {xpGainedForLine.toLocaleString()}XP
              </span>
              <span className="text-xs text-carbon-600">
                Purchasing this product earns{' '}
                <span className="font-bold text-carbon-900">
                  {xpGainedForLine.toLocaleString()} XP
                </span>
              </span>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-carbon-900 mb-2">
                {t('product.quantity')}
              </label>
              <div className="flex items-center gap-3">
                <div className="flex border border-carbon-300 rounded-full">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-carbon-600 hover:text-carbon-900 hover:bg-carbon-50 transition-colors rounded-l-full"
                  >
                    −
                  </button>
                  <span className="w-10 h-10 flex items-center justify-center text-carbon-900 border-x border-carbon-300">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-10 h-10 flex items-center justify-center text-carbon-600 hover:text-carbon-900 hover:bg-carbon-50 transition-colors rounded-r-full"
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

            {/* CTAs - Empilés verticalement */}
            <div ref={ctaButtonsRef} className="flex flex-col gap-3 pt-4 mb-6">
              {/* Add to Cart — fond noir + survol type landing (cercle blanc) */}
              <button
                ref={addToCartMainButtonRef}
                type="button"
                onClick={handleAddToCart}
                disabled={currentVariant && !currentVariant.availableForSale}
                onPointerEnter={
                  currentVariant && !currentVariant.availableForSale
                    ? undefined
                    : added
                      ? undefined
                      : clipAddMain.onPointerEnter
                }
                onPointerMove={
                  currentVariant && !currentVariant.availableForSale
                    ? undefined
                    : added
                      ? undefined
                      : clipAddMain.onPointerMove
                }
                onPointerLeave={
                  currentVariant && !currentVariant.availableForSale
                    ? undefined
                    : added
                      ? undefined
                      : clipAddMain.onPointerLeave
                }
                onFocus={() => {
                  if ((!currentVariant || currentVariant.availableForSale) && !added) clipAddMain.onFocus()
                }}
                onBlur={() => clipAddMain.onBlur()}
                className={`relative w-full overflow-hidden rounded-full border py-4 px-6 font-medium transition-[border-color,color] duration-500 ease-out outline-none [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:outline-none ${
                  currentVariant && !currentVariant.availableForSale
                    ? 'cursor-not-allowed border-carbon-200 bg-carbon-100 text-carbon-500'
                    : added
                      ? 'border-transparent bg-carbon-600 text-white'
                      : CLIP_REVEAL_BUTTON_BASE_CLASS
                }`}
                style={
                  currentVariant && !currentVariant.availableForSale
                    ? undefined
                    : added
                      ? undefined
                      : clipAddMain.cssVars
                }
              >
                {!added && !(currentVariant && !currentVariant.availableForSale) && (
                  <span
                    className="pointer-events-none absolute -inset-px z-0 rounded-full"
                    style={{
                      backgroundColor: '#ffffff',
                      clipPath: `circle(${clipAddMain.active ? 'var(--clip-r, 0px)' : '0px'} at var(--clip-x, 50%) var(--clip-y, 50%))`,
                      WebkitClipPath: `circle(${clipAddMain.active ? 'var(--clip-r, 0px)' : '0px'} at var(--clip-x, 50%) var(--clip-y, 50%))`,
                      transition:
                        'clip-path 900ms cubic-bezier(0.22,1,0.36,1), -webkit-clip-path 900ms cubic-bezier(0.22,1,0.36,1)',
                      willChange: 'clip-path',
                    }}
                    aria-hidden
                  />
                )}
                <span
                  className={`relative z-10 block transition-all duration-300 ${
                    added ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
                  } ${
                    currentVariant && !currentVariant.availableForSale
                      ? ''
                      : clipAddMain.hover && !added
                        ? 'text-black'
                        : added
                          ? ''
                          : 'text-white'
                  }`}
                >
                  {t('product.addToCart')}
                </span>
                <span
                  className={`absolute inset-0 z-10 flex items-center justify-center text-white transition-all duration-300 ${
                    added ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
                  }`}
                >
                  {t('product.addedToCart')}
                </span>
              </button>
            </div>

            <div className="text-center px-1 mt-1">
              <p className="text-[11px] text-carbon-500 leading-snug">
                {t('product.secureCheckoutLabel')}
              </p>
              <PaymentMethodBadges className="mt-2" iconClassName="h-6 w-auto shrink-0" />
            </div>

            {/* Product accordions: Description / Why / How to use */}
            <div className="pt-6 border-t border-carbon-200 divide-y divide-carbon-200">
              {product.description && (
                <div className="py-4">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenAccordion((prev) => (prev === 'description' ? null : 'description'))
                    }
                    className="w-full flex items-center justify-between gap-4"
                  >
                    <h3 className="text-sm font-semibold text-carbon-900">Description</h3>
                    <svg
                      className={`w-4 h-4 text-carbon-600 transition-transform ${
                        openAccordion === 'description' ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      openAccordion === 'description'
                        ? 'grid-rows-[1fr] opacity-100 mt-3'
                        : 'grid-rows-[0fr] opacity-0 mt-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-sm text-carbon-600 whitespace-pre-line">{product.description}</p>
                    </div>
                  </div>
                </div>
              )}

              {pageContent?.why && (
                <div className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenAccordion((prev) => (prev === 'why' ? null : 'why'))}
                    className="w-full flex items-center justify-between gap-4"
                  >
                    <h3 className="text-sm font-semibold text-carbon-900">Why {product.name}?</h3>
                    <svg
                      className={`w-4 h-4 text-carbon-600 transition-transform ${
                        openAccordion === 'why' ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      openAccordion === 'why'
                        ? 'grid-rows-[1fr] opacity-100 mt-3'
                        : 'grid-rows-[0fr] opacity-0 mt-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-sm text-carbon-600 whitespace-pre-line">{pageContent.why}</p>
                    </div>
                  </div>
                </div>
              )}

              {pageContent?.howToUseSteps && pageContent.howToUseSteps.length > 0 && (
                <div className="py-4">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenAccordion((prev) => (prev === 'howToUse' ? null : 'howToUse'))
                    }
                    className="w-full flex items-center justify-between gap-4"
                  >
                    <h3 className="text-sm font-semibold text-carbon-900">How to use</h3>
                    <svg
                      className={`w-4 h-4 text-carbon-600 transition-transform ${
                        openAccordion === 'howToUse' ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      openAccordion === 'howToUse'
                        ? 'grid-rows-[1fr] opacity-100 mt-3'
                        : 'grid-rows-[0fr] opacity-0 mt-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <ol className="text-sm text-carbon-600 list-decimal pl-5 space-y-1">
                        {pageContent.howToUseSteps.map((step, idx) => (
                          <li key={`${idx}-${step.slice(0, 16)}`}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="bg-carbon-50 border-t border-carbon-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {/* En-tête (gros titre à gauche, étoiles juste en dessous) */}
            <div className="flex flex-col items-start gap-4">
              <h2 className="text-4xl md:text-5xl font-bold text-carbon-900">
                Customer Reviews
              </h2>

              {/* Note moyenne + compteur (avec remplissage progressif) */}
              <div className="flex items-center gap-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => {
                    // i=0 => étoile #1 ; pour 4.7, les 4 premières sont 100% et la 5e à 70%
                    const fill = Math.max(0, Math.min(1, reviewsAverage - i))
                    const fillWidth = `${fill * 100}%`
                    return (
                      <div key={i} className="relative w-7 h-7">
                        <svg
                          className="absolute inset-0 w-7 h-7 text-yellow-400/20"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <div
                          className="absolute left-0 top-0 h-full overflow-hidden"
                          style={{ width: fillWidth }}
                        >
                          <svg
                            className="absolute inset-0 w-7 h-7 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <span className="text-lg font-semibold text-carbon-900">
                  {reviewsAverage.toFixed(1)} / 5
                </span>
              </div>

              <span className="text-sm text-carbon-600">Based on {reviewCount} verified reviews</span>
            </div>

            {/* Only show "no reviews" when the product has none */}
            {reviewCount <= 0 ? (
              <p className="text-sm text-carbon-600 bg-white border border-carbon-200 rounded-lg p-4">
                This product has no reviews.
              </p>
            ) : (
              <p className="text-sm text-carbon-600 bg-white border border-carbon-200 rounded-lg p-4">
                No written reviews are available at the moment.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Related products — rail horizontal (même composant que le panier) */}
      {relatedProducts.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ProductYouMightLikeRail title="You might also like" products={relatedProducts} />
          </div>
        </section>
      )}

      {/* Sticky Navigation Bar - Desktop */}
      {product && (
        <div 
          className={`hidden lg:flex fixed bottom-6 left-0 right-0 z-50 justify-center transition-all duration-300 ease-in-out ${
            showStickyBar ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <div 
            className="flex items-center gap-4 px-6 py-4 rounded-full bg-carbon-950/80 backdrop-blur-md border border-carbon-800/50 shadow-xl"
            style={{ 
              width: navbarWidth > 0 ? `${navbarWidth * 0.8}px` : 'auto'
            }}
          >
            {/* Titre du produit */}
            <h2 className="text-base font-semibold text-pearl line-clamp-1 flex-1 min-w-0">
              {product.name}
            </h2>
            
              {/* Bouton Add to cart — même effet survol rouge Fireball */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={currentVariant && !currentVariant.availableForSale}
              onPointerEnter={
                currentVariant && !currentVariant.availableForSale
                  ? undefined
                  : added
                    ? undefined
                    : clipAddSticky.onPointerEnter
              }
              onPointerMove={
                currentVariant && !currentVariant.availableForSale
                  ? undefined
                  : added
                    ? undefined
                    : clipAddSticky.onPointerMove
              }
              onPointerLeave={
                currentVariant && !currentVariant.availableForSale
                  ? undefined
                  : added
                    ? undefined
                    : clipAddSticky.onPointerLeave
              }
              onFocus={() => {
                if ((!currentVariant || currentVariant.availableForSale) && !added) clipAddSticky.onFocus()
              }}
              onBlur={() => clipAddSticky.onBlur()}
              className={`relative overflow-hidden rounded-full border px-6 py-2.5 text-sm font-medium whitespace-nowrap outline-none [-webkit-tap-highlight-color:transparent] transition-[border-color,color] duration-500 ease-out focus:outline-none focus-visible:outline-none active:scale-[0.98] ${
                currentVariant && !currentVariant.availableForSale
                  ? 'cursor-not-allowed border-carbon-700 bg-carbon-800 text-carbon-500'
                  : added
                    ? 'border-transparent bg-carbon-600 text-white'
                    : 'border-[#0485F7] bg-[#0485F7] text-white hover:border-[#3592F9] hover:bg-[#3592F9]'
              }`}
              style={
                currentVariant && !currentVariant.availableForSale
                  ? undefined
                  : added
                    ? undefined
                    : clipAddSticky.cssVars
              }
            >
              <span
                className={`relative z-10 ${
                  currentVariant && !currentVariant.availableForSale
                    ? ''
                    : added
                      ? 'text-white'
                        : 'text-white'
                }`}
              >
                {added ? `✓ ${t('product.addedToCart')}` : 'Purchase'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Admin editor modal */}
      {adminEditorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end bg-black/50"
          onClick={() => setAdminEditorOpen(false)}
        >
          <div
            className="bg-white h-full w-full max-w-md rounded-l-2xl shadow-xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-carbon-200">
              <div>
                <p className="text-[11px] font-semibold text-carbon-500">Admin</p>
                <h2 className="text-xl font-bold text-carbon-900">Why / How to use</h2>
                <p className="text-xs text-carbon-500 mt-1 line-clamp-1">{product.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setAdminEditorOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-carbon-100 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5 text-carbon-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {productPageSaveError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {productPageSaveError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-carbon-700 mb-2">
                  Why (texte)
                </label>
                <textarea
                  value={whyDraft}
                  onChange={(e) => setWhyDraft(e.target.value)}
                  className="w-full min-h-[140px] rounded-xl border border-carbon-200 bg-white px-3 py-2 text-sm text-carbon-900 placeholder:text-carbon-400 focus:outline-none focus:border-carbon-400 resize-vertical"
                  placeholder="Why..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-carbon-700 mb-2">
                  How to use (1 étape par ligne)
                </label>
                <textarea
                  value={howToUseDraft}
                  onChange={(e) => setHowToUseDraft(e.target.value)}
                  className="w-full min-h-[160px] rounded-xl border border-carbon-200 bg-white px-3 py-2 text-sm text-carbon-900 placeholder:text-carbon-400 focus:outline-none focus:border-carbon-400 resize-vertical"
                  placeholder={'Step 1...\nStep 2...\nStep 3...'}
                />
              </div>
            </div>

            <div className="p-6 border-t border-carbon-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setAdminEditorOpen(false)}
                className="px-4 py-2 rounded-full text-sm font-semibold text-carbon-700 hover:bg-carbon-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveAdminEditor}
                disabled={savingProductPage || !slug}
                className="px-4 py-2 rounded-full text-sm font-semibold text-white bg-carbon-900 hover:bg-carbon-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {savingProductPage ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {favoriteModal}

      {/* Sticky Add to Cart Mobile */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-carbon-200 p-4 z-50 shadow-lg transform-gpu transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          showMobileStickyBar ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-7xl mx-auto flex gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-carbon-900 line-clamp-1">{product.name}</p>
            <p className="mt-1 text-xs font-medium text-carbon-600">
              {displayPrice.toFixed(2)} $CA
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={currentVariant && !currentVariant.availableForSale}
            onPointerEnter={
              currentVariant && !currentVariant.availableForSale
                ? undefined
                : added
                  ? undefined
                  : clipAddMobile.onPointerEnter
            }
            onPointerMove={
              currentVariant && !currentVariant.availableForSale
                ? undefined
                : added
                  ? undefined
                  : clipAddMobile.onPointerMove
            }
            onPointerLeave={
              currentVariant && !currentVariant.availableForSale
                ? undefined
                : added
                  ? undefined
                  : clipAddMobile.onPointerLeave
            }
            onFocus={() => {
              if ((!currentVariant || currentVariant.availableForSale) && !added) clipAddMobile.onFocus()
            }}
            onBlur={() => clipAddMobile.onBlur()}
            className={`relative shrink-0 overflow-hidden rounded-full border px-6 py-3 text-sm font-medium outline-none [-webkit-tap-highlight-color:transparent] transition-[border-color,color] duration-500 ease-out focus:outline-none focus-visible:outline-none active:scale-[0.98] ${
              currentVariant && !currentVariant.availableForSale
                ? 'cursor-not-allowed border-carbon-200 bg-carbon-200 text-carbon-500'
                : added
                  ? 'border-transparent bg-carbon-600 text-white'
                  : 'border-[#0485F7] bg-[#0485F7] text-white hover:border-[#3592F9] hover:bg-[#3592F9]'
            }`}
            style={
              currentVariant && !currentVariant.availableForSale
                ? undefined
                : added
                  ? undefined
                  : clipAddMobile.cssVars
            }
          >
            <span
              className={`relative z-10 ${
                currentVariant && !currentVariant.availableForSale
                  ? ''
                  : added
                    ? 'text-white'
                      : 'text-white'
              }`}
            >
              {added ? `✓ ${t('product.addedToCart')}` : 'Purchase'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
