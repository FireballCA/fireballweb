import { useState, useEffect, useCallback, useRef } from 'react'

interface AddVehicleModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (make: string, model: string, year: number) => void
  currentMake?: string
  currentModel?: string
  currentYear?: number
  /** Sans overlay plein écran — pour AppleSheet ou autre conteneur */
  layout?: 'modal' | 'embedded'
}

interface Make {
  Make_ID: number
  Make_Name: string
}

interface Model {
  Make_ID: number
  Make_Name: string
  Model_ID: number
  Model_Name: string
}

// ─── Light-mode searchable select ─────────────────────────────────────────────

interface LightSelectProps {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

function LightSelect({ label, value, options, onChange, placeholder = 'Select…', disabled = false }: LightSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    if (open) {
      document.addEventListener('mousedown', handler)
      setTimeout(() => inputRef.current?.focus(), 80)
    }
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
  const selected = options.find((o) => o.value === value)

  return (
    <div className="relative" ref={ref}>
      <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className="w-full h-[44px] rounded-[10px] px-3.5 text-left text-[15px] flex items-center justify-between transition-all outline-none"
        style={{
          background: disabled ? '#f5f5f7' : '#fff',
          border: open ? '1.5px solid #0071e3' : '1.5px solid #d2d2d7',
          color: selected ? '#1d1d1f' : '#86868b',
          boxShadow: open ? '0 0 0 3px rgba(0,113,227,0.15)' : 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <svg
          className={`w-4 h-4 text-[#86868b] transition-transform shrink-0 ml-2 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute z-[60] w-full mt-1.5 rounded-[12px] overflow-hidden"
          style={{
            background: '#fff',
            border: '1.5px solid #d2d2d7',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            maxHeight: 320,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className="p-2 border-b border-[#f0f0f0]">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full h-9 px-3 rounded-[8px] text-[13px] text-[#1d1d1f] placeholder:text-[#86868b] outline-none"
              style={{ background: '#f5f5f7', border: '1.5px solid transparent' }}
              onFocus={(e) => (e.currentTarget.style.border = '1.5px solid #0071e3')}
              onBlur={(e) => (e.currentTarget.style.border = '1.5px solid transparent')}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto p-1.5" style={{ maxHeight: 260 }}>
            {filtered.length > 0 ? (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setQuery('') }}
                  className="w-full px-3 py-2 rounded-[8px] text-left text-[13px] transition-colors"
                  style={{
                    background: value === opt.value ? '#e8f0fe' : 'transparent',
                    color: value === opt.value ? '#0071e3' : '#1d1d1f',
                    fontWeight: value === opt.value ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (value !== opt.value) e.currentTarget.style.background = '#f5f5f7'
                  }}
                  onMouseLeave={(e) => {
                    if (value !== opt.value) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {opt.label}
                </button>
              ))
            ) : (
              <p className="px-3 py-3 text-[13px] text-[#86868b] text-center">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Modal ─────────────────────────────────────────────────────────────────────

export function AddVehicleModal({
  isOpen,
  onClose,
  onSelect,
  currentMake = '',
  currentModel = '',
  currentYear = new Date().getFullYear(),
  layout = 'modal',
}: AddVehicleModalProps) {
  const [selectedMake, setSelectedMake] = useState(currentMake)
  const [selectedModel, setSelectedModel] = useState(currentModel)
  const [selectedYear, setSelectedYear] = useState(currentYear)

  const [makes, setMakes] = useState<Make[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [loadingMakes, setLoadingMakes] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)

  const years = useCallback(() => {
    const cur = new Date().getFullYear()
    return Array.from({ length: cur - 1989 }, (_, i) => cur - i)
  }, [])()

  useEffect(() => {
    if (layout === 'embedded') return
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen, layout])

  useEffect(() => {
    if (isOpen && makes.length === 0) loadMakes()
  }, [isOpen, makes.length])

  useEffect(() => {
    if (selectedMake) {
      loadModels(selectedMake)
      if (selectedMake !== currentMake) {
        setSelectedModel('')
        setSelectedYear(new Date().getFullYear())
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMake])

  const loadMakes = useCallback(async () => {
    setLoadingMakes(true)
    try {
      const res = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json')
      const data = await res.json()
      if (data.Results) {
        setMakes(data.Results.sort((a: Make, b: Make) => a.Make_Name.localeCompare(b.Make_Name)))
      }
    } catch (e) { console.error(e) }
    finally { setLoadingMakes(false) }
  }, [])

  const loadModels = useCallback(async (make: string) => {
    setLoadingModels(true)
    setModels([])
    try {
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${encodeURIComponent(make)}?format=json`)
      const data = await res.json()
      if (data.Results) {
        setModels(data.Results.sort((a: Model, b: Model) => a.Model_Name.localeCompare(b.Model_Name)))
      }
    } catch (e) { console.error(e) }
    finally { setLoadingModels(false) }
  }, [])

  const handleConfirm = () => {
    if (selectedMake && selectedModel && selectedYear) {
      onSelect(selectedMake, selectedModel, selectedYear)
    }
  }

  if (!isOpen) return null

  const makeOptions = makes.map((m) => ({ value: m.Make_Name, label: m.Make_Name }))
  const modelOptions = models.map((m) => ({ value: m.Model_Name, label: m.Model_Name }))
  const yearOptions = years.map((y) => ({ value: y.toString(), label: y.toString() }))

  const panel = (
      <div
        className={`relative w-full rounded-[20px] ${layout === 'modal' ? 'max-w-md' : ''}`}
        style={{ background: '#fff', boxShadow: layout === 'modal' ? '0 24px 80px rgba(0,0,0,0.25)' : 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        {layout === 'modal' ? (
          <div className="flex items-center justify-between border-b border-[#f0f0f0] px-6 pb-5 pt-6">
            <div>
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-[#86868b]">My Garage</p>
              <h3 className="text-[20px] font-semibold text-[#1d1d1f]">Add a Vehicle</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
              style={{ background: '#f5f5f7' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#e8e8ed')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#f5f5f7')}
            >
              <svg className="h-4 w-4 text-[#1d1d1f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : null}

        <div className={`space-y-4 px-6 py-5 ${layout === 'embedded' ? 'pt-2' : ''}`}>
          <LightSelect
            label="Make"
            value={selectedMake}
            options={makeOptions}
            onChange={setSelectedMake}
            placeholder={loadingMakes ? 'Loading…' : 'Select a make'}
          />

          <LightSelect
            label="Model"
            value={selectedModel}
            options={modelOptions}
            onChange={(v) => { setSelectedModel(v); setSelectedYear(new Date().getFullYear()) }}
            placeholder={loadingModels ? 'Loading…' : selectedMake ? 'Select a model' : 'Select a make first'}
            disabled={!selectedMake || loadingModels}
          />

          <LightSelect
            label="Year"
            value={selectedYear.toString()}
            options={yearOptions}
            onChange={(v) => setSelectedYear(Number(v))}
            placeholder={selectedModel ? 'Select a year' : 'Select a model first'}
            disabled={!selectedModel}
          />
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 flex gap-3">
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
            onClick={handleConfirm}
            disabled={!selectedMake || !selectedModel || !selectedYear}
            className="flex-1 h-[44px] rounded-[10px] text-[15px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#0071e3', color: '#fff' }}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#0077ed' }}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#0071e3')}
          >
            Continue
          </button>
        </div>
      </div>
  )

  if (layout === 'embedded') {
    return <div className="w-full pb-2">{panel}</div>
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      />
      {panel}
    </div>
  )
}
