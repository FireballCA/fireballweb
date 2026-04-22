import type { ReactNode } from 'react'

const stripAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const STATUS_RE =
  /\b(approved|declined|approve|decline|approuvé|approuve|refusé|refuse|payment required|payment due|paiement requis|paid|payé|paye)\b/gi

/** Surligne les statuts clés (approved, payment required, paid, declined). */
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
  const green = tone === 'onDark' ? 'font-semibold text-emerald-400' : 'font-semibold text-emerald-600'
  const red = tone === 'onDark' ? 'font-semibold text-red-400' : 'font-semibold text-red-600'
  const amber = tone === 'onDark' ? 'font-semibold text-amber-300' : 'font-semibold text-amber-700'
  const sky = tone === 'onDark' ? 'font-semibold text-sky-300' : 'font-semibold text-sky-700'
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const w = m[0]
    const lower = stripAccents(w.toLowerCase())
    const cls =
      lower === 'approved' || lower === 'approve' || lower === 'approuve'
        ? green
        : lower === 'declined' || lower === 'decline' || lower === 'refuse'
          ? red
          : lower === 'payment required' || lower === 'payment due' || lower === 'paiement requis'
            ? amber
            : lower === 'paid' || lower === 'paye'
              ? sky
              : ''
    parts.push(
      <span key={`${k++}-${m.index}`} className={cls}>
        {w}
      </span>,
    )
    last = re.lastIndex
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts.length ? parts : text}</>
}

/**
 * Texte déjà échappé pour HTML — injecte des &lt;span&gt; de couleur pour les mots de statut.
 * À utiliser sur du contenu sans balises HTML (sauf &lt;br/&gt; déjà insérés après coup).
 */
export function highlightStatusWordsInEscapedPlainText(escapedPlain: string): string {
  const re = new RegExp(STATUS_RE.source, STATUS_RE.flags)
  return escapedPlain.replace(re, (match) => {
    const lower = stripAccents(match.toLowerCase())
    if (lower === 'approved' || lower === 'approve' || lower === 'approuve') {
      return `<span style="color:#059669;font-weight:700;">${match}</span>`
    }
    if (lower === 'declined' || lower === 'decline' || lower === 'refuse') {
      return `<span style="color:#dc2626;font-weight:700;">${match}</span>`
    }
    if (lower === 'payment required' || lower === 'payment due' || lower === 'paiement requis') {
      return `<span style="color:#b45309;font-weight:700;">${match}</span>`
    }
    if (lower === 'paid' || lower === 'paye') {
      return `<span style="color:#0369a1;font-weight:700;">${match}</span>`
    }
    return match
  })
}
