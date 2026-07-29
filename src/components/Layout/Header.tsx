import { useState, useEffect, useLayoutEffect, useMemo, useRef, useContext } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCart } from '@/context/CartContext'
import { CATEGORIES, PRODUCTS, SHOP_NAV_CATEGORY_IDS } from '@/data/products'
import { isAuthenticated, getCurrentUserProfile } from '@/utils/supabaseAuth'
import { FB_UNREAD_NOTIF_EVENT, readUnreadNotificationsFromStorage } from '@/utils/inAppNotificationsFlag'
import { supabase } from '@/lib/supabase'
import { fetchProductsFromShopify } from '@/utils/shopifyStorefront'
import { shopBrowseCategoryPath } from '@/constants/paths'
import { LenisContext } from '@/components/LenisRoot'
import { NAV_BAR_INNER_CLASS, NAV_LOGO_GAP_CLASS, NAV_LINKS_GAP_CLASS, NAV_LINK_CLASS, NAV_LINK_ACTIVE_CLASS, NAV_ICON_BTN_CLASS, NAV_BANNER_INNER_CLASS, NAV_BANNER_CLASS, NAV_LOGO_CLASS, NAV_LOGO_SRC, NAV_AVATAR_RING_CLASS, NAV_AVATAR_FALLBACK_CLASS, NAV_MOBILE_BORDER_CLASS, SOLID_NAV_COLOR, navBgStyle } from './navShared'
import { useSiteHeaderHeight } from './useSiteHeaderHeight'
import { NavMegaMenu, type MegaMenuId } from './NavMegaMenu'


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

