import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SHOPIFY_CUSTOMER_ORDERS_URL } from '@/constants/shopifyShopApp'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AccountTrackOrder() {
  usePageTitle('Track your order - Fireball Canada')
  useEffect(() => {
    window.location.replace(SHOPIFY_CUSTOMER_ORDERS_URL)
  }, [])

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-carbon-900">
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <div className="mb-8">
          <Link
            to="/account/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0485F7] transition-colors hover:text-[#0366c7]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to dashboard
          </Link>
        </div>

        <header className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-carbon-500">Orders</p>
          <h1 className="mt-1 font-nav text-3xl font-bold tracking-tight text-carbon-900 sm:text-4xl">Track your order</h1>
        </header>

        <div className="rounded-2xl border border-carbon-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm leading-relaxed text-carbon-600">Redirecting to Shopify order tracking...</p>
          <a
            href={SHOPIFY_CUSTOMER_ORDERS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex text-sm font-semibold text-[#0485F7] hover:underline"
          >
            Open Shopify orders page
          </a>
        </div>
      </div>
    </div>
  )
}
