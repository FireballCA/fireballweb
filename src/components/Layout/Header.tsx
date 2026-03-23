import { useId, useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCart } from '@/context/CartContext'
import { CATEGORIES, PRODUCTS } from '@/data/products'
import { isAuthenticated } from '@/utils/supabaseAuth'
import { supabase } from '@/lib/supabase'
import { isShopPathname } from '@/utils/shopRoutes'
import { isNavOverFullBleedHero } from '@/utils/navHeroOverlap'
import { fetchProductsFromShopify } from '@/utils/shopifyStorefront'

const CERAMIC_SECTIONS = [
  {
    title: 'CARROSSERIE',
    description: 'Protection complète de la carrosserie',
    links: [
      { label: 'Coatings', to: '/boutique/revetements' },
      { label: 'Sealants', to: '/boutique/revetements' },
    ],
  },
  {
    title: 'SURFACES SPÉCIALES',
    description: 'Jantes, vitres et plastiques',
    links: [
      { label: 'Jantes', to: '/boutique/revetements' },
      { label: 'Vitres', to: '/boutique/revetements' },
    ],
  },
]

const COMPANY_SECTIONS: Array<{
  title: string
  description: string
  links: Array<{ label: string; to?: string; href?: string }>
}> = [
  {
    title: 'COMPANY',
    description: 'Brand, recognition & story',
    links: [
      { label: 'Open FIREBALL Center', to: '/join-fireball' },
      { label: 'Merch', to: '/boutique' },
      { label: 'Awards', href: '#' },
      { label: 'About us', to: '/about' },
    ],
  },
  {
    title: 'CONNECT',
    description: 'Media & direct contact',
    links: [
      { label: 'Contact us', to: '/contact' },
      { label: 'Press kit', to: '/press-kit' },
      { label: 'Legal', to: '/legal' },
    ],
  },
]

type SearchEntry = {
  id: string
  label: string
  to: string
  kind: 'Page' | 'Category' | 'Product'
  subtitle?: string
  keywords?: string[]
}

type RankedSearchEntry = SearchEntry & {
  score: number
}

function FlagEN() {
  const clipId = useId()
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
      <defs>
        <clipPath id={clipId}>
          <circle cx="10" cy="10" r="10" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="20" height="20" fill="#012169" />
        <path d="M0 0L20 20M20 0L0 20" stroke="white" strokeWidth="3" />
        <path d="M0 0L20 20M20 0L0 20" stroke="#C8102E" strokeWidth="1.8" />
        <path d="M10 0v20M0 10h20" stroke="white" strokeWidth="5" />
        <path d="M10 0v20M0 10h20" stroke="#C8102E" strokeWidth="3" />
      </g>
    </svg>
  )
}

function FlagFR() {
  const clipId = useId()
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
      <defs>
        <clipPath id={clipId}>
          <circle cx="10" cy="10" r="10" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="6.67" height="20" fill="#002395" />
        <rect width="6.67" height="20" x="6.67" fill="#fff" />
        <rect width="6.67" height="20" x="13.33" fill="#ED2939" />
      </g>
    </svg>
  )
}

