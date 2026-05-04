import { useCallback, useEffect, useRef } from 'react'
import { AppleSheet } from '@/components/ui/AppleSheet'
import { AppleCapsuleLabel } from '@/components/ui/AppleInfoPill'
import { ServiceBuilderConfigurationBody } from '@/components/service-builder/ServiceBuilderConfigurationBody'
import { ServiceBuilderReviewSheetContent } from '@/components/service-builder/ServiceBuilderReviewSheetContent'
import { useNotifications } from '@/context/NotificationsContext'
import { useServiceBuilderForm } from '@/hooks/useServiceBuilderForm'
import type { StockistLocation } from '@/data/stockists'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  shop: StockistLocation | null
}

function stockistShortLabel(shop: StockistLocation) {
  return [shop.name, shop.city, shop.province].filter(Boolean).join(' · ')
}

export function ServiceBuilderQuickMapSheet({ open, onOpenChange, shop }: Props) {
  const { notify } = useNotifications()
  const f = useServiceBuilderForm()
  /** Garde le stockiste si la prop `shop` est brièvement null pendant l’envoi (feuilles empilées / re-render parent). */
  const shopRef = useRef<StockistLocation | null>(null)

  const stockistLabel = shop ? stockistShortLabel(shop) : ''

  useEffect(() => {
    if (open && shop) {
      shopRef.current = shop
    }
  }, [open, shop])

  useEffect(() => {
    if (!open || !shop) return
    const line = [shop.address1, shop.city, shop.province, shop.postalCode].filter(Boolean).join(', ')
    if (line) f.setServiceAddress(line)
  }, [open, shop, f])

  const handleClose = useCallback(() => {
    shopRef.current = null
    f.resetForm()
    onOpenChange(false)
  }, [f, onOpenChange])

  const handleSend = useCallback(async () => {
    const stockist = shop ?? shopRef.current
    if (!stockist) {
      notify({
        title: 'Unable to send',
        message: 'Shop context was lost. Close this sheet and open Quick service again from the map.',
        kind: 'error',
      })
      return
    }
    if (!f.isReviewFormValid) {
      notify({
        title: 'Incomplete form',
        message: 'Please fill in all required fields, including vehicle and contact details.',
        kind: 'error',
      })
      return
    }
    if (f.isSending) return
    f.setIsSending(true)
    try {
      const result = await f.submitServiceRequest({
        source: 'quick_service_map',
        stockistId: stockist.id,
        stockistSnapshot: stockistShortLabel(stockist),
      })
      if (!result.ok) {
        notify({ title: 'Unable to save your request.', message: result.error, kind: 'error' })
        return
      }
      f.setRequestNumber(result.reference)
      f.setReviewSheetOpen(false)
      f.setSuccessSheetOpen(true)
      notify({ title: 'Service request sent successfully.', message: '', kind: 'success' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error'
      notify({ title: 'Unable to save your request.', message, kind: 'error' })
    } finally {
      f.setIsSending(false)
    }
  }, [f, notify, shop])

  const handleCopyRequestNumber = useCallback(async () => {
    if (!f.requestNumber) return
    try {
      await navigator.clipboard.writeText(f.requestNumber)
      notify({ title: 'Request number copied.', message: '', kind: 'success' })
    } catch {
      notify({ title: 'Unable to copy request number.', message: '', kind: 'error' })
    }
  }, [f.requestNumber, notify])

  return (
    <>
      <AppleSheet
        open={open && !f.reviewSheetOpen && !f.successSheetOpen}
        onOpenChange={(next) => {
          if (!next) handleClose()
        }}
        title="Quick service"
        zIndex={100_060}
        avoidHeaderOffset
        desktopWidthClassName="max-w-[min(92vw,56rem)]"
      >
        <div className="px-3 pb-2 pt-0 font-sans sm:px-4">
          {shop ? (
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <AppleCapsuleLabel className="max-w-full text-left normal-case [overflow-wrap:anywhere]">
                {stockistLabel}
              </AppleCapsuleLabel>
              <span className="text-[12px] font-medium leading-snug tracking-normal text-neutral-600">
                Request goes to this shop first
              </span>
            </div>
          ) : null}
          <p className="mb-6 text-[13px] leading-relaxed text-neutral-600">
            Same options as the full service builder. Adjust the service address if the vehicle will be elsewhere — we
            use it to coordinate with nearby partners when needed.
          </p>
          <ServiceBuilderConfigurationBody
            form={f}
            showGarageImport={false}
            showEstimateBar
            firstSectionScrollMarginTopPx={0}
          />
        </div>
      </AppleSheet>

      <AppleSheet
        open={f.reviewSheetOpen}
        onOpenChange={f.setReviewSheetOpen}
        title="Final review"
        zIndex={100_070}
        desktopWidthClassName="max-w-5xl"
        avoidHeaderOffset
      >
        <ServiceBuilderReviewSheetContent form={f} shopLocationTag={stockistLabel} onSend={handleSend} />
      </AppleSheet>

      <AppleSheet
        open={f.successSheetOpen}
        onOpenChange={(next) => {
          f.setSuccessSheetOpen(next)
          if (!next) handleClose()
        }}
        title="Request received"
        zIndex={100_080}
        avoidHeaderOffset
      >
        <div className="px-4 pb-5">
          <p className="text-xl font-semibold text-[#1d1d1f]">Thank you for sending your service request.</p>
          <p className="mt-2 text-sm leading-relaxed text-[#424245]">
            Our team will review your configuration and follow up shortly. You will receive updates by email and phone.
            {f.isLoggedIn ? ' You will also see this request in your dashboard.' : ''}
          </p>
          <div className="mt-6 border-t border-black/10 pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6e6e73]">Request number</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="font-mono text-[14px] font-semibold text-[#1d1d1f]">{f.requestNumber || '-'}</p>
              <button
                type="button"
                onClick={() => void handleCopyRequestNumber()}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f3f4f6] text-[#1d1d1f] transition hover:bg-[#e8e8ed]"
                aria-label="Copy request number"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </AppleSheet>
    </>
  )
}
