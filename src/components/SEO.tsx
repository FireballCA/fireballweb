import { Helmet } from 'react-helmet-async'

export const SITE_URL = 'https://fireball-canada.com'
export const SITE_NAME = 'Fireball Canada'
export const DEFAULT_TITLE = 'Fireball Canada — World Ceramic Coating Leader'
export const DEFAULT_DESCRIPTION =
  'Fireball Canada — World leader in ceramic coatings, paint protection and premium auto detailing products. Find a certified installer near you and protect your vehicle with the most trusted ceramic coating in Canada.'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/LogoFull.avif`

export interface SEOProps {
  /** Page-specific title. If omitted, default site title is used. */
  title?: string
  /** When true, the title is used as-is. When false (default), " | Fireball Canada" is appended. */
  rawTitle?: boolean
  /** Meta description (155–165 chars optimal). */
  description?: string
  /** Path or absolute URL of the canonical page. Defaults to current path. */
  canonicalPath?: string
  /** Comma separated keywords. */
  keywords?: string
  /** Absolute or relative path to the OpenGraph image. */
  image?: string
  /** OpenGraph type. Defaults to "website". Use "product" for product pages, "article" for blog posts. */
  ogType?: 'website' | 'product' | 'article' | 'profile'
  /** When true, instructs robots to noindex,nofollow this page (e.g. account pages). */
  noindex?: boolean
  /** Optional structured data object(s) – will be serialized as JSON-LD. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
  /** Locale, defaults to en_CA. */
  locale?: string
}

function resolveUrl(pathOrUrl?: string): string {
  if (!pathOrUrl) {
    if (typeof window !== 'undefined') {
      return `${SITE_URL}${window.location.pathname}`
    }
    return SITE_URL
  }
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

export function SEO({
  title,
  rawTitle = false,
  description = DEFAULT_DESCRIPTION,
  canonicalPath,
  keywords,
  image = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noindex = false,
  jsonLd,
  locale = 'en_CA',
}: SEOProps) {
  const fullTitle = title
    ? rawTitle
      ? title
      : `${title} | ${SITE_NAME}`
    : DEFAULT_TITLE
  const canonical = resolveUrl(canonicalPath)
  const ogImage = resolveUrl(image)

  const jsonLdArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      <link rel="canonical" href={canonical} />

      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex,nofollow" />
      ) : (
        <meta
          name="robots"
          content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
        />
      )}
      <meta name="googlebot" content="index,follow" />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={`${SITE_NAME} — ${title || 'World Ceramic Coating Leader'}`} />
      <meta property="og:locale" content={locale} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@fireballcanada" />

      {/* hreflang */}
      <link rel="alternate" hrefLang="en-ca" href={canonical} />
      <link rel="alternate" hrefLang="x-default" href={canonical} />

      {/* JSON-LD Structured Data */}
      {jsonLdArray.map((data, i) => (
        <script type="application/ld+json" key={`jsonld-${i}`}>
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Reusable JSON-LD builders
 * ──────────────────────────────────────────────────────────────────────────── */

export const ORGANIZATION_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  alternateName: 'Fireball',
  url: SITE_URL,
  logo: `${SITE_URL}/LogoFull.avif`,
  image: `${SITE_URL}/LogoFull.avif`,
  description: DEFAULT_DESCRIPTION,
  sameAs: [
    'https://www.instagram.com/fireballcanada/',
    'https://www.facebook.com/fireballcanada',
    'https://www.youtube.com/@fireballcanada',
    'https://www.tiktok.com/@fireballcanada',
  ],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@fireball-canada.com',
      areaServed: 'CA',
      availableLanguage: ['English', 'French'],
    },
  ],
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'CA',
    addressRegion: 'QC',
  },
}

export const WEBSITE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  description: DEFAULT_DESCRIPTION,
  inLanguage: 'en-CA',
  publisher: { '@id': `${SITE_URL}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: resolveUrl(it.path),
    })),
  }
}

export function productJsonLd({
  name,
  description,
  image,
  sku,
  price,
  currency = 'CAD',
  availability = 'https://schema.org/InStock',
  url,
  rating,
  reviewCount,
  brand = SITE_NAME,
}: {
  name: string
  description: string
  image: string | string[]
  sku?: string
  price: number | string
  currency?: string
  availability?: string
  url: string
  rating?: number
  reviewCount?: number
  brand?: string
}): Record<string, unknown> {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: Array.isArray(image) ? image.map((i) => resolveUrl(i)) : resolveUrl(image),
    brand: { '@type': 'Brand', name: brand },
    offers: {
      '@type': 'Offer',
      url: resolveUrl(url),
      priceCurrency: currency,
      price: typeof price === 'number' ? price.toFixed(2) : price,
      availability,
      itemCondition: 'https://schema.org/NewCondition',
    },
  }
  if (sku) ld.sku = sku
  if (rating && reviewCount) {
    ld.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating,
      reviewCount,
    }
  }
  return ld
}

export function serviceJsonLd({
  name,
  description,
  serviceType,
  areaServed = 'Canada',
  provider = SITE_NAME,
  url,
}: {
  name: string
  description: string
  serviceType: string
  areaServed?: string
  provider?: string
  url: string
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    serviceType,
    areaServed: { '@type': 'Country', name: areaServed },
    provider: {
      '@type': 'Organization',
      name: provider,
      '@id': `${SITE_URL}/#organization`,
    },
    url: resolveUrl(url),
  }
}

export function faqJsonLd(items: { question: string; answer: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: it.answer,
      },
    })),
  }
}

export default SEO
