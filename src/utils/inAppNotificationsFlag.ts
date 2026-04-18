/** Sync “unread in-app notifications” between Account dashboard and site Header. */
export const FB_UNREAD_NOTIF_STORAGE_KEY = 'fb_unread_notifications'

export const FB_UNREAD_NOTIF_EVENT = 'fb:in-app-notifications'

export type UnreadNotifDetail = { hasUnread: boolean }

export function readUnreadNotificationsFromStorage(): boolean {
  try {
    return sessionStorage.getItem(FB_UNREAD_NOTIF_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function broadcastUnreadNotifications(hasUnread: boolean): void {
  try {
    sessionStorage.setItem(FB_UNREAD_NOTIF_STORAGE_KEY, hasUnread ? '1' : '0')
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent<UnreadNotifDetail>(FB_UNREAD_NOTIF_EVENT, { detail: { hasUnread } }),
  )
}
