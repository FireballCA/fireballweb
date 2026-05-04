import { Link } from 'react-router-dom'
import { AppleButton } from '@/components/ui/AppleButton'
import { AppleCapsuleLabel } from '@/components/ui/AppleInfoPill'
import type { ServiceBuilderFormApi } from '@/hooks/useServiceBuilderForm'
import { cn } from '@/lib/utils'
import { SB_REVIEW_FIELD_BASE } from '@/components/service-builder/serviceBuilderFieldStyles'

type Props = {
  form: ServiceBuilderFormApi
  /** Pastille type Apple (ex. ville de la shop) — quick service depuis la carte. */
  shopLocationTag?: string | null
  onSend: () => void
}

export function ServiceBuilderReviewSheetContent({ form, shopLocationTag, onSend }: Props) {
  const {
    isLoggedIn,
    estimatedXp,
    selectedVehicleSize,
    selectedPaintCondition,
    coatingName,
    waxName,
    totalPrice,
    vehicleMakeInput,
    setVehicleMakeInput,
    vehicleModelInput,
    setVehicleModelInput,
    vehicleYearInput,
    setVehicleYearInput,
    contactFirstName,
    setContactFirstName,
    contactLastName,
    setContactLastName,
    contactEmail,
    setContactEmail,
    contactPhone,
    setContactPhone,
    serviceAddress,
    setServiceAddress,
    customMessage,
    setCustomMessage,
    uploadedVehicleImages,
    handleVehicleImagesChange,
    isReviewFormValid,
    isSending,
    setReviewSheetOpen,
  } = form

  return (
    <div className="px-4 pb-5 text-[#1d1d1f]">
      {shopLocationTag ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <AppleCapsuleLabel className="max-w-full text-left normal-case [overflow-wrap:anywhere]">
            {shopLocationTag}
          </AppleCapsuleLabel>
          <span className="text-[12px] font-medium leading-snug tracking-normal text-[#6e6e73]">Receiving shop</span>
        </div>
      ) : null}

      <div className="mb-5 rounded-[28px] bg-white px-4 py-4 shadow-[0_8px_22px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-4">
          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-[#0485F7]" aria-hidden>
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" aria-hidden>
              <circle cx="10" cy="10" r="7.25" />
              <path d="M10 8.25v5" />
              <circle cx="10" cy="5.55" r="0.85" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[15px] font-semibold leading-tight text-[#0485F7]">
                {isLoggedIn ? 'Connected account' : 'Not connected'}
              </p>
              {!isLoggedIn ? (
                <Link to="/account" target="_blank" rel="noreferrer" className="shrink-0">
                  <AppleButton className="!rounded-full !px-4 !py-2 !text-[12px]">Sign in</AppleButton>
                </Link>
              ) : null}
            </div>
            <p className="mt-1 text-[14px] leading-relaxed text-[#6b7280]">
              {isLoggedIn
                ? `You are eligible to earn +${estimatedXp} XP if this service request is approved.`
                : (
                    <>
                      Connect your account to be eligible for{' '}
                      <span className="font-semibold text-[#1d1d1f]">+{estimatedXp} XP</span> if this service request is approved.
                    </>
                  )}
            </p>
          </div>
        </div>
      </div>

      <section className="pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6e6e73]">Service summary</p>
        <div className="mt-3 space-y-1.5 text-[14px] text-[#2b2b2d]">
          <p>
            Vehicle size: <span className="font-semibold">{selectedVehicleSize ?? '-'}</span>
          </p>
          <p>
            Paint condition: <span className="font-semibold">{selectedPaintCondition ?? '-'}</span>
          </p>
          <p>
            Coating: <span className="font-semibold">{coatingName || '-'}</span>
          </p>
          <p>
            Wax: <span className="font-semibold">{waxName || 'None'}</span>
          </p>
          <p className="pt-1 text-[17px] font-semibold text-[#1d1d1f]">Total estimate: ${totalPrice} CAD</p>
        </div>
      </section>

      <div className="h-px bg-black/10" />

      <section className="pt-4 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6e6e73]">Vehicle information</p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            value={vehicleMakeInput}
            onChange={(e) => setVehicleMakeInput(e.target.value)}
            placeholder="Vehicle make"
            required
            aria-required
            className={cn(SB_REVIEW_FIELD_BASE, 'h-11 rounded-xl px-3')}
          />
          <input
            value={vehicleModelInput}
            onChange={(e) => setVehicleModelInput(e.target.value)}
            placeholder="Vehicle model"
            required
            aria-required
            className={cn(SB_REVIEW_FIELD_BASE, 'h-11 rounded-xl px-3')}
          />
          <input
            value={vehicleYearInput}
            onChange={(e) => setVehicleYearInput(e.target.value)}
            placeholder="Vehicle year"
            required
            aria-required
            className={cn(SB_REVIEW_FIELD_BASE, 'h-11 rounded-xl px-3')}
          />
        </div>
      </section>

      <div className="h-px bg-black/10" />

      <section className="pt-4 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6e6e73]">Contact information</p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            value={contactFirstName}
            onChange={(e) => setContactFirstName(e.target.value)}
            placeholder="First name"
            required
            aria-required
            autoComplete="given-name"
            className={cn(SB_REVIEW_FIELD_BASE, 'h-11 rounded-xl px-3')}
          />
          <input
            value={contactLastName}
            onChange={(e) => setContactLastName(e.target.value)}
            placeholder="Last name"
            required
            aria-required
            autoComplete="family-name"
            className={cn(SB_REVIEW_FIELD_BASE, 'h-11 rounded-xl px-3')}
          />
          <input
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="Email"
            type="email"
            required
            aria-required
            autoComplete="email"
            className={cn(SB_REVIEW_FIELD_BASE, 'h-11 rounded-xl px-3')}
          />
          <input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="Contact phone number"
            type="tel"
            required
            aria-required
            autoComplete="tel"
            className={cn(SB_REVIEW_FIELD_BASE, 'h-11 rounded-xl px-3')}
          />
        </div>
      </section>

      <div className="h-px bg-black/10" />

      <section className="pt-4 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6e6e73]">Service location</p>
        <p className="mt-1 text-[12px] leading-snug text-[#6e6e73]">
          Address or preferred location for the service (helps us route your request to nearby partners).
        </p>
        <textarea
          value={serviceAddress}
          onChange={(e) => setServiceAddress(e.target.value)}
          placeholder="Street, city, postal code, or brief description of where the vehicle will be serviced"
          required
          aria-required
          rows={3}
          className={cn(SB_REVIEW_FIELD_BASE, 'mt-3 w-full rounded-xl px-3 py-2.5')}
        />
      </section>

      <div className="h-px bg-black/10" />

      <section className="pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6e6e73]">Extra details</p>
        <div className="mt-3 space-y-3">
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Add a custom message for our team (paint concerns, schedule preference, etc.)"
            rows={4}
            className={cn(SB_REVIEW_FIELD_BASE, 'w-full rounded-xl px-3 py-2.5')}
          />
          <div className="rounded-xl border border-dashed border-black/15 bg-[#fafafa] p-3">
            <label className="block text-[12px] font-medium text-[#424245]">Add one or more photos of your vehicle</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleVehicleImagesChange}
              className="mt-2 block w-full text-sm text-[#424245] file:mr-3 file:rounded-lg file:border-0 file:bg-[#ececef] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#1d1d1f] hover:file:bg-[#e2e2e6]"
            />
            {uploadedVehicleImages.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {uploadedVehicleImages.map((file) => (
                  <span
                    key={file.name}
                    className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] text-[#424245]"
                  >
                    {file.name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mt-4 flex items-center justify-end gap-3">
        <AppleButton className="!border-black/20 !bg-white !text-[#1d1d1f]" onClick={() => setReviewSheetOpen(false)}>
          Back
        </AppleButton>
        <AppleButton disabled={!isReviewFormValid || isSending} onClick={() => void onSend()}>
          {isSending ? 'Sending…' : 'Send my service'}
        </AppleButton>
      </div>
    </div>
  )
}
