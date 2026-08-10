export type CalendarLinks = {
  google: string
  outlook: string
  icsContent: string
  filename: string
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toGCal(d: Date) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function toICS(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}

function escapeIcsText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function buildCalendarLinks(input: {
  title: string
  location: string
  startIso: string
  endIso: string
  details?: string
}): CalendarLinks | null {
  const start = new Date(input.startIso)
  const end = new Date(input.endIso)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null

  const title = input.title.trim() || 'Fireball Event'
  const location = input.location.trim()
  const details = (input.details ?? `${title} — Fireball event`).trim()

  const google = `https://calendar.google.com/calendar/render?${new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details,
    location,
    dates: `${toGCal(start)}/${toGCal(end)}`,
  }).toString()}`

  const outlook = `https://outlook.live.com/calendar/0/deeplink/compose?${new URLSearchParams({
    subject: title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    location,
    body: details,
  }).toString()}`

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'PRODID:-//Fireball//Events//EN',
    'BEGIN:VEVENT',
    `UID:${toICS(start)}-${title.replace(/\s+/g, '-').toLowerCase()}@fireball-canada.com`,
    `DTSTAMP:${toICS(new Date())}`,
    `DTSTART:${toICS(start)}`,
    `DTEND:${toICS(end)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `LOCATION:${escapeIcsText(location)}`,
    `DESCRIPTION:${escapeIcsText(details)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const filename = `${title.replace(/[^\w\-]+/g, '-').replace(/^-|-$/g, '') || 'fireball-event'}.ics`

  return { google, outlook, icsContent, filename }
}

/** Download an .ics file via Blob (works far more reliably than data: URIs). */
export function downloadIcsFile(filename: string, icsContent: string) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}
