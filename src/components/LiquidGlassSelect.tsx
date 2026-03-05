import { useState, useRef, useEffect } from 'react'

interface Option {
  value: string
  label: string
  bold?: boolean
}

interface LiquidGlassSelectProps {
  label: string
  value: string
  options: Option[]
  onChange: (value: string) => void
  placeholder?: string
  searchable?: boolean
}

export function LiquidGlassSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select...',
  searchable = true,
}: LiquidGlassSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const selectRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      if (searchable) setTimeout(() => searchInputRef.current?.focus(), 100)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, searchable])

  // Filtrer les options basées sur la recherche
  const filteredOptions = searchable
    ? options.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options

  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <div className="relative" ref={selectRef}>
      <label className="block text-white/80 text-sm mb-2 font-medium">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full rounded-xl px-4 py-3 text-left text-white focus:outline-none transition-all flex items-center justify-between bg-white/[0.06] border border-white/15 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]"
        >
          <span className={selectedOption?.bold ? 'font-bold' : ''}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div
            className="absolute z-50 w-full mt-2 rounded-2xl border border-white/20 shadow-[0_18px_40px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.24)] overflow-hidden"
            style={{
              background: 'rgba(20, 20, 20, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              maxHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {searchable && (
              <div className="p-2 border-b border-white/10">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-3 py-2 rounded-xl text-xs font-nav text-white placeholder:text-silver/50 focus:outline-none bg-white/[0.06] border border-white/15 backdrop-blur-xl"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            
            {/* Liste des options */}
            <div
              className="overflow-y-auto p-1.5"
              style={{
                maxHeight: '300px',
              }}
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value)
                      setIsOpen(false)
                      setSearchQuery('')
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left text-xs font-nav font-bold text-silver hover:bg-white/10 hover:text-white transition-colors ${
                      value === option.value ? 'bg-white/15 text-white' : ''
                    } ${option.bold ? 'font-bold' : ''}`}
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-silver/50 text-center">No results found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