export function Header() {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const [ceramicOpen, setCeramicOpen] = useState(false)
  const [companyOpen, setCompanyOpen] = useState(false)
  const [mobileShopOpen, setMobileShopOpen] = useState(false)
  const [mobileCompanyOpen, setMobileCompanyOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [isMobileMenuMounted, setIsMobileMenuMounted] = useState(false)
  const [isMobileMenuVisible, setIsMobileMenuVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrollProgress, setScrollProgress] = useState(0)
  const lang = i18n.language === 'fr' ? 'FR' : 'EN'
  const [langOpen, setLangOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const langMenuDesktopRef = useRef<HTMLDivElement | null>(null)
  const langMenuMobileRef = useRef<HTMLDivElement | null>(null)
  const searchMenuRef = useRef<HTMLDivElement | null>(null)
  const { totalItems } = useCart()
  const isDashboardPage = location.pathname === '/account/dashboard' || location.pathname === '/dashboard'
  const isContactPage = location.pathname === '/contact'
  const isShopPage = isShopPathname(location.pathname)
  const isProductPage =
    location.pathname.startsWith('/product/') ||
    location.pathname.startsWith('/produit/')
  const isCoatingPage = location.pathname.startsWith('/coating')
  /**
   * Fond plein dès le haut (même logique que le footer) : tout sauf accueil / about où le hero
   * passe sous la navbar fixe (transparence → opaque au scroll).
   */
  const useSolidNav =
    isDashboardPage ||
    isContactPage ||
    isProductPage ||
    isCoatingPage ||
    !isNavOverFullBleedHero(location.pathname)
  /** 0 = navbar visible, 1 = entièrement masquée (pages produit / coating uniquement, piloté par le scroll) */
  const [headerHideProgress, setHeaderHideProgress] = useState(0)
  const headerHideProgressRef = useRef(0)
  const lastScrollYRef = useRef(0)
  const headerHideRafRef = useRef<number | null>(null)
  const mobileMenuCloseTimerRef = useRef<number | null>(null)

  const HEADER_HIDE_SCROLL_SCALE = 1 / 320
  const HEADER_SHOW_TOP_PX = 96
  const SCROLL_DELTA_IGNORE = 0.75
  const MOBILE_MENU_ANIMATION_MS = 280
  
  // Announcement settings
  const [bannerText, setBannerText] = useState<string | null>(null)
  const [bannerLink, setBannerLink] = useState<string | null>(null)
  const [bannerEnabled, setBannerEnabled] = useState(false)
  const [featuredName, setFeaturedName] = useState('Featured Collection')
  const [featuredDescription, setFeaturedDescription] = useState('Découvrez notre sélection premium de produits haut de gamme')
  const [featuredImage, setFeaturedImage] = useState<string | null>(null)
  const [searchableProducts, setSearchableProducts] = useState(PRODUCTS)

  // Load announcement settings
  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'announcements')
          .maybeSingle()

        if (error) {
          console.error('Error loading announcements:', error)
          return
        }

        if (data?.value) {
          const settings = data.value as any
          console.log('Loaded announcement settings:', settings)
          setBannerText(settings.navbar_banner_text || null)
          setBannerLink(settings.navbar_banner_link || null)
          setBannerEnabled(settings.navbar_banner_enabled || false)
          
          // Use the saved values, or fallback to defaults only if they are null/undefined
          if (settings.featured_collection_name !== null && settings.featured_collection_name !== undefined) {
            console.log('Setting featured name from DB:', settings.featured_collection_name)
            setFeaturedName(settings.featured_collection_name)
          } else {
            console.log('Using default featured name')
            setFeaturedName('Featured Collection')
          }
          
          if (settings.featured_collection_description !== null && settings.featured_collection_description !== undefined) {
            console.log('Setting featured description from DB:', settings.featured_collection_description)
            setFeaturedDescription(settings.featured_collection_description)
          } else {
            console.log('Using default featured description')
            setFeaturedDescription('Découvrez notre sélection premium de produits haut de gamme')
          }
          
          setFeaturedImage(settings.featured_collection_image || null)
        } else {
          console.log('No announcement settings found in database, using defaults')
        }
      } catch (err) {
        console.error('Error loading announcements:', err)
      }
    }

    loadAnnouncements()
    
    // Subscribe to changes
    const channel = supabase
      .channel('announcements-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings', filter: 'key=eq.announcements' }, () => {
        loadAnnouncements()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadSearchProducts = async () => {
      try {
        const shopProducts = await fetchProductsFromShopify()
        if (!cancelled && Array.isArray(shopProducts) && shopProducts.length > 0) {
          setSearchableProducts(shopProducts)
        }
      } catch (error) {
        if (!cancelled) {
          setSearchableProducts(PRODUCTS)
        }
      }
    }

    loadSearchProducts()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (menuOpen || shopOpen || ceramicOpen || companyOpen || searchOpen || langOpen) {
      headerHideProgressRef.current = 0
      setHeaderHideProgress(0)
    }
  }, [menuOpen, shopOpen, ceramicOpen, companyOpen, searchOpen, langOpen])

  useEffect(() => {
    if (!isProductPage && !isCoatingPage) {
      headerHideProgressRef.current = 0
      setHeaderHideProgress(0)
    }
  }, [isProductPage, isCoatingPage])

  useEffect(() => {
    const flushHeaderHide = () => {
      headerHideRafRef.current = null
      setHeaderHideProgress(headerHideProgressRef.current)
    }

    const scheduleHeaderHideFlush = () => {
      if (headerHideRafRef.current != null) return
      headerHideRafRef.current = requestAnimationFrame(flushHeaderHide)
    }

    const onScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0
      const maxScroll = 200
      const progress = Math.min(scrollY / maxScroll, 1)
      setScrollProgress(progress)

      if (!(isProductPage || isCoatingPage)) {
        lastScrollYRef.current = scrollY
        return
      }

      const navLocked =
        menuOpen || shopOpen || ceramicOpen || companyOpen || searchOpen || langOpen
      if (navLocked) {
        lastScrollYRef.current = scrollY
        if (headerHideProgressRef.current !== 0) {
          headerHideProgressRef.current = 0
          scheduleHeaderHideFlush()
        }
        return
      }

      const lastScrollY = lastScrollYRef.current
      const delta = scrollY - lastScrollY
      lastScrollYRef.current = scrollY

      if (scrollY < HEADER_SHOW_TOP_PX) {
        if (headerHideProgressRef.current !== 0) {
          headerHideProgressRef.current = 0
          scheduleHeaderHideFlush()
        }
        return
      }

      if (Math.abs(delta) < SCROLL_DELTA_IGNORE) {
        return
      }

      let next = headerHideProgressRef.current + delta * HEADER_HIDE_SCROLL_SCALE
      next = Math.min(1, Math.max(0, next))
      if (next !== headerHideProgressRef.current) {
        headerHideProgressRef.current = next
        scheduleHeaderHideFlush()
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (headerHideRafRef.current != null) {
        cancelAnimationFrame(headerHideRafRef.current)
        headerHideRafRef.current = null
      }
    }
  }, [
    isProductPage,
    isCoatingPage,
    menuOpen,
    shopOpen,
    ceramicOpen,
    companyOpen,
    searchOpen,
    langOpen,
  ])

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (langOpen) {
        const inDesktop = langMenuDesktopRef.current?.contains(target)
        const inMobile = langMenuMobileRef.current?.contains(target)
        if (!inDesktop && !inMobile) {
          setLangOpen(false)
        }
      }

      if (searchOpen && searchMenuRef.current && !searchMenuRef.current.contains(target)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [langOpen, searchOpen])

  useEffect(() => {
    if (menuOpen) {
      if (mobileMenuCloseTimerRef.current != null) {
        window.clearTimeout(mobileMenuCloseTimerRef.current)
        mobileMenuCloseTimerRef.current = null
      }
      setIsMobileMenuMounted(true)
      requestAnimationFrame(() => {
        setIsMobileMenuVisible(true)
      })
      return
    }

    setIsMobileMenuVisible(false)
    if (isMobileMenuMounted) {
      mobileMenuCloseTimerRef.current = window.setTimeout(() => {
        setIsMobileMenuMounted(false)
        mobileMenuCloseTimerRef.current = null
      }, MOBILE_MENU_ANIMATION_MS)
    }

    return () => {
      if (mobileMenuCloseTimerRef.current != null) {
        window.clearTimeout(mobileMenuCloseTimerRef.current)
        mobileMenuCloseTimerRef.current = null
      }
    }
  }, [menuOpen, isMobileMenuMounted, MOBILE_MENU_ANIMATION_MS])

  useEffect(() => {
    if (!menuOpen) {
      setMobileSearchOpen(false)
    }
  }, [menuOpen])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return

    const closeMenuOnDesktop = () => {
      if (window.innerWidth >= 1024) {
        setMenuOpen(false)
      }
    }

    closeMenuOnDesktop()
    window.addEventListener('resize', closeMenuOnDesktop)
    return () => window.removeEventListener('resize', closeMenuOnDesktop)
  }, [menuOpen])

  useEffect(() => {
    setSearchQuery('')
  }, [location.pathname])

  // Bloquer totalement le scroll de fond quand le menu mobile est ouvert
  useEffect(() => {
    if (!isMobileMenuMounted) {
      return () => {
        // Cleanup toujours retourné pour éviter l'erreur React #310
      }
    }
    const scrollY = window.scrollY || window.pageYOffset || 0
    const previousBodyOverflow = document.body.style.overflow
    const previousBodyPosition = document.body.style.position
    const previousBodyTop = document.body.style.top
    const previousBodyWidth = document.body.style.width
    const previousBodyTouchAction = document.body.style.touchAction
    const previousHtmlOverflow = document.documentElement.style.overflow

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.touchAction = 'none'

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
      document.body.style.position = previousBodyPosition
      document.body.style.top = previousBodyTop
      document.body.style.width = previousBodyWidth
      document.body.style.touchAction = previousBodyTouchAction
      window.scrollTo(0, scrollY)
    }
  }, [isMobileMenuMounted])

  const opacity = useSolidNav ? 1 : scrollProgress * 0.95
  const borderOpacity = useSolidNav ? 0.45 : 0.15 + (scrollProgress * 0.35) // Toujours au moins 0.15 visible
  /** Aligné sur le footer (`bg-carbon-900` = #111111) */
  const solidNavColor = '#111111'
  
  const navBgStyle: React.CSSProperties = useSolidNav
    ? {
        backgroundColor: solidNavColor,
        backdropFilter: 'none',
        borderBottom: `1px solid rgba(37, 37, 37, ${borderOpacity})`,
        transition: 'background-color 0.12s ease-out, backdrop-filter 0.12s ease-out, border-bottom-color 0.12s ease-out',
      }
    : {
        backgroundColor: `rgba(10, 10, 10, ${opacity})`,
        backdropFilter: opacity > 0.01 ? 'blur(12px)' : 'none',
        borderBottom: `1px solid rgba(37, 37, 37, ${borderOpacity})`,
        transition: 'background-color 0.12s ease-out, backdrop-filter 0.12s ease-out, border-bottom-color 0.12s ease-out',
      }

  const navLink =
    'font-nav font-bold text-white transition-colors text-xs uppercase px-4 py-2 rounded-md hover:bg-carbon-700/20 group-hover:text-silver/70 hover:!text-white'
  const anyMenuOpen = shopOpen || ceramicOpen || companyOpen || searchOpen || langOpen || menuOpen

  const normalizeSearchValue = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()

  const searchEntries = useMemo<SearchEntry[]>(() => {
    const pageEntries: SearchEntry[] = [
      { id: 'page-boutique', label: 'Shop', to: '/boutique', kind: 'Page', keywords: ['boutique', 'products', 'store'] },
      { id: 'page-car-club', label: 'Car club', to: '/car-club', kind: 'Page', keywords: ['club'] },
      { id: 'page-event', label: 'Events', to: '/event', kind: 'Page', keywords: ['events'] },
      { id: 'page-academy', label: 'Academy', to: '/academy', kind: 'Page', keywords: ['formation'] },
      { id: 'page-company', label: 'Open FIREBALL Center', to: '/join-fireball', kind: 'Page', keywords: ['company', 'partner'] },
      { id: 'page-contact', label: 'Contact', to: '/contact', kind: 'Page', keywords: ['support'] },
      { id: 'page-about', label: 'About us', to: '/about', kind: 'Page', keywords: ['a propos', 'brand'] },
      { id: 'page-legal', label: 'Legal', to: '/legal', kind: 'Page', keywords: ['mentions', 'terms'] },
      { id: 'page-press-kit', label: 'Press kit', to: '/press-kit', kind: 'Page', keywords: ['media', 'presse'] },
      { id: 'page-cart', label: 'Cart', to: '/panier', kind: 'Page', keywords: ['panier', 'checkout'] },
    ]

    const categoryEntries: SearchEntry[] = CATEGORIES.map((category) => ({
      id: `category-${category.id}`,
      label: category.name,
      to: `/boutique/${category.id}`,
      kind: 'Category',
      subtitle: category.description,
      keywords: [category.id, 'categorie', 'category', 'boutique'],
    }))

    const categoryById = new Map(CATEGORIES.map((category) => [category.id, category.name]))
    const productEntries: SearchEntry[] = searchableProducts.map((product) => ({
      id: `product-${product.slug}`,
      label: product.name,
      to: `/produit/${product.slug}`,
      kind: 'Product',
      subtitle: categoryById.get(product.category) ?? product.category,
      keywords: [product.shortDesc, product.category, product.badge ?? ''],
    }))

    return [...pageEntries, ...categoryEntries, ...productEntries]
  }, [searchableProducts])

  const popularSearches = useMemo(
    () =>
      searchEntries.filter((entry) =>
        ['page-boutique', 'category-revetements', 'page-car-club', 'page-academy'].includes(entry.id)
      ),
    [searchEntries]
  )

  const searchResults = useMemo<RankedSearchEntry[]>(() => {
    const query = normalizeSearchValue(searchQuery)
    if (!query) return []

    return searchEntries
      .map((entry) => {
        const label = normalizeSearchValue(entry.label)
        const subtitle = normalizeSearchValue(entry.subtitle ?? '')
        const keywords = (entry.keywords ?? []).map((keyword) => normalizeSearchValue(keyword)).join(' ')

        let score = 0
        if (label.startsWith(query)) score += 120
        else if (label.includes(query)) score += 90
        if (subtitle.includes(query)) score += 45
        if (keywords.includes(query)) score += 35
        if (normalizeSearchValue(entry.to).includes(query)) score += 20
        if (query.length > 2 && query.split(' ').every((term) => label.includes(term) || keywords.includes(term))) {
          score += 30
        }

        return { ...entry, score }
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
  }, [searchEntries, searchQuery])

  const activeSearchEntries = searchQuery.trim() ? searchResults : popularSearches

  const handleSearchNavigation = (to: string) => {
    setSearchOpen(false)
    setMobileSearchOpen(false)
    setMenuOpen(false)
    navigate(to)
  }

  const handleAccountClick = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    const authenticated = await isAuthenticated()
    if (authenticated) {
      navigate('/account/dashboard')
    } else {
      sessionStorage.setItem('accountIntroFromNav', '1')
      navigate('/account')
    }
  }

  return (
    <>
      {/* Navbar Banner */}
      {bannerEnabled && bannerText && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-carbon-900 border-b border-carbon-800">
          <div className="max-w-7xl mx-auto px-6 py-2">
            {bannerLink ? (
              <Link
                to={bannerLink}
                className="block text-center text-sm text-white/90 hover:text-white transition-colors"
              >
                {bannerText}
              </Link>
            ) : (
              <p className="text-center text-sm text-white/90">{bannerText}</p>
            )}
          </div>
        </div>
      )}
      <header
        className={`${isProductPage || isCoatingPage ? 'sticky' : 'fixed'} top-0 left-0 right-0 ${
          isMobileMenuMounted ? 'z-[10010]' : 'z-[120]'
        } ${
          bannerEnabled && bannerText ? 'mt-[42px]' : ''
        }`}
        style={{
          ...(isMobileMenuMounted
            ? {
                ...(navBgStyle || {}),
                backgroundColor: solidNavColor,
                backdropFilter: 'none',
              }
            : navBgStyle),
          ...((isProductPage || isCoatingPage) && !isMobileMenuMounted
            ? {
                transform: `translateY(${-headerHideProgress * 100}%)`,
                willChange: 'transform',
              }
            : {}),
        }}
      >
        {anyMenuOpen && !menuOpen && (
          <div className="fixed inset-0 z-40 bg-black/15 pointer-events-none" aria-hidden />
        )}
        <div className={`max-w-7xl mx-auto px-6 flex items-center justify-between ${isShopPage ? 'h-16' : 'h-20'}`}>
        {/* Left: Logo + links */}
        <div className="flex items-center gap-10 h-full">
          <Link to="/" className="flex items-center h-12 w-auto select-none">
            <img src="/LogoFull.avif" alt="Fireball" className="h-6 w-auto object-contain pointer-events-none" draggable={false} />
          </Link>

          <nav className="hidden lg:flex items-center gap-1 pt-0.5 group h-full">
            <Link to="/car-club" className={navLink}>
              Car club
            </Link>

            <div
              className="relative h-full flex items-center"
              onMouseEnter={() => setShopOpen(true)}
              onMouseLeave={() => setShopOpen(false)}
            >
              <button type="button" className={`${navLink} flex items-center gap-1 ${shopOpen ? '!bg-carbon-700/20 !text-white' : ''}`}>
                Shop
                <svg
                  className={`w-4 h-4 transition-transform ${shopOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {shopOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-0 animate-fade-in z-50">
                  <div className="relative bg-white shadow-2xl rounded-2xl pt-4">
                    <svg className="absolute -top-2 left-1/2 w-4 h-2 -translate-x-1/2 fill-white z-10 pointer-events-none" viewBox="0 0 16 8" preserveAspectRatio="none">
                      <path d="M 0 8 L 5 1.5 Q 8 0 11 1.5 L 16 8 Z" />
                    </svg>
                    <div className="overflow-hidden rounded-b-2xl">
                      <div className="flex gap-12 px-8 py-5">
                        {/* PROTECTION SYSTEMS */}
                        <div className="min-w-[200px]">
                          <h3 className="font-nav font-bold text-carbon-900 text-sm mb-1.5">
                            PROTECTION SYSTEMS
                          </h3>
                          <p className="text-sm text-carbon-600 mb-10">
                            Surface durability & coating technologies
                          </p>
                          <ul className="space-y-1.5">
                            <li>
                              <Link
                                to="/coatings"
                                className="relative inline-block text-sm text-carbon-700 no-underline hover:text-carbon-900 overflow-hidden pb-0.5 [&:hover_.dropdown-link-line]:w-full"
                                onClick={() => setShopOpen(false)}
                              >
                                Coatings
                                <span className="dropdown-link-line absolute bottom-0 left-0 h-px bg-carbon-900 w-0 transition-all duration-300 ease-out" />
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="/sealants"
                                className="relative inline-block text-sm text-carbon-700 no-underline hover:text-carbon-900 overflow-hidden pb-0.5 [&:hover_.dropdown-link-line]:w-full"
                                onClick={() => setShopOpen(false)}
                              >
                                Sealants
                                <span className="dropdown-link-line absolute bottom-0 left-0 h-px bg-carbon-900 w-0 transition-all duration-300 ease-out" />
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="/waxes"
                                className="relative inline-block text-sm text-carbon-700 no-underline hover:text-carbon-900 overflow-hidden pb-0.5 [&:hover_.dropdown-link-line]:w-full"
                                onClick={() => setShopOpen(false)}
                              >
                                Waxes
                                <span className="dropdown-link-line absolute bottom-0 left-0 h-px bg-carbon-900 w-0 transition-all duration-300 ease-out" />
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="/dressings"
                                className="relative inline-block text-sm text-carbon-700 no-underline hover:text-carbon-900 overflow-hidden pb-0.5 [&:hover_.dropdown-link-line]:w-full"
                                onClick={() => setShopOpen(false)}
                              >
                                Dressings
                                <span className="dropdown-link-line absolute bottom-0 left-0 h-px bg-carbon-900 w-0 transition-all duration-300 ease-out" />
                              </Link>
                            </li>
                          </ul>
                        </div>

                        {/* MAINTENANCE & PREPARATION */}
                        <div className="min-w-[220px]">
                          <h3 className="font-nav font-bold text-carbon-900 text-sm mb-1.5">
                            MAINTENANCE & PREPARATION
                          </h3>
                          <p className="text-sm text-carbon-600 mb-10">
                            Preparation, cleaning & system care
                          </p>
                          <ul className="space-y-1.5">
                            <li>
                              <Link
                                to="/washing"
                                className="relative inline-block text-sm text-carbon-700 no-underline hover:text-carbon-900 overflow-hidden pb-0.5 [&:hover_.dropdown-link-line]:w-full"
                                onClick={() => setShopOpen(false)}
                              >
                                Washing
                                <span className="dropdown-link-line absolute bottom-0 left-0 h-px bg-carbon-900 w-0 transition-all duration-300 ease-out" />
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="/cleaners"
                                className="relative inline-block text-sm text-carbon-700 no-underline hover:text-carbon-900 overflow-hidden pb-0.5 [&:hover_.dropdown-link-line]:w-full"
                                onClick={() => setShopOpen(false)}
                              >
                                Cleaners
                                <span className="dropdown-link-line absolute bottom-0 left-0 h-px bg-carbon-900 w-0 transition-all duration-300 ease-out" />
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="/towels"
                                className="relative inline-block text-sm text-carbon-700 no-underline hover:text-carbon-900 overflow-hidden pb-0.5 [&:hover_.dropdown-link-line]:w-full"
                                onClick={() => setShopOpen(false)}
                              >
                                Towels
                                <span className="dropdown-link-line absolute bottom-0 left-0 h-px bg-carbon-900 w-0 transition-all duration-300 ease-out" />
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="/accessories"
                                className="relative inline-block text-sm text-carbon-700 no-underline hover:text-carbon-900 overflow-hidden pb-0.5 [&:hover_.dropdown-link-line]:w-full"
                                onClick={() => setShopOpen(false)}
                              >
                                Accessories
                                <span className="dropdown-link-line absolute bottom-0 left-0 h-px bg-carbon-900 w-0 transition-all duration-300 ease-out" />
                              </Link>
                            </li>
                          </ul>
                        </div>

                        {/* Section Image */}
                        <div className="min-w-[220px] max-w-[260px]">
                          <div className="w-full bg-carbon-200 rounded mb-2.5 overflow-hidden">
                            <div className="relative w-full pb-[56.25%]">
                            {featuredImage ? (
                              <img
                                src={featuredImage}
                                alt={featuredName}
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                }}
                              />
                            ) : null}
                            <div className={`absolute inset-0 flex items-center justify-center text-carbon-400 ${featuredImage ? 'hidden' : ''}`}>
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            </div>
                          </div>
                          <h4 className="font-nav font-bold text-carbon-900 text-sm mb-1.5">
                            {featuredName}
                          </h4>
                          <p className="text-sm text-carbon-600 mb-2.5 featured-description">
                            {featuredDescription}
                          </p>
                          <Link
                            to="/boutique"
                            className="inline-flex items-center gap-0.5 text-sm font-nav font-bold text-blue-600 hover:text-blue-700 underline transition-colors"
                            onClick={() => setShopOpen(false)}
                          >
                            Explore now
                            <svg className="w-4 h-4 transform -rotate-45 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div
              className="relative h-full flex items-center"
              onMouseEnter={() => setCeramicOpen(true)}
              onMouseLeave={() => setCeramicOpen(false)}
            >
              <button type="button" className={`${navLink} flex items-center gap-1 ${ceramicOpen ? '!bg-carbon-700/20 !text-white' : ''}`}>
                Ceramic coating
                <svg
                  className={`w-4 h-4 transition-transform ${ceramicOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {ceramicOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-0 animate-fade-in z-50">
                  <div className="relative bg-white shadow-2xl rounded-2xl pt-4">
                    <svg className="absolute -top-2 left-1/2 w-4 h-2 -translate-x-1/2 fill-white z-10 pointer-events-none" viewBox="0 0 16 8" preserveAspectRatio="none">
                      <path d="M 0 8 L 5 1.5 Q 8 0 11 1.5 L 16 8 Z" />
                    </svg>
                    <div className="flex gap-12 px-8 py-5 rounded-b-2xl">
                        {CERAMIC_SECTIONS.map((section) => (
                          <div key={section.title} className="min-w-[200px]">
                            <h3 className="font-nav font-bold text-carbon-900 text-sm mb-1.5">{section.title}</h3>
                            <p className="text-sm text-carbon-600 mb-10">{section.description}</p>
                            <ul className="space-y-1.5">
                              {section.links.map((item) => (
                                <li key={item.label}>
                                  <Link
                                    to={item.to}
                                    className="relative inline-block text-sm text-carbon-700 no-underline hover:text-carbon-900 overflow-hidden pb-0.5 [&:hover_.dropdown-link-line]:w-full"
                                    onClick={() => setCeramicOpen(false)}
                                  >
                                    {item.label}
                                    <span className="dropdown-link-line absolute bottom-0 left-0 h-px bg-carbon-900 w-0 transition-all duration-300 ease-out" />
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                  </div>
                </div>
              )}
            </div>

            <Link to="/event" className={navLink}>
              Events
            </Link>
            <Link to="/academy" className={navLink}>
              Academy
            </Link>

            <div
              className="relative h-full flex items-center"
              onMouseEnter={() => setCompanyOpen(true)}
              onMouseLeave={() => setCompanyOpen(false)}
            >
              <button type="button" className={`${navLink} flex items-center gap-1 ${companyOpen ? '!bg-carbon-700/20 !text-white' : ''}`}>
                Company
                <svg
                  className={`w-4 h-4 transition-transform ${companyOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {companyOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-0 animate-fade-in z-50">
                  <div className="relative bg-white shadow-2xl rounded-2xl pt-4">
                    <svg className="absolute -top-2 left-1/2 w-4 h-2 -translate-x-1/2 fill-white z-10 pointer-events-none" viewBox="0 0 16 8" preserveAspectRatio="none">
                      <path d="M 0 8 L 5 1.5 Q 8 0 11 1.5 L 16 8 Z" />
                    </svg>
                    <div className="flex gap-12 px-8 py-5 rounded-b-2xl">
                        {COMPANY_SECTIONS.map((section) => (
                          <div key={section.title} className="min-w-[200px]">
                            <h3 className="font-nav font-bold text-carbon-900 text-sm mb-1.5">{section.title}</h3>
                            <p className="text-sm text-carbon-600 mb-10">{section.description}</p>
                            <ul className="space-y-1.5">
                              {section.links.map((item) => (
                                <li key={item.label}>
                                  {'to' in item && item.to ? (
                                    <Link
                                      to={item.to}
                                      className="relative inline-block text-sm text-carbon-700 no-underline hover:text-carbon-900 overflow-hidden pb-0.5 [&:hover_.dropdown-link-line]:w-full"
                                      onClick={() => setCompanyOpen(false)}
                                    >
                                      {item.label}
                                      <span className="dropdown-link-line absolute bottom-0 left-0 h-px bg-carbon-900 w-0 transition-all duration-300 ease-out" />
                                    </Link>
                                  ) : (
                                    <a
                                      href={item.href ?? '#'}
                                      className="relative inline-block text-sm text-carbon-700 no-underline hover:text-carbon-900 overflow-hidden pb-0.5 [&:hover_.dropdown-link-line]:w-full"
                                      onClick={(e) => {
                                        if (item.href === '#') e.preventDefault()
                                        setCompanyOpen(false)
                                      }}
                                    >
                                      {item.label}
                                      <span className="dropdown-link-line absolute bottom-0 left-0 h-px bg-carbon-900 w-0 transition-all duration-300 ease-out" />
                                    </a>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right: Search, separator, lang, account, cart */}
        <div className="hidden lg:flex items-center gap-2 h-full">
          <div className="relative h-full flex items-center" ref={searchMenuRef}>
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              className="px-2 py-1.5 rounded-md text-white transition-colors hover:bg-carbon-700/30"
              aria-label="Recherche"
              aria-expanded={searchOpen}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" />
              </svg>
            </button>
            {searchOpen && (
              <div className="absolute top-full right-0 pt-0 animate-fade-in">
                <div className="relative bg-white p-4 min-w-[320px] w-[380px] rounded-2xl shadow-xl pt-6">
                  <svg className="absolute -top-2 right-6 w-4 h-2 fill-white z-10" viewBox="0 0 16 8" preserveAspectRatio="none">
                    <path d="M 0 8 L 5 1.5 Q 8 0 11 1.5 L 16 8 Z" />
                  </svg>
                  <div>
                    <input
                      type="search"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="w-full py-2.5 px-3 rounded-xl bg-transparent border border-black text-carbon-950 text-sm placeholder:text-carbon-500 focus:outline-none focus:ring-0"
                      autoFocus
                    />
                    <p className="text-carbon-500 text-xs font-nav font-bold uppercase mt-4 mb-2">
                      {searchQuery.trim() ? 'Search results' : 'Popular searches'}
                    </p>
                    {activeSearchEntries.length === 0 ? (
                      <p className="px-3 py-3 text-sm text-carbon-500">No results found.</p>
                    ) : (
                      <ul className="space-y-0.5">
                        {activeSearchEntries.map((entry) => (
                          <li key={entry.id}>
                            <button
                              type="button"
                              onClick={() => handleSearchNavigation(entry.to)}
                              className="w-full flex items-start justify-between gap-3 px-3 py-2.5 text-left rounded-2xl hover:bg-black/10 transition-colors"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-nav font-bold text-carbon-900 truncate">{entry.label}</p>
                                {entry.subtitle ? (
                                  <p className="text-xs text-carbon-500 truncate">{entry.subtitle}</p>
                                ) : (
                                  <p className="text-xs text-carbon-500">{entry.to}</p>
                                )}
                              </div>
                              <span className="text-[10px] mt-0.5 uppercase tracking-[0.14em] text-carbon-500">
                                {entry.kind}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-carbon-600" aria-hidden />

          <div className="relative h-full flex items-center" ref={langMenuDesktopRef}>
            <button
              type="button"
              onClick={() => setLangOpen((open) => !open)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md text-silver/80 hover:text-white transition-colors hover:bg-carbon-700/30"
              aria-haspopup="menu"
              aria-expanded={langOpen}
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full overflow-hidden">
                {lang === 'EN' ? <FlagEN /> : <FlagFR />}
              </span>
              <span className="text-sm font-nav font-bold">{lang}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {langOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-0 animate-fade-in">
                <div className="relative bg-white p-2 min-w-[160px] rounded-2xl shadow-xl pt-5">
                  <svg className="absolute -top-2 left-1/2 w-4 h-2 -translate-x-1/2 fill-white z-10" viewBox="0 0 16 8" preserveAspectRatio="none">
                    <path d="M 0 8 L 5 1.5 Q 8 0 11 1.5 L 16 8 Z" />
                  </svg>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        i18n.changeLanguage('en')
                        setLangOpen(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-nav font-bold text-carbon-900 transition-colors rounded-2xl hover:bg-black/10"
                    >
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full overflow-hidden">
                        <FlagEN />
                      </span>
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        i18n.changeLanguage('fr')
                        setLangOpen(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-nav font-bold text-carbon-900 transition-colors rounded-2xl hover:bg-black/10"
                    >
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full overflow-hidden">
                        <FlagFR />
                      </span>
                      Français
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/account"
              onClick={handleAccountClick}
              className="px-2 py-1.5 rounded-md text-white transition-colors hover:bg-carbon-700/30"
              aria-label="My account"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>

            <Link
              to="/cart"
              className="relative px-2 py-1.5 rounded-md text-white transition-colors hover:bg-carbon-700/30"
              aria-label="Cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 px-0.5 rounded-full bg-[#B61B1B] text-white text-[10px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile: logo + cart + menu */}
        <div className="flex lg:hidden items-center gap-3">
          <Link to="/cart" className="relative p-2 text-white" aria-label="Cart">
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 min-w-[1rem] h-4 px-0.5 rounded-full bg-[#B61B1B] text-white text-[10px] font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
          </Link>
          <label className="fb-burger" aria-label="Menu">
            <input
              type="checkbox"
              checked={menuOpen}
              onChange={() => setMenuOpen(!menuOpen)}
              aria-hidden="true"
            />
            <span />
            <span />
            <span />
          </label>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuMounted && typeof document !== 'undefined' && createPortal(
        <div
          className="lg:hidden fixed inset-0 z-[9999] pointer-events-none"
          style={{ backgroundColor: solidNavColor }}
        >
          <div
            className={`h-full ${isShopPage ? 'pt-16' : 'pt-20'} transition-all duration-300 ease-out ${
              isMobileMenuVisible
                ? 'opacity-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 -translate-y-4 pointer-events-none'
            }`}
          >
            <div
              className="h-full border-t border-carbon-800 px-6 py-4 overflow-x-hidden"
              style={{ backgroundColor: solidNavColor }}
            >
          <div className="h-full flex flex-col">
            <nav className="-mx-6 space-y-0 pb-4 flex-1 overflow-y-auto overflow-x-hidden">
              <Link
                to="/car-club"
                className="flex w-[96%] mx-auto items-center justify-between py-3 px-2 font-nav font-bold text-white border-b border-white/[0.06]"
                onClick={() => setMenuOpen(false)}
              >
                <span>Car club</span>
              </Link>

            {/* Shop + catégories (dropdown mobile) */}
            <div className={`border-b border-white/[0.06] ${mobileShopOpen ? 'bg-white/[0.03]' : ''}`}>
              <button
                type="button"
                className="flex w-[96%] mx-auto items-center justify-between py-3 px-2 font-nav font-bold text-white"
                onClick={() => setMobileShopOpen((open) => !open)}
              >
                <span>Shop</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform mr-1 ${mobileShopOpen ? '-rotate-180' : ''}`}
                >
                  <path d="m19 12-7 7-7-7" />
                </svg>
              </button>
              {mobileShopOpen && (
                <div className="pl-10 pb-2 space-y-1 animate-fade-in">
                  <Link
                    to="/boutique"
                    className="block py-1 font-nav text-silver hover:text-chrome"
                    onClick={() => setMenuOpen(false)}
                  >
                    Tous les produits
                  </Link>
                  {CATEGORIES.map((c) => (
                    <Link
                      key={c.id}
                      to={`/boutique/${c.id}`}
                      className="block py-1 font-nav text-silver hover:text-chrome"
                      onClick={() => setMenuOpen(false)}
                    >
                      {c.name}
                    </Link>
                  ))}
                  <Link
                    to="/boutique/revetements"
                    className="block py-1 font-nav text-silver hover:text-chrome"
                    onClick={() => setMenuOpen(false)}
                  >
                    Ceramic coating
                  </Link>
                </div>
              )}
            </div>

            <Link
              to="/event"
              className="flex w-[96%] mx-auto items-center justify-between py-3 px-2 font-nav font-bold text-white border-b border-white/[0.06]"
              onClick={() => setMenuOpen(false)}
            >
              <span>Events</span>
            </Link>
            <Link
              to="/academy"
              className="flex w-[96%] mx-auto items-center justify-between py-3 px-2 font-nav font-bold text-white border-b border-white/[0.06]"
              onClick={() => setMenuOpen(false)}
            >
              <span>Academy</span>
            </Link>

            {/* Company (dropdown mobile) */}
            <div className={`border-b border-white/[0.06] ${mobileCompanyOpen ? 'bg-white/[0.03]' : ''}`}>
              <button
                type="button"
                className="flex w-[96%] mx-auto items-center justify-between py-3 px-2 font-nav font-bold text-white"
                onClick={() => setMobileCompanyOpen((open) => !open)}
              >
                <span>Company</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform mr-1 ${mobileCompanyOpen ? '-rotate-180' : ''}`}
                >
                  <path d="m19 12-7 7-7-7" />
                </svg>
              </button>
              {mobileCompanyOpen && (
                <div className="pl-4 pb-1 space-y-4 animate-fade-in">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-silver/60">
                      Company
                    </p>
                    <div className="mt-1 space-y-1.5 pl-3">
                      <Link
                        to="/join-fireball"
                        className="flex items-center gap-2 py-1.5 font-nav text-silver hover:text-chrome"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M10 12h4" />
                            <path d="M10 8h4" />
                            <path d="M14 21v-3a2 2 0 0 0-4 0v3" />
                            <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
                            <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
                          </svg>
                        </span>
                        <span>Open FIREBALL Center</span>
                      </Link>
                      <Link
                        to="/boutique"
                        className="flex items-center gap-2 py-1.5 font-nav text-silver hover:text-chrome"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
                          </svg>
                        </span>
                        <span>Merch</span>
                      </Link>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 py-1.5 font-nav text-silver hover:text-chrome"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="8" r="6" />
                            <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" />
                          </svg>
                        </span>
                        <span>Awards</span>
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 py-1.5 font-nav text-silver hover:text-chrome"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <path d="M16 3.128a4 4 0 0 1 0 7.744" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <circle cx="9" cy="7" r="4" />
                          </svg>
                        </span>
                        <span>About us</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] space-y-1.5">
                    <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-silver/60">
                      Connect
                    </p>
                    <div className="mt-1 space-y-1.5 pl-3">
                      <Link
                        to="/contact"
                        className="flex items-center gap-2 py-1.5 font-nav text-silver hover:text-chrome"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12.5" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                            <path d="M18 15.28c.2-.4.5-.8.9-1a2.1 2.1 0 0 1 2.6.4c.3.4.5.8.5 1.3 0 1.3-2 2-2 2" />
                            <path d="M20 22v.01" />
                          </svg>
                        </span>
                        <span>Contact us</span>
                      </Link>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 py-1.5 font-nav text-silver hover:text-chrome"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                            <circle cx="12" cy="13" r="2" />
                            <path d="M12 15v5" />
                          </svg>
                        </span>
                        <span>Press kit</span>
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 py-1.5 font-nav text-silver hover:text-chrome"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m14 13-8.381 8.38a1 1 0 0 1-3.001-3l8.384-8.381" />
                            <path d="m16 16 6-6" />
                            <path d="m21.5 10.5-8-8" />
                            <path d="m8 8 6-6" />
                            <path d="m8.5 7.5 8 8" />
                          </svg>
                        </span>
                        <span>Legal</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

              {/* Search */}
              <div className={`mt-4 border-b border-white/[0.06] ${mobileSearchOpen ? 'bg-white/[0.03]' : ''}`}>
                <button
                  type="button"
                  onClick={() => setMobileSearchOpen((open) => !open)}
                  className="flex w-[96%] mx-auto items-center justify-between py-3 px-2 text-sm font-nav font-bold text-white"
                  aria-expanded={mobileSearchOpen}
                >
                  <span className="inline-flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white"
                    >
                      <path d="m21 21-4.34-4.34" />
                      <circle cx="11" cy="11" r="8" />
                    </svg>
                    <span>Search</span>
                  </span>
                  {mobileSearchOpen && (
                    <svg
                      className="w-4 h-4 transition-transform -rotate-180"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 12-7 7-7-7" />
                    </svg>
                  )}
                </button>
                <div
                  className={`transition-all duration-300 ease-out overflow-hidden ${
                    mobileSearchOpen ? 'max-h-[520px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-2 pb-3">
                    <div className="w-[96%] mx-auto">
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search pages, links, products..."
                        className="w-full py-2.5 px-3 rounded-xl border border-white/20 bg-black/20 text-white text-sm placeholder:text-silver/60 focus:outline-none focus:border-white/40"
                      />
                      <p className="text-[10px] font-nav font-bold uppercase tracking-[0.14em] text-silver/60 mt-3 mb-2">
                        {searchQuery.trim() ? 'Results' : 'Popular'}
                      </p>
                      {activeSearchEntries.length === 0 ? (
                        <p className="text-sm text-silver/70 py-2">No results found.</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {activeSearchEntries.map((entry) => (
                            <li key={`mobile-${entry.id}`}>
                              <button
                                type="button"
                                onClick={() => handleSearchNavigation(entry.to)}
                                className="w-full text-left px-2.5 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] transition-colors"
                              >
                                <p className="text-sm text-white font-nav font-bold">{entry.label}</p>
                                <div className="mt-0.5 flex items-center justify-between gap-2">
                                  <p className="text-xs text-silver/70 truncate">{entry.subtitle || entry.to}</p>
                                  <span className="text-[10px] uppercase tracking-[0.14em] text-silver/60">{entry.kind}</span>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Langue */}
              <div className="mt-4 pt-1 relative" ref={langMenuMobileRef}>
                <button
                  type="button"
                  onClick={() => setLangOpen((open) => !open)}
                  className="flex w-[96%] mx-auto items-center gap-2 py-3 px-2 text-sm font-nav font-bold text-white"
                  aria-haspopup="menu"
                  aria-expanded={langOpen}
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full overflow-hidden">
                      {lang === 'EN' ? <FlagEN /> : <FlagFR />}
                    </span>
                    <span>{lang === 'EN' ? 'English' : 'Français'}</span>
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${langOpen ? '-rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 12-7 7-7-7" />
                  </svg>
                </button>
                {langOpen && (
                  <div className="absolute left-0 right-0 top-full mt-0 rounded-b-lg bg-inherit shadow-none animate-fade-in">
                    {lang === 'EN' ? (
                      <button
                        type="button"
                        onClick={() => {
                          i18n.changeLanguage('fr')
                          setLangOpen(false)
                        }}
                        className="flex w-[96%] mx-auto items-center gap-2 py-2 px-2 text-sm font-nav font-bold text-silver hover:text-white"
                      >
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full overflow-hidden">
                          <FlagFR />
                        </span>
                        Français
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          i18n.changeLanguage('en')
                          setLangOpen(false)
                        }}
                        className="flex w-[96%] mx-auto items-center gap-2 py-2 px-2 text-sm font-nav font-bold text-silver hover:text-white"
                      >
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full overflow-hidden">
                          <FlagEN />
                        </span>
                        English
                      </button>
                    )}
                  </div>
                )}
              </div>

            </nav>

            {/* Boutons d'action (tout en bas, hors zone scrollable) */}
            <div className="shrink-0 -mx-6 px-6 pt-3 pb-3 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  navigate('/account')
                }}
                className="w-[95vw] max-w-[520px] py-3 rounded-xl text-sm font-nav font-bold uppercase tracking-[0.14em] text-white bg-[#B61B1B] shadow-[0_14px_30px_rgba(0,0,0,0.55)] hover:bg-[#b61b1bcc] transition-colors"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  navigate('/join-fireball')
                }}
                className="w-[95vw] max-w-[520px] py-3 rounded-xl text-sm font-nav font-bold uppercase tracking-[0.14em] text-white border border-white/[0.16] bg-transparent hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors"
              >
                Join Fireball
              </button>
            </div>
          </div>
            </div>
        </div>
        </div>,
        document.body
      )}
    </header>
    </>
  )
}
