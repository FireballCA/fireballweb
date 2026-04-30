import { useCallback, useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'

const MOBILE_MQ = '(max-width: 1023px)'

export type AppleSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: React.ReactNode
  /** Base z-index; nested sheets should use a higher value */
  zIndex?: number
  className?: string
}

export function AppleSheet({
  open,
  onOpenChange,
  title,
  children,
  zIndex = 55_000,
  className = '',
}: AppleSheetProps) {
  const titleId = useId()
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const close = useCallback(() => onOpenChange(false), [onOpenChange])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  if (!mounted) return null

  const handleBar = (
    <button
      type="button"
      className="mx-auto mb-3 flex w-full flex-col items-center justify-center gap-2 rounded-lg pt-1 pb-0.5 outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/40"
      onClick={close}
      aria-label="Fermer"
    >
      <span
        className="block h-1 w-9 shrink-0 rounded-full bg-[#d2d2d7]"
        style={{ boxShadow: '0 0 0 0.5px rgba(0,0,0,0.04)' }}
      />
    </button>
  )

  const headerRow = (
    <div className="flex items-center gap-3 px-5 pb-3 pt-1">
      <h2
        id={titleId}
        className="min-w-0 flex-1 text-left text-[17px] font-semibold leading-snug tracking-[-0.02em] text-[#1d1d1f]"
      >
        {title}
      </h2>
      <button
        type="button"
        onClick={close}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors"
        style={{ background: '#e8e8ed' }}
        aria-label="Fermer"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#dcdcde'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#e8e8ed'
        }}
      >
        <svg className="h-3.5 w-3.5 text-[#3a3a3c]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )

  const panelBody = (
    <div
      className={`flex min-h-0 max-h-full flex-1 flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_16px_48px_rgba(0,0,0,0.14)] ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="shrink-0 pt-2 sm:pt-3">{handleBar}</div>
      {headerRow}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-1 pb-2">{children}</div>
    </div>
  )

  const content = (
    <AnimatePresence>
      {open ? (
        <div key="apple-sheet" className="fixed inset-0" style={{ zIndex }} role="presentation">
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ background: 'rgba(0,0,0,0.28)' }}
            onClick={close}
          />

          {isMobile ? (
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-end p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,12px))] pl-[max(0.75rem,env(safe-area-inset-left,12px))] pr-[max(0.75rem,env(safe-area-inset-right,12px))]">
              <motion.div
                className="pointer-events-auto flex max-h-[min(92dvh,880px)] min-h-0 w-full flex-col"
                initial={{ y: '108%', opacity: 0.98 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '108%', opacity: 0.96 }}
                transition={{ type: 'spring', stiffness: 420, damping: 38, mass: 0.85 }}
                drag="y"
                dragConstraints={{ top: 0 }}
                dragElastic={{ top: 0, bottom: 0.35 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 72 || info.velocity.y > 420) close()
                }}
              >
                {panelBody}
              </motion.div>
            </div>
          ) : (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
              <motion.div
                className="pointer-events-auto flex max-h-[min(88dvh,720px)] w-full max-w-lg min-h-0 flex-col"
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              >
                {panelBody}
              </motion.div>
            </div>
          )}
        </div>
      ) : null}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}
