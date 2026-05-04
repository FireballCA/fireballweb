import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const stripAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const STATUS_RE =
  /\b(approved|declined|approve|decline|approuvé|approuve|refusé|refuse|payment required|payment due|paiement requis|paid|payé|paye)\b/gi

const pillBaseDefault = 'mx-0.5 inline-flex max-w-full items-center rounded-full px-2 py-0.5 align-baseline text-[11px] font-semibold leading-tight [overflow-wrap:anywhere]'

const pillBaseOnDark = 'mx-0.5 inline-flex max-w-full items-center rounded-full px-2 py-0.5 align-baseline text-[11px] font-semibold leading-tight [overflow-wrap:anywhere]'

function statusWordPillClass(lower: string, tone: 'default' | 'onDark'): string {
  const isDark = tone === 'onDark'
  if (lower === 'approved' || lower === 'approve' || lower === 'approuve') {
    return isDark
      ? cn(pillBaseOnDark, 'bg-white/14 text-emerald-200')
      : cn(pillBaseDefault, 'bg-[#34C759]/14 text-[#0f5c28]')
  }
  if (lower === 'declined' || lower === 'decline' || lower === 'refuse') {
    return isDark
      ? cn(pillBaseOnDark, 'bg-white/14 text-red-200')
      : cn(pillBaseDefault, 'bg-[#FF3B30]/12 text-[#b42318]')
  }
  if (lower === 'payment required' || lower === 'payment due' || lower === 'paiement requis') {
    return isDark
      ? cn(pillBaseOnDark, 'bg-white/14 text-amber-200')
      : cn(pillBaseDefault, 'bg-[#FF9500]/16 text-[#8a4a00]')
  }
  if (lower === 'paid' || lower === 'paye') {
    return isDark
      ? cn(pillBaseOnDark, 'bg-white/14 text-sky-200')
      : cn(pillBaseDefault, 'bg-[#007AFF]/12 text-[#0055b3]')
  }
  return ''
}

/** Mots de statut rendus en pastilles type capsule Apple (fond doux, pas seulement une couleur de texte). */
export function NotificationMessageWithStatusHighlight({
  text,
  tone = 'default',
}: {
  text: string
  /** `onDark` : toasts sur fond sombre */
  tone?: 'default' | 'onDark'
}): ReactNode {
  const parts: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  const re = new RegExp(STATUS_RE.source, STATUS_RE.flags)
  let k = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const w = m[0]
    const lower = stripAccents(w.toLowerCase())
    const cls = statusWordPillClass(lower, tone)
    parts.push(
      cls ? (
        <span key={`${k++}-${m.index}`} className={cls}>
          {w}
        </span>
      ) : (
        w
      ),
    )
    last = re.lastIndex
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts.length ? parts : text}</>
}

/**
 * Texte déjà échappé pour HTML — injecte des spans en pastille pour les mots de statut.
 * À utiliser sur du contenu sans balises HTML (sauf &lt;br/&gt; déjà insérés après coup).
 */
export function highlightStatusWordsInEscapedPlainText(escapedPlain: string): string {
  const re = new RegExp(STATUS_RE.source, STATUS_RE.flags)
  return escapedPlain.replace(re, (match) => {
    const lower = stripAccents(match.toLowerCase())
    const base =
      'display:inline-flex;align-items:center;border-radius:9999px;padding:2px 8px;font-size:11px;font-weight:600;line-height:1.25;max-width:100%;'
    if (lower === 'approved' || lower === 'approve' || lower === 'approuve') {
      return `<span style="${base}background:rgba(52,199,89,0.14);color:#0f5c28;">${match}</span>`
    }
    if (lower === 'declined' || lower === 'decline' || lower === 'refuse') {
      return `<span style="${base}background:rgba(255,59,48,0.12);color:#b42318;">${match}</span>`
    }
    if (lower === 'payment required' || lower === 'payment due' || lower === 'paiement requis') {
      return `<span style="${base}background:rgba(255,149,0,0.16);color:#8a4a00;">${match}</span>`
    }
    if (lower === 'paid' || lower === 'paye') {
      return `<span style="${base}background:rgba(0,122,255,0.12);color:#0055b3;">${match}</span>`
    }
    return match
  })
}
