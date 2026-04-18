/** IDs masqués localement (Clear) — nécessaire car les notifs broadcast/role n’ont pas de DELETE côté RLS. */
export function dismissedNotificationsStorageKey(userId: string): string {
  return `fb_dismissed_notifications_${userId}`
}

export function loadDismissedNotificationIds(userId: string): string[] {
  try {
    const raw = localStorage.getItem(dismissedNotificationsStorageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is string => typeof x === 'string' && x.length > 0)
  } catch {
    return []
  }
}

export function saveDismissedNotificationIds(userId: string, ids: string[]): void {
  try {
    localStorage.setItem(dismissedNotificationsStorageKey(userId), JSON.stringify([...new Set(ids)]))
  } catch {
    /* ignore quota / private mode */
  }
}
