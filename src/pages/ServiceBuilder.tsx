import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { IconChevronDown } from '@tabler/icons-react'
import { AppleButton } from '@/components/ui/AppleButton'
import { AppleSheet } from '@/components/ui/AppleSheet'
import { GarageAddVehicleFlow } from '@/components/MyGarageSection'
import { useNotifications } from '@/context/NotificationsContext'
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion'
import { useServiceBuilderForm } from '@/hooks/useServiceBuilderForm'
import { cn } from '@/lib/utils'
import { getCurrentUserProfile } from '@/utils/supabaseAuth'
import { SERVICE_BUILDER_FAQS } from '@/constants/serviceBuilderCatalog'
import { ServiceBuilderConfigurationBody } from '@/components/service-builder/ServiceBuilderConfigurationBody'
import { ServiceBuilderReviewSheetContent } from '@/components/service-builder/ServiceBuilderReviewSheetContent'

function ServiceBuilderFAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-black/10">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="pr-6 text-sm font-semibold text-[#1d1d1f] md:text-base">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className="shrink-0">
          <IconChevronDown size={16} className="text-[#86868b]" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-[#424245]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function ServiceBuilder() {
  const { notify } = useNotifications()
  const reduceMotion = useEffectiveReducedMotion()
  const vehicleStepRef = useRef<HTMLElement | null>(null)
  const heroRef = useRef<HTMLElement | null>(null)
  const [heroPassed, setHeroPassed] = useState(false)

  const f = useServiceBuilderForm()
  const {
    isLoggedIn,
    garageSheetOpen,
    setGarageSheetOpen,
    addVehicleSheetOpen,
    setAddVehicleSheetOpen,
    garageVehicles,
    garageLoading,
    setImportedVehicle,
    reviewSheetOpen,
    setReviewSheetOpen,
    successSheetOpen,
    setSuccessSheetOpen,
    requestNumber,
    setContactFirstName,
    setContactLastName,
    setContactEmail,
    loadGarage,
    totalPrice,
    canProceed,
  } = f

  useEffect(() => {
    const root = document.getElementById('app-scroll-root')
    const hero = heroRef.current
    if (!root || !hero) return

    const io = new IntersectionObserver(
      ([entry]) => {
        setHeroPassed(!entry.isIntersecting)
      },
      { root, threshold: 0 },
    )
    io.observe(hero)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false
    void getCurrentUserProfile().then((p) => {
      if (!p || cancelled) return
      const fn = (p.first_name || '').trim()
      const ln = (p.last_name || '').trim()
      const em = (p.email || '').trim()
      if (fn) setContactFirstName((c) => c.trim() || fn)
      if (ln) setContactLastName((c) => c.trim() || ln)
      if (em) setContactEmail((c) => c.trim() || em)
    })
    return () => {
      cancelled = true
    }
  }, [setContactEmail, setContactFirstName, setContactLastName])

  const handleSendService = useCallback(async () => {
    if (!f.isReviewFormValid || f.isSending) return
    f.setIsSending(true)
    const result = await f.submitServiceRequest({ source: 'service_builder' })
    f.setIsSending(false)
    if (!result.ok) {
      notify({ title: 'Unable to save your request.', message: result.error, kind: 'error' })
      return
    }
    f.setRequestNumber(result.reference)
    f.setReviewSheetOpen(false)
    f.setSuccessSheetOpen(true)
    notify({ title: 'Service request sent successfully.', message: '', kind: 'success' })
  }, [f, notify])

  const handleCopyRequestNumber = useCallback(async () => {
    if (!requestNumber) return
    try {
      await navigator.clipboard.writeText(requestNumber)
      notify({ title: 'Request number copied.', message: '', kind: 'success' })
    } catch {
      notify({ title: 'Unable to copy request number.', message: '', kind: 'error' })
    }
  }, [requestNumber, notify])

  const bannerTransition = reduceMotion
    ? ''
    : 'transition-[max-height,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'

  return (
    <section className="relative min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <header ref={heroRef} className="relative isolate overflow-hidden border-b border-black/10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/Service Builder.jpg')" }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/58 via-black/30 to-[#f5f5f7]"
          aria-hidden
        />

        <div className="relative mx-auto flex min-h-[58vh] w-full max-w-[1400px] items-center justify-center px-6 py-14 text-center md:min-h-[64vh] md:px-8 md:py-20">
          <div className="max-w-2xl">
            <motion.h1
              className="font-nav text-4xl font-bold leading-tight text-white md:text-6xl"
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            >
              Configure your service
            </motion.h1>
            <motion.p
              className="mt-4 text-sm text-white md:text-base"
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              A simple way to plan, customize, and manage your vehicle care.
            </motion.p>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <AppleButton
                className="mt-6 mx-auto"
                onClick={() => {
                  vehicleStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                Get started
              </AppleButton>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Bannière prix / Send : uniquement après avoir dépassé le hero (slide depuis le haut) */}
      <div
        className={cn(
          'sticky top-0 z-[119] overflow-hidden bg-[#f5f5f7]/95 backdrop-blur-md supports-[backdrop-filter]:bg-[#f5f5f7]/88',
          bannerTransition,
          heroPassed
            ? 'max-h-[96px] translate-y-0 border-b border-black/[0.08] opacity-100'
            : 'pointer-events-none max-h-0 -translate-y-full opacity-0',
        )}
        aria-hidden={!heroPassed}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-3.5 md:px-8">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6e6e73]">Estimate</p>
            <p className="truncate font-nav text-2xl font-bold tracking-tight text-[#1d1d1f] md:text-[28px]">
              ${totalPrice}
              <span className="ml-1 text-base font-semibold text-[#6e6e73] md:text-lg">CAD</span>
            </p>
          </div>
          <AppleButton
            disabled={!canProceed}
            className="shrink-0 !rounded-full !px-6 !py-2.5 !text-[13px] disabled:!cursor-not-allowed disabled:!opacity-40"
            onClick={() => setReviewSheetOpen(true)}
          >
            Next step
          </AppleButton>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-6 py-12 pb-16 md:px-8 md:py-16 md:pb-20">
        <div className="space-y-28 md:space-y-36">
          <ServiceBuilderConfigurationBody
            form={f}
            vehicleStepRef={vehicleStepRef}
            showGarageImport
            firstSectionScrollMarginTopPx={heroPassed ? 72 : 0}
          />
        </div>
      </div>

      <section className="border-t border-black/10 bg-white py-20 md:py-28">
        <div className="mx-auto w-full max-w-[1400px] px-6 md:px-8">
          <div className="grid gap-12 md:grid-cols-[280px_1fr]">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f] md:text-3xl">
                Common questions
              </h2>
              <p className="mt-2 text-sm text-[#6e6e73]">
                Everything you need before configuring your service.
              </p>
            </div>
            <div className="border-t border-black/10">
              {SERVICE_BUILDER_FAQS.map((faq, i) => (
                <ServiceBuilderFAQItem key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <AppleSheet
        open={reviewSheetOpen}
        onOpenChange={setReviewSheetOpen}
        title="Final review"
        zIndex={100_040}
        desktopWidthClassName="max-w-5xl"
        avoidHeaderOffset
      >
        <ServiceBuilderReviewSheetContent form={f} shopLocationTag={null} onSend={handleSendService} />
      </AppleSheet>

      <AppleSheet open={successSheetOpen} onOpenChange={setSuccessSheetOpen} title="Request received" zIndex={100_050}>
        <div className="px-4 pb-5">
          <p className="text-xl font-semibold text-[#1d1d1f]">Thank you for sending your service request.</p>
          <p className="mt-2 text-sm leading-relaxed text-[#424245]">
            Our team will review your configuration and follow up shortly. You will receive updates by email and phone.
            {isLoggedIn ? ' You will also see this request in your dashboard.' : ''}
          </p>
          <div className="mt-6 border-t border-black/10 pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6e6e73]">Request number</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="font-mono text-[14px] font-semibold text-[#1d1d1f]">{requestNumber || '-'}</p>
              <button
                type="button"
                onClick={handleCopyRequestNumber}
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

      <AppleSheet open={garageSheetOpen} onOpenChange={setGarageSheetOpen} title="My Garage" zIndex={100_020}>
        <div className="px-4 pb-4">
          {garageLoading ? (
            <div className="flex justify-center py-12 text-sm text-[#86868b]">Loading…</div>
          ) : garageVehicles.length === 0 ? (
            <button
              type="button"
              onClick={() => setAddVehicleSheetOpen(true)}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#d2d2d7] bg-[#fafafa] px-6 py-14 text-center transition hover:border-[#b0b0b5] hover:bg-[#f5f5f7]"
            >
              <span className="text-[15px] font-medium text-[#1d1d1f]">No vehicle in your garage yet</span>
              <span className="max-w-xs text-[13px] text-[#86868b]">
                Tap here to add your first vehicle — it will appear in My Garage and here.
              </span>
            </button>
          ) : (
            <ul className="flex flex-col gap-3">
              {garageVehicles.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setImportedVehicle(v)
                      setGarageSheetOpen(false)
                    }}
                    className="flex w-full items-center gap-4 rounded-2xl border border-black/[0.08] bg-white p-3 text-left shadow-sm transition hover:border-black/15 hover:shadow-md"
                  >
                    <div className="h-[72px] w-[104px] shrink-0 overflow-hidden rounded-xl bg-[#f5f5f7]">
                      {v.image_url ? (
                        <img src={v.image_url} alt="" className="h-full w-full object-cover" draggable={false} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[11px] text-[#86868b]">
                          No photo
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[17px] font-semibold tracking-tight text-[#1d1d1f]">
                        {v.brand} {v.model}
                      </p>
                      <p className="mt-0.5 text-[14px] text-[#6e6e73]">{v.year}</p>
                      {v.color ? (
                        <p className="mt-1 truncate text-[12px] text-[#86868b]">{v.color}</p>
                      ) : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </AppleSheet>

      <AppleSheet
        open={addVehicleSheetOpen}
        onOpenChange={setAddVehicleSheetOpen}
        title="Add vehicle"
        zIndex={100_030}
      >
        <GarageAddVehicleFlow
          isOpen={addVehicleSheetOpen}
          layout="embedded"
          onClose={() => setAddVehicleSheetOpen(false)}
          onSaved={() => {
            setAddVehicleSheetOpen(false)
            void loadGarage()
          }}
        />
      </AppleSheet>
    </section>
  )
}
