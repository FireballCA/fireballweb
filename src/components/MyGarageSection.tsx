import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import {
  fetchGarageVehicles,
  createGarageVehicle,
  updateGarageVehicle,
  deleteGarageVehicle,
  uploadGarageVehicleImage,
  type GarageVehicleRow,
} from '@/utils/supabaseGarage'
import { AddVehicleModal } from '@/components/AddVehicleModal'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const E = [0.22, 1, 0.36, 1] as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fadeUp: any = {
  hidden: { opacity: 0, y: 28 },
  show: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.65, ease: E, delay: d } }),
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cardVariants: any = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.55, ease: E, delay: i * 0.07 },
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.25 } },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ─── Shared light-modal input ─────────────────────────────────────────────────

interface LightInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  optional?: boolean
}
function LightInput({ label, optional, ...props }: LightInputProps) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[13px] font-medium text-[#1d1d1f] mb-1.5">
        {label}
        {optional && <span className="text-[#86868b] font-normal">(optional)</span>}
      </label>
      <input
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
        className="w-full h-[44px] rounded-[10px] px-3.5 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] outline-none transition-all"
        style={{
          background: '#fff',
          border: focused ? '1.5px solid #0071e3' : '1.5px solid #d2d2d7',
          boxShadow: focused ? '0 0 0 3px rgba(0,113,227,0.15)' : 'none',
          ...(props.style ?? {}),
        }}
      />
    </div>
  )
}

interface LightTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  optional?: boolean
}
function LightTextarea({ label, optional, ...props }: LightTextareaProps) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[13px] font-medium text-[#1d1d1f] mb-1.5">
        {label}
        {optional && <span className="text-[#86868b] font-normal">(optional)</span>}
      </label>
      <textarea
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
        className="w-full rounded-[10px] px-3.5 py-3 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] outline-none resize-none transition-all"
        style={{
          background: '#fff',
          border: focused ? '1.5px solid #0071e3' : '1.5px solid #d2d2d7',
          boxShadow: focused ? '0 0 0 3px rgba(0,113,227,0.15)' : 'none',
          ...(props.style ?? {}),
        }}
      />
    </div>
  )
}

// ─── Image Upload Field ───────────────────────────────────────────────────────

