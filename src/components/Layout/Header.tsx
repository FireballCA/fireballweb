import { useId, useState, useEffect, useMemo, useRef, useContext } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCart } from '@/context/CartContext'
import { CATEGORIES, PRODUCTS, SHOP_NAV_CATEGORY_IDS } from '@/data/products'
import { isAuthenticated, getCurrentUserProfile } from '@/utils/supabaseAuth'
import { FB_UNREAD_NOTIF_EVENT, readUnreadNotificationsFromStorage } from '@/utils/inAppNotificationsFlag'
import { supabase } from '@/lib/supabase'
import { isShopPathname } from '@/utils/shopRoutes'
import { isNavOverFullBleedHero } from '@/utils/navHeroOverlap'
import { fetchProductsFromShopify } from '@/utils/shopifyStorefront'
import { shopBrowseCategoryPath } from '@/constants/paths'
import { LenisContext } from '@/components/LenisRoot'

const CERAMIC_SECTIONS = [
  {
    title: 'Shop Coatings',
    description: 'Explore and compare our full range of high-performance ceramic coatings.',
    links: [
      { label: 'All Coatings', to: '/all-coatings' },
      { label: 'Compare Coatings', to: '/coatings/compare' },
    ],
  },
  {
    title: 'Learn & Connect',
    description: 'Find certified installers and learn how ceramic coatings work.',
    links: [
      { label: 'Find Installer', to: '/coatings/find-installer' },
      { label: 'How It Works', to: '/coatings/how-it-works' },
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
      { label: 'Join Fireball', to: '/join-fireball' },
      { label: 'Merch', to: '/apparel' },
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
  const lenis = useContext(LenisContext)
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const [ceramicOpen, setCeramicOpen] = useState(false)
  const [companyOpen, setCompanyOpen] = useState(false)
  const [mobileShopOpen, setMobileShopOpen] = useState(false)
  const [mobileCeramicOpen, setMobileCeramicOpen] = useState(false)
  const [mobileCompanyOpen, setMobileCompanyOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [isMobileMenuMounted, setIsMobileMenuMounted] = useState(false)
  const [isMobileMenuVisible, setIsMobileMenuVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isMobileBreakpoint, setIsMobileBreakpoint] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false,
  )
  const lang = i18n.language === 'fr' ? 'FR' : 'EN'
  const [langOpen, setLangOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const langMenuDesktopRef = useRef<HTMLDivElement | null>(null)
  const langMenuMobileRef = useRef<HTMLDivElement | null>(null)
  const searchMenuRef = useRef<HTMLDivElement | null>(null)
  const { totalItems } = useCart()
  const isDashboardPage = location.pathname === '/account/dashboard' || location.pathname === '/dashboard'
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

  const showAccountNotifBang = loggedInForNotif && headerUnreadNotif && !isDashboardPage

  const isContactPage = location.pathname === '/contact'
  const isShopPage = isShopPathname(location.pathname)
  const isProductPage =
    location.pathname.startsWith('/products/') ||
    location.pathname.startsWith('/product/')
  const isCoatingPage =
    location.pathname.startsWith('/coating/') ||
    location.pathname.startsWith('/coatings/') ||
    location.pathname === '/all-coatings'
  const isStandardNavCoatingPage =
    location.pathname === '/coatings/how-it-works' || location.pathname === '/coatings/compare'
  const isAutoHideHeaderPage = (isProductPage || isCoatingPage) && !isStandardNavCoatingPage
  const isBusinessPage =
    location.pathname.startsWith('/business') || location.pathname.startsWith('/account/business')
  const isJoinClubPage = location.pathname === '/join-club'
  const isAcademyPage = location.pathname === '/academy'
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
  /** 0 = navbar visible, 1 = entièrement masquée (pages produit / coating, hors pages vitrines compare/how-it-works) */
  const [headerHideProgress, setHeaderHideProgress] = useState(0)
  const headerHideProgressRef = useRef(0)
  const lastScrollYRef = useRef(0)
  const headerHideRafRef = useRef<number | null>(null)
  const mobileMenuCloseTimerRef = useRef<number | null>(null)

  const HEADER_HIDE_SCROLL_SCALE = 1 / 320
  const HEADER_SHOW_TOP_PX = 96
  const SCROLL_DELTA_IGNORE = 0.75
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
  const [bannerHidden, setBannerHidden] = useState(false)
  const lastBannerScrollYRef = useRef(0)
  const bannerRef = useRef<HTMLDivElement | null>(null)
  const [bannerHeightPx, setBannerHeightPx] = useState(0)
  const isEventDetailPage = location.pathname.startsWith('/event/') && location.pathname.length > '/event/'.length - 1
  // Disable banners inside dashboards (member dashboard + business/admin) and event detail pages
  const bannerAllowedByRoute =
    !isContactPage && !isBusinessPage && !isDashboardPage && !isEventDetailPage
  const activeBanners = useMemo(
    () => banners.filter((b) => b.enabled && String(b.text || '').trim().length > 0),
    [banners],
  )
  const bannerActive = bannerAllowedByRoute && activeBanners.length > 0
  const [bannerIndex, setBannerIndex] = useState(0)
  const currentBanner = activeBanners[Math.min(bannerIndex, Math.max(activeBanners.length - 1, 0))]

  useEffect(() => {
    if (!bannerActive) {
      setBannerHeightPx(0)
      return
    }

    const el = bannerRef.current
    if (!el) return

    const measure = () => {
      const next = Math.round(el.getBoundingClientRect().height)
      setBannerHeightPx(next)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [bannerActive, banners, bannerIndex])
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
            setBanners([
              { id: 'banner-1', enabled, text, button_text: btnText, button_to: btnTo },
            ])
          }
          
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

  // Rotation (only among active banners)
  useEffect(() => {
    if (!bannerActive) return
    if (activeBanners.length <= 1) return
    const id = window.setInterval(() => {
      setBannerIndex((i) => (i + 1) % activeBanners.length)
    }, 6500)
    return () => window.clearInterval(id)
  }, [bannerActive, activeBanners.length])

  // Banner behavior: hide on scroll down, show on scroll up
  useEffect(() => {
    if (!bannerActive || isJoinClubPage || isAcademyPage) return

    lastBannerScrollYRef.current = window.scrollY || window.pageYOffset || 0
    let raf: number | null = null

    const onScroll = () => {
      if (raf != null) return
      raf = requestAnimationFrame(() => {
        raf = null
        const y = window.scrollY || window.pageYOffset || 0
        const last = lastBannerScrollYRef.current
        const delta = y - last
        lastBannerScrollYRef.current = y

        // Always show near top
        if (y < 24) {
          if (bannerHidden) setBannerHidden(false)
          return
        }

        // Threshold to avoid jitter
        if (delta > 6) {
          if (!bannerHidden) setBannerHidden(true)
        } else if (delta < -6) {
          if (bannerHidden) setBannerHidden(false)
        }
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf != null) cancelAnimationFrame(raf)
    }
  }, [bannerActive, bannerHidden, isJoinClubPage, isAcademyPage])

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
    if (!isAutoHideHeaderPage) {
      headerHideProgressRef.current = 0
      setHeaderHideProgress(0)
    }
  }, [isAutoHideHeaderPage])

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

      if (!isAutoHideHeaderPage) {
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
    isAutoHideHeaderPage,
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

  // Track mobile breakpoint for always-fixed navbar logic
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const handler = (e: MediaQueryListEvent) => setIsMobileBreakpoint(e.matches)
    mq.addEventListener('change', handler)
    setIsMobileBreakpoint(mq.matches)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Expose total header height as CSS var so Layout.tsx spacer can match it
  useEffect(() => {
    const el = document.getElementById('site-header-stack')
    if (!el) return
    const update = () => {
      document.documentElement.style.setProperty('--mobile-header-h', el.getBoundingClientRect().height + 'px')
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

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

  /** Aligné sur le footer (`bg-carbon-900` = #111111) */
  const solidNavColor = '#111111'

  // Navbar is always solid — outer shell is bg-black so there's nothing to fade over
  const navBgStyle: React.CSSProperties = {
    backgroundColor: solidNavColor,
    backdropFilter: 'none',
    borderBottom: '1px solid rgba(37, 37, 37, 0.45)',
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
        className={`fixed top-0 left-0 right-0 ${
          isMobileMenuMounted ? 'z-[10010]' : 'z-[120]'
        } transition-transform duration-300 ease-out will-change-transform`}
        style={{
          transform:
            isMobileBreakpoint || isJoinClubPage || isAcademyPage || !(bannerActive && bannerHidden && bannerHeightPx > 0)
              ? 'translateY(0)'
              : `translateY(-${bannerHeightPx}px)`,
        }}
      >
        {/* Navbar Banner */}
        {bannerActive && (
          <div
            ref={bannerRef}
            className="border-b border-white/[0.07] bg-[#111111] text-white"
          >
            <div className="max-w-7xl mx-auto px-6 py-2">
              <div className="flex items-center justify-center gap-2 flex-nowrap overflow-hidden">
                <p className="min-w-0 text-center text-[11px] sm:text-sm font-nav font-bold text-white/80 truncate whitespace-nowrap">
                  {currentBanner?.text ?? ''}
                </p>
                {currentBanner?.button_to && currentBanner?.button_text ? (
                  <Link
                    to={currentBanner.button_to}
                    className="shrink-0 group inline-flex items-center gap-1 text-[11px] sm:text-sm font-nav font-bold text-white hover:text-white/70 transition-colors whitespace-nowrap"
                  >
                    <span className="underline underline-offset-4 decoration-white/40 group-hover:decoration-white">
                      {currentBanner.button_text}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 640 640"
                      className="shrink-0 h-[14px] w-[14px] transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden
                    >
                      <path
                        fill="white"
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
                  backgroundColor: solidNavColor,
                  backdropFilter: 'none',
                }
              : navBgStyle),
            ...(isAutoHideHeaderPage && !isMobileMenuMounted
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
        <div className={`max-w-7xl mx-auto px-6 flex items-center justify-between ${isShopPage ? 'h-16 max-lg:h-14' : 'h-20 max-lg:h-14'}`}>
        {/* Left: Logo + links */}
        <div className="flex items-center gap-10 h-full">
          <Link to="/" className="flex items-center h-12 w-auto select-none">
            <img id="navbar-logo" src="/LogoFull.avif" alt="Fireball" className={`h-6 w-auto object-contain pointer-events-none${isDashboardPage ? ' max-lg:[filter:invert(1)_hue-rotate(180deg)]' : ''}`} draggable={false} />
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
                            to="/shop"
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
              className="relative flex items-center justify-center w-8 h-8 rounded-full transition-opacity hover:opacity-80"
              aria-label="My account"
            >
              {headerAvatarUrl ? (
                <img
                  src={headerAvatarUrl}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-white/20"
                />
              ) : headerUserInitial ? (
                <div className="w-8 h-8 rounded-full bg-carbon-600 ring-2 ring-white/20 flex items-center justify-center text-[13px] font-semibold text-white select-none">
                  {headerUserInitial}
                </div>
              ) : (
                <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          <Link to="/cart" className={`relative p-2 ${isDashboardPage ? 'text-neutral-900' : 'text-white'}`} aria-label="Cart">
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
          <label className={`fb-burger${isDashboardPage ? ' fb-burger--dark' : ''}`} aria-label="Menu">
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
          className="lg:hidden fixed left-0 right-0 bottom-0 z-[9999] overflow-hidden pointer-events-none"
          style={{ top: 'var(--mobile-header-h, 3.5rem)' }}
        >
          <div
            className={`absolute inset-0 transition-transform duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isMobileMenuVisible
                ? 'translate-y-0 pointer-events-auto'
                : '-translate-y-full pointer-events-none'
            }`}
            style={{ backgroundColor: solidNavColor }}
          >
            <div
              className="h-full border-t border-carbon-800 px-6 py-4 overflow-x-hidden"
              style={{
                backgroundColor: solidNavColor,
              }}
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
                <div className="pl-4 pb-2 space-y-4 animate-fade-in">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-silver/60">
                      PROTECTION SYSTEMS
                    </p>
                    <div className="mt-1 space-y-1.5 pl-3">
                      <Link
                        to="/coatings"
                        className="flex items-center gap-2 py-1.5 font-nav text-silver hover:text-chrome"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.5 3 8 9l4 13 4-13-2.5-6" />
                            <path d="M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z" />
                            <path d="M2 9h20" />
                          </svg>
                        </span>
                        <span>Coatings</span>
                      </Link>
                      <Link
                        to="/sealants"
                        className="flex items-center gap-2 py-1.5 font-nav text-silver hover:text-chrome"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="1" />
                            <path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z" />
                            <path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z" />
                          </svg>
                        </span>
                        <span>Sealants</span>
                      </Link>
                      <Link
                        to="/waxes"
                        className="flex items-center gap-2 py-1.5 font-nav text-silver hover:text-chrome"
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
                        <span>Waxes</span>
                      </Link>
                      <Link
                        to="/dressings"
                        className="flex items-center gap-2 py-1.5 font-nav text-silver hover:text-chrome"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2.5 16.88a1 1 0 0 1-.32-1.43l9-13.02a1 1 0 0 1 1.64 0l9 13.01a1 1 0 0 1-.32 1.44l-8.51 4.86a2 2 0 0 1-1.98 0Z" />
                            <path d="M12 2v20" />
                          </svg>
                        </span>
                        <span>Dressings</span>
                      </Link>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] space-y-1.5">
                    <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-silver/60">
                      MAINTENANCE &amp; PREPARATION
                    </p>
                    <div className="mt-1 space-y-1.5 pl-3">
                      <Link
                        to="/washing"
                        className="flex items-center gap-2 py-1.5 font-nav text-silver hover:text-chrome"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 2h8l2 6H6l2-6Z" />
                            <path d="M6 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" />
                            <path d="M10 12h4" />
                          </svg>
                        </span>
                        <span>Washing</span>
                      </Link>
                      <Link
                        to="/cleaners"
                        className="flex items-center gap-2 py-1.5 font-nav text-silver hover:text-chrome"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m11 10 3 3" />
                            <path d="M6.5 21A3.5 3.5 0 1 0 3 17.5a2.62 2.62 0 0 1-.708 1.792A1 1 0 0 0 3 21z" />
                            <path d="M9.969 17.031 21.378 5.624a1 1 0 0 0-3.002-3.002L6.967 14.031" />
                          </svg>
                        </span>
                        <span>Cleaners</span>
                      </Link>
                      <Link
                        to="/towels"
                        className="flex items-center gap-2 py-1.5 font-nav text-silver hover:text-chrome"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 7h-2" />
                            <path d="M6.5 3h11A2.5 2.5 0 0 1 20 5.5V20a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V5.5a1 1 0 0 0-5 0V17a1 1 0 0 0 1 1h4" />
                            <path d="M9 7H2" />
                          </svg>
                        </span>
                        <span>Towels</span>
                      </Link>
                      <Link
                        to="/accessories"
                        className="flex items-center gap-2 py-1.5 font-nav text-silver hover:text-chrome"
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className="inline-flex items-center justify-center w-5 h-5 text-apex">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z" />
                          </svg>
                        </span>
                        <span>Accessories</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ceramic coating (dropdown mobile) */}
            <div className={`border-b border-white/[0.06] ${mobileCeramicOpen ? 'bg-white/[0.03]' : ''}`}>
              <button
                type="button"
                className="flex w-[96%] mx-auto items-center justify-between py-3 px-2 font-nav font-bold text-white"
                onClick={() => setMobileCeramicOpen((open) => !open)}
              >
                <span>Ceramic coating</span>
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
                  {CERAMIC_SECTIONS.map((section) => (
                    <div key={section.title} className="space-y-1.5">
                      <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-silver/60">
                        {section.title}
                      </p>
                      <div className="mt-1 space-y-1.5 pl-3">
                        {section.links.map((link) => (
                          <Link
                            key={link.to}
                            to={link.to}
                            className="flex items-center gap-2 py-1.5 font-nav text-silver hover:text-chrome"
                            onClick={() => setMenuOpen(false)}
                          >
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
                        <span>Join Fireball</span>
                      </Link>
                      <Link
                        to="/apparel"
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
              {loggedInForNotif ? (
                <div className="w-full flex flex-col gap-3">
                  {/* Profil + nom */}
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-shrink-0 flex items-center justify-center w-9 h-9">
                      {headerAvatarUrl ? (
                        <img
                          src={headerAvatarUrl}
                          alt="Profile"
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-white/20"
                        />
                      ) : headerUserInitial ? (
                        <div className="w-9 h-9 rounded-full bg-carbon-600 ring-2 ring-white/20 flex items-center justify-center text-[14px] font-semibold text-white select-none">
                          {headerUserInitial}
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-carbon-600 ring-2 ring-white/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {headerUserName && (
                      <span className="text-sm font-nav font-medium text-silver truncate">
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
                    className="w-[95vw] max-w-[520px] py-3 rounded-xl text-sm font-nav font-bold uppercase tracking-[0.14em] text-white border border-white/[0.16] bg-transparent hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors"
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
    </>
  )
}
