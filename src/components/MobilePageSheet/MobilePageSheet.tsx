import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface MobilePageSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children?: React.ReactNode
}

export function MobilePageSheet({ isOpen, onClose, title, children }: MobilePageSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sheetRef.current || !overlayRef.current) return
    const sheet = sheetRef.current
    const overlay = overlayRef.current
    const EASE = 'cubic-bezier(0.4,0,0.2,1)'
    const DUR = '0.38s'

    if (isOpen) {
      // Mount visible but off-screen, then animate in
      overlay.style.transition = 'none'
      overlay.style.opacity = '0'
      sheet.style.transition = 'none'
      sheet.style.transform = 'translateY(100%)'

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          overlay.style.transition = `opacity ${DUR} ${EASE}`
          overlay.style.opacity = '1'
          sheet.style.transition = `transform ${DUR} ${EASE}`
          sheet.style.transform = 'translateY(0)'
        })
      })
    } else {
      overlay.style.transition = `opacity ${DUR} ${EASE}`
      overlay.style.opacity = '0'
      sheet.style.transition = `transform ${DUR} ${EASE}`
      sheet.style.transform = 'translateY(100%)'
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] lg:hidden" style={{ touchAction: 'none' }}>
      {/* Dimmed overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.45)', opacity: 0 }}
        onClick={onClose}
      />

      {/* White sheet — slides from bottom, ~90% height */}
      <div
        ref={sheetRef}
        className="absolute left-0 right-0 bottom-0 bg-white"
        style={{
          height: '90dvh',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          transform: 'translateY(100%)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Handle bar — tap to close */}
        <div
          className="flex justify-center pt-3 pb-2 shrink-0 cursor-pointer select-none"
          onClick={onClose}
        >
          <div
            className="rounded-full bg-neutral-300"
            style={{ width: 40, height: 5 }}
          />
        </div>

        {/* Title */}
        <div className="px-5 pb-4 shrink-0">
          <h2
            className="font-nav font-semibold text-neutral-900"
            style={{ fontSize: 20 }}
          >
            {title}
          </h2>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto" style={{ touchAction: 'pan-y' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
