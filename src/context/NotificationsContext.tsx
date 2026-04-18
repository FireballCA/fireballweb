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
    ({ title, message, kind = 'info', durationMs = 4000 }) => {
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
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[9999] flex justify-center md:justify-end md:pr-6">
        <div className="flex w-full max-w-sm md:max-w-md flex-col gap-3 px-4 md:px-0">
          {notifications.map((n) => {
            const tone =
              n.kind === 'success'
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-50'
                : n.kind === 'error'
                  ? 'border-red-500/60 bg-red-500/12 text-red-50'
                  : 'border-white/20 bg-black/80 text-white'
            return (
              <div
                key={n.id}
                className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.7)] backdrop-blur-md ${tone} animate-slide-up`}
              >
                <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-white/70" />
                <div className="flex-1 text-sm leading-snug">
                  {n.title ? (
                    <div className="mb-0.5 font-medium">
                      <NotificationMessageWithStatusHighlight text={n.title} tone="onDark" />
                    </div>
                  ) : null}
                  <div className="text-white/80">
                    <NotificationMessageWithStatusHighlight text={n.message} tone="onDark" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(n.id)}
                  className="ml-2 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center text-xs text-white/65 hover:text-white"
                >
                  ×
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