function ImageUploadField({
  preview,
  onChange,
}: {
  preview: string | null
  onChange: (file: File, dataUrl: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <label className="text-[13px] font-medium text-[#1d1d1f] mb-1.5 block">
        Photo <span className="text-[#86868b] font-normal">(optional)</span>
      </label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full h-[120px] rounded-[10px] flex flex-col items-center justify-center gap-2 transition-all overflow-hidden relative"
        style={{ border: '1.5px dashed #d2d2d7', background: preview ? 'transparent' : '#f5f5f7' }}
        onMouseEnter={(e) => { if (!preview) e.currentTarget.style.background = '#ebebf0' }}
        onMouseLeave={(e) => { if (!preview) e.currentTarget.style.background = '#f5f5f7' }}
      >
        {preview ? (
          <>
            <img src={preview} alt="Vehicle preview" className="absolute inset-0 w-full h-full object-cover" />
            <span className="relative z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-white"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.929l-3.536.707.707-3.536A4 4 0 019 13z" />
              </svg>
              Change photo
            </span>
          </>
        ) : (
          <>
            <svg className="w-7 h-7 text-[#86868b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[13px] text-[#86868b]">Tap to add a photo</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          const reader = new FileReader()
          reader.onload = (ev) => onChange(file, ev.target?.result as string)
          reader.readAsDataURL(file)
        }}
      />
    </div>
  )
}

// ─── Details Modal (step 2 — add or edit) ─────────────────────────────────────

interface DetailsModalProps {
  mode: 'add' | 'edit'
  title: string
  vehicle?: GarageVehicleRow
  onClose: () => void
  onBack?: () => void
  onSaved: (v: GarageVehicleRow) => void
}

function DetailsModal({ mode, title, vehicle, onClose, onBack, onSaved }: DetailsModalProps) {
  const [color, setColor] = useState(vehicle?.color ?? '')
  const [notes, setNotes] = useState(vehicle?.notes ?? '')
  const [protDate, setProtDate] = useState(
    vehicle?.ceramic_protection_date
      ? new Date(vehicle.ceramic_protection_date).toISOString().split('T')[0]
      : ''
  )
  const [protShop, setProtShop] = useState(vehicle?.protection_shop ?? '')
  const [protProduct, setProtProduct] = useState(vehicle?.protection_product ?? '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(vehicle?.image_url ?? null)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)

    let imageUrl: string | undefined | null = vehicle?.image_url ?? undefined
    if (imageFile) {
      const uploaded = await uploadGarageVehicleImage(imageFile)
      if (uploaded) imageUrl = uploaded
    }

    const ceramicDate = protDate ? new Date(protDate) : undefined

    let result: GarageVehicleRow | null = null

    if (mode === 'add' && vehicle) {
      result = await createGarageVehicle({
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        color: color || undefined,
        imageUrl: imageUrl ?? undefined,
        notes: notes || undefined,
        ceramicProtectionDate: ceramicDate,
        protectionShop: protShop || undefined,
        protectionProduct: protProduct || undefined,
      })
    } else if (mode === 'edit' && vehicle) {
      result = await updateGarageVehicle(vehicle.id, {
        color: color || null,
        imageUrl: imageUrl ?? null,
        notes: notes || null,
        ceramicProtectionDate: ceramicDate ?? null,
        protectionShop: protShop || null,
        protectionProduct: protProduct || null,
      })
    }

    setSaving(false)
    if (result) {
      onSaved(result)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      />
      <div
        className="relative w-full sm:max-w-md rounded-t-[20px] sm:rounded-[20px]"
        style={{ background: '#fff', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', maxHeight: '92dvh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-[#f0f0f0]">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: '#f5f5f7' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#e8e8ed')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#f5f5f7')}
              >
                <svg className="w-4 h-4 text-[#1d1d1f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#86868b] mb-0.5">
                {mode === 'add' ? 'My Garage' : 'Edit Vehicle'}
              </p>
              <h3 className="text-[18px] font-semibold text-[#1d1d1f] leading-tight">{title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: '#f5f5f7' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#e8e8ed')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#f5f5f7')}
          >
            <svg className="w-4 h-4 text-[#1d1d1f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 py-5 space-y-5" style={{ maxHeight: 'calc(92dvh - 160px)' }}>
          {/* Photo */}
          <ImageUploadField
            preview={imagePreview}
            onChange={(file, url) => { setImageFile(file); setImagePreview(url) }}
          />

          <LightInput
            label="Color"
            optional
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="e.g. Frozen Grey"
          />

          <LightTextarea
            label="Notes"
            optional
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this vehicle…"
            rows={3}
          />

          {/* Protection section */}
          <div
            className="rounded-[14px] p-4 space-y-4"
            style={{ background: '#f5f5f7', border: '1.5px solid #e8e8ed' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0"
                style={{ background: '#e3f5e8' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="#34c759" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#1d1d1f]">Ceramic Protection</p>
                <p className="text-[11px] text-[#86868b]">Record the last application</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-medium text-[#86868b] uppercase tracking-wider mb-1.5 block">
                  When — Date applied
                </label>
                <input
                  type="date"
                  value={protDate}
                  onChange={(e) => setProtDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full h-[44px] rounded-[10px] px-3.5 text-[15px] text-[#1d1d1f] outline-none transition-all"
                  style={{ background: '#fff', border: '1.5px solid #d2d2d7' }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = '1.5px solid #0071e3'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = '1.5px solid #d2d2d7'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#86868b] uppercase tracking-wider mb-1.5 block">
                  Where — Shop / Installer
                </label>
                <input
                  type="text"
                  value={protShop}
                  onChange={(e) => setProtShop(e.target.value)}
                  placeholder="e.g. Fireball Canada, Montréal"
                  className="w-full h-[44px] rounded-[10px] px-3.5 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] outline-none transition-all"
                  style={{ background: '#fff', border: '1.5px solid #d2d2d7' }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = '1.5px solid #0071e3'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = '1.5px solid #d2d2d7'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#86868b] uppercase tracking-wider mb-1.5 block">
                  Product used
                </label>
                <input
                  type="text"
                  value={protProduct}
                  onChange={(e) => setProtProduct(e.target.value)}
                  placeholder="e.g. Fireball Ceramic Coating v2"
                  className="w-full h-[44px] rounded-[10px] px-3.5 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] outline-none transition-all"
                  style={{ background: '#fff', border: '1.5px solid #d2d2d7' }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = '1.5px solid #0071e3'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = '1.5px solid #d2d2d7'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 flex gap-3 border-t border-[#f0f0f0]">
          <button
            onClick={onClose}
            className="flex-1 h-[44px] rounded-[10px] text-[15px] font-semibold transition-all"
            style={{ background: '#f5f5f7', color: '#1d1d1f' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#e8e8ed')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#f5f5f7')}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-[44px] rounded-[10px] text-[15px] font-semibold transition-all disabled:opacity-50"
            style={{ background: '#0071e3', color: '#fff' }}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = '#0077ed' }}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#0071e3')}
          >
            {saving ? 'Saving…' : mode === 'add' ? 'Add to Garage' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Vehicle Flow ─────────────────────────────────────────────────────────

function AddVehicleFlow({
  isOpen,
  onClose,
  onSaved,
}: {
  isOpen: boolean
  onClose: () => void
  onSaved: (v: GarageVehicleRow) => void
}) {
  const [step, setStep] = useState<'select' | 'details'>('select')
  const [partial, setPartial] = useState<{ brand: string; model: string; year: number } | null>(null)

  useEffect(() => {
    if (isOpen) { setStep('select'); setPartial(null) }
  }, [isOpen])

  if (!isOpen) return null

  if (step === 'select') {
    return (
      <AddVehicleModal
        isOpen
        onClose={onClose}
        onSelect={(make, model, year) => {
          setPartial({ brand: make, model, year })
          setStep('details')
        }}
      />
    )
  }

  if (!partial) return null

  const draftVehicle: GarageVehicleRow = {
    id: '',
    user_id: '',
    brand: partial.brand,
    model: partial.model,
    year: partial.year,
    created_at: new Date().toISOString(),
  }

  return (
    <DetailsModal
      mode="add"
      title={`${partial.year} ${partial.brand} ${partial.model}`}
      vehicle={draftVehicle}
      onClose={onClose}
      onBack={() => setStep('select')}
      onSaved={onSaved}
    />
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({
  vehicle,
  onConfirm,
  onCancel,
}: {
  vehicle: GarageVehicleRow
  onConfirm: () => void
  onCancel: () => void
}) {
  const [deleting, setDeleting] = useState(false)
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      />
      <div
        className="relative w-full max-w-sm rounded-[20px] overflow-hidden p-6 text-center"
        style={{ background: '#fff', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: '#fff1f0' }}
        >
          <svg className="w-6 h-6 text-[#ff3b30]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-1">Remove Vehicle</h3>
        <p className="text-[14px] text-[#86868b] mb-6">
          Remove <span className="font-medium text-[#1d1d1f]">{vehicle.year} {vehicle.brand} {vehicle.model}</span> from your garage?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-[44px] rounded-[10px] text-[15px] font-semibold transition-all"
            style={{ background: '#f5f5f7', color: '#1d1d1f' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#e8e8ed')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#f5f5f7')}
          >
            Cancel
          </button>
          <button
            onClick={async () => { setDeleting(true); await onConfirm() }}
            disabled={deleting}
            className="flex-1 h-[44px] rounded-[10px] text-[15px] font-semibold transition-all disabled:opacity-50"
            style={{ background: '#ff3b30', color: '#fff' }}
            onMouseEnter={(e) => { if (!deleting) e.currentTarget.style.background = '#e0362c' }}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#ff3b30')}
          >
            {deleting ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Vehicle Card ─────────────────────────────────────────────────────────────

function VehicleCard({
  vehicle,
  index,
  onDelete,
  onEdit,
}: {
  vehicle: GarageVehicleRow
  index: number
  onDelete: (v: GarageVehicleRow) => void
  onEdit: (v: GarageVehicleRow) => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const coated = !!vehicle.ceramic_protection_date

  useEffect(() => {
    if (!showMenu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  return (
    <motion.div
      layout
      variants={cardVariants}
      custom={index}
      initial="hidden"
      animate="show"
      exit="exit"
      // No overflow-hidden here — the dropdown needs to escape the card bounds
      className="group relative flex flex-col rounded-2xl"
      style={{
        background: 'linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
      }}
    >
      {/* Image — overflow-hidden stays on the image wrapper only */}
      <div className="relative h-44 overflow-hidden rounded-t-2xl bg-[#0d0d0d]">
        {vehicle.image_url ? (
          <img
            src={vehicle.image_url}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <CarIllustration />
          </div>
        )}

        {/* Protection badge */}
        <div className="absolute left-3 top-3">
          {coated ? (
            <span
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest"
              style={{
                background: 'rgba(52,199,89,0.18)',
                border: '1px solid rgba(52,199,89,0.4)',
                color: '#4ade80',
                backdropFilter: 'blur(10px)',
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              Protected
            </span>
          ) : (
            <span
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest"
              style={{
                background: 'rgba(255,59,48,0.15)',
                border: '1px solid rgba(255,59,48,0.3)',
                color: '#ff6b6b',
                backdropFilter: 'blur(10px)',
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              Not protected
            </span>
          )}
        </div>
      </div>

      {/* Kebab — outside image div so it's not clipped */}
      <div className="absolute right-3 top-3" ref={menuRef}>
        <button
          onClick={() => setShowMenu((v) => !v)}
          className="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)' }}
        >
          <span className="flex flex-col gap-[3px] items-center">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-[3px] w-[3px] rounded-full bg-white/80" />
            ))}
          </span>
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-9 z-50 min-w-[160px] rounded-[14px] overflow-hidden"
              style={{
                background: '#ffffff',
                border: '1px solid #e5e5ea',
                boxShadow: '0 12px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <button
                onClick={() => { setShowMenu(false); onEdit(vehicle) }}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[14px] font-medium"
                style={{ color: '#1d1d1f', background: 'transparent' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f7')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <svg className="h-[18px] w-[18px] shrink-0" fill="none" stroke="#0071e3" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.929l-3.536.707.707-3.536A4 4 0 019 13z" />
                </svg>
                Edit vehicle
              </button>
              <div style={{ height: 1, background: '#f0f0f5', margin: '0' }} />
              <button
                onClick={() => { setShowMenu(false); onDelete(vehicle) }}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[14px] font-medium"
                style={{ color: '#ff3b30', background: 'transparent' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#fff5f5')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <svg className="h-[18px] w-[18px] shrink-0" fill="none" stroke="#ff3b30" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remove vehicle
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-base font-semibold leading-tight text-white">
            {vehicle.year} {vehicle.brand} {vehicle.model}
          </h3>
          {vehicle.color && (
            <p className="mt-0.5 text-xs text-white/40">{vehicle.color}</p>
          )}
        </div>

        {/* Protection info block */}
        {coated ? (
          <div
            className="rounded-xl p-3 space-y-1.5"
            style={{ background: 'rgba(52,199,89,0.07)', border: '1px solid rgba(52,199,89,0.2)' }}
          >
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="#34c759" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-[11px] font-semibold text-green-400 uppercase tracking-wider">Ceramic Protected</span>
            </div>
            {vehicle.ceramic_protection_date && (
              <div className="flex items-baseline gap-2 pl-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/25 w-10 shrink-0">When</span>
                <span className="text-[11px] text-white/55">{formatDate(vehicle.ceramic_protection_date)}</span>
              </div>
            )}
            {vehicle.protection_shop && (
              <div className="flex items-baseline gap-2 pl-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/25 w-10 shrink-0">Where</span>
                <span className="text-[11px] text-white/55 truncate">{vehicle.protection_shop}</span>
              </div>
            )}
            {vehicle.protection_product && (
              <div className="flex items-baseline gap-2 pl-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/25 w-10 shrink-0">What</span>
                <span className="text-[11px] text-white/55 truncate">{vehicle.protection_product}</span>
              </div>
            )}
          </div>
        ) : (
          <div
            className="rounded-xl px-3 py-2.5 flex items-center gap-2"
            style={{ background: 'rgba(255,59,48,0.07)', border: '1px solid rgba(255,59,48,0.18)' }}
          >
            <svg className="w-3.5 h-3.5 shrink-0 text-red-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <span className="text-[11px] text-red-400/70 font-medium">Not ceramic protected</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyGarage({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      variants={fadeUp} custom={0.1} initial="hidden" animate="show"
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <GarageEmptyIllustration />
      </div>
      <h3 className="mb-2 font-nav text-xl font-bold text-white">No vehicles yet</h3>
      <p className="mb-6 max-w-xs text-sm text-white/40">
        Add your first vehicle to start tracking its protection and service history.
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white transition-all active:scale-95"
        style={{ background: '#1d1d1f' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#333')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#1d1d1f')}
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add your first vehicle
      </button>
    </motion.div>
  )
}

// ─── SVG Illustrations ─────────────────────────────────────────────────────────

function CarIllustration() {
  return (
    <svg width="80" height="48" viewBox="0 0 80 48" fill="none">
      <path d="M14 30L20 16H60L66 30" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeLinecap="round" />
      <rect x="8" y="30" width="64" height="12" rx="4" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
      <circle cx="20" cy="42" r="5" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <circle cx="60" cy="42" r="5" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <path d="M26 22H54L58 30H22L26 22Z" fill="rgba(255,255,255,0.05)" />
      <rect x="28" y="24" width="10" height="6" rx="1" fill="rgba(255,255,255,0.06)" />
      <rect x="42" y="24" width="10" height="6" rx="1" fill="rgba(255,255,255,0.06)" />
    </svg>
  )
}

function GarageEmptyIllustration() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path d="M8 18L24 6L40 18V42H8V18Z" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M16 42V28H32V42" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="20" y="20" width="8" height="8" rx="1" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
    </svg>
  )
}

// ─── Skeleton loaders ──────────────────────────────────────────────────────────

function GarageSkeletons() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="overflow-hidden rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="h-44 animate-pulse bg-white/5" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-white/5" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Not Logged In ─────────────────────────────────────────────────────────────

function NotLoggedInState() {
  return (
    <motion.div
      variants={fadeUp} custom={0.1} initial="hidden" animate="show"
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <svg className="h-9 w-9 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <h3 className="mb-2 font-nav text-xl font-bold text-white">Sign in to access your garage</h3>
      <p className="mb-6 max-w-xs text-sm text-white/40">
        Create an account or sign in to manage your vehicles and track their protection.
      </p>
      <a
        href="/account"
        className="rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
        style={{ background: '#0071e3' }}
      >
        Sign In
      </a>
    </motion.div>
  )
}

// ─── Main Export ───────────────────────────────────────────────────────────────

export function MyGarageSection() {
  const [vehicles, setVehicles] = useState<GarageVehicleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showAddFlow, setShowAddFlow] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<GarageVehicleRow | null>(null)
  const [deletingVehicle, setDeletingVehicle] = useState<GarageVehicleRow | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
      if (user) {
        fetchGarageVehicles().then((rows) => { setVehicles(rows); setLoading(false) })
      } else {
        setLoading(false)
      }
    })
  }, [])

  const handleVehicleSaved = useCallback((v: GarageVehicleRow) => {
    setVehicles((prev) => {
      const idx = prev.findIndex((x) => x.id === v.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = v; return next }
      return [...prev, v]
    })
  }, [])

  const handleDelete = useCallback(async () => {
    if (!deletingVehicle) return
    const ok = await deleteGarageVehicle(deletingVehicle.id)
    if (ok) setVehicles((prev) => prev.filter((v) => v.id !== deletingVehicle.id))
    setDeletingVehicle(null)
  }, [deletingVehicle])

  return (
    <section className="bg-black py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <motion.div
          className="mb-10 flex items-end justify-between"
          variants={fadeUp} custom={0} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }}
        >
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/35">Car Club</p>
            <h2 className="font-nav text-3xl font-bold tracking-tight text-white md:text-4xl">My Garage</h2>
          </div>

          {isLoggedIn && vehicles.length > 0 && (
            <button
              onClick={() => setShowAddFlow(true)}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white transition-all active:scale-95"
              style={{ background: '#1d1d1f' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#333')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#1d1d1f')}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Vehicle
            </button>
          )}
        </motion.div>

        {!isLoggedIn ? (
          <NotLoggedInState />
        ) : loading ? (
          <GarageSkeletons />
        ) : vehicles.length === 0 ? (
          <EmptyGarage onAdd={() => setShowAddFlow(true)} />
        ) : (
          <motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" layout>
            <AnimatePresence mode="popLayout">
              {vehicles.map((v, i) => (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  index={i}
                  onDelete={setDeletingVehicle}
                  onEdit={setEditingVehicle}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Add flow */}
      <AddVehicleFlow
        isOpen={showAddFlow}
        onClose={() => setShowAddFlow(false)}
        onSaved={handleVehicleSaved}
      />

      {/* Edit modal */}
      {editingVehicle && (
        <DetailsModal
          mode="edit"
          title={`${editingVehicle.year} ${editingVehicle.brand} ${editingVehicle.model}`}
          vehicle={editingVehicle}
          onClose={() => setEditingVehicle(null)}
          onSaved={(v) => { handleVehicleSaved(v); setEditingVehicle(null) }}
        />
      )}

      {/* Delete confirm */}
      {deletingVehicle && (
        <DeleteConfirmModal
          vehicle={deletingVehicle}
          onConfirm={handleDelete}
          onCancel={() => setDeletingVehicle(null)}
        />
      )}
    </section>
  )
}
