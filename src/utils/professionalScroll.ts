/**
 * Système de scroll professionnel avec effet de momentum et parallaxe
 * Inspiré des sites premium comme Apple
 */

let isInitialized = false
let currentScroll = 0
let targetScroll = 0
let rafId: number | null = null
let isScrolling = false

const SCROLL_SPEED = 0.6 // Vitesse de scroll (plus lent = plus professionnel)
const DAMPING = 0.12 // Damping pour l'effet d'élasticité
const PARALLAX_ELEMENTS: Array<{ element: HTMLElement; intensity: number; direction: 'up' | 'down' }> = []

/**
 * Initialise le système de scroll professionnel
 */
export function initProfessionalScroll() {
  if (isInitialized) return
  isInitialized = true

  currentScroll = window.pageYOffset || document.documentElement.scrollTop
  targetScroll = currentScroll

  // Intercepter le scroll natif avec détection intelligente
  let lastWheelTime = 0
  let wheelVelocity = 0
  let isUserScrolling = false

  const handleWheel = (e: WheelEvent) => {
    // Ne pas intercepter si l'utilisateur scroll dans un élément spécifique (input, textarea, etc.)
    const target = e.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.closest('[data-no-smooth-scroll]') ||
      target.closest('header') ||
      target.closest('[role="dialog"]') ||
      target.closest('[data-modal]')
    ) {
      return
    }

    // Ne pas intercepter si on est déjà en haut ou en bas
    const currentPos = window.pageYOffset || document.documentElement.scrollTop
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    
    if ((currentPos <= 0 && e.deltaY < 0) || (currentPos >= maxScroll && e.deltaY > 0)) {
      return
    }

    isUserScrolling = true
    const now = Date.now()
    const timeDelta = now - lastWheelTime
    lastWheelTime = now

    // Calculer la vélocité pour un effet de momentum
    if (timeDelta < 100) {
      wheelVelocity = e.deltaY
    } else {
      wheelVelocity = e.deltaY * 0.5
    }

    // Appliquer la vitesse personnalisée
    const delta = wheelVelocity * SCROLL_SPEED
    targetScroll += delta

    // Limiter le scroll
    targetScroll = Math.max(0, Math.min(targetScroll, maxScroll))

    if (!isScrolling) {
      isScrolling = true
      smoothScroll()
    }

    // Empêcher le scroll natif seulement si on gère le scroll
    e.preventDefault()
  }

  // Gérer le scroll avec momentum
  const smoothScroll = () => {
    const diff = targetScroll - currentScroll

    if (Math.abs(diff) > 0.5) {
      // Appliquer le damping pour un effet fluide et élastique
      currentScroll += diff * DAMPING

      // Scroll fluide avec easing
      window.scrollTo({
        top: currentScroll,
        behavior: 'auto', // On gère nous-mêmes le smooth
      })

      // Mettre à jour les éléments parallaxe
      updateParallaxElements(currentScroll)

      rafId = requestAnimationFrame(smoothScroll)
    } else {
      currentScroll = targetScroll
      window.scrollTo({
        top: currentScroll,
        behavior: 'auto',
      })
      updateParallaxElements(currentScroll)
      isScrolling = false
    }
  }

  // Mettre à jour la position de scroll actuelle lors du scroll natif
  const handleScroll = () => {
    // Ne synchroniser que si le scroll n'est pas initié par notre système
    if (!isScrolling && !isUserScrolling) {
      currentScroll = window.pageYOffset || document.documentElement.scrollTop
      targetScroll = currentScroll
    }
    isUserScrolling = false
  }

  // Ajouter les event listeners
  window.addEventListener('wheel', handleWheel, { passive: false })
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('touchmove', handleScroll, { passive: true })

  // Mettre à jour au resize
  window.addEventListener('resize', () => {
    currentScroll = window.pageYOffset || document.documentElement.scrollTop
    targetScroll = currentScroll
  })
}

/**
 * Ajoute un élément avec effet parallaxe
 */
export function addParallaxElement(
  element: HTMLElement,
  intensity: number = 0.3,
  direction: 'up' | 'down' = 'up'
) {
  if (!PARALLAX_ELEMENTS.find((p) => p.element === element)) {
    PARALLAX_ELEMENTS.push({ element, intensity, direction })
    element.style.willChange = 'transform'
  }
}

/**
 * Retire un élément parallaxe
 */
export function removeParallaxElement(element: HTMLElement) {
  const index = PARALLAX_ELEMENTS.findIndex((p) => p.element === element)
  if (index !== -1) {
    PARALLAX_ELEMENTS.splice(index, 1)
    element.style.transform = ''
    element.style.willChange = ''
  }
}

/**
 * Met à jour tous les éléments parallaxe
 */
function updateParallaxElements(scrollY: number) {
  const windowHeight = window.innerHeight
  const viewportCenter = scrollY + windowHeight / 2

  PARALLAX_ELEMENTS.forEach(({ element, intensity, direction }) => {
    const rect = element.getBoundingClientRect()
    const elementTop = rect.top + scrollY
    const elementHeight = rect.height
    const elementCenter = elementTop + elementHeight / 2

    const distanceFromCenter = viewportCenter - elementCenter
    const parallaxValue = distanceFromCenter * intensity * (direction === 'up' ? -1 : 1)

    if (rect.bottom >= 0 && rect.top <= windowHeight) {
      element.style.transform = `translate3d(0, ${parallaxValue}px, 0)`
    }
  })
}

/**
 * Nettoie le système de scroll
 */
export function cleanupProfessionalScroll() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
  }
  PARALLAX_ELEMENTS.forEach(({ element }) => {
    element.style.transform = ''
    element.style.willChange = ''
  })
  PARALLAX_ELEMENTS.length = 0
  isInitialized = false
}
