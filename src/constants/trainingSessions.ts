export type TrainingSessionOption = {
  id: string
  label: string
  hint?: string
}

export const DEFAULT_TRAINING_SESSION_OPTIONS: TrainingSessionOption[] = []

export function resolveTrainingSessionOptions(raw: unknown): TrainingSessionOption[] {
  if (!Array.isArray(raw)) return []
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
  return parsed
}
