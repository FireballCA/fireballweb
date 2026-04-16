export type TrainingSessionOption = {
  id: string
  label: string
  hint?: string
}

export const DEFAULT_TRAINING_SESSION_OPTIONS: TrainingSessionOption[] = [
  {
    id: 'may-2026-sh',
    label: 'May 15-16, 2026',
    hint: 'Saint-Hyacinthe, QC - hands-on + certification',
  },
  {
    id: 'jun-2026-sh',
    label: 'June 12-13, 2026',
    hint: 'Saint-Hyacinthe, QC - hands-on + certification',
  },
  {
    id: 'sep-2026-sh',
    label: 'September 18-19, 2026',
    hint: 'Saint-Hyacinthe, QC - hands-on + certification',
  },
]

export function resolveTrainingSessionOptions(raw: unknown): TrainingSessionOption[] {
  if (!Array.isArray(raw)) return DEFAULT_TRAINING_SESSION_OPTIONS
  const parsed: TrainingSessionOption[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const id = typeof (item as { id?: unknown }).id === 'string' ? (item as { id: string }).id.trim() : ''
    const label =
      typeof (item as { label?: unknown }).label === 'string'
        ? (item as { label: string }).label.trim()
        : ''
    const hint =
      typeof (item as { hint?: unknown }).hint === 'string'
        ? (item as { hint: string }).hint.trim()
        : undefined
    if (!id || !label) continue
    parsed.push({ id, label, hint: hint || undefined })
  }
  return parsed.length ? parsed : DEFAULT_TRAINING_SESSION_OPTIONS
}
