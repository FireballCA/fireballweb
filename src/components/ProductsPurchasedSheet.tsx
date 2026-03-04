import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LiquidGlassSelect } from '@/components/LiquidGlassSelect'

interface ProductsPurchasedSheetProps {
  isOpen: boolean
  onClose: () => void
}

interface Purchase {
  id: string
  order_number: string | null
  total_price: number | null
  currency: string | null
  points_earned: number | null
  placed_at: string | null
}

interface PurchaseItem {
  id: string
  product_title: string | null
  variant_title: string | null
  sku: string | null
  quantity: number | null
  unit_price: number | null
  total_price: number | null
}

export function ProductsPurchasedSheet({ isOpen, onClose }: ProductsPurchasedSheetProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null)
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [dateFilter, setDateFilter] = useState<'all' | '30d' | '6m' | 'year'>('all')
  const [rendered, setRendered] = useState(isOpen)
  const [isExiting, setIsExiting] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [scrolledDown, setScrolledDown] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setRendered(true)
      setIsExiting(false)
      document.body.style.overflow = 'hidden'
      return
    }

    if (!isOpen && rendered) {
      setIsExiting(true)
      const timeout = window.setTimeout(() => {
        setRendered(false)
        setIsExiting(false)
        document.body.style.overflow = ''
      }, 450)
      return () => {
        window.clearTimeout(timeout)
        document.body.style.overflow = ''
      }
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, rendered])

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false

    const loadPurchases = async () => {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          if (!cancelled) setPurchases([])
          return
        }

        const { data, error } = await supabase
          .from('purchases')
          .select('id,order_number,total_price,currency,points_earned,placed_at')
          .eq('user_id', user.id)
          .order('placed_at', { ascending: false })

        if (error) {
          console.warn('Failed to load purchases', error.message)
          if (!cancelled) setPurchases([])
          return
        }

        if (!cancelled) {
          setPurchases(data as Purchase[])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadPurchases()

    return () => {
      cancelled = true
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !selectedPurchaseId) {
      setItems([])
      return
    }

    let cancelled = false

    const loadItems = async () => {
      setLoadingItems(true)
      try {
        const { data, error } = await supabase
          .from('purchase_items')
          .select('id,product_title,variant_title,sku,quantity,unit_price,total_price')
          .eq('purchase_id', selectedPurchaseId)
          .order('product_title', { ascending: true })

        if (error) {
          console.warn('Failed to load purchase_items', error.message)
          if (!cancelled) setItems([])
          return
        }

        if (!cancelled) {
          setItems((data || []) as PurchaseItem[])
        }
      } finally {
        if (!cancelled) setLoadingItems(false)
      }
    }

    void loadItems()

    return () => {
      cancelled = true
    }
  }, [isOpen, selectedPurchaseId])

  if (!rendered) return null

  const now = new Date()
  const filteredPurchases = purchases.filter((p) => {
    if (!p.placed_at) return dateFilter === 'all'
    if (dateFilter === 'all') return true
    const placed = new Date(p.placed_at)
    if (Number.isNaN(placed.getTime())) return false

    if (dateFilter === '30d') {
      const cutoff = new Date(now)
      cutoff.setDate(cutoff.getDate() - 30)
      return placed >= cutoff
    }

    if (dateFilter === '6m') {
      const cutoff = new Date(now)
      cutoff.setMonth(cutoff.getMonth() - 6)
      return placed >= cutoff
    }

    // 'year' -> depuis le début de l'année courante
    const cutoff = new Date(now.getFullYear(), 0, 1)
    return placed >= cutoff
  })

  const orderCount = filteredPurchases.length
  const totalPoints = filteredPurchases.reduce(
    (sum, p) => sum + (p.points_earned || 0),
    0,
  )

  const selectedPurchase = selectedPurchaseId
    ? filteredPurchases.find((p) => p.id === selectedPurchaseId) || null
    : null

  return (
    <div className="fixed inset-0 z-[150] flex flex-col justify-end pointer-events-none">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity duration-300"
        onClick={onClose}
        aria-label="Fermer"
      />
      <div
        className="relative w-full h-[92vh] md:h-[88vh] overflow-hidden pointer-events-auto flex flex-col rounded-t-[28px] shadow-[0_-24px_60px_rgba(0,0,0,0.55)]"
        style={{
          backgroundColor: '#0a0a0a',
          animation: isExiting
            ? 'productsPurchasedSlideDown 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards'
            : 'productsPurchasedSlideUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        }}
      >
        {/* Header type Apple */}
        <div className="px-6 md:px-10 pt-6 pb-4 border-b border-white/[0.06] flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/45">
              Account
            </p>
            <h2 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.02em] text-white">
              Products purchased
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-white/65 hover:text-white transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Contenu type page Apple */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 md:px-10 pt-5 pb-8"
          onScroll={(event) => {
            const target = event.currentTarget
            setScrolledDown(target.scrollTop > 40)
          }}
        >
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-10">
            {/* Colonne gauche : résumé */}
            <div className="w-full lg:w-[32%] flex flex-col gap-4">
              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm px-5 py-5 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
                <p className="text-[13px] font-medium text-white/80 mb-2">
                  Purchase history
                </p>
                <p className="text-[28px] font-semibold tracking-[-0.03em] text-white">
                  {orderCount}&nbsp;order{orderCount === 1 ? '' : 's'}
                </p>
                <p className="mt-2 text-[12px] leading-relaxed text-white/60">
                  Once you place an order with your Fireball account, it will appear
                  here with products, total and points earned.
                </p>
              </div>

              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
                <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/45 mb-2">
                  Points
                </p>
                <p className="text-[22px] font-semibold tracking-[-0.03em] text-white">
                  {totalPoints} points
                </p>
                <p className="mt-1 text-[12px] text-white/60">
                  Every eligible purchase helps you progress in your membership level.
                </p>
              </div>
            </div>

            {/* Colonne droite : liste des commandes */}
            <div className="w-full lg:flex-1 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3 mb-1">
                <p className="text-[13px] font-medium text-white/80">
                  Your orders
                </p>
                <div className="w-[180px]">
                  <LiquidGlassSelect
                    label="Date range"
                    value={dateFilter}
                    options={[
                      { value: 'all', label: 'All time' },
                      { value: '30d', label: 'Last 30 days' },
                      { value: '6m', label: 'Last 6 months' },
                      { value: 'year', label: 'This year' },
                    ]}
                    onChange={(val) => {
                      setSelectedPurchaseId(null)
                      setDateFilter(val as 'all' | '30d' | '6m' | 'year')
                    }}
                    placeholder="All time"
                    searchable={false}
                  />
                </div>
              </div>

              {loading ? (
                <div className="rounded-3xl border border-white/[0.12] bg-white/[0.02] px-6 py-7 text-sm text-white/70">
                  Loading your orders...
                </div>
              ) : filteredPurchases.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/[0.18] bg-white/[0.03] px-6 py-7 flex flex-col items-center text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/[0.04] text-white/70 mb-3.5">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 11h18M7 11V7a5 5 0 0 1 10 0v4m-9 7h8"
                      />
                    </svg>
                  </div>
                  <p className="text-[15px] font-medium text-white mb-1">
                    No orders yet
                  </p>
                  <p className="text-[13px] text-white/65 max-w-md">
                    Once you place an order on the store with this account, we will show
                    the order details, products and points here.
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-3xl border border-white/[0.12] bg-white/[0.02] px-4 py-4 flex flex-col gap-2">
                    {filteredPurchases.map((order) => {
                      const isSelected = order.id === selectedPurchaseId
                      return (
                        <button
                          key={order.id}
                          type="button"
                          onClick={() =>
                            setSelectedPurchaseId(isSelected ? null : order.id)
                          }
                          className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${
                            isSelected ? 'bg-white/[0.08]' : 'hover:bg-white/[0.03]'
                          }`}
                        >
                          <div className="flex flex-col gap-0.5">
                            <p className="text-sm text-white">
                              {order.order_number || 'Commande'}
                            </p>
                            <p className="text-[11px] text-white/55">
                              {order.placed_at
                                ? new Date(order.placed_at).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : 'Unknown date'}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end gap-0.5">
                              <p className="text-sm text-white">
                                {order.total_price?.toFixed(2) ?? '0.00'}{' '}
                                {order.currency || 'CAD'}
                              </p>
                              <p className="text-[11px] text-emerald-300">
                                +{order.points_earned ?? 0} pts
                              </p>
                            </div>
                            <span
                              className={`w-5 h-5 inline-flex items-center justify-center rounded-full border text-[10px] ${
                                isSelected
                                  ? 'border-white/70 text-white'
                                  : 'border-white/30 text-white/60'
                              }`}
                            >
                              {isSelected ? '-' : '+'}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {selectedPurchase && (
                    <div className="rounded-3xl border border-white/[0.16] bg-white/[0.03] px-5 py-5">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div>
                          <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/55">
                            Order details
                          </p>
                          <p className="mt-1 text-sm text-white">
                            {selectedPurchase.order_number || 'Commande'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-white">
                            {selectedPurchase.total_price?.toFixed(2) ?? '0.00'}{' '}
                            {selectedPurchase.currency || 'CAD'}
                          </p>
                          <p className="text-[11px] text-emerald-300">
                            +{selectedPurchase.points_earned ?? 0} pts
                          </p>
                        </div>
                      </div>

                      {loadingItems ? (
                        <p className="text-[13px] text-white/65">
                          Loading products...
                        </p>
                      ) : items.length === 0 ? (
                        <p className="text-[13px] text-white/65">
                          Product details are not yet available for this order.
                        </p>
                      ) : (
                        <div className="divide-y divide-white/[0.08]">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="py-3 flex items-center justify-between gap-4"
                            >
                              <div className="flex flex-col gap-0.5">
                                <p className="text-sm text-white">
                                  {item.product_title || 'Product'}
                                </p>
                                {item.variant_title && (
                                  <p className="text-[11px] text-white/55">
                                    {item.variant_title}
                                  </p>
                                )}
                                {item.sku && (
                                  <p className="text-[11px] text-white/45">SKU: {item.sku}</p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-0.5">
                                <p className="text-[11px] text-white/65">
                                  Qty: {item.quantity ?? 0}
                                </p>
                                <p className="text-[11px] text-white/65">
                                  {item.unit_price?.toFixed(2) ?? '0.00'} / u
                                </p>
                                <p className="text-sm text-white">
                                  {item.total_price?.toFixed(2) ?? '0.00'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        {/* Mobile close button (floating only, slide like example) */}
        <button
          type="button"
          onClick={onClose}
          className={`lg:hidden pointer-events-auto flex items-center justify-start rounded-full border border-white/[0.18] bg-white/[0.12] backdrop-blur-md text-white/85 hover:bg-white/[0.2] hover:text-white transition-all duration-300 ease-in-out overflow-hidden absolute right-5 bottom-5 z-20 shadow-[0_12px_35px_rgba(0,0,0,0.6)] ${
            scrolledDown ? 'w-11 h-11' : 'w-[130px] h-11'
          }`}
        >
          <div
            className={`flex items-center justify-center transition-all duration-300 ease-in-out ${
              scrolledDown ? 'w-full pl-0' : 'w-[32%] pl-3'
            }`}
          >
            <svg
              className="w-[17px] h-[17px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
            >
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div
            className={`text-white text-[13px] font-semibold transition-all duration-300 ease-in-out whitespace-nowrap ${
              scrolledDown ? 'opacity-0 w-0 pr-0' : 'opacity-100 w-[68%] pr-3'
            }`}
          >
            Close
          </div>
        </button>
      </div>
      <style>{`
        @keyframes productsPurchasedSlideUp {
          from {
            transform: translateY(100%);
            opacity: 0.98;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes productsPurchasedSlideDown {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(100%);
            opacity: 0.98;
          }
        }
      `}</style>
    </div>
  )
}
