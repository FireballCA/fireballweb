import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { NotificationMessageWithStatusHighlight } from '@/utils/notificationTextHighlight'

type NotificationKind = 'success' | 'error' | 'info'

export interface Notification {
  id: string
  title?: string
  message: string
  kind?: NotificationKind
}

interface NotificationsContextValue {
  notifications: Notification[]
  notify: (input: { title?: string; message: string; kind?: NotificationKind; durationMs?: number }) => void
  dismiss: (id: string) => void
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const dismiss = useCallback((id: string) => {
    setNotifications((current) => current.filter((n) => n.id !== id))
  }, [])

  const notify: NotificationsContextValue['notify'] = useCallback(
    ({ title, message, kind = 'info', durationMs = 8000 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const next: Notification = { id, title, message, kind }
      setNotifications((current) => [...current, next])

      if (durationMs > 0) {
        window.setTimeout(() => {
          dismiss(id)
        }, durationMs)
      }
    },
    [dismiss],
  )

  const value: NotificationsContextValue = {
    notifications,
    notify,
    dismiss,
  }

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[9999] flex justify-center md:justify-end md:pr-6">
        <div className="flex w-full max-w-sm md:max-w-md flex-col gap-3 px-4 md:px-0">
          {notifications.map((n) => {
            const isSuccess = n.kind === 'success'
            const isError = n.kind === 'error'
            const titleClass = isSuccess
              ? 'text-[#12b161]'
              : isError
                ? 'text-[#ff3b3b]'
                : 'text-[#0485F7]'
            const iconClass = isSuccess
              ? 'text-[#12b161]'
              : isError
                ? 'text-[#ff3b3b]'
                : 'text-[#0485F7]'
            return (
              <div
                key={n.id}
                className="pointer-events-auto flex items-center gap-3 rounded-[28px] bg-white px-4 py-3.5 shadow-[0_10px_26px_rgba(0,0,0,0.12)] animate-slide-up"
              >
                <span className={`inline-flex h-5 w-5 flex-shrink-0 items-center justify-center ${iconClass}`}>
                  {isSuccess ? (
                    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <circle cx="10" cy="10" r="7.25" />
                      <path d="M6.3 10.2 8.8 12.7 13.8 7.8" />
                    </svg>
                  ) : isError ? (
                    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" aria-hidden>
                      <circle cx="10" cy="10" r="7.25" />
                      <path d="M10 6.3v4.6" />
                      <circle cx="10" cy="13.55" r="0.85" fill="currentColor" stroke="none" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" aria-hidden>
                      <circle cx="10" cy="10" r="7.25" />
                      <path d="M10 8.25v5" />
                      <circle cx="10" cy="5.55" r="0.85" fill="currentColor" stroke="none" />
                    </svg>
                  )}
                </span>
                <div className="min-w-0 flex-1 self-center text-sm leading-snug">
                  <div className={`text-[15px] font-medium leading-tight ${titleClass}`}>
                    <NotificationMessageWithStatusHighlight text={n.title || n.message} tone="default" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(n.id)}
                  className="ml-1 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#f3f4f6] text-[20px] leading-none text-[#9ca3af] hover:text-[#6b7280]"
                >
                  <span aria-hidden>×</span>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationsProvider')
  }
  return ctx
}