/** Icônes Lucide (scroll-text, git-compare-arrows, map-pin, wrench) pour le sous-menu ceramic mobile. */
function CeramicMobileNavIcon({ to }: { to: string }) {
  const svgProps = {
    xmlns: 'http://www.w3.org/2000/svg' as const,
    width: 18,
    height: 18,
    viewBox: '0 0 24 24' as const,
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (to) {
    case '/all-coatings':
      return (
        <svg {...svgProps}>
          <path d="M15 12h-5" />
          <path d="M15 8h-5" />
          <path d="M19 17V5a2 2 0 0 0-2-2H4" />
          <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" />
        </svg>
      )
    case '/coatings/compare':
      return (
        <svg {...svgProps}>
          <circle cx="5" cy="6" r="3" />
          <path d="M12 6h5a2 2 0 0 1 2 2v7" />
          <path d="m15 9-3-3 3-3" />
          <circle cx="19" cy="18" r="3" />
          <path d="M12 18H7a2 2 0 0 1-2-2V9" />
          <path d="m9 15 3 3-3 3" />
        </svg>
      )
    case '/coatings/find-installer':
      return (
        <svg {...svgProps}>
          <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      )
    case '/coatings/how-it-works':
      return (
        <svg {...svgProps}>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z" />
        </svg>
      )
    default:
      return null
  }
}

type HeaderProps = {
  showAnnouncementBanner?: boolean
}

export function Header({ showAnnouncementBanner = true }: HeaderProps) {
  const lenis = useContext(LenisContext)
  const { t } = useTranslation()

  const ceramicSections = useMemo(() => [
    {
      title: t('nav.shopCoatingsTitle'),
      description: t('nav.shopCoatingsDesc'),
      links: [
        { label: t('nav.allCoatings'), to: '/all-coatings' },
        { label: t('nav.compareCoatings'), to: '/coatings/compare' },
      ],
    },
    {
      title: t('nav.learnConnectTitle'),
      description: t('nav.learnConnectDesc'),
      links: [
        { label: t('nav.findInstaller'), to: '/coatings/find-installer' },
        { label: t('nav.howItWorks'), to: '/coatings/how-it-works' },
      ],
    },
  ], [t])

  const companySections = useMemo<Array<{ title: string; description: string; links: Array<{ label: string; to?: string; href?: string }> }>>(() => [
    {
      title: t('nav.companySection'),
      description: t('nav.companyDesc'),
      links: [
        { label: t('nav.joinFireball'), to: '/join-fireball' },
        { label: t('nav.merch'), to: '/apparel' },
        { label: t('nav.aboutUs'), to: '/about' },
      ],
    },
    {
      title: t('nav.connect'),
      description: t('nav.connectDesc'),
      links: [
        { label: t('nav.contactUs'), to: '/contact' },
        { label: t('nav.pressKit'), to: '/press-kit' },
        { label: t('nav.legal'), to: '/legal' },
      ],
    },
  ], [t])
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [megaMenu, setMegaMenu] = useState<MegaMenuId | null>(null)
  const [mobileShopOpen, setMobileShopOpen] = useState(false)
  const [mobileCeramicOpen, setMobileCeramicOpen] = useState(false)
  const [mobileCompanyOpen, setMobileCompanyOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [isMobileMenuMounted, setIsMobileMenuMounted] = useState(false)
  const [isMobileMenuVisible, setIsMobileMenuVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchMenuRef = useRef<HTMLDivElement | null>(null)
  const headerStackRef = useRef<HTMLDivElement | null>(null)
  const megaMenuCloseTimerRef = useRef<number | null>(null)
  const { totalItems } = useCart()
  const [headerUnreadNotif, setHeaderUnreadNotif] = useState(() =>
    typeof window !== 'undefined' ? readUnreadNotificationsFromStorage() : false,
  )
  const [loggedInForNotif, setLoggedInForNotif] = useState(false)
  const [headerAvatarUrl, setHeaderAvatarUrl] = useState<string | null>(null)
  const [headerUserInitial, setHeaderUserInitial] = useState<string | null>(null)
  const [headerUserName, setHeaderUserName] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    isAuthenticated().then(async (ok) => {
      if (!cancelled) setLoggedInForNotif(ok)
      if (ok && !cancelled) {
        const profile = await getCurrentUserProfile()
        if (!cancelled && profile) {
          setHeaderAvatarUrl(profile.avatar_url || null)
          setHeaderUserInitial(profile.first_name ? profile.first_name.charAt(0).toUpperCase() : null)
          setHeaderUserName(profile.first_name || null)
        }
      } else if (!ok && !cancelled) {
        setHeaderAvatarUrl(null)
        setHeaderUserInitial(null)
        setHeaderUserName(null)
      }
    })
    return () => {
      cancelled = true
    }
  }, [location.pathname])

  useEffect(() => {
    const onAvatarUpdate = (e: Event) => {
      const ce = e as CustomEvent<{ avatarUrl: string | null }>
      setHeaderAvatarUrl(ce.detail?.avatarUrl || null)
    }
    window.addEventListener('avatar-updated', onAvatarUpdate)
    return () => window.removeEventListener('avatar-updated', onAvatarUpdate)
  }, [])

  useEffect(() => {
    const onFlag = (e: Event) => {
      const ce = e as CustomEvent<{ hasUnread?: boolean }>
      setHeaderUnreadNotif(Boolean(ce.detail?.hasUnread))
    }
    window.addEventListener(FB_UNREAD_NOTIF_EVENT, onFlag)
    return () => window.removeEventListener(FB_UNREAD_NOTIF_EVENT, onFlag)
  }, [])

  const showAccountNotifBang = loggedInForNotif && headerUnreadNotif

  const mobileMenuCloseTimerRef = useRef<number | null>(null)

  const MOBILE_MENU_ANIMATION_MS = 480
  
  type BannerItem = {
    id: string
    enabled: boolean
    text: string
    button_text: string | null
    button_to: string | null
  }

  // Announcement settings
  // Defaults: show an example banner unless Supabase overrides it.
  const [banners, setBanners] = useState<BannerItem[]>([
    {
      id: 'banner-example',
      enabled: true,
      text: 'Exemple — Livraison gratuite dès 99$ · Retours 30 jours',
      button_text: 'Contact us',
      button_to: '/contact',
    },
  ])
  const lastBannerScrollYRef = useRef(0)
  const bannerRef = useRef<HTMLDivElement | null>(null)
  const activeBanners = useMemo(
    () => banners.filter((b) => {
      if (!b.enabled || !String(b.text || '').trim()) return false
      if ((b as any).deadline) {
        const expires = new Date((b as any).deadline).getTime()
        if (!isNaN(expires) && expires <= Date.now()) return false
      }
      return true
    }),
    [banners],
  )
  const bannerActive = showAnnouncementBanner && activeBanners.length > 0
  const [bannerIndex, setBannerIndex] = useState(0)
  const currentBanner = activeBanners[Math.min(bannerIndex, Math.max(activeBanners.length - 1, 0))]

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
          // New multi-banners
          if (Array.isArray(settings.navbar_banners) && settings.navbar_banners.length > 0) {
            setBanners(
              settings.navbar_banners.map((b: any, i: number) => ({
                id: String(b.id ?? `banner-${i}`),
                enabled: Boolean(b.enabled),
                text: String(b.text ?? ''),
                button_text: b.button_text != null ? String(b.button_text) : null,
                button_to: b.button_to != null ? String(b.button_to) : null,
              })),
            )
          } else if (
            settings.navbar_banner_text !== null ||
            settings.navbar_banner_link !== null ||
            settings.navbar_banner_enabled !== null
          ) {
            // Back-compat (single banner old)
            const text = settings.navbar_banner_text ? String(settings.navbar_banner_text) : ''
            const enabled = Boolean(settings.navbar_banner_enabled)
            const btnText = settings.navbar_banner_button_text != null ? String(settings.navbar_banner_button_text) : null
            const btnTo =
              settings.navbar_banner_button_to != null
                ? String(settings.navbar_banner_button_to)
                : settings.navbar_banner_link != null
                  ? String(settings.navbar_banner_link)
                  : null
            const deadline = settings.navbar_banner_deadline != null ? String(settings.navbar_banner_deadline) : null
            setBanners([
              { id: 'banner-1', enabled, text, button_text: btnText, button_to: btnTo, deadline } as any,
            ])
          }
          
          // Use the saved values, or fallback to defaults only if they are null/undefined
          if (settings.featured_collection_name !== null && settings.featured_collection_name !== undefined) {
            setFeaturedName(settings.featured_collection_name)
          } else {
            setFeaturedName('Featured Collection')
          }
          
          if (settings.featured_collection_description !== null && settings.featured_collection_description !== undefined) {
            setFeaturedDescription(settings.featured_collection_description)
          } else {
            setFeaturedDescription('Découvrez notre sélection premium de produits haut de gamme')
          }
          
          setFeaturedImage(settings.featured_collection_image || null)
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

  // Rotation (only among active banners)
  useEffect(() => {
    if (!bannerActive) return
    if (activeBanners.length <= 1) return
    const id = window.setInterval(() => {
      setBannerIndex((i) => (i + 1) % activeBanners.length)
    }, 6500)
    return () => window.clearInterval(id)
  }, [bannerActive, activeBanners.length])

  // Keep this ref synced for potential future interactions tied to scroll direction.
  useEffect(() => {
    lastBannerScrollYRef.current = window.scrollY || window.pageYOffset || 0
  }, [location.pathname])

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
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (searchOpen && searchMenuRef.current && !searchMenuRef.current.contains(target)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [searchOpen])

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

  useLayoutEffect(() => {
    setMenuOpen(false)
    setMegaMenu(null)
    setIsMobileMenuVisible(false)
    setIsMobileMenuMounted(false)
    if (mobileMenuCloseTimerRef.current != null) {
      window.clearTimeout(mobileMenuCloseTimerRef.current)
      mobileMenuCloseTimerRef.current = null
    }
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

  useSiteHeaderHeight()

  useEffect(() => {
    const stack = headerStackRef.current
    if (!stack) return

    const updateStackBottom = () => {
      const bottom = Math.round(stack.getBoundingClientRect().bottom)
      document.documentElement.style.setProperty('--header-stack-bottom', `${bottom}px`)
    }

    updateStackBottom()
    const ro = new ResizeObserver(updateStackBottom)
    ro.observe(stack)
    window.addEventListener('resize', updateStackBottom, { passive: true })
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateStackBottom)
    }
  }, [megaMenu, bannerActive])

  // Stopper Lenis quand le menu mobile est monté (Lenis bypass overflow:hidden)
  useEffect(() => {
    if (!lenis) return
    if (isMobileMenuMounted) {
      lenis.stop()
    } else {
      lenis.start()
    }
  }, [isMobileMenuMounted, lenis])

  // Bloquer totalement le scroll de fond quand le menu mobile est ouvert
  useEffect(() => {
    const isMobileViewport = typeof window !== 'undefined' ? window.innerWidth < 1024 : false
    if (!isMobileMenuMounted || !isMobileViewport) {
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
  }, [isMobileMenuMounted, location.pathname])

  const navLink = NAV_LINK_CLASS

  const openMegaMenu = (id: MegaMenuId) => {
    if (megaMenuCloseTimerRef.current != null) {
      window.clearTimeout(megaMenuCloseTimerRef.current)
      megaMenuCloseTimerRef.current = null
    }
    setMegaMenu(id)
  }

  const scheduleMegaMenuClose = () => {
    if (megaMenuCloseTimerRef.current != null) {
      window.clearTimeout(megaMenuCloseTimerRef.current)
    }
    megaMenuCloseTimerRef.current = window.setTimeout(() => {
      setMegaMenu(null)
      megaMenuCloseTimerRef.current = null
    }, 150)
  }

  const closeMegaMenuNow = () => {
    if (megaMenuCloseTimerRef.current != null) {
      window.clearTimeout(megaMenuCloseTimerRef.current)
      megaMenuCloseTimerRef.current = null
    }
    setMegaMenu(null)
  }

  const cancelMegaMenuClose = () => {
    if (megaMenuCloseTimerRef.current != null) {
      window.clearTimeout(megaMenuCloseTimerRef.current)
      megaMenuCloseTimerRef.current = null
    }
  }
  const normalizeSearchValue = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()

  const searchEntries = useMemo<SearchEntry[]>(() => {
    const pageEntries: SearchEntry[] = [
      { id: 'page-shop', label: 'Shop', to: '/shop', kind: 'Page', keywords: ['products', 'store'] },
      { id: 'page-car-club', label: 'Car club', to: '/car-club', kind: 'Page', keywords: ['club'] },
      { id: 'page-event', label: 'Events', to: '/event', kind: 'Page', keywords: ['events'] },
      { id: 'page-academy', label: 'Academy', to: '/academy', kind: 'Page', keywords: ['formation'] },
      { id: 'page-company', label: 'Join Fireball', to: '/join', kind: 'Page', keywords: ['company', 'partner'] },
      { id: 'page-contact', label: 'Contact', to: '/contact', kind: 'Page', keywords: ['support'] },
      { id: 'page-about', label: 'About us', to: '/about', kind: 'Page', keywords: ['a propos', 'brand'] },
      { id: 'page-legal', label: 'Legal', to: '/legal', kind: 'Page', keywords: ['mentions', 'terms'] },
      { id: 'page-press-kit', label: 'Press kit', to: '/press-kit', kind: 'Page', keywords: ['media', 'presse'] },
      { id: 'page-cart', label: 'Cart', to: '/cart', kind: 'Page', keywords: ['checkout'] },
    ]

    const SEARCH_CATEGORY_IDS = new Set([...SHOP_NAV_CATEGORY_IDS, 'apparel'])
    const categoryEntries: SearchEntry[] = CATEGORIES.filter((c) => SEARCH_CATEGORY_IDS.has(c.id)).map((category) => ({
      id: `category-${category.id}`,
      label: category.name,
      to: shopBrowseCategoryPath(category.id),
      kind: 'Category',
      subtitle: category.description,
      keywords: [category.id, 'category', 'shop'],
    }))

    const categoryById = new Map(CATEGORIES.map((category) => [category.id, category.name]))
    const productEntries: SearchEntry[] = searchableProducts.map((product) => ({
      id: `product-${product.slug}`,
      label: product.name,
      to: `/products/${product.slug}`,
      kind: 'Product',
      subtitle: categoryById.get(product.category) ?? product.category,
      keywords: [product.shortDesc, product.category, product.badge ?? ''],
    }))

    return [...pageEntries, ...categoryEntries, ...productEntries]
  }, [searchableProducts])

  const popularSearches = useMemo(
    () =>
      searchEntries.filter((entry) =>
        ['page-event', 'category-coatings', 'page-car-club', 'page-academy'].includes(entry.id)
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
      try { sessionStorage.setItem('accountIntroFromNav', '1') } catch {}
      navigate('/account')
    }
  }

  return (
    <>
      {/* Banner + Navbar: move as ONE block (no gap, smoother) */}
      <div
        id="site-header-stack"
        ref={headerStackRef}
        className={`fixed top-0 left-0 right-0 ${
          isMobileMenuMounted ? 'z-[10010]' : 'z-[120]'
        } transition-transform duration-300 ease-out will-change-transform`}
        style={{
          transform: 'translateY(0)',
        }}
      >
        <div className="relative overflow-visible" onMouseLeave={scheduleMegaMenuClose}>
        <div id="site-nav-chrome" className="bg-white">
        {/* Navbar Banner */}
        {bannerActive && (
          <div
            ref={bannerRef}
            className={NAV_BANNER_CLASS}
          >
            <div className={NAV_BANNER_INNER_CLASS}>
              <div className="flex items-center justify-center gap-2 flex-nowrap overflow-hidden">
                <p className="min-w-0 text-center text-[11px] sm:text-sm font-nav font-bold text-black/80 truncate whitespace-nowrap">
                  {currentBanner?.text ?? ''}
                </p>
                {currentBanner?.button_to && currentBanner?.button_text ? (
                  <Link
                    to={currentBanner.button_to}
                    className="shrink-0 group inline-flex items-center gap-1 text-[11px] sm:text-sm font-nav font-bold text-black hover:text-black/70 transition-colors whitespace-nowrap"
                  >
                    <span className="underline underline-offset-4 decoration-black/30 group-hover:decoration-black">
                      {currentBanner.button_text}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 640 640"
                      className="shrink-0 h-[14px] w-[14px] text-black transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden
                    >
                      <path
                        fill="currentColor"
                        d="M566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L406.6 137.3C394.1 124.8 373.8 124.8 361.3 137.3C348.8 149.8 348.8 170.1 361.3 182.6L466.7 288L96 288C78.3 288 64 302.3 64 320C64 337.7 78.3 352 96 352L466.7 352L361.3 457.4C348.8 469.9 348.8 490.2 361.3 502.7C373.8 515.2 394.1 515.2 406.6 502.7L566.6 342.7z"
                      />
                    </svg>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        )}

        <header
          className="left-0 right-0"
          style={{
            ...(isMobileMenuMounted
              ? {
                  ...(navBgStyle || {}),
                  backgroundColor: SOLID_NAV_COLOR,
                  backdropFilter: 'none',
                }
              : navBgStyle),
          }}
        >
        {searchOpen && !menuOpen && (
          <div className="fixed inset-0 z-40 bg-black/15 pointer-events-none" aria-hidden />
        )}
        <div className={NAV_BAR_INNER_CLASS}>
        {/* Left: Logo + links */}
        <div className={`flex items-center ${NAV_LOGO_GAP_CLASS} h-full`}>
          <Link to="/" className="flex items-center h-10 w-auto select-none">
            <img id="navbar-logo" src={NAV_LOGO_SRC} alt="Fireball" className={NAV_LOGO_CLASS} draggable={false} />
          </Link>

          <nav className={`hidden lg:flex items-center ${NAV_LINKS_GAP_CLASS} pt-0.5 group h-full`}>
            <Link to="/car-club" className={navLink}>
              {t('nav.carClub')}
            </Link>

            <div
              className="relative h-full flex items-center"
              onMouseEnter={() => openMegaMenu('shop')}
            >
              <button type="button" className={`${navLink} flex items-center gap-1 ${megaMenu === 'shop' ? NAV_LINK_ACTIVE_CLASS : ''}`}>
                {t('nav.shop')}
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${megaMenu === 'shop' ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div
              className="relative h-full flex items-center"
              onMouseEnter={() => openMegaMenu('ceramic')}
            >
              <button type="button" className={`${navLink} flex items-center gap-1 ${megaMenu === 'ceramic' ? NAV_LINK_ACTIVE_CLASS : ''}`}>
                {t('nav.ceramicCoating')}
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${megaMenu === 'ceramic' ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <Link to="/event" className={navLink}>
              {t('nav.events')}
            </Link>
            <Link to="/academy" className={navLink}>
              {t('nav.academy')}
            </Link>
            <Link to="/service-builder" className={navLink}>
              {t('nav.serviceBuilder')}
            </Link>

            <div
              className="relative h-full flex items-center"
              onMouseEnter={() => openMegaMenu('company')}
            >
              <button type="button" className={`${navLink} flex items-center gap-1 ${megaMenu === 'company' ? NAV_LINK_ACTIVE_CLASS : ''}`}>
                {t('nav.company')}
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${megaMenu === 'company' ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </nav>
        </div>

        {/* Right: Search, separator, lang, account, cart */}
        <div className="hidden lg:flex items-center gap-2 h-full">
          <div className="relative h-full flex items-center" ref={searchMenuRef}>
            <button
              type="button"
              onClick={() => {
                closeMegaMenuNow()
                setSearchOpen((open) => !open)
              }}
              className={NAV_ICON_BTN_CLASS}
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

          <div className="flex items-center gap-2">
            <Link
              to="/account"
              onClick={handleAccountClick}
              className="relative flex items-center justify-center w-8 h-8 rounded-full transition-opacity hover:opacity-80"
              aria-label="My account"
            >
              {headerAvatarUrl ? (
                <img
                  src={headerAvatarUrl}
                  alt="Profile"
                  className={`w-8 h-8 rounded-full object-cover ${NAV_AVATAR_RING_CLASS}`}
                />
              ) : headerUserInitial ? (
                <div className={`w-8 h-8 rounded-full ${NAV_AVATAR_RING_CLASS} ${NAV_AVATAR_FALLBACK_CLASS}`}>
                  {headerUserInitial}
                </div>
              ) : (
                <svg className="w-5 h-5 text-black" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
              {showAccountNotifBang ? (
                <span
                  className="absolute -right-0.5 top-0 flex h-[15px] min-w-[15px] items-center justify-center rounded-sm bg-[#E11D48] px-[2px] text-[11px] font-black leading-none text-white shadow-sm ring-1 ring-black/20"
                  aria-hidden
                >
                  !
                </span>
              ) : null}
            </Link>

            <Link
              to="/cart"
              className={`relative ${NAV_ICON_BTN_CLASS}`}
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
          <Link to="/cart" className="relative p-2 text-black" aria-label="Cart">
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
          <label className="fb-burger fb-burger--dark" aria-label="Menu">
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
          className="lg:hidden fixed left-0 right-0 bottom-0 z-[9999] overflow-hidden"
          style={{ top: 'var(--mobile-header-h, 3.5rem)' }}
        >
          <div
            className={`absolute inset-0 transition-transform duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isMobileMenuVisible
                ? 'translate-y-0 pointer-events-auto'
                : '-translate-y-full pointer-events-none'
            }`}
            style={{ backgroundColor: SOLID_NAV_COLOR }}
          >
            <div
              className={`h-full border-t ${NAV_MOBILE_BORDER_CLASS} px-6 py-4 overflow-x-hidden`}
              style={{
                backgroundColor: SOLID_NAV_COLOR,
              }}
            >
          <div className="h-full flex flex-col">
            <nav
              className="-mx-6 space-y-0 pb-4 flex-1 overflow-y-auto overflow-x-hidden"
              style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
            >
              <Link
                to="/car-club"
                className="flex w-[96%] mx-auto items-center justify-between py-3 px-2 font-nav font-bold text-black border-b border-black/[0.08]"
                onClick={() => setMenuOpen(false)}
              >
                <span>{t('nav.carClub')}</span>
              </Link>

            {/* Shop + catégories (dropdown mobile) */}
            <div className={`border-b border-black/[0.08] ${mobileShopOpen ? 'bg-black/[0.03]' : ''}`}>
              <button
                type="button"
                className="flex w-[96%] mx-auto items-center justify-between py-3 px-2 font-nav font-bold text-black"
                onClick={() => setMobileShopOpen((open) => !open)}
              >
                <span>{t('nav.shop')}</span>
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
                <div className="pl-4 pb-2 space-y-4 animate-fade-in">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-black/50">
                      {t('nav.protectionSystems')}
                    </p>
                    <div className="mt-1 space-y-1.5 pl-3">
                      <Link
                        to="/coatings"
                        className="flex items-center gap-2 py-1.5 font-nav text-black/70 hover:text-black"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.5 3 8 9l4 13 4-13-2.5-6" />
                            <path d="M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z" />
                            <path d="M2 9h20" />
                          </svg>
                        </span>
                        <span>{t('nav.coatings')}</span>
                      </Link>
                      <Link
                        to="/sealants"
                        className="flex items-center gap-2 py-1.5 font-nav text-black/70 hover:text-black"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="1" />
                            <path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z" />
                            <path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z" />
                          </svg>
                        </span>
                        <span>{t('nav.sealants')}</span>
                      </Link>
                      <Link
                        to="/waxes"
                        className="flex items-center gap-2 py-1.5 font-nav text-black/70 hover:text-black"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 10H6a4 4 0 0 1-4-4 1 1 0 0 1 1-1h4" />
                            <path d="M7 5a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1 7 7 0 0 1-7 7H8a1 1 0 0 1-1-1z" />
                            <path d="M9 12v5" />
                            <path d="M15 12v5" />
                            <path d="M5 20a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3 1 1 0 0 1-1 1H6a1 1 0 0 1-1-1" />
                          </svg>
                        </span>
                        <span>{t('nav.waxes')}</span>
                      </Link>
                      <Link
                        to="/dressings"
                        className="flex items-center gap-2 py-1.5 font-nav text-black/70 hover:text-black"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2.5 16.88a1 1 0 0 1-.32-1.43l9-13.02a1 1 0 0 1 1.64 0l9 13.01a1 1 0 0 1-.32 1.44l-8.51 4.86a2 2 0 0 1-1.98 0Z" />
                            <path d="M12 2v20" />
                          </svg>
                        </span>
                        <span>{t('nav.dressings')}</span>
                      </Link>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-black/[0.08] space-y-1.5">
                    <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-black/50">
                      {t('nav.maintenancePrep')}
                    </p>
                    <div className="mt-1 space-y-1.5 pl-3">
                      <Link
                        to="/washing"
                        className="flex items-center gap-2 py-1.5 font-nav text-black/70 hover:text-black"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 2h8l2 6H6l2-6Z" />
                            <path d="M6 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" />
                            <path d="M10 12h4" />
                          </svg>
                        </span>
                        <span>{t('nav.washing')}</span>
                      </Link>
                      <Link
                        to="/cleaners"
                        className="flex items-center gap-2 py-1.5 font-nav text-black/70 hover:text-black"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m11 10 3 3" />
                            <path d="M6.5 21A3.5 3.5 0 1 0 3 17.5a2.62 2.62 0 0 1-.708 1.792A1 1 0 0 0 3 21z" />
                            <path d="M9.969 17.031 21.378 5.624a1 1 0 0 0-3.002-3.002L6.967 14.031" />
                          </svg>
                        </span>
                        <span>{t('nav.cleaners')}</span>
                      </Link>
                      <Link
                        to="/towels"
                        className="flex items-center gap-2 py-1.5 font-nav text-black/70 hover:text-black"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 7h-2" />
                            <path d="M6.5 3h11A2.5 2.5 0 0 1 20 5.5V20a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V5.5a1 1 0 0 0-5 0V17a1 1 0 0 0 1 1h4" />
                            <path d="M9 7H2" />
                          </svg>
                        </span>
                        <span>{t('nav.towels')}</span>
                      </Link>
                      <Link
                        to="/accessories"
                        className="flex items-center gap-2 py-1.5 font-nav text-black/70 hover:text-black"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z" />
                          </svg>
                        </span>
                        <span>{t('nav.accessories')}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ceramic coating (dropdown mobile) */}
            <div className={`border-b border-black/[0.08] ${mobileCeramicOpen ? 'bg-black/[0.03]' : ''}`}>
              <button
                type="button"
                className="flex w-[96%] mx-auto items-center justify-between py-3 px-2 font-nav font-bold text-black"
                onClick={() => setMobileCeramicOpen((open) => !open)}
              >
                <span>{t('nav.ceramicCoating')}</span>
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
                  className={`transition-transform mr-1 ${mobileCeramicOpen ? '-rotate-180' : ''}`}
                >
                  <path d="m19 12-7 7-7-7" />
                </svg>
              </button>
              {mobileCeramicOpen && (
                <div className="pl-4 pb-2 space-y-4 animate-fade-in">
                  {ceramicSections.map((section) => (
                    <div key={section.title} className="space-y-1.5">
                      <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-black/50">
                        {section.title}
                      </p>
                      <div className="mt-1 space-y-1.5 pl-3">
                        {section.links.map((link) => (
                          <Link
                            key={link.to}
                            to={link.to}
                            className="flex items-center gap-2 py-1.5 font-nav text-black/70 hover:text-black"
                            onClick={() => setMenuOpen(false)}
                          >
                            <span className="inline-flex items-center justify-center w-5 h-5 shrink-0 text-apex">
                              <CeramicMobileNavIcon to={link.to} />
                            </span>
                            <span>{link.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/event"
              className="flex w-[96%] mx-auto items-center justify-between py-3 px-2 font-nav font-bold text-black border-b border-black/[0.08]"
              onClick={() => setMenuOpen(false)}
            >
              <span>{t('nav.events')}</span>
            </Link>
            <Link
              to="/academy"
              className="flex w-[96%] mx-auto items-center justify-between py-3 px-2 font-nav font-bold text-black border-b border-black/[0.08]"
              onClick={() => setMenuOpen(false)}
            >
              <span>{t('nav.academy')}</span>
            </Link>
            <Link
              to="/service-builder"
              className="flex w-[96%] mx-auto items-center justify-between py-3 px-2 font-nav font-bold text-black border-b border-black/[0.08]"
              onClick={() => setMenuOpen(false)}
            >
              <span>{t('nav.serviceBuilder')}</span>
            </Link>

            {/* Company (dropdown mobile) */}
            <div className={`border-b border-black/[0.08] ${mobileCompanyOpen ? 'bg-black/[0.03]' : ''}`}>
              <button
                type="button"
                className="flex w-[96%] mx-auto items-center justify-between py-3 px-2 font-nav font-bold text-black"
                onClick={() => setMobileCompanyOpen((open) => !open)}
              >
                <span>{t('nav.company')}</span>
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
                    <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-black/50">
                      {t('nav.companySection')}
                    </p>
                    <div className="mt-1 space-y-1.5 pl-3">
                      <Link
                        to="/join-fireball"
                        className="flex items-center gap-2 py-1.5 font-nav text-black/70 hover:text-black"
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
                        <span>{t('nav.joinFireball')}</span>
                      </Link>
                      <Link
                        to="/apparel"
                        className="flex items-center gap-2 py-1.5 font-nav text-black/70 hover:text-black"
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
                        <span>{t('nav.merch')}</span>
                      </Link>
                      <Link
                        to="/about"
                        className="flex items-center gap-2 py-1.5 font-nav text-black/70 hover:text-black"
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
                        <span>{t('nav.aboutUs')}</span>
                      </Link>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-black/[0.08] space-y-1.5">
                    <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-black/50">
                      {t('nav.connect')}
                    </p>
                    <div className="mt-1 space-y-1.5 pl-3">
                      <Link
                        to="/contact"
                        className="flex items-center gap-2 py-1.5 font-nav text-black/70 hover:text-black"
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
                        <span>{t('nav.contactUs')}</span>
                      </Link>
                      <Link
                        to="/press-kit"
                        className="flex items-center gap-2 py-1.5 font-nav text-black/70 hover:text-black"
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
                        <span>{t('nav.pressKit')}</span>
                      </Link>
                      <Link
                        to="/legal"
                        className="flex items-center gap-2 py-1.5 font-nav text-black/70 hover:text-black"
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
                        <span>{t('nav.legal')}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

              {/* Search */}
              <div className={`mt-4 border-b border-black/[0.08] ${mobileSearchOpen ? 'bg-black/[0.03]' : ''}`}>
                <button
                  type="button"
                  onClick={() => setMobileSearchOpen((open) => !open)}
                  className="flex w-[96%] mx-auto items-center justify-between py-3 px-2 text-sm font-nav font-bold text-black"
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
                      className="text-black"
                    >
                      <path d="m21 21-4.34-4.34" />
                      <circle cx="11" cy="11" r="8" />
                    </svg>
                    <span>{t('nav.search')}</span>
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
                        className="w-full py-2.5 px-3 rounded-xl border border-black/15 bg-black/[0.03] text-black text-sm placeholder:text-black/40 focus:outline-none focus:border-black/30"
                      />
                      <p className="text-[10px] font-nav font-bold uppercase tracking-[0.14em] text-black/50 mt-3 mb-2">
                        {searchQuery.trim() ? 'Results' : 'Popular'}
                      </p>
                      {activeSearchEntries.length === 0 ? (
                        <p className="text-sm text-black/60 py-2">No results found.</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {activeSearchEntries.map((entry) => (
                            <li key={`mobile-${entry.id}`}>
                              <button
                                type="button"
                                onClick={() => handleSearchNavigation(entry.to)}
                                className="w-full text-left px-2.5 py-2 rounded-lg bg-black/[0.03] hover:bg-black/[0.08] transition-colors"
                              >
                                <p className="text-sm text-black font-nav font-bold">{entry.label}</p>
                                <div className="mt-0.5 flex items-center justify-between gap-2">
                                  <p className="text-xs text-black/60 truncate">{entry.subtitle || entry.to}</p>
                                  <span className="text-[10px] uppercase tracking-[0.14em] text-black/50">{entry.kind}</span>
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

            </nav>

            {/* Boutons d'action (tout en bas, hors zone scrollable) */}
            <div className="shrink-0 -mx-6 px-6 pt-3 pb-3 flex flex-col items-center gap-2">
              {loggedInForNotif ? (
                <div className="w-full flex flex-col gap-3">
                  {/* Profil + nom */}
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-shrink-0 flex items-center justify-center w-9 h-9">
                      {headerAvatarUrl ? (
                        <img
                          src={headerAvatarUrl}
                          alt="Profile"
                          className={`w-9 h-9 rounded-full object-cover ${NAV_AVATAR_RING_CLASS}`}
                        />
                      ) : headerUserInitial ? (
                        <div className={`w-9 h-9 rounded-full ${NAV_AVATAR_RING_CLASS} ${NAV_AVATAR_FALLBACK_CLASS} text-[14px]`}>
                          {headerUserInitial}
                        </div>
                      ) : (
                        <div className={`w-9 h-9 rounded-full ${NAV_AVATAR_RING_CLASS} bg-carbon-200 flex items-center justify-center`}>
                          <svg className="w-4 h-4 text-black" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {headerUserName && (
                      <span className="text-sm font-nav font-medium text-black/70 truncate">
                        {headerUserName}
                      </span>
                    )}
                  </div>
                  {/* Bouton Dashboard pleine largeur */}
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); navigate('/account/dashboard') }}
                    className="w-full py-3 rounded-xl text-sm font-nav font-semibold text-white bg-[#B61B1B] shadow-[0_8px_20px_rgba(0,0,0,0.45)] hover:bg-[#b61b1bcc] transition-colors"
                  >
                    My dashboard
                  </button>
                </div>
              ) : (
                <>
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
                    className="w-[95vw] max-w-[520px] py-3 rounded-xl text-sm font-nav font-bold uppercase tracking-[0.14em] text-black border border-black/15 bg-transparent hover:bg-black/[0.03] active:bg-black/[0.05] transition-colors"
                  >
                    Join Fireball
                  </button>
                </>
              )}
            </div>
          </div>
            </div>
        </div>
        </div>,
        document.body
      )}
        </header>
        </div>

        <NavMegaMenu
          activeMenu={megaMenu}
          onClose={closeMegaMenuNow}
          onPointerEnterPanel={cancelMegaMenuClose}
          onPointerLeavePanel={scheduleMegaMenuClose}
          ceramicSections={ceramicSections}
          companySections={companySections}
          featuredName={featuredName}
          featuredDescription={featuredDescription}
          featuredImage={featuredImage}
        />
        </div>
      </div>
    </>
  )
}
