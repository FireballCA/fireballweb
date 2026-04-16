import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SHOPIFY_SHOP_APP_URL } from '@/constants/shopifyShopApp'
import { fetchCustomerOrders, formatOrderRef, type CustomerOrder } from '@/utils/customerOrders'
import { appleButtonVisualClassName } from '@/components/ui/AppleButton'
import { cn } from '@/lib/utils'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AccountOrders() {
  usePageTitle('Your orders - Fireball Canada')
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await fetchCustomerOrders()
        if (!cancelled) setOrders(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-carbon-900">
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <div className="mb-8 flex items-center justify-between gap-4">
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
          <h1 className="mt-1 font-nav text-3xl font-bold tracking-tight text-carbon-900 sm:text-4xl">Your orders</h1>
        </header>

        <div className="mb-10 rounded-2xl border border-carbon-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0485F7]">Shopify Shop app</p>
          <h2 className="mt-2 font-nav text-xl font-bold tracking-tight text-carbon-900 sm:text-2xl">
            Track orders in the Shop app
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-carbon-600">
            Open the official Shop app by Shopify in a new tab to see order status, tracking, and receipts. Sign in with
            the same email you use at checkout.
          </p>
          <a
            href={SHOPIFY_SHOP_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn('mt-6 inline-flex w-full justify-center sm:w-auto', appleButtonVisualClassName)}
          >
            Open Shop app
          </a>
        </div>

        <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.1em] text-carbon-500">
          Synced on Fireball
        </h2>
        <p className="mb-6 text-sm text-carbon-600">
          Orders linked to your Fireball account from our store (for XP and dashboard).
        </p>

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06]" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-black/[0.06]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-carbon-100 text-2xl text-carbon-400" aria-hidden>
              📦
            </div>
            <p className="text-base font-medium text-carbon-900">No orders yet</p>
            <p className="mt-2 text-sm text-carbon-600">
              When you buy from the Fireball shop, synced orders will show below. For full history and tracking, use the
              Shop app.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href={SHOPIFY_SHOP_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn('inline-flex w-full justify-center sm:w-auto', appleButtonVisualClassName)}
              >
                Open Shop app
              </a>
              <Link to="/shop" className="text-sm font-semibold text-[#0485F7] hover:underline">
                Browse the shop
              </Link>
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {orders.map((order) => {
              const firstLine = order.lineItems?.[0]
              const thumb = firstLine?.imageUrl || order.imageUrl
              const title = firstLine?.title ?? order.name
              const total = order.totalPrice ?? 0
              const cur = order.currency || 'CAD'
              return (
                <li key={order.id}>
                  <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06] transition-shadow hover:shadow-md">
                    <div className="flex gap-4 p-4 sm:p-5">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-carbon-100 sm:h-24 sm:w-24">
                        {thumb ? (
                          <img src={thumb} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-2xl text-carbon-400" aria-hidden>
                            🧴
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-carbon-900">
                              Order {formatOrderRef(order.orderNumber)}
                            </p>
                            <p className="mt-0.5 text-xs text-carbon-500">
                              {order.date ? `Placed ${order.date}` : 'Date unavailable'}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                            Completed
                          </span>
                        </div>
                        <p className="mt-3 line-clamp-2 text-sm text-carbon-800">{title}</p>
                        {order.lineItems && order.lineItems.length > 1 && (
                          <p className="mt-1 text-xs text-carbon-500">
                            +{order.lineItems.length - 1} more item{order.lineItems.length > 2 ? 's' : ''}
                          </p>
                        )}
                        <div className="mt-4 flex flex-wrap items-end justify-between gap-2 border-t border-carbon-100 pt-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-carbon-500">Total</p>
                            <p className="text-base font-bold text-carbon-900">
                              {total.toFixed(2)} $ {cur}
                            </p>
                          </div>
                          {typeof order.pointsEarned === 'number' && Number.isFinite(order.pointsEarned) && (
                            <p className="text-xs font-medium text-carbon-600">+{order.pointsEarned} XP</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
