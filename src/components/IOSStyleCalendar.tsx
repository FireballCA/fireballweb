import { useState } from 'react'

interface IOSStyleCalendarProps {
  value: string
  onChange: (date: string) => void
  className?: string
}

const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export function IOSStyleCalendar({ value, onChange, className = '' }: IOSStyleCalendarProps) {
  const [viewDate, setViewDate] = useState(() => {
    const v = value ? new Date(value) : new Date()
    return new Date(v.getFullYear(), v.getMonth(), 1)
  })

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const selected = value ? new Date(value) : null
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPadding = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const totalCells = startPadding + daysInMonth
  const rows = Math.ceil(totalCells / 7)

  const goPrev = () => setViewDate(new Date(year, month - 1, 1))
  const goNext = () => setViewDate(new Date(year, month + 1, 1))

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ]

  const cells: (number | null)[] = []
  for (let i = 0; i < startPadding; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const isSelected = (day: number | null) => {
    if (!day || !selected) return false
    return selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day
  }

  const isToday = (day: number | null) => {
    if (!day) return false
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
  }

  const handleDay = (day: number | null) => {
    if (!day) return
    const d = new Date(year, month, day)
    onChange(d.toISOString().slice(0, 10))
  }

  return (
    <div
      className={`rounded-2xl border border-white/20 bg-white/[0.06] backdrop-blur-xl overflow-hidden ${className}`}
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <button
          type="button"
          onClick={goPrev}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Mois précédent"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-white">
          {monthNames[month]} {year}
        </span>
        <button
          type="button"
          onClick={goNext}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Mois suivant"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-7 gap-0.5 mb-2">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1 text-center text-[10px] font-medium text-white/50 uppercase tracking-wider">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleDay(day)}
              disabled={!day}
              className={`
                aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-colors
                ${!day ? 'invisible' : ''}
                ${isSelected(day) ? 'bg-[#0A84FF] text-white' : 'text-white hover:bg-white/10'}
                ${isToday(day) && !isSelected(day) ? 'ring-1 ring-white/30' : ''}
              `}
            >
              {day ?? ''}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
