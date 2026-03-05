import { useState, useMemo } from 'react'

const TIMEZONE_MONTREAL = 'America/Montreal'

/** Parse YYYY-MM-DD en date à midi UTC pour éviter le décalage d'un jour (affichage correct en Montréal). */
function parseDateLocal(value: string): Date | null {
  if (!value || value.length < 10) return null
  return new Date(value + 'T12:00:00')
}

/** Aujourd'hui en date (année, mois, jour) dans le fuseau Montréal. */
function getTodayInMontreal(): { year: number; month: number; date: number } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE_MONTREAL,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(new Date())
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0'
  return {
    year: Number(get('year')),
    month: Number(get('month')) - 1,
    date: Number(get('day')),
  }
}

interface IOSStyleCalendarProps {
  value: string
  onChange: (date: string) => void
  className?: string
}

const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export function IOSStyleCalendar({ value, onChange, className = '' }: IOSStyleCalendarProps) {
  const parsed = useMemo(() => parseDateLocal(value), [value])
  const [viewDate, setViewDate] = useState(() => {
    if (parsed) return new Date(parsed.getFullYear(), parsed.getMonth(), 1)
    const t = getTodayInMontreal()
    return new Date(t.year, t.month, 1)
  })

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const selected = parsed
    ? { year: parsed.getFullYear(), month: parsed.getMonth(), date: parsed.getDate() }
    : null
  const todayMontreal = useMemo(() => getTodayInMontreal(), [])

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPadding = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

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
    return selected.year === year && selected.month === month && selected.date === day
  }

  const isToday = (day: number | null) => {
    if (!day) return false
    return todayMontreal.year === year && todayMontreal.month === month && todayMontreal.date === day
  }

  const handleDay = (day: number | null) => {
    if (!day) return
    const y = String(year)
    const m = String(month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    onChange(`${y}-${m}-${d}`)
  }

  return (
    <div
      className={`w-full max-w-[240px] rounded-xl border border-white/20 bg-white/[0.06] backdrop-blur-xl overflow-hidden ${className}`}
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center justify-between px-2 py-2 border-b border-white/10">
        <button
          type="button"
          onClick={goPrev}
          className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Mois précédent"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-xs font-semibold text-white">
          {monthNames[month]} {year}
        </span>
        <button
          type="button"
          onClick={goNext}
          className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Mois suivant"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="p-2">
        <div className="grid grid-cols-7 gap-px mb-1">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-0.5 text-center text-[9px] font-medium text-white/50 uppercase tracking-wider">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px">
          {cells.map((day, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleDay(day)}
              disabled={!day}
              className={`
                aspect-square min-w-0 flex items-center justify-center rounded-lg text-xs font-medium transition-colors
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
